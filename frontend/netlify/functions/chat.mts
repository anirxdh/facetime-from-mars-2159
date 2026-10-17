// POST /api/chat (routed here by netlify.toml).
//
// Request:  { text, session_id?, character?, history? }
//   history is optional: [{ role: "user" | "assistant", content }], oldest first.
//   Functions are stateless, so the browser sends recent turns for context.
//
// Live:     OpenAI gpt-4o-mini reply, spoken by ElevenLabs. Returns audio/mpeg with
//           X-Zeph-Text, X-Session-Id and X-Demo-Mode headers (same shape as backend/main.py).
// Fallback: if OpenAI is missing, out of credits, slow or erroring, the character answers
//           with a pre-written line (demo: true). If ElevenLabs is missing or fails, the reply
//           comes back as JSON { text, session_id, audio: null, demo, voice: "browser" }
//           and the browser speaks it with speechSynthesis.

import { getCharacter } from "../lib/characters";
import {
  audioResponse,
  generateReply,
  json,
  synthesizeSpeech,
  textReply,
  type ChatMessage,
} from "../lib/http";
import { pickDemoReply } from "../../src/lib/demoReplies";

const MAX_TEXT = 600;
const MAX_HISTORY = 20;
const MAX_SESSIONS = 500;

// Best-effort memory for warm instances when the client sends no history.
const sessions = new Map<string, ChatMessage[]>();

function sanitizeHistory(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ChatMessage[] = [];
  for (const m of raw.slice(-MAX_HISTORY)) {
    if (!m || typeof m !== "object") continue;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role === "user" || role === "assistant") && typeof content === "string" && content.trim()) {
      out.push({ role, content: content.trim().slice(0, MAX_TEXT) });
    }
  }
  return out;
}

export default async function chat(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const started = Date.now();

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const text = typeof body?.text === "string" ? body.text.trim().slice(0, MAX_TEXT) : "";
  if (!text) return json({ error: "text is required" }, 400);

  const { key, character } = getCharacter(body.character);
  const sessionId =
    typeof body.session_id === "string" && /^[\w-]{1,64}$/.test(body.session_id)
      ? body.session_id
      : crypto.randomUUID();
  const sKey = `${key}:${sessionId}`;

  const history = sanitizeHistory(body.history) ?? sessions.get(sKey) ?? [];
  const turns: ChatMessage[] = [...history, { role: "user" as const, content: text }].slice(-MAX_HISTORY);

  // 1) Reply text: live OpenAI, else a pre-written line in character.
  let reply = await generateReply(character.system_prompt, turns, 6000);
  const demo = !reply;
  if (!reply) {
    const alreadySaid = turns.filter((m) => m.role === "assistant").map((m) => m.content);
    reply = pickDemoReply(key, text, alreadySaid);
  }

  if (sessions.size >= MAX_SESSIONS && !sessions.has(sKey)) {
    const oldest = sessions.keys().next().value;
    if (oldest !== undefined) sessions.delete(oldest);
  }
  sessions.set(sKey, [...turns, { role: "assistant" as const, content: reply }].slice(-MAX_HISTORY));

  // 2) Voice: ElevenLabs within what is left of the ~10s function budget, else browser voice.
  const remaining = Math.max(1500, 9000 - (Date.now() - started));
  const audio = await synthesizeSpeech(reply, character.voice_id, remaining);
  if (audio) return audioResponse(audio, reply, sessionId, demo);
  return textReply(reply, sessionId, demo);
}
