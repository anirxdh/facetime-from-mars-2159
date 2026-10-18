// Pre-written "demo mode" transmissions.
//
// Used when the live AI path is unavailable (no OPENAI_API_KEY, OpenAI errors,
// credits exhausted, or the API cannot be reached at all). Shared by the
// Netlify Functions (server side) and the browser (last-resort fallback), so
// this file must stay free of secrets and system prompts.

export type CharacterKey = "zeph" | "chef_riku" | "dr_nova";

export const CHARACTER_KEYS: CharacterKey[] = ["zeph", "chef_riku", "dr_nova"];

export function normalizeCharacter(key: unknown): CharacterKey {
  return typeof key === "string" && (CHARACTER_KEYS as string[]).includes(key)
    ? (key as CharacterKey)
    : "zeph";
}

export const CHARACTER_NAMES: Record<CharacterKey, string> = {
  zeph: "Zeph",
  chef_riku: "Chef Riku",
  dr_nova: "Dr. Nova",
};

export const INTRO_LINES: Record<CharacterKey, string> = {
  zeph: "Yo! I'm Zeph, calling from Mars! Can you hear me? Who's this?",
  chef_riku:
    "Hey! Chef Riku here from the Mars Food Lab. You're on Earth right? Tell me, what did you eat today?",
  dr_nova:
    "This is Dr. Nova, Terraforming Division. I've got about 5 minutes before the next dust storm hits. What do you want to know?",
};

interface DemoReply {
  /** Lowercase keyword prefixes. Multi-word phrases score higher. */
  keywords: string[];
  text: string;
}

