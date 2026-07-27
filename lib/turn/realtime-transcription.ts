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
const START_TONE_DURATION_SECONDS = 0.16;

type RealtimeTranscriptionOptions = {
  onError: () => void;
  onLevel: (level: number) => void;
  onTranscript: (text: string) => void;
  signal?: AbortSignal;
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
    throwIfAborted(options.signal);
    await context.resume();
    const tokenPromise = requestTranscriptionToken(options.signal);
    void tokenPromise.catch(() => undefined);
    microphone = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    const token = await tokenPromise;
    throwIfAborted(options.signal);
    const gateway = createGateway({ apiKey: token });
    await playStartTone(context, options.signal);
    throwIfAborted(options.signal);
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
          streaming: { delay: "low" },
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

async function requestTranscriptionToken(signal?: AbortSignal) {
  const controller = new AbortController();
  const abortRequest = () => controller.abort();
  signal?.addEventListener("abort", abortRequest, { once: true });
  const timeout = setTimeout(
    () => controller.abort(),
    TRANSCRIPTION_REQUEST_TIMEOUT_MS,
  );

  try {
    throwIfAborted(signal);
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
    signal?.removeEventListener("abort", abortRequest);
  }
}

async function playStartTone(context: AudioContext, signal?: AbortSignal) {
  throwIfAborted(signal);
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startsAt = context.currentTime;
  const endsAt = startsAt + START_TONE_DURATION_SECONDS;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(660, startsAt);
  oscillator.frequency.exponentialRampToValueAtTime(880, endsAt);
  gain.gain.setValueAtTime(0.0001, startsAt);
  gain.gain.exponentialRampToValueAtTime(0.16, startsAt + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, endsAt);
  oscillator.connect(gain);
  gain.connect(context.destination);

  await new Promise<void>((resolve, reject) => {
    let settled = false;

    function finish(error?: DOMException) {
      if (settled) {
        return;
      }

      settled = true;
      signal?.removeEventListener("abort", abortTone);
      oscillator.disconnect();
      gain.disconnect();

      if (error === undefined) {
        resolve();
      } else {
        reject(error);
      }
    }

    function abortTone() {
      try {
        oscillator.stop();
      } catch {
        // The tone already ended.
      }
      finish(abortError());
    }

    signal?.addEventListener("abort", abortTone, { once: true });
    oscillator.onended = () => finish();
    oscillator.start(startsAt);
    oscillator.stop(endsAt);
  });
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw abortError();
  }
}

function abortError() {
  return new DOMException("Aborted", "AbortError");
}

function startMicrophoneCapture(
  context: AudioContext,
  microphone: MediaStream,
  onAudio: (chunk: string) => void,
  onLevel: (level: number) => void,
) {
  const source = context.createMediaStreamSource(microphone);
  const processor = context.createScriptProcessor(2048, 1, 1);
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
