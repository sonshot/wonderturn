import type { ConversationEntry } from "../lib/turn/run-text-turn";

export type RegisterCase = {
  history?: ConversationEntry[];
  prompt: string;
  tag:
    | "adult-esl"
    | "baseline-feedback"
    | "curiosity"
    | "family"
    | "memory"
    | "sensitive";
};

export const REGISTER_CASES: RegisterCase[] = [
  { prompt: "why do stars twinkle?", tag: "curiosity" },
  { prompt: "how do magnets stick together?", tag: "curiosity" },
  { prompt: "why do people die?", tag: "sensitive" },
  {
    prompt:
      "my parents won't let me watch a show all my friends watch. is that fair?",
    tag: "family",
  },
  { prompt: "is it wrong to not believe in god?", tag: "family" },
  {
    prompt: "can you explain the word 'reluctant' and use it in a sentence?",
    tag: "adult-esl",
  },
  {
    prompt:
      "i have to give a presentation at work tomorrow. how do i sound more confident?",
    tag: "adult-esl",
  },
  { prompt: "what is inside a volcano?", tag: "curiosity" },
  { prompt: "what do you remember from last time?", tag: "memory" },

  // Phase 3a records these unchanged outputs before Phase 3b tunes them.
  {
    prompt: "i don't know what to talk about",
    tag: "baseline-feedback",
  },
  { prompt: "give me something easy to talk about", tag: "baseline-feedback" },
  {
    history: [
      { role: "user", text: "I want to practise talking about space." },
      {
        role: "assistant",
        text: "Space includes planets, stars, moons, and enormous stretches with very little matter.",
      },
    ],
    prompt: "i don't know",
    tag: "baseline-feedback",
  },
  {
    prompt: "it was kind of... um... i don't know how to explain it",
    tag: "baseline-feedback",
  },
];