export const DEMO_REPLIES: Record<CharacterKey, DemoReply[]> = {
  zeph: [
    {
      keywords: ["food", "eat", "snack", "tomato", "dinner", "lunch", "breakfast", "hungry", "pizza"],
      text: "Okay so my dad sometimes grows real tomatoes in the food lab and it's the biggest flex in Dome 7. Everything else is synthesized, which is fine I guess. Wait, do you just pick food off plants outside whenever you want?",
    },
    {
      keywords: ["school", "class", "learn", "study", "teacher", "homework", "tutor"],
      text: "School's inside the dome and my favorite class is Earth History, because dude, your planet is so weird. Like you had to walk outside to get to school? What's your favorite class?",
    },
    {
      keywords: ["pixel", "pet", "gecko", "animal", "dog", "cat", "lizard"],
      text: "Pixel is my genetically engineered gecko and he's basically the best roommate in Dome 7. He sleeps under the heat lamp all day like a total crater brain. Do you have a pet down there?",
    },
    {
      keywords: ["sunset", "sky", "blue", "sun", "color", "sunrise"],
      text: "Mars sunsets are blue, which is obviously superior. I've seen Earth sunsets in VR and they're pretty but way too orange. What color is your sky right now?",
    },
    {
      keywords: ["basketball", "sport", "game", "play", "olympic", "gymnast", "low-grav", "gravity"],
      text: "Low-grav basketball is so sol, the hoops are six meters high and you basically fly to dunk. And low-grav gymnastics at the Mars Olympics? Insane. Do you play any sports?",
    },
    {
      keywords: ["redfeed", "social", "internet", "wifi", "phone", "app", "post", "online"],
      text: "RedFeed is our social media, it's all dome drama and dust storm pics. People still talk about the Great Wifi Outage of 2134 like it was a horror movie. What app do you use the most?",
    },
    {
      keywords: ["rain", "weather", "ocean", "water", "bug", "insect", "outside", "beach", "swim"],
      text: "Wait, rain just falls out of the sky? On you? For free? We can't even step outside without a suit. Have you ever actually swum in an ocean?",
    },
    {
      keywords: ["music", "song", "band", "listen", "singer", "concert"],
      text: "Most music is AI-generated now, but there's this huge human-only underground scene and it's honestly the best. My friends and I trade tracks on RedFeed. Who do you listen to?",
    },
    {
      keywords: ["earth", "visit", "elevator", "dodo", "car", "travel", "future"],
      text: "I've never been to Earth, but your space elevator looks so cool in photos. Also, someone cloned a dodo and apparently they're kinda mean. Is Earth as loud as it looks in videos?",
    },
    {
      keywords: ["who are you", "your name", "about you", "hello", "hey", "hi", "how are you", "yourself"],
      text: "I'm Zeph, sixteen, born in Mars Colony One and I've literally never seen Earth in person. This quantum relay call is wild, by the way, no time delay at all. So what's it like being an Earthling?",
    },
  ],
  chef_riku: [
    {
      keywords: ["pizza", "cheese", "crust"],
      text: "Pizza is my white whale! I've spent years in the lab trying to get it right, and I've never tasted the real thing. Tell me honestly, is the crust supposed to be crunchy or soft?",
    },
    {
      keywords: ["eat", "food", "dinner", "lunch", "breakfast", "meal", "today", "hungry"],
      text: "Now we're cooking! Today I'm working on dome-grown red basil pesto over synthetic protein noodles. What did you eat for your last meal, and was it as good as it sounds?",
    },
    {
      keywords: ["taste", "flavor", "flavour", "spice", "spicy", "salt", "chocolate", "smell"],
      text: "Everything I know about flavor comes from molecular databases and old recipe archives. I can match the molecules, but I can't match the memory. What does chocolate actually taste like to you?",
    },
    {
      keywords: ["ingredient", "mushroom", "basil", "vegetable", "soil", "grow", "garden", "farm"],
      text: "Mars has ingredients you've never heard of. Our low-grav mushrooms grow big and spongy, and the Mars soil vegetables are packed with minerals. What's one vegetable you actually love?",
    },
    {
      keywords: ["grandparent", "grandma", "grandpa", "family", "settler", "story", "stories", "history"],
      text: "My grandparents came over with the first settlers in 2070, and they used to describe Earth food at bedtime like fairy tales. Fresh bread, ocean fish, real strawberries. Which one should I try to recreate first?",
    },
    {
      keywords: ["zeph", "lab", "work", "job", "team", "colleague"],
      text: "Zeph's dad works with me in the Food Design Lab, so I hear every one of that kid's snack opinions. Every dish we make is a guess at a flavor none of us has tasted. What's your favorite comfort food?",
    },
    {
      keywords: ["coffee", "drink", "tea", "juice", "soda"],
      text: "Coffee is a sacred mystery up here. Our version comes from synthetic beans and it's a five-star effort, but I know it's not the real thing. How do you take yours?",
    },
    {
      keywords: ["cook", "recipe", "kitchen", "chef", "fusion", "dish"],
      text: "My favorite thing is fusion, Mars ingredients with Earth techniques. Every meal is art, even when the art is a little experimental. Do you cook at home?",
    },
    {
      keywords: ["dessert", "cake", "ice cream", "sweet", "fruit", "strawberr", "sugar", "favorite dessert"],
      text: "Dessert is where I get emotional. We've never had a real strawberry up here, only the flavor profile from the archives. Is it sweet, or more sour than people say?",
    },
    {
      keywords: ["who are you", "your name", "about you", "hello", "hey", "hi", "how are you", "yourself"],
      text: "Chef Riku, Head of the Food Design Lab, second-generation Mars-born, and very excited to talk to someone who eats real Earth food. That's a five-star moment for me. What's the best thing you've ever eaten?",
    },
  ],
  dr_nova: [
    {
      keywords: ["terraform", "atmosphere", "air", "breath", "oxygen", "progress", "how's terraforming"],
      text: "Eighteen years into terraforming, and the air outside is still trying to kill us, just less enthusiastically. The processors and engineered bacteria are slowly doing their work. What does it feel like to just breathe outside without thinking about it?",
    },
    {
      keywords: ["storm", "dust", "weather", "wind"],
      text: "Dust storms here can last for weeks, and I have about five minutes before the next one hits. My favorite kind of deadline. What's the worst weather you've ever been caught in?",
    },
    {
      keywords: ["plant", "garden", "tree", "flower", "green", "seed", "outside the dome"],
      text: "My proudest moment is a single plant that survived outside the dome for seventy-two hours. That doesn't sound like much until you see how hard Mars tried to stop it. Do you have trees where you live?",
    },
    {
      keywords: ["sunset", "sky", "blue", "color", "sun"],
      text: "Our sunsets are blue. After all these years, they still stop me in my tracks, even when I'm late for a processor check. What do sunsets look like from your window?",
    },
    {
      keywords: ["dream", "walk", "suit", "without a suit", "future", "someday", "hope"],
      text: "My dream is to walk outside without a suit and feel the wind on my face. I might actually see the first unprotected breath on Mars in my lifetime. If you could stand on Mars for one minute, what would you do?",
    },
    {
      keywords: ["radiation", "engineer", "water", "ice", "science", "machine", "processor", "tech"],
      text: "Most of my day is radiation shielding, water extraction, and negotiating with atmospheric processors. We're also working on the ice caps, carefully. How much do you think about water where you live? Up here it's treasure.",
    },
    {
      keywords: ["born", "growing up", "childhood", "kid", "home", "colony", "family"],
      text: "I was born here in 2117, when the colony was tiny and fragile. Mars is a planet that tries to kill you every day, and I love it anyway. What's home like for you?",
    },
    {
      keywords: ["earth", "ocean", "forest", "planet"],
      text: "You have all that free oxygen just sitting there in the open. Professionally, I find that outrageous. Personally, I'm a little jealous. What's the air like where you are right now?",
    },
    {
      keywords: ["danger", "scary", "afraid", "accident", "survive", "risk", "fail"],
      text: "I've been through dust storms, equipment failures, and more close calls than I'd like. Mars keeps you humble. What's the bravest thing you've ever done?",
    },
    {
      keywords: ["who are you", "your name", "about you", "hello", "hey", "hi", "how are you", "yourself"],
      text: "Dr. Nova, Chief Terraforming Engineer at Mars Colony One. I lead the project to make this atmosphere breathable, which is a long way of saying I argue with a planet for a living. What would you like to know?",
    },
  ],
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreReply(reply: DemoReply, text: string): number {
  let score = 0;
  for (const kw of reply.keywords) {
    // Longer keywords match as word prefixes ("plant" matches "plants").
    // Short ones must be whole words (plus plural), so "hi" skips "history".
    const tail = kw.length <= 3 ? "(s|es)?($|[^a-z])" : "";
    if (new RegExp(`(^|[^a-z])${escapeRegExp(kw)}${tail}`).test(text)) {
      score += kw.split(" ").length;
    }
  }
  return score;
}

/**
 * Pick a pre-written reply for the character, loosely matched to the
 * visitor's message, avoiding replies already used in this conversation.
 * Falls back to rotating through unused replies in order.
 */
export function pickDemoReply(
  character: unknown,
  userText: string,
  alreadySaid: string[] = []
): string {
  const replies = DEMO_REPLIES[normalizeCharacter(character)];
  const said = new Set(alreadySaid.map((s) => s.trim()));
  let pool = replies.filter((r) => !said.has(r.text));
  if (pool.length === 0) pool = replies;

  const text = (userText || "").toLowerCase();
  let best: DemoReply | null = null;
  let bestScore = 0;
  for (const reply of pool) {
    const s = scoreReply(reply, text);
    if (s > bestScore) {
      best = reply;
      bestScore = s;
    }
  }
  if (best) return best.text;

  // No topic match: rotate through what has not been said yet, skipping the
  // "who are you" line unless it is all that is left.
  const general = pool.filter((r) => !r.keywords.includes("who are you"));
  return (general[0] ?? pool[0]).text;
}
