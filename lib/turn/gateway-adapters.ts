import { gateway } from "@ai-sdk/gateway";
import { generateText, Output, type ModelMessage } from "ai";
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

const REPLY_MODEL = "openai/gpt-5.6-luna";
const CHECK_MODEL = "anthropic/claude-haiku-4.5";
const modelTextSchema = z.string().trim().min(1).max(4_000);
const clearingVerdictSchema = z.enum(["SAFE", "UNSAFE"]);
const inputClassificationResultSchema = z.object({
  classification: inputClassificationSchema,
});
const clearingResultSchema = z.object({
  verdict: clearingVerdictSchema,
});

async function classifyInput(said: string, signal: AbortSignal) {
  const result = await generateText({
    abortSignal: signal,
    instructions: INPUT_CLASSIFIER_PROMPT,
    maxOutputTokens: 32,
    maxRetries: 0,
    model: gateway(CHECK_MODEL),
    output: Output.object({ schema: inputClassificationResultSchema }),
    prompt: said,
    temperature: 0,
  });

  return result.output.classification;
}

async function clearCandidate(candidate: string, signal: AbortSignal) {
  const result = await generateText({
    abortSignal: signal,
    instructions: CLEARING_PROMPT,
    maxOutputTokens: 32,
    maxRetries: 0,
    model: gateway(CHECK_MODEL),
    output: Output.object({ schema: clearingResultSchema }),
    prompt: candidate,
    temperature: 0,
  });

  return result.output.verdict === "SAFE";
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
    maxOutputTokens: 300,
    maxRetries: 0,
    messages,
    model: gateway(REPLY_MODEL),
    temperature: 0,
  });

  return modelTextSchema.parse(result.text);
};

export const gatewayTextDependencies: TextTurnDependencies = {
  classifyInput,
  clearCandidate,
  generateCandidate,
};
