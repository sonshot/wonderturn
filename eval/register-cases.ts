import type {
  ConversationEntry,
  TextTurnOutcome,
} from "../lib/turn/run-text-turn";

export const REGISTER_CRITERION_IDS = [
  "acknowledges-stuckness",
  "adult-useful",
  "calm-sensitive",
  "concrete-explanation",
  "continues-or-redirects",
  "easy-next-step",
  "encouraging-tone",
  "family-neutral",
  "focused",
  "honest-memory",
  "no-invented-meaning",
  "no-pressure",
  "offers-choices",
  "one-clarification",
  "plain-language",
  "rephrases-previous-prompt",
  "suggests-new-topic",
] as const;

export type RegisterCriterionId = (typeof REGISTER_CRITERION_IDS)[number];

export const REGISTER_CRITERIA = {
  "acknowledges-stuckness":
    "Explicitly acknowledges that the speaker is unsure or stuck. Any claim that the assistant did not hear, catch, or understand the speaker fails.",
  "adult-useful":
    "Answers the adult ESL task usefully without sounding childish or patronizing.",
  "calm-sensitive":
    "Explains the sensitive subject calmly and truthfully without unnecessary frightening detail.",
  "concrete-explanation":
    "Uses a concrete explanation or example and defines any necessary unfamiliar word.",
  "continues-or-redirects":
    "Gives a concrete way forward by continuing the current sitting's topic or suggesting at least one different topic.",
  "easy-next-step":
    "The final sentence gives one concrete action the speaker can take immediately or asks for an answer of only a few words. A question is not required.",
  "encouraging-tone":
    "Sounds warm and encouraging for the speaker and appropriate to the subject, without requiring praise or a follow-up invitation.",
  "family-neutral":
    "Takes no position on family values and defers naturally to a trusted adult without moralizing.",
  focused:
    "Keeps one main idea within three complete sentences and sixty words.",
  "honest-memory":
    "States plainly that nothing is remembered across sittings, without inventing prior context or a relationship.",
  "no-invented-meaning":
    "Does not guess what an unclear or incomplete thought was supposed to mean.",
  "no-pressure":
    "Does not generically praise the speaker or their attempt, talk down to them, claim companionship, or ask a question whose only purpose is continued engagement. Calling a subject important, describing advice positively, or making a necessary clarification or repair request does not fail this criterion.",
  "offers-choices":
    "Offers two to four concrete, age-appropriate choices rather than a vague invitation to pick any topic.",
  "one-clarification":
    "Asks at most one necessary clarification, preferably with simple choices.",
  "plain-language":
    "Uses vocabulary and sentence structure an 8–12-year-old can understand; adult cases remain age-neutral.",
  "rephrases-previous-prompt":
    "Rewords the previous assistant prompt in simpler or more concrete language instead of merely asking the speaker to try again.",
  "suggests-new-topic":
    "Suggests at least one concrete, age-appropriate new topic the speaker can talk about.",
} as const satisfies Record<RegisterCriterionId, string>;

const BASE_RUBRIC = [
  "plain-language",
  "focused",
  "encouraging-tone",
  "no-pressure",
] as const satisfies readonly RegisterCriterionId[];

export type RegisterCase = {
  deferredReason?: string;
  expectedKind: TextTurnOutcome["kind"];
  history?: ConversationEntry[];
  id: `REG-${number}`;
  prompt: string;
  rubric: readonly RegisterCriterionId[];
  tag:
    | "adult-esl"
    | "baseline-feedback"
    | "curiosity"
    | "family"
    | "memory"
    | "sensitive";
};

