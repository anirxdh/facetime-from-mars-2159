// Shared helpers for the Netlify Functions that replace backend/main.py in production.

/** Returns the trimmed env value, or undefined when missing/blank. Never log the result. */
export function envKey(name: "OPENAI_API_KEY" | "ELEVENLABS_API_KEY"): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** URL-encode text so it is ASCII-safe inside an HTTP header (matches the Python _safe_header). */
export function headerSafe(text: string): string {
  return encodeURIComponent(text.replace(/\s*\n\s*/g, " "));
}

export function audioResponse(
  audio: ArrayBuffer,
  text: string,
  sessionId: string,
  demo: boolean
): Response {
  return new Response(audio, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "X-Zeph-Text": headerSafe(text),
      "X-Session-Id": sessionId,
      "X-Demo-Mode": demo ? "1" : "0",
    },
  });
}

/** JSON reply used whenever there is no ElevenLabs audio; the browser speaks it instead. */
export function textReply(text: string, sessionId: string, demo: boolean): Response {
  return json({ text, session_id: sessionId, audio: null, demo, voice: "browser" });
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const TTS_MODEL = "eleven_turbo_v2_5";
const TTS_VOICE_SETTINGS = {
  stability: 0.35,
  similarity_boost: 0.8,
  style: 0.6,
  use_speaker_boost: true,
};

/** ElevenLabs text-to-speech. Returns mp3 bytes, or null on any failure (caller falls back to browser voice). */
export async function synthesizeSpeech(
  text: string,
  voiceId: string,
  timeoutMs: number
): Promise<ArrayBuffer | null> {
  const apiKey = envKey("ELEVENLABS_API_KEY");
  if (!apiKey) return null;
  try {
    const res = await fetchWithTimeout(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({ text, model_id: TTS_MODEL, voice_settings: TTS_VOICE_SETTINGS }),
      },
      timeoutMs
    );
    if (!res.ok) {
      // Log the status only: provider error bodies are not needed and are never returned to clients.
      console.warn(`ElevenLabs TTS failed: HTTP ${res.status}`);
      return null;
    }
    const buf = await res.arrayBuffer();
    return buf.byteLength > 0 ? buf : null;
  } catch (err) {
    console.warn(`ElevenLabs TTS error: ${(err as Error)?.name ?? "unknown"}`);
    return null;
  }
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** OpenAI chat completion. Returns the reply text, or null on any failure (caller falls back to demo replies). */
export async function generateReply(
  systemPrompt: string,
  history: ChatMessage[],
  timeoutMs: number
): Promise<string | null> {
  const apiKey = envKey("OPENAI_API_KEY");
  if (!apiKey) return null;
  try {
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 120,
          messages: [{ role: "system", content: systemPrompt }, ...history],
        }),
      },
      timeoutMs
    );
    if (!res.ok) {
      // Only log the status and OpenAI's error code (e.g. insufficient_quota). The
      // message text can echo a masked key fragment, so it is deliberately not logged.
      let code = "";
      try {
        const body = (await res.json()) as { error?: { code?: string; type?: string } };
        code = body?.error?.code || body?.error?.type || "";
      } catch {
        /* ignore */
      }
      console.warn(`OpenAI chat failed: HTTP ${res.status}${code ? ` (${code})` : ""}`);
      return null;
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string | null } }[];
    };
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text ? text : null;
  } catch (err) {
    console.warn(`OpenAI chat error: ${(err as Error)?.name ?? "unknown"}`);
    return null;
  }
}
