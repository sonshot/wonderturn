import { z } from "zod";

export const conversationEntrySchema = z
  .object({
    role: z.enum(["assistant", "user"]),
    text: z.string().min(1).max(1_000),
  })
  .strict();

export const turnRequestSchema = z
  .object({
    history: z.array(conversationEntrySchema).max(20),
    said: z.string().max(1_000),
  })
  .strict();

export const turnResponseSchema = z
  .object({
    audio: z.base64().max(3_000_000),
    kind: z.enum(["disclosure", "nudge", "redirect", "reply"]),
    text: z.string().min(1).max(1_000),
  })
  .strict();

export const turnFailureSchema = z
  .object({
    category: z.enum(["authorization", "upstream", "validation"]),
  })
  .strict();

export type TurnRequest = z.infer<typeof turnRequestSchema>;
export type TurnResponse = z.infer<typeof turnResponseSchema>;