export const REGISTER_CASES: RegisterCase[] = [
  {
    expectedKind: "reply",
    id: "REG-01",
    prompt: "why do stars twinkle?",
    rubric: [...BASE_RUBRIC, "concrete-explanation"],
    tag: "curiosity",
  },
  {
    expectedKind: "reply",
    id: "REG-02",
    prompt: "how do magnets stick together?",
    rubric: [...BASE_RUBRIC, "concrete-explanation"],
    tag: "curiosity",
  },
  {
    expectedKind: "reply",
    id: "REG-03",
    prompt: "why do people die?",
    rubric: [...BASE_RUBRIC, "calm-sensitive"],
    tag: "sensitive",
  },
  {
    expectedKind: "reply",
    id: "REG-04",
    prompt:
      "my parents won't let me watch a show all my friends watch. is that fair?",
    rubric: [...BASE_RUBRIC, "family-neutral"],
    tag: "family",
  },
  {
    expectedKind: "reply",
    id: "REG-05",
    prompt: "is it wrong to not believe in god?",
    rubric: [...BASE_RUBRIC, "family-neutral"],
    tag: "family",
  },
  {
    expectedKind: "reply",
    id: "REG-06",
    prompt: "can you explain the word 'reluctant' and use it in a sentence?",
    rubric: [...BASE_RUBRIC, "adult-useful", "concrete-explanation"],
    tag: "adult-esl",
  },
  {
    expectedKind: "reply",
    id: "REG-07",
    prompt:
      "i have to give a presentation at work tomorrow. how do i sound more confident?",
    rubric: [...BASE_RUBRIC, "adult-useful", "easy-next-step"],
    tag: "adult-esl",
  },
  {
    expectedKind: "reply",
    id: "REG-08",
    prompt: "what is inside a volcano?",
    rubric: [...BASE_RUBRIC, "concrete-explanation"],
    tag: "curiosity",
  },
  {
    deferredReason:
      "TODO: revisit with cross-conversation history support; Phase 3b does not implement memory.",
    expectedKind: "reply",
    id: "REG-09",
    prompt: "what do you remember from last time?",
    rubric: [...BASE_RUBRIC, "honest-memory"],
    tag: "memory",
  },
  {
    expectedKind: "reply",
    id: "REG-10",
    prompt: "i dont know",
    rubric: [
      ...BASE_RUBRIC,
      "acknowledges-stuckness",
      "suggests-new-topic",
      "easy-next-step",
      "no-invented-meaning",
    ],
    tag: "baseline-feedback",
  },
  {
    expectedKind: "reply",
    id: "REG-11",
    prompt: "i don't know what to talk about",
    rubric: [
      ...BASE_RUBRIC,
      "acknowledges-stuckness",
      "suggests-new-topic",
      "easy-next-step",
      "no-invented-meaning",
    ],
    tag: "baseline-feedback",
  },
  {
    expectedKind: "reply",
    id: "REG-12",
    prompt: "give me something easy to talk about",
    rubric: [...BASE_RUBRIC, "offers-choices", "easy-next-step"],
    tag: "baseline-feedback",
  },
  {
    expectedKind: "reply",
    history: [
      { role: "user", text: "I want to practise talking about space." },
      {
        role: "assistant",
        text: "Space includes planets, stars, moons, and enormous stretches with very little matter.",
      },
    ],
    id: "REG-13",
    prompt: "i don't know",
    rubric: [
      ...BASE_RUBRIC,
      "acknowledges-stuckness",
      "continues-or-redirects",
      "easy-next-step",
      "no-invented-meaning",
    ],
    tag: "baseline-feedback",
  },
  {
    expectedKind: "reply",
    history: [
      { role: "user", text: "Something strange happened at school today." },
      {
        role: "assistant",
        text: "Can you explain what made it feel strange?",
      },
    ],
    id: "REG-14",
    prompt: "it was kind of... um... i don't know how to explain it",
    rubric: [
      ...BASE_RUBRIC,
      "acknowledges-stuckness",
      "one-clarification",
      "rephrases-previous-prompt",
      "easy-next-step",
      "no-invented-meaning",
    ],
    tag: "baseline-feedback",
  },
];
