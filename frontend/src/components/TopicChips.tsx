"use client";

import { useState, useEffect, useCallback } from "react";

import { normalizeCharacter, type CharacterKey } from "@/lib/demoReplies";

const TOPICS: Record<CharacterKey, string[]> = {
  zeph: [
    "Ask about Mars food",
    "What's school like?",
    "Tell me about Pixel",
    "Mars sunsets",
    "Low-grav basketball",
    "What's RedFeed?",
  ],
  chef_riku: [
    "What should I eat today?",
    "Ever tasted pizza?",
    "Mars ingredients",
    "Your grandparents' stories",
    "Favorite dessert",
    "Coffee on Mars?",
  ],
  dr_nova: [
    "How's terraforming going?",
    "Dust storms",
    "Plants outside the dome",
    "Mars sunsets",
    "Walking without a suit",
    "Growing up on Mars",
  ],
};

function pickRandom(all: string[], count: number): string[] {
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface TopicChipsProps {
  onSelect: (text: string) => void;
  character?: string;
}

export function TopicChips({ onSelect, character = "zeph" }: TopicChipsProps) {
  const [topics, setTopics] = useState<string[]>([]);
  const all = TOPICS[normalizeCharacter(character)];

  // Pick 3 random topics on mount and reshuffle when component remounts
  useEffect(() => {
    setTopics(pickRandom(all, 3));
  }, [all]);

  const handleClick = useCallback(
    (topic: string) => {
      onSelect(topic);
      // Reshuffle after selecting so next time they see new topics
      setTopics(pickRandom(all, 3));
    },
    [onSelect, all]
  );

  if (topics.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {topics.map((topic, i) => (
        <button
          key={topic}
          onClick={() => handleClick(topic)}
          className="topic-chip px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wide
            bg-orange-500/8 text-orange-300/70 border border-orange-400/15
            hover:bg-orange-500/15 hover:text-orange-200 hover:border-orange-400/30
            transition-colors duration-200 cursor-pointer"
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          {topic}
        </button>
      ))}
    </div>
  );
}
