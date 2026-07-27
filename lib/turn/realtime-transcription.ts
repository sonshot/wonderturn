"use client";

import { createGateway } from "@ai-sdk/gateway";
import {
  experimental_encodeRealtimeAudio as encodeRealtimeAudio,
  experimental_resampleAudio as resampleAudio,
  experimental_streamTranscribe as streamTranscribe,
} from "ai";

import { turnFailureSchema } from "./contracts";
import {
  TRANSCRIPTION_MODEL,
  TRANSCRIPTION_SAMPLE_RATE,
  transcriptionTokenSchema,
} from "./transcription-contracts";

const TRANSCRIPTION_REQUEST_TIMEOUT_MS = 10_000;
const TRANSCRIPTION_FINALIZATION_TIMEOUT_MS = 10_000;

type RealtimeTranscriptionOptions = {
  onError: () => void;
  onLevel: (level: number) => void;
  onTranscript: (text: string) => void;
};

export type RealtimeTranscriptionSession = {
  abort: () => void;
  stop: () => Promise<string>;
};

type StreamOutcome =
  | { ok: true }
  | {
      error: unknown;
      ok: false;
    };

export async function startRealtimeTranscription(
  options: RealtimeTranscriptionOptions,
): Promise<RealtimeTranscriptionSession> {
  const context = new AudioContext({ sampleRate: TRANSCRIPTION_SAMPLE_RATE });

  let microphone: MediaStream | null = null;

  try {
    await context.resume();
    microphone = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    const token = await requestTranscriptionToken();
    const gateway = createGateway({ apiKey: token });
    let audioController:
      ReadableStreamDefaultController<Uint8Array | string> | undefined;
    const audio = new ReadableStream<Uint8Array | string>({
      start(controller) {
        audioController = controller;
      },
    });
    const abortController = new AbortController();
    const result = streamTranscribe({
      abortSignal: abortController.signal,
      audio,
      inputAudioFormat: {
        rate: TRANSCRIPTION_SAMPLE_RATE,
        type: "audio/pcm",
      },
      model: gateway.experimental_transcription(TRANSCRIPTION_MODEL),
      providerOptions: {
        openai: {
          language: "en",
          streaming: { delay: "medium" },
        },
      },
    });
    const fullStream = result.fullStream;
    let deltaTranscript = "";
    let reportedError = false;

    function reportError() {
      if (reportedError) {
        return;
      }

      reportedError = true;
      options.onError();
    }

    const streamOutcome: Promise<StreamOutcome> = (async () => {
      try {
        for await (const part of fullStream) {
          if (part.type === "transcript-delta") {
            deltaTranscript += part.delta;
            options.onTranscript(deltaTranscript.trim());
          } else if (
            part.type === "transcript-partial" ||
            part.type === "transcript-final"
          ) {
            deltaTranscript = part.text.trim();
            options.onTranscript(deltaTranscript);
          } else if (part.type === "error") {
            throw part.error;
          }
        }

        return { ok: true };
      } catch (error) {
        reportError();
        return { error, ok: false };
      }
    })();
    const capture = startMicrophoneCapture(
      context,
      microphone,
      (chunk) => audioController?.enqueue(chunk),
      options.onLevel,
    );
    let closed = false;

    function stopCapture() {
      if (closed) {
        return;
      }

      closed = true;
      capture.stop();
      microphone?.getTracks().forEach((track) => track.stop());
      microphone = null;
      void context.close();
    }

    return {
      abort() {
        stopCapture();
        abortController.abort();

        try {
          audioController?.error(new DOMException("Aborted", "AbortError"));
        } catch {
          // The stream already reached a terminal state.
        }
      },
      async stop() {
        stopCapture();
        audioController?.close();
        const timeout = setTimeout(
          () => abortController.abort(),
          TRANSCRIPTION_FINALIZATION_TIMEOUT_MS,
        );

        try {
          const outcome = await streamOutcome;

          if (!outcome.ok) {
            throw outcome.error;
          }

          return (await result.text).trim();
        } finally {
          clearTimeout(timeout);
        }
      },
    };
  } catch (error) {
    microphone?.getTracks().forEach((track) => track.stop());
    void context.close();
    throw error;
  }
}

async function requestTranscriptionToken() {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    TRANSCRIPTION_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch("/api/transcriptions/token", {
      method: "POST",
      signal: controller.signal,
    });
    const body: unknown = await response.json();

    if (!response.ok) {
      turnFailureSchema.parse(body);
      throw new Error("Transcription token request failed");
    }

    return transcriptionTokenSchema.parse(body).token;
  } finally {
    clearTimeout(timeout);
  }
}

function startMicrophoneCapture(
  context: AudioContext,
  microphone: MediaStream,
  onAudio: (chunk: string) => void,
  onLevel: (level: number) => void,
) {
  const source = context.createMediaStreamSource(microphone);
  const processor = context.createScriptProcessor(4096, 1, 1);
  let active = true;

  processor.onaudioprocess = (event) => {
    if (!active) {
      return;
    }

    const input = new Float32Array(event.inputBuffer.getChannelData(0));
    let squaredTotal = 0;

    for (const sample of input) {
      squaredTotal += sample * sample;
    }

    const rms = Math.sqrt(squaredTotal / input.length);
    onLevel(Math.min(1, rms * 8));
    const samples = resampleAudio(
      input,
      context.sampleRate,
      TRANSCRIPTION_SAMPLE_RATE,
    );
    onAudio(encodeRealtimeAudio(samples));
  };

  source.connect(processor);
  processor.connect(context.destination);

  return {
    stop() {
      active = false;
      processor.onaudioprocess = null;
      processor.disconnect();
      source.disconnect();
      onLevel(0);
    },
  };
}
