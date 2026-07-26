import { gateway } from "@ai-sdk/gateway";
import { experimental_transcribe as transcribe } from "ai";
import { z } from "zod";

import {
  REMOTE_TRANSCRIPTION_MODELS,
  remoteTranscriptionRequestSchema,
  remoteTranscriptionResponseSchema,
  type RemoteTranscriptionResult,
} from "@/lib/diagnostics/remote-transcription";

const ENDPOINT = "/api/diagnostics/transcriptions";
const TRANSCRIPTION_TIMEOUT_MS = 30_000;

async function transcribeWithModel(
  model: (typeof REMOTE_TRANSCRIPTION_MODELS)[number],
  audio: Uint8Array,
): Promise<RemoteTranscriptionResult> {
  const startedAt = performance.now();
  const result = await transcribe({
    abortSignal: AbortSignal.timeout(TRANSCRIPTION_TIMEOUT_MS),
    audio,
    maxRetries: 0,
    model: gateway.transcriptionModel(model.id),
  });

  return {
    latencyMs: Math.round(performance.now() - startedAt),
    model: model.id,
    text: result.text,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const input = remoteTranscriptionRequestSchema.parse({
      audio: formData.get("audio"),
      speechSampleId: formData.get("speechSampleId"),
    });
    const audio = new Uint8Array(await input.audio.arrayBuffer());
    const results = await Promise.all(
      REMOTE_TRANSCRIPTION_MODELS.map((model) =>
        transcribeWithModel(model, audio),
      ),
    );

    return Response.json(remoteTranscriptionResponseSchema.parse({ results }));
  } catch (error) {
    const validationFailure = error instanceof z.ZodError;
    const status = validationFailure ? 400 : 502;

    console.error("[diagnostics] remote transcription failed", {
      category: validationFailure ? "validation" : "upstream",
      endpoint: ENDPOINT,
      status,
    });

    return Response.json(
      { error: "The recording could not be transcribed." },
      { status },
    );
  }
}
