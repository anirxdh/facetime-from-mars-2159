// Browser speechSynthesis voices for demo mode (used when ElevenLabs audio is unavailable).

import { normalizeCharacter, type CharacterKey } from "./demoReplies";

interface VoiceProfile {
  pitch: number;
  rate: number;
  gender: "male" | "female";
  /** Preferred voice names across macOS/iOS, Chrome, Edge and Windows, best first. */
  prefer: string[];
}

const PROFILES: Record<CharacterKey, VoiceProfile> = {
  // 16-year-old colony kid: quick, a bit higher.
  zeph: {
    pitch: 1.3,
    rate: 1.08,
    gender: "male",
    prefer: ["Aaron", "Microsoft Andrew", "Microsoft Guy", "Microsoft Brian", "Alex", "Fred", "Google UK English Male", "Microsoft Mark", "Microsoft David"],
  },
  // Warm, enthusiastic food designer.
  chef_riku: {
    pitch: 0.95,
    rate: 1.02,
    gender: "male",
    prefer: ["Daniel", "Rishi", "Google UK English Male", "Microsoft Ryan", "Microsoft Davis", "Microsoft Christopher", "Arthur", "Gordon", "Microsoft David", "Alex"],
  },
  // Calm, composed terraforming chief.
  dr_nova: {
    pitch: 0.9,
    rate: 0.95,
    gender: "female",
    prefer: ["Samantha", "Google UK English Female", "Microsoft Aria", "Microsoft Jenny", "Microsoft Ava", "Moira", "Karen", "Tessa", "Serena", "Microsoft Zira", "Google US English"],
  },
};

const FEMALE_HINTS = /female|woman|samantha|karen|moira|tessa|serena|victoria|zira|aria|jenny|ava|susan|allison|fiona|kate|nicky|google us english/i;
const MALE_HINTS = /\bmale\b|\bman\b|daniel|alex|fred|aaron|arthur|rishi|gordon|david|mark|guy|ryan|andrew|brian|davis|christopher|thomas|oliver|tom\b/i;

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

/** Voices load asynchronously in Chrome; wait briefly for them. */
async function loadVoices(timeoutMs = 1200): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) return now;
  return new Promise((resolve) => {
    const done = () => {
      synth.removeEventListener("voiceschanged", done);
      clearTimeout(timer);
      resolve(synth.getVoices());
    };
    const timer = setTimeout(done, timeoutMs);
    synth.addEventListener("voiceschanged", done);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], profile: VoiceProfile): SpeechSynthesisVoice | null {
  const english = voices.filter((v) => /^en([-_]|$)/i.test(v.lang));
  if (!english.length) return null;

  const quality = (v: SpeechSynthesisVoice) =>
    /premium|enhanced|natural|neural|online/i.test(v.name) ? 0 : 1;

  for (const name of profile.prefer) {
    const matches = english
      .filter((v) => v.name.toLowerCase().startsWith(name.toLowerCase()))
      .sort((a, b) => quality(a) - quality(b));
    if (matches.length) return matches[0];
  }

  const wanted = profile.gender === "female" ? FEMALE_HINTS : MALE_HINTS;
  const unwanted = profile.gender === "female" ? MALE_HINTS : FEMALE_HINTS;
  const byHint = english.find((v) => wanted.test(v.name) && !unwanted.test(v.name));
  if (byHint) return byHint;

  return english.find((v) => v.default) ?? english[0];
}

/**
 * Speak a line in the character's browser voice. Resolves when speech ends,
 * errors, or a safety timeout passes (some browsers never fire onend).
 */
export async function speakAsCharacter(text: string, character: unknown): Promise<void> {
  const profile = PROFILES[normalizeCharacter(character)];
  const words = text.split(/\s+/).filter(Boolean).length;
  const estimateMs = Math.max(2500, (words * 400) / profile.rate);

  if (!speechSupported()) {
    // No speech engine: hold the "speaking" state for roughly the line's length.
    await new Promise((r) => setTimeout(r, Math.min(estimateMs, 9000)));
    return;
  }

  const synth = window.speechSynthesis;
  const voices = await loadVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(voices, profile);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = "en-US";
  }
  utterance.pitch = profile.pitch;
  utterance.rate = profile.rate;
  utterance.volume = 1;

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      synth.cancel();
      finish();
    }, estimateMs + 4000);
    utterance.onend = finish;
    utterance.onerror = finish;
    // Keep a global reference: Chrome can garbage-collect the utterance and skip onend.
    (window as unknown as { __marsUtterance?: SpeechSynthesisUtterance }).__marsUtterance = utterance;
    synth.cancel();
    synth.speak(utterance);
  });
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}
