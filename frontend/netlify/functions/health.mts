// GET /api/health (routed here by netlify.toml).
// Reports only whether each key is configured. Never returns any part of a key.

import { envKey, json } from "../lib/http";

export default async function health(): Promise<Response> {
  return json({
    status: "ok",
    location: "Mars Colony One",
    openai: Boolean(envKey("OPENAI_API_KEY")),
    elevenlabs: Boolean(envKey("ELEVENLABS_API_KEY")),
  });
}
