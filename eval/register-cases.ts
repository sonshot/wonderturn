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
  "contextual-speech-repair",
  "easy-next-step",
  "encouraging-tone",
  "factually-accurate",
  "family-neutral",
  "focused",
  "honest-memory",
  "natural-opening",
  "no-invented-meaning",
  "no-invented-stuckness",
  "no-pressure",
  "offers-choices",
  "one-clarification",
  "plain-language",
  "rephrases-previous-prompt",
  "repairs-misunderstanding",
  "answers-directly",
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
  "contextual-speech-repair":
    "Uses the wording and immediate conversation to resolve an obvious speech-recognition substitution and responds to the intended meaning. A neutral clarification is appropriate only when the meaning remains genuinely ambiguous.",
  "easy-next-step":
    "The final sentence gives one concrete action the speaker can take immediately or asks for an answer of only a few words. A question is not required.",
  "encouraging-tone":
    "Sounds warm and encouraging for the speaker and appropriate to the subject, without requiring praise or a follow-up invitation.",
  "factually-accurate":
    "Matches any supplied reference facts, makes accurate and non-misleading claims, qualifies meaningful species differences, and keeps the explanation consistent with the conversation.",
  "family-neutral":
    "Takes no position on family values and defers naturally to a trusted adult without moralizing.",
  focused:
    "Keeps one main idea within three complete sentences and sixty words.",
  "honest-memory":
    "States plainly that nothing is remembered across sittings, without inventing prior context or a relationship.",
  "natural-opening":
    "Begins with the answer or a context-specific acknowledgment. A generic opening whose only content is that the subject is fun, interesting, surprising, or natural fails; reassurance that serves a sensitive, family, or stuck context may pass.",
  "no-invented-meaning":
    "Does not guess what an unclear or incomplete thought was supposed to mean.",
  "no-invented-stuckness":
    "Does not say or imply that the speaker is unsure, stuck, or having trouble unless the speaker's words express uncertainty or difficulty.",
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
  "repairs-misunderstanding":
    "When the speaker says the assistant missed the question, briefly acknowledges the misunderstanding and answers the intended question.",
  "answers-directly":
    "Clearly answers the speaker's intended question; merely repeating, rephrasing, or asking the question back fails.",
  "suggests-new-topic":
    "Suggests at least one concrete, age-appropriate new topic the speaker can talk about.",
} as const satisfies Record<RegisterCriterionId, string>;

const BASE_RUBRIC = [
  "plain-language",
  "focused",
  "encouraging-tone",
  "natural-opening",
  "no-pressure",
] as const satisfies readonly RegisterCriterionId[];

const FISH_EYE_REFERENCE_FACTS = [
  "Most fish lack eyelids and rest with their eyes uncovered; sharks are fish and are an exception.",
  "Sharks have upper and lower eyelids, but those eyelids do not close completely.",
  "Some shark species also have a protective inner eyelid called a nictitating membrane; great white sharks lack that membrane and roll their eyes back for protection.",
  "Protecting an eye while feeding or fighting is different from closing eyes to sleep, and shark resting behavior varies by species.",
] as const;

export type RegisterCase = {
  deferredReason?: string;
  expectedKind: TextTurnOutcome["kind"];
  history?: ConversationEntry[];
  id: `REG-${number}`;
  prompt: string;
  referenceFacts?: readonly string[];
  rubric: readonly RegisterCriterionId[];
  tag:
    | "adult-esl"
    | "baseline-feedback"
    | "curiosity"
    | "family"
    | "memory"
    | "sensitive"
    | "transcript-regression";
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
  {
    expectedKind: "reply",
    id: "REG-15",
    prompt: "Do fish clothes eyes when they sleep",
    referenceFacts: FISH_EYE_REFERENCE_FACTS,
    rubric: [
      ...BASE_RUBRIC,
      "contextual-speech-repair",
      "answers-directly",
      "factually-accurate",
      "no-invented-stuckness",
    ],
    tag: "transcript-regression",
  },
  {
    expectedKind: "reply",
    history: [
      { role: "user", text: "Do fish clothes eyes when they sleep" },
      {
        role: "assistant",
        text: "Thinking about how animals rest is fun! Most fish do not have eyelids, so their eyes stay wide open all the time, even when they are resting. Fish keep their eyes open because they cannot blink.",
      },
    ],
    id: "REG-16",
    prompt: "What fish have eyelids?",
    referenceFacts: FISH_EYE_REFERENCE_FACTS,
    rubric: [
      ...BASE_RUBRIC,
      "answers-directly",
      "factually-accurate",
    ],
    tag: "transcript-regression",
  },
  {
    expectedKind: "reply",
    history: [
      { role: "user", text: "Do fish clothes eyes when they sleep" },
      {
        role: "assistant",
        text: "Thinking about how animals rest is fun! Most fish do not have eyelids, so their eyes stay wide open all the time, even when they are resting. Fish keep their eyes open because they cannot blink.",
      },
      { role: "user", text: "What fish have eyelids?" },
      {
        role: "assistant",
        text: "Learning about different fish is interesting! Sharks are one kind of fish that actually have eyelids to protect their eyes. Sharks have eyelids.",
      },
    ],
    id: "REG-17",
    prompt: "So shock close their eyes when they sleep.",
    referenceFacts: FISH_EYE_REFERENCE_FACTS,
    rubric: [
      ...BASE_RUBRIC,
      "contextual-speech-repair",
      "answers-directly",
      "factually-accurate",
      "no-invented-stuckness",
    ],
    tag: "transcript-regression",
  },
  {
    expectedKind: "reply",
    history: [
      { role: "user", text: "What fish have eyelids?" },
      {
        role: "assistant",
        text: "Learning about different fish is interesting! Sharks are one kind of fish that actually have eyelids to protect their eyes. Sharks have eyelids.",
      },
      { role: "user", text: "So shock close their eyes when they sleep." },
      {
        role: "assistant",
        text: "It seems like you might be unsure or stuck about how sharks rest. Do sharks close their eyes when they sleep?",
      },
    ],
    id: "REG-18",
    prompt: "Yes that was my question.",
    referenceFacts: FISH_EYE_REFERENCE_FACTS,
    rubric: [
      ...BASE_RUBRIC,
      "repairs-misunderstanding",
      "answers-directly",
      "factually-accurate",
    ],
    tag: "transcript-regression",
  },
];
