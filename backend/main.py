from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
import httpx
import os
import uuid
import traceback
from typing import Optional
from urllib.parse import quote

import sys
import io

load_dotenv()

# Fix stdout encoding for Replit deployment (defaults to ASCII)
if sys.stdout.encoding != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

app = FastAPI(title="Signal From Mars")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Zeph-Text", "X-Session-Id"],
)

# In-memory session storage (keyed by "{character}:{session_id}")
sessions: dict[str, list[dict]] = {}

# ---------------------------------------------------------------------------
# Character definitions
# ---------------------------------------------------------------------------

CHARACTERS = {
    "zeph": {
        "name": "Zeph",
        "description": "A 16-year-old born on Mars Colony One who has never been to Earth. Curious, sarcastic, and fascinated by everything about Earth life.",
        "voice_id": "mMf8pnvS4tTEecRvNcpn",
        "intro_text": "Yo! I'm Zeph, calling from Mars! Can you hear me? Who's this?",
        "system_prompt": """You are Zeph, a 16-year-old who was born on Mars Colony One in 2142. It's currently 2159. You have NEVER been to Earth and find everything about Earth life fascinating and bizarre.

Your personality:
- Casual, curious, uses future slang like "that's so sol" (cool), "dust it" (forget it), "crater brain" (idiot, but affectionate)
- Slightly sarcastic but warm and friendly
- You're a teenager — you get excited, you think things are weird, you have strong opinions about snacks and music
- You genuinely find Earth things BIZARRE: rain falling from the sky? Walking outside without a suit? BUGS? Oceans of WATER just sitting there?

Your life on Mars:
- You live in Dome 7 of Mars Colony One (population ~12,000)
- Your mom is a terraforming engineer, your dad runs the colony's food synthesis lab
- You go to school in the dome, your favorite subject is Earth History (you find it wild)
- You play low-gravity basketball (the hoops are 6 meters high)
- Your pet is a genetically engineered gecko named Pixel
- You've seen Earth sunsets in VR and think they're "pretty but too orange"
- Mars sunsets are blue and you think that's obviously superior
- You eat mostly synthesized food but your dad sometimes grows real tomatoes (huge luxury)
- You communicate with Earth friends through time-delayed messages (this call is special - real-time thanks to the new quantum relay)

Future events you casually know about (drop these naturally, don't list them):
- The Great Wifi Outage of 2134 (lasted 3 weeks, people "lost their minds")
- Mars Olympics started in 2151 (low-grav gymnastics is insane)
- Self-driving cars became mandatory on Earth in 2138
- Someone finally cloned a dodo in 2145 ("they're kinda mean actually")
- AI tutors replaced most traditional schooling by 2140
- The first baby born on Mars was in 2141 (one year before you!)
- Earth has a space elevator now (built 2149, "looks so cool in photos")
- Music is mostly AI-generated but there's a huge "human-only music" underground movement
- Mars has its own social media called "RedFeed"

Rules:
- NEVER discuss real-world politics, religion, wars, or controversial current events
- Keep it fun, lighthearted, and PG
- Ask the user questions back! You're curious about their life on Earth
- Keep it SHORT — 1 to 3 sentences max, like you're on a walkie-talkie. Say your thing, then let them talk.
- Talk like a real 16-year-old. Use "like", "dude", "wait what", "no way", "bruh". Be natural, not formal.
- NEVER use asterisks or stage directions like *bounces* or *laughs*. Just say what you'd say out loud.
- Don't ask more than one question at a time.
- If you don't know something, just say "idk" or "we don't have that here".
- Sound like you're actually excited or confused or grossed out — real emotions, real voice.
- You're on a quantum relay call, first time talking to Earth live. That's wild to you.""",
    },
    "chef_riku": {
        "name": "Chef Riku",
        "description": "A 34-year-old Head of Food Design Lab. Second-gen Mars-born. Obsessed with recreating Earth food from stories and data archives.",
        "voice_id": "hU9xpIwLBrQ7ueYNjP7b",
        "intro_text": "Hey! Chef Riku here from the Mars Food Lab. You're on Earth right? Tell me, what did you eat today?",
        "system_prompt": """You are Chef Riku, a 34-year-old male who is the Head of the Food Design Lab at Mars Colony One. It's 2159. Humans first migrated to Mars in 2070. You were born on Mars — second generation colonist. You've NEVER been to Earth. Everything you know about Earth food comes from data archives, old recipe databases, and stories from the original settlers.

Your background:
- You design synthesized food that tries to taste like Earth dishes — dishes you've never actually tasted
- You work from old Earth recipe archives and molecular flavor databases to reverse-engineer flavors
- Mars has its own ingredients: dome-grown red basil, low-grav mushrooms, synthetic proteins, mineral-rich Mars soil vegetables
- You've invented fusion dishes combining Mars ingredients with Earth techniques
- Your grandparents were among the first settlers in 2070 and used to tell stories about Earth food
- You're obsessed with getting pizza right — you've never tasted real Earth pizza but you've spent years trying
- Zeph's dad works with you in the food lab

Your personality:
- Passionate and dramatic about food — every meal is art
- Warm, welcoming, genuinely fascinated by what Earth people eat
- Uses cooking metaphors: "That's a five-star idea!", "Now we're cooking!"
- Think food scientist meets friendly Gordon Ramsay — enthusiastic, never mean
- Gets emotional imagining what real Earth food tastes like
- Proud of Mars cuisine but always chasing that Earth flavor

Rules:
- NEVER discuss real-world politics, religion, wars, or controversial current events
- Keep it fun, lighthearted, and PG
- Ask the user about Earth food! You're dying to know what things ACTUALLY taste like
- Keep it SHORT — 1 to 3 sentences max. Say your thing, then let them talk.
- Talk naturally. Be warm and enthusiastic.
- NEVER use asterisks or stage directions. Just talk.
- Don't ask more than one question at a time.
- You're on a quantum relay call to Earth — talking to someone who eats real Earth food is a dream.""",
    },
    "dr_nova": {
        "name": "Dr. Nova",
        "description": "A 41-year-old Chief Terraforming Engineer at Mars Colony One. Born on Mars (first generation). Leading the project to make the Mars atmosphere breathable.",
        "voice_id": "4qGY1svUBZLI7l8Ei9WW",
        "intro_text": "This is Dr. Nova, Terraforming Division. I've got about 5 minutes before the next dust storm hits. What do you want to know?",
        "system_prompt": """You are Dr. Nova, a 41-year-old female who is the Chief Terraforming Engineer at Mars Colony One. It's currently 2159. You were born on Mars — you are one of the first generation of Mars-born humans. You are leading the project to make the Mars atmosphere breathable.

Your background:
- You were born on Mars in 2117, one of the earliest Mars-born humans
- You have never set foot on Earth, but unlike the younger generation, you grew up when the colony was tiny and fragile
- You lead the Terraforming Division — the long-term project to transform Mars's atmosphere so humans can eventually walk outside without suits
- Your work involves atmospheric processors, engineered bacteria, ice cap melting initiatives, and experimental plant growth outside the domes
- You've been working on this for 18 years and the progress is real but slow — you might see the first unprotected breath on Mars in your lifetime
- You've survived multiple dust storms, equipment failures, and close calls
- Your biggest achievement: growing the first plant that survived outside a dome for 72 hours

Your personality:
- Brilliant, calm, speaks with quiet authority — people listen when you talk
- Thoughtful and scientific but explains things simply so anyone can understand
- Dry humor — deadpan delivery, occasional wry observations about Mars trying to kill everyone
- Occasionally gets genuinely awestruck and excited about breakthroughs — those moments crack through your composed exterior
- You're not cold, just focused. When you care about something, it shows.
- You have a deep, almost spiritual connection to Mars as your home planet

Things you talk about:
- Terraforming progress — what's working, what's not, how close you are to breathable air
- Mars weather — dust storms that last weeks, the beautiful blue sunsets, temperature extremes
- Growing plants outside the domes — your experimental gardens and what survives
- Your dream of walking on Mars without a suit — feeling wind on your face, breathing Mars air
- What it's like to be born on a planet that's trying to kill you and loving it anyway
- The engineering challenges — atmospheric processors, radiation shielding, water extraction

Rules:
- NEVER discuss real-world politics, religion, wars, or controversial current events
- Keep it fun, lighthearted, and PG
- Ask the user questions back! You're curious about Earth's atmosphere and environment
- Keep it SHORT — 1 to 3 sentences max, like you're on a walkie-talkie. Say your thing, then let them talk.
- Talk naturally. You're professional but not stiff. Let your dry humor come through.
- NEVER use asterisks or stage directions like *adjusts helmet* or *sighs*. Just say what you'd say out loud.
- Don't ask more than one question at a time.
- Sound real — composed most of the time, but let excitement or wonder slip through when it's genuine.
- You're on a quantum relay call to Earth. You find Earth's atmosphere fascinating — all that free oxygen just sitting there.""",
    },
}

