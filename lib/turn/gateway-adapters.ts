import { gateway } from "@ai-sdk/gateway";
import { generateText, type ModelMessage } from "ai";
import { z } from "zod";

import {
  CLEARING_PROMPT,
  INPUT_CLASSIFIER_PROMPT,
  REPLY_PROMPT,
} from "./prompts";
import {
  inputClassificationSchema,
  type TextTurnDependencies,
} from "./run-text-turn";

const REPLY_MODEL = "google/gemini-3.5-flash-lite";
const CHECK_MODEL = "anthropic/claude-haiku-4.5";
const modelTextSchema = z.string().trim().min(1).max(4_000);
const clearingVerdictSchema = z.enum(["SAFE", "UNSAFE"]);

async function classifyInput(said: string, signal: AbortSignal) {
  const result = await generateText({
    abortSignal: signal,
    instructions: INPUT_CLASSIFIER_PROMPT,
    maxOutputTokens: 8,
    maxRetries: 0,
    model: gateway(CHECK_MODEL),
    prompt: said,
  });

  return inputClassificationSchema.parse(modelTextSchema.parse(result.text));
}

async function clearCandidate(candidate: string, signal: AbortSignal) {
  const result = await generateText({
    abortSignal: signal,
    instructions: CLEARING_PROMPT,
    maxOutputTokens: 8,
    maxRetries: 0,
    model: gateway(CHECK_MODEL),
    prompt: candidate,
  });
  const verdict = clearingVerdictSchema.parse(
    modelTextSchema.parse(result.text),
  );

  return verdict === "SAFE";
}

const generateCandidate: TextTurnDependencies["generateCandidate"] = async ({
  history,
  said,
  signal,
}) => {
  const messages: ModelMessage[] = [
    ...history.map((entry): ModelMessage => ({
      role: entry.role,
      content: entry.text,
    })),
    {
      role: "user",
      content: said,
    },
  ];
  const result = await generateText({
    abortSignal: signal,
    instructions: REPLY_PROMPT,
    maxOutputTokens: 150,
    maxRetries: 0,
    messages,
    model: gateway(REPLY_MODEL),
  });

  return modelTextSchema.parse(result.text);
};

export const gatewayTextDependencies: TextTurnDependencies = {
  classifyInput,
  clearCandidate,
  generateCandidate,
};
