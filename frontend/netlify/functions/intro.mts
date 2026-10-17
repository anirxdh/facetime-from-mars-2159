// GET /api/intro?character=zeph (routed here by netlify.toml).
//
// Live: ElevenLabs mp3 with X-Zeph-Text / X-Session-Id headers (same shape as backend/main.py).
// Fallback: JSON { text, session_id, audio: null, demo, voice: "browser" } and the
// browser speaks the line with speechSynthesis.

import { getCharacter } from "../lib/characters";
import { audioResponse, envKey, synthesizeSpeech, textReply } from "../lib/http";

export default async function intro(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const { character } = getCharacter(url.searchParams.get("character"));
  const sessionId = crypto.randomUUID();
  const text = character.intro_text;

  // The intro line is scripted either way; "demo" tells the UI whether replies will be live.
  const demo = !envKey("OPENAI_API_KEY");

  const audio = await synthesizeSpeech(text, character.voice_id, 8000);
  if (audio) return audioResponse(audio, text, sessionId, demo);
  return textReply(text, sessionId, demo);
}
