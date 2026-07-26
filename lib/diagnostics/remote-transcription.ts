import { z } from "zod";

import { SPEECH_SAMPLE_IDS } from "./speech-samples";

export const REMOTE_TRANSCRIPTION_MODELS = [
  {
    id: "openai/gpt-4o-mini-transcribe",
    label: "OpenAI GPT-4o mini Transcribe",
  },
  {
    id: "xai/grok-stt",
    label: "xAI Grok STT",
  },
] as const;

const remoteTranscriptionModelIdSchema = z.enum(
  REMOTE_TRANSCRIPTION_MODELS.map((model) => model.id),
);

export const remoteTranscriptionResultSchema = z
  .object({
    latencyMs: z.number().int().nonnegative(),
    model: remoteTranscriptionModelIdSchema,
    text: z.string().max(20_000),
  })
  .strict();

export const remoteTranscriptionResponseSchema = z
  .object({
    results: z.array(remoteTranscriptionResultSchema).length(2),
  })
  .strict();

const allowedAudioTypes = [
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
];

export const remoteTranscriptionRequestSchema = z
  .object({
    audio: z
      .instanceof(File)
      .refine((file) => file.size > 0 && file.size <= 2_000_000)
      .refine((file) =>
        allowedAudioTypes.some(
          (type) => file.type === type || file.type.startsWith(`${type};`),
        ),
      ),
    speechSampleId: z.enum(SPEECH_SAMPLE_IDS),
  })
  .strict();

export type RemoteTranscriptionResult = z.infer<
  typeof remoteTranscriptionResultSchema
>;
