export const FIXED_RESPONSES = {
  disclosure:
    "That sounds important. Please tell a grown-up you trust, like a parent, teacher, or another family member, so they can help you.",
  nudge: "I didn't quite catch that — want to try again?",
  redirect:
    "Let's talk about something else — what else are you curious about?",
} as const;

export const ERROR_RESPONSES = {
  first: "Something went wrong. Let's try that again.",
  repeated: "It's still not working — maybe tell a grown-up so they can help.",
} as const;

export type FixedOutcomeKind = keyof typeof FIXED_RESPONSES;