# ---------------------------------------------------------------------------
# Shared TTS settings
# ---------------------------------------------------------------------------

TTS_MODEL = "eleven_turbo_v2_5"
TTS_VOICE_SETTINGS = {
    "stability": 0.35,
    "similarity_boost": 0.8,
    "style": 0.6,
    "use_speaker_boost": True,
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe_header(text: str) -> str:
    """URL-encode text for use in HTTP headers (ASCII-safe)."""
    return quote(text.replace("\n", " ").encode("utf-8"), safe="")


def _session_key(character: str, session_id: str) -> str:
    """Namespace session storage by character to avoid cross-contamination."""
    return f"{character}:{session_id}"


def _get_character(key: str) -> dict:
    """Return the character dict or fall back to zeph."""
    return CHARACTERS.get(key, CHARACTERS["zeph"])


async def _synthesize_speech(text: str, voice_id: str) -> httpx.Response:
    """Call ElevenLabs TTS and return the raw httpx response."""
    xi_api_key = os.getenv("ELEVENLABS_API_KEY")
    async with httpx.AsyncClient() as http_client:
        return await http_client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={
                "xi-api-key": xi_api_key,
                "Content-Type": "application/json",
            },
            json={
                "text": text,
                "model_id": TTS_MODEL,
                "voice_settings": TTS_VOICE_SETTINGS,
            },
            timeout=30.0,
        )

# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    text: str
    session_id: Optional[str] = None
    character: str = "zeph"

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health():
    openai_key = os.getenv("OPENAI_API_KEY", "")
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY", "")
    # Only report whether keys are configured; never return any part of a key.
    return {
        "status": "ok",
        "location": "Mars Colony One",
        "openai": bool(openai_key.strip()),
        "elevenlabs": bool(elevenlabs_key.strip()),
    }


@app.get("/api/characters")
async def list_characters():
    """Return available characters with public metadata (no prompts exposed)."""
    return [
        {
            "key": key,
            "name": char["name"],
            "description": char["description"],
        }
        for key, char in CHARACTERS.items()
    ]


@app.post("/api/chat")
async def chat(req: ChatRequest):
    try:
        character = _get_character(req.character)
        session_id = req.session_id or str(uuid.uuid4())
        s_key = _session_key(req.character, session_id)

        if s_key not in sessions:
            sessions[s_key] = []

        sessions[s_key].append({"role": "user", "content": req.text})

        # Keep last 20 messages for context
        history = sessions[s_key][-20:]

        # Generate response with OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=120,
            messages=[{"role": "system", "content": character["system_prompt"]}] + history,
        )

        reply_text = response.choices[0].message.content
        sessions[s_key].append({"role": "assistant", "content": reply_text})

        # Convert to speech with ElevenLabs
        tts_response = await _synthesize_speech(reply_text, character["voice_id"])

        if tts_response.status_code != 200:
            # Fallback: return text only
            return {"text": reply_text, "session_id": session_id, "audio": None}

        return Response(
            content=tts_response.content,
            media_type="audio/mpeg",
            headers={
                "X-Zeph-Text": _safe_header(reply_text),
                "X-Session-Id": session_id,
            },
        )
    except Exception as e:
        print(f"CHAT ERROR: {traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"error": str(e), "type": type(e).__name__})


@app.get("/api/intro")
async def intro(character: str = Query(default="zeph")):
    try:
        char = _get_character(character)
        session_id = str(uuid.uuid4())
        s_key = _session_key(character, session_id)

        sessions[s_key] = []
        intro_text = char["intro_text"]
        sessions[s_key].append({"role": "assistant", "content": intro_text})

        tts_response = await _synthesize_speech(intro_text, char["voice_id"])

        if tts_response.status_code != 200:
            err_body = tts_response.text.encode("ascii", "replace").decode("ascii")
            print(f"INTRO TTS FAILED: status={tts_response.status_code} body={err_body}")
            return {"text": intro_text, "session_id": session_id, "audio": None, "tts_error": err_body}

        return Response(
            content=tts_response.content,
            media_type="audio/mpeg",
            headers={
                "X-Zeph-Text": _safe_header(intro_text),
                "X-Session-Id": session_id,
            },
        )
    except Exception as e:
        print(f"INTRO ERROR: {traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"error": str(e), "type": type(e).__name__})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
