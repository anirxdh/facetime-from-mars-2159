# FaceTime From Mars 2159

**Talk to colonists on Mars via quantum relay. Year 2159.**

**[Live Demo](https://facetime-from-mars.netlify.app)** (hosted on Netlify)

Built for [ElevenLabs x Replit Hackathon](https://elevenlabs.io) (#ElevenHacks)

---

## Live Mode vs Demo Mode

The live site always works. Without API keys (or if OpenAI or ElevenLabs errors, times out, or runs out of credits) it runs in **demo mode**: each colonist answers with pre-written lines in their own personality, loosely matched to what you asked, and your browser speaks them with its built-in voices (radio beeps, static and glitches stay on). A small "Demo mode" note shows in the call screen.

With keys set, it uses the real path: OpenAI `gpt-4o-mini` writes the reply and ElevenLabs speaks it in the character's voice. Each half falls back on its own, so a missing ElevenLabs key just means AI replies in a browser voice.

### Enable live mode on Netlify

1. Open the site in Netlify: **Site configuration > Environment variables**.
2. Add `OPENAI_API_KEY` and `ELEVENLABS_API_KEY` (scope: Functions).
3. Redeploy: **Deploys > Trigger deploy > Deploy site**, or run `netlify deploy --build --prod` from the repo root.
4. Check `https://facetime-from-mars.netlify.app/api/health`. It returns only booleans, for example `{"openai": true, "elevenlabs": true}`. It never shows any part of a key.

## Quick Start — Add Your API Keys

You need **two API keys** to run this app in live mode:

| Key | Where to get it |
|-----|----------------|
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `ELEVENLABS_API_KEY` | [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys) |

**On Netlify:** see "Enable live mode on Netlify" above.

**On Replit:** Go to Secrets tab (lock icon) → add both keys → restart.

**Locally:** Copy `backend/.env.example` to `backend/.env` and paste your keys.

That's it. No other config needed — voice IDs are hardcoded for all 3 characters.

---

## What is this?

A voice-powered web app where you call people living on Mars in the year 2159. Humans migrated to Mars in 2070 — now it's 90 years later and you can talk to three Mars colonists in real-time via a quantum relay connection.

### The Colonists

| Character | Role | Voice |
|-----------|------|-------|
| **Zeph** | 16-year-old colony kid who's never seen Earth | ElevenLabs custom voice |
| **Chef Riku** | Food designer recreating Earth dishes he's never tasted | ElevenLabs custom voice |
| **Dr. Nova** | Terraforming chief making Mars breathable | ElevenLabs custom voice |

### Features

- **Walkie-talkie voice chat** — hold to talk, release to send
- **3 unique AI characters** with distinct personalities and voices
- **Radio effects** — static bursts and bandpass filter on voice for space feel
- **3D Mars scene** — interactive rotating Mars, Earth, satellite (React Three Fiber)
- **Camera transitions** — view pans to Earth when you talk, Mars when they respond
- **Ambient space sounds** — procedural drone + blips
- **Signal glitches** — random visual disruptions for immersion
- **Mars clock** — live Earth + Mars time display
- **Suggested topics** — conversation starter chips
- **End call summary** — transmission report with stats and highlights

## Tech Stack

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS + React Three Fiber
- **Backend**: Netlify Functions (TypeScript) in production; FastAPI (Python) for local development
- **AI Conversation**: OpenAI `gpt-4o-mini`
- **Voice Synthesis**: ElevenLabs Text-to-Speech API (browser speechSynthesis in demo mode)
- **Speech-to-Text**: Browser Web Speech API
- **Deployment**: Netlify (originally built and deployed on Replit)

## How It Works

```
User holds transmit button → Browser Speech-to-Text → text
  → /api/chat (Netlify Function in production, FastAPI locally)
    → OpenAI gpt-4o-mini (character-specific prompt → response text)
    → ElevenLabs TTS (character-specific voice → audio)
    (demo mode: pre-written reply → browser speechSynthesis)
  → Audio returned to browser
  → Radio effects applied via Web Audio API
  → Plays through speaker with waveform visualization
```

## Setup

### Prerequisites
- [OpenAI API key](https://platform.openai.com/api-keys)
- [ElevenLabs API key](https://elevenlabs.io/app/settings/api-keys)

### Deploy on Netlify

`netlify.toml` builds the Next.js app from `frontend/` and routes `/api/*` to the functions in `frontend/netlify/functions`. The site deploys with no environment variables (demo mode); add keys as described above for live mode.

```bash
netlify link            # or: netlify sites:create
netlify deploy --build --prod
```

### Run on Replit
1. Import this repo on [Replit](https://replit.com)
2. Add Secrets: `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`
3. Click Run — both backend and frontend start automatically

### Run locally
```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in your API keys
python main.py

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/characters` | GET | List available characters |
| `/api/intro?character=zeph` | GET | Get character's intro audio |
| `/api/chat` | POST | Send message, get voice response |
| `/api/health` | GET | Health check (booleans only: `openai`, `elevenlabs`) |

`/api/intro` and `/api/chat` return `audio/mpeg` with the reply text in the `X-Zeph-Text` header when ElevenLabs works. Otherwise they return JSON `{ text, session_id, audio: null, demo, voice: "browser" }` and the browser speaks the text. `/api/chat` also accepts an optional `history` array of recent turns, since serverless functions do not keep session memory.

## Project Structure

```
├── netlify.toml             # Netlify build + /api/* routing to functions
├── backend/
│   ├── main.py              # FastAPI server for local dev, 3 character prompts, OpenAI + ElevenLabs
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── netlify/
│   │   ├── functions/       # health, characters, intro, chat (production API)
│   │   └── lib/             # character prompts + OpenAI/ElevenLabs helpers (server only)
│   ├── src/
│   │   ├── app/             # Next.js app router
│   │   ├── lib/             # demo-mode replies + browser voice picker
│   │   └── components/
│   │       ├── LandingScreen.tsx      # Character selection cards
│   │       ├── TransmissionPanel.tsx  # Voice chat interface
│   │       ├── MarsScene.tsx          # 3D scene (R3F)
│   │       ├── TransmitButton.tsx     # Push-to-talk button
│   │       ├── WaveformVisualizer.tsx # Audio waveform
│   │       ├── SignalGlitch.tsx       # Random visual glitches
│   │       ├── TopicChips.tsx         # Conversation starters
│   │       ├── MarsClock.tsx          # Dual Earth/Mars time
│   │       ├── AmbientSound.tsx       # Procedural space audio
│   │       └── EndCallSummary.tsx     # Transmission report
│   └── public/
│       ├── Zeph.png
│       ├── foodengineer.jpg
│       └── Drnova.png
└── README.md
```

## ElevenLabs Integration

- **Voice Design**: Each character uses a unique ElevenLabs voice ID matched to their personality
- **Text-to-Speech**: `eleven_turbo_v2_5` model for low-latency responses
- **Voice Settings**: Tuned per character (stability 0.35, style 0.6) for expressive, human-like speech
- **Radio Processing**: Web Audio API adds bandpass filter + waveshaper distortion for space radio effect

## Built With

- [ElevenLabs](https://elevenlabs.io) — Voice synthesis
- [Replit](https://replit.com) — Development and deployment
- [Claude](https://anthropic.com) — AI conversation
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) — 3D rendering

## Hackathon

**ElevenLabs x Replit Hack 3** | #ElevenHacks

Tag [@Replit](https://twitter.com/Replit) and [@elevenlabsio](https://twitter.com/elevenlabsio) when sharing.

---

*The future is calling — pick up.*
