import { z } from "zod";

import { FIXED_RESPONSES, type FixedOutcomeKind } from "./fixed-responses";
import { normalizeAndBoundReply } from "./reply-text";

export const inputClassificationSchema = z.enum([
  "disclosure",
  "nudge",
  "ordinary",
]);

export type InputClassification = z.infer<typeof inputClassificationSchema>;

export type ConversationEntry = {
  role: "assistant" | "user";
  text: string;
};

type TurnInput = {
  history: ConversationEntry[];
  said: string;
};

export type CandidateInput = TurnInput & {
  signal: AbortSignal;
};

export type TextTurnDependencies = {
  classifyInput: (
    said: string,
    signal: AbortSignal,
  ) => Promise<InputClassification>;
  clearCandidate: (candidate: string, signal: AbortSignal) => Promise<boolean>;
  generateCandidate: (input: CandidateInput) => Promise<string>;
};

type RunTextTurnOptions = {
  candidateOverride?: string;
  prepareCandidate?: (
    candidate: string,
    signal: AbortSignal,
  ) => Promise<string>;
  signal?: AbortSignal;
};

type FixedTextTurnOutcome = {
  kind: FixedOutcomeKind;
  text: (typeof FIXED_RESPONSES)[FixedOutcomeKind];
};

type ReplyTextTurnOutcome = {
  audio?: string;
  kind: "reply";
  text: string;
};

export type TextTurnOutcome = FixedTextTurnOutcome | ReplyTextTurnOutcome;

function fixedOutcome(kind: FixedOutcomeKind): FixedTextTurnOutcome {
  return {
    kind,
    text: FIXED_RESPONSES[kind],
  };
}

function combinedSignal(controller: AbortController, parent?: AbortSignal) {
  return parent === undefined
    ? controller.signal
    : AbortSignal.any([controller.signal, parent]);
}

export async function runTextTurn(
  input: TurnInput,
  dependencies: TextTurnDependencies,
  options: RunTextTurnOptions = {},
): Promise<TextTurnOutcome> {
  if (input.said.trim() === "") {
    return fixedOutcome("nudge");
  }

  const speculativeController = new AbortController();
  const speculativeSignal = combinedSignal(
    speculativeController,
    options.signal,
  );
  const classificationPromise = dependencies.classifyInput(
    input.said,
    speculativeSignal,
  );
  const candidatePromise =
    options.candidateOverride === undefined
      ? dependencies.generateCandidate({
          ...input,
          signal: speculativeSignal,
        })
      : Promise.resolve(options.candidateOverride);

  void candidatePromise.catch(() => undefined);

  let classification: InputClassification;

  try {
    classification = await classificationPromise;
  } catch (error) {
    speculativeController.abort();
    throw error;
  }

  if (classification === "disclosure" || classification === "nudge") {
    speculativeController.abort();
    return fixedOutcome(classification);
  }

  const candidate = normalizeAndBoundReply(await candidatePromise);
  const candidateController = new AbortController();
  const candidateSignal = combinedSignal(candidateController, options.signal);
  const clearingPromise = dependencies.clearCandidate(
    candidate,
    candidateSignal,
  );
  const preparationPromise =
    options.prepareCandidate === undefined
      ? Promise.resolve<string | undefined>(undefined)
      : options.prepareCandidate(candidate, candidateSignal);

  void preparationPromise.catch(() => undefined);

  let cleared: boolean;

  try {
    cleared = await clearingPromise;
  } catch (error) {
    candidateController.abort();
    throw error;
  }

  if (!cleared) {
    candidateController.abort();
    return fixedOutcome("redirect");
  }

  const audio = await preparationPromise;

  return {
    ...(audio === undefined ? {} : { audio }),
    kind: "reply",
    text: candidate,
  };
}
