import { z } from "zod";

export const TRANSCRIPTION_MODEL = "openai/gpt-realtime-whisper";
export const TRANSCRIPTION_SAMPLE_RATE = 24_000;

export const transcriptionTokenSchema = z.object({
  token: z.string().startsWith("vcst_"),
});
