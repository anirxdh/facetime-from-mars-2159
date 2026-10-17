// GET /api/characters (routed here by netlify.toml).
// Public metadata only; system prompts are never exposed.

import { CHARACTERS } from "../lib/characters";
import { json } from "../lib/http";

export default async function characters(): Promise<Response> {
  return json(
    Object.entries(CHARACTERS).map(([key, c]) => ({
      key,
      name: c.name,
      description: c.description,
    }))
  );
}
