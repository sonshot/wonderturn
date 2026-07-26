"use client";

import { useEffect, useRef, useState } from "react";

import {
  diagnosticReportResponseSchema,
  type DiagnosticReportSubmission,
} from "@/lib/diagnostics/report";
import {
  REMOTE_TRANSCRIPTION_MODELS,
  remoteTranscriptionResponseSchema,
  type RemoteTranscriptionResult,
} from "@/lib/diagnostics/remote-transcription";
import {
  getSpeechSample,
  SPEECH_SAMPLES,
  type SpeechSampleId,
} from "@/lib/diagnostics/speech-samples";
import {
  formatDevice,
  inferDevice,
  type DeviceInfo,
} from "@/lib/diagnostics/user-agent";

type DiagnosticEvent = {
  id: number;
  message: string;
  milliseconds: number;
};

type TestResult = "not-run" | "running" | "passed" | "failed";

type EnvironmentSummary = {
  device: DeviceInfo;
  online: boolean;
  secureContext: boolean;
  speechRecognition: "present" | "absent";
};

type SubmissionState = "idle" | "submitting" | "submitted" | "failed";
type RemoteActivity = "idle" | "recording" | "transcribing";

const MAX_RECORDING_MS = 60_000;
const MAX_REMOTE_RECORDING_MS = 15_000;
const RESTART_DELAY_MS = 250;
const DELAYED_SOURCE_MS = 1_500;
const STREAM_RESPONSE_COMPLETE_MS = 5_000;
const PROGRESSIVE_THRESHOLD_MS = 4_500;
const RECORDING_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
] as const;

function recognitionConstructor() {
  if (typeof SpeechRecognition !== "undefined") {
    return SpeechRecognition;
  }

  if (typeof webkitSpeechRecognition !== "undefined") {
    return webkitSpeechRecognition;
  }

  return null;
}

function errorName(error: unknown) {
  return error instanceof Error ? error.name : "unknown-error";
}

export default function DiagnosticsPage() {
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [speechResult, setSpeechResult] = useState<TestResult>("not-run");
  const [speechSampleId, setSpeechSampleId] =
    useState<SpeechSampleId>("everyday");
  const [unlockResult, setUnlockResult] = useState<TestResult>("not-run");
  const [progressiveResult, setProgressiveResult] =
    useState<TestResult>("not-run");
  const [remoteActivity, setRemoteActivity] = useState<RemoteActivity>("idle");
  const [remoteResult, setRemoteResult] = useState<TestResult>("not-run");
  const [remoteTranscriptions, setRemoteTranscriptions] = useState<
    RemoteTranscriptionResult[]
  >([]);
  const [offlineResult, setOfflineResult] =
    useState<DiagnosticReportSubmission["offlineRecognition"]>("not-tested");
  const [notes, setNotes] = useState("");
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>("idle");
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [environmentSummary, setEnvironmentSummary] =
    useState<EnvironmentSummary | null>(null);

  const eventIdRef = useRef(0);
  const pageStartedAtRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const keepListeningRef = useRef(false);
  const recognitionDeadlineRef = useRef(0);
  const recognitionRestartRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const recognitionStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayedAudioRef = useRef<HTMLAudioElement | null>(null);
  const delayedPhaseRef = useRef<"idle" | "unlocking" | "delayed">("idle");
  const delayedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressiveAudioRef = useRef<HTMLAudioElement | null>(null);
  const progressiveStartedAtRef = useRef(0);
  const progressiveHasStartedRef = useRef(false);
  const remoteRecorderRef = useRef<MediaRecorder | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteChunksRef = useRef<Blob[]>([]);
  const remoteStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const appendEvent = (message: string) => {
    const now = performance.now();
    const pageStartedAt = pageStartedAtRef.current ?? now;
    pageStartedAtRef.current = pageStartedAt;
    const milliseconds = Math.round(now - pageStartedAt);
    eventIdRef.current += 1;
    const id = eventIdRef.current;
    setEvents((current) => [
      ...current.slice(-99),
      { id, message, milliseconds },
    ]);
  };

  const selectSpeechSample = (id: SpeechSampleId) => {
    setSpeechSampleId(id);
    setFinalTranscript("");
    setInterimTranscript("");
    setSpeechResult("not-run");
    setRemoteTranscriptions([]);
    setRemoteResult("not-run");
  };

  const stopSpeechTest = () => {
    keepListeningRef.current = false;

    if (recognitionRestartRef.current !== null) {
      clearTimeout(recognitionRestartRef.current);
      recognitionRestartRef.current = null;
    }

    if (recognitionStopRef.current !== null) {
      clearTimeout(recognitionStopRef.current);
      recognitionStopRef.current = null;
    }

    try {
      recognitionRef.current?.stop();
      appendEvent("Speech stop requested");
    } catch (error) {
      appendEvent(`Speech stop failed: ${errorName(error)}`);
    }
  };

  const startSpeechTest = () => {
    const Constructor = recognitionConstructor();

    if (Constructor === null) {
      setSpeechResult("failed");
      appendEvent("SpeechRecognition unavailable");
      return;
    }

    const previousRecognition = recognitionRef.current;
    recognitionRef.current = null;
    keepListeningRef.current = false;
    previousRecognition?.abort();
    setFinalTranscript("");
    setInterimTranscript("");
    setSpeechResult("running");
    appendEvent(`Speech sample selected: ${speechSampleId}`);
    keepListeningRef.current = true;
    recognitionDeadlineRef.current = performance.now() + MAX_RECORDING_MS;

    const recognition = new Constructor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      appendEvent("Speech recognition started");
    };
    recognition.onaudiostart = () => {
      appendEvent("Microphone audio started");
    };
    recognition.onspeechstart = () => {
      appendEvent("Speech detected");
    };
    recognition.onspeechend = () => {
      appendEvent("Speech ended");
    };
    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) {
        return;
      }

      let nextInterim = "";
      let nextFinal = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results.item(index);
        const transcript = result.item(0).transcript;

        if (result.isFinal) {
          nextFinal += transcript;
        } else {
          nextInterim += transcript;
        }
      }

      if (nextInterim !== "") {
        setInterimTranscript(nextInterim);
        appendEvent(`Interim result: ${nextInterim}`);
      }

      if (nextFinal !== "") {
        setFinalTranscript((current) =>
          current === "" ? nextFinal : `${current} ${nextFinal}`,
        );
        setInterimTranscript("");
        appendEvent(`Final result: ${nextFinal}`);
      }
    };
    recognition.onerror = (event) => {
      if (recognitionRef.current !== recognition) {
        return;
      }

      appendEvent(`Speech error: ${event.error}`);

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        keepListeningRef.current = false;
        setSpeechResult("failed");
      }
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) {
        return;
      }

      appendEvent("Speech recognition ended");

      if (
        keepListeningRef.current &&
        performance.now() < recognitionDeadlineRef.current
      ) {
        recognitionRestartRef.current = setTimeout(() => {
          if (!keepListeningRef.current) {
            return;
          }

          try {
            recognition.start();
            appendEvent("Speech recognition restart requested");
          } catch (error) {
            keepListeningRef.current = false;
            setSpeechResult("failed");
            appendEvent(`Speech restart failed: ${errorName(error)}`);
          }
        }, RESTART_DELAY_MS);
        return;
      }

      keepListeningRef.current = false;
      setSpeechResult((current) => (current === "failed" ? current : "passed"));
    };

    try {
      recognition.start();
      appendEvent("Speech start requested with en-US locale");
      recognitionStopRef.current = setTimeout(() => {
        if (keepListeningRef.current) {
          appendEvent("60-second limit reached");
          stopSpeechTest();
        }
      }, MAX_RECORDING_MS);
    } catch (error) {
      keepListeningRef.current = false;
      setSpeechResult("failed");
      appendEvent(`Speech start failed: ${errorName(error)}`);
    }
  };

  const startUnlockTest = () => {
    const audio = delayedAudioRef.current;

    if (audio === null) {
      setUnlockResult("failed");
      appendEvent("Delayed audio element unavailable");
      return;
    }

    if (delayedTimerRef.current !== null) {
      clearTimeout(delayedTimerRef.current);
    }

    setUnlockResult("running");
    delayedPhaseRef.current = "unlocking";
    audio.src = `/api/diagnostics/audio?mode=silence&run=${Date.now()}`;
    audio.currentTime = 0;
    appendEvent("Initial play() called inside tap handler");

    void audio.play().catch((error: unknown) => {
      setUnlockResult("failed");
      appendEvent(`Initial play rejected: ${errorName(error)}`);
    });

    delayedTimerRef.current = setTimeout(() => {
      delayedPhaseRef.current = "delayed";
      audio.src = `/api/diagnostics/audio?mode=atomic&run=${Date.now()}`;
      appendEvent("Audio src swapped after 1500ms; delayed play() called");

      void audio.play().catch((error: unknown) => {
        setUnlockResult("failed");
        appendEvent(`Delayed play rejected: ${errorName(error)}`);
      });
    }, DELAYED_SOURCE_MS);
  };

  const startProgressiveTest = () => {
    const audio = progressiveAudioRef.current;

    if (audio === null) {
      setProgressiveResult("failed");
      appendEvent("Progressive audio element unavailable");
      return;
    }

    progressiveStartedAtRef.current = performance.now();
    progressiveHasStartedRef.current = false;
    setProgressiveResult("running");
    audio.src = `/api/diagnostics/audio?mode=stream&run=${Date.now()}`;
    appendEvent(
      "Progressive audio play() called; response takes about 5000ms to send",
    );

    void audio.play().catch((error: unknown) => {
      setProgressiveResult("failed");
      appendEvent(`Progressive play rejected: ${errorName(error)}`);
    });
  };

  const stopRemoteStream = () => {
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current = null;
  };

  const stopRemoteRecording = () => {
    const recorder = remoteRecorderRef.current;

    if (recorder === null || recorder.state === "inactive") {
      return;
    }

    recorder.stop();
    appendEvent("Remote STT recording stop requested");
  };

  const submitRemoteRecording = async (
    recorder: MediaRecorder,
    chunks: Blob[],
  ) => {
    const mimeType = recorder.mimeType || chunks.at(0)?.type || "";
    const audio = new Blob(chunks, { type: mimeType });

    if (audio.size === 0) {
      throw new Error("empty-recording");
    }

    const extension = mimeType.startsWith("audio/mp4")
      ? "m4a"
      : mimeType.startsWith("audio/ogg")
        ? "ogg"
        : "webm";
    const formData = new FormData();
    formData.append("audio", audio, `speech-sample.${extension}`);
    formData.append("speechSampleId", speechSampleId);
    setRemoteActivity("transcribing");
    appendEvent(
      `Remote STT upload started: ${audio.size} bytes, ${mimeType || "unknown type"}`,
    );

    const response = await fetch("/api/diagnostics/transcriptions", {
      body: formData,
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = remoteTranscriptionResponseSchema.parse(
      await response.json(),
    );
    setRemoteTranscriptions(result.results);
    setRemoteResult("passed");
    setRemoteActivity("idle");

    for (const transcription of result.results) {
      appendEvent(
        `Remote STT completed: ${transcription.model} in ${transcription.latencyMs}ms`,
      );
    }
  };

  const startRemoteRecording = async () => {
    if (
      typeof MediaRecorder === "undefined" ||
      navigator.mediaDevices?.getUserMedia === undefined
    ) {
      setRemoteResult("failed");
      appendEvent("MediaRecorder or getUserMedia unavailable");
      return;
    }

    setRemoteResult("running");
    setRemoteTranscriptions([]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = RECORDING_MIME_TYPES.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = new MediaRecorder(
        stream,
        mimeType === undefined ? undefined : { mimeType },
      );

      remoteStreamRef.current = stream;
      remoteRecorderRef.current = recorder;
      remoteChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          remoteChunksRef.current.push(event.data);
        }
      };
      recorder.onerror = (event) => {
        setRemoteResult("failed");
        setRemoteActivity("idle");
        stopRemoteStream();
        appendEvent(`Remote STT recording failed: ${event.error.name}`);
      };
      recorder.onstop = () => {
        if (remoteStopRef.current !== null) {
          clearTimeout(remoteStopRef.current);
          remoteStopRef.current = null;
        }

        remoteRecorderRef.current = null;
        stopRemoteStream();
        const chunks = remoteChunksRef.current;
        remoteChunksRef.current = [];

        void submitRemoteRecording(recorder, chunks).catch((error: unknown) => {
          setRemoteResult("failed");
          setRemoteActivity("idle");
          appendEvent(`Remote STT failed: ${errorName(error)}`);
        });
      };

      recorder.start();
      setRemoteActivity("recording");
      appendEvent(
        `Remote STT recording started: ${recorder.mimeType || "browser default"}`,
      );
      remoteStopRef.current = setTimeout(() => {
        appendEvent("15-second remote recording limit reached");
        stopRemoteRecording();
      }, MAX_REMOTE_RECORDING_MS);
    } catch (error) {
      setRemoteResult("failed");
      setRemoteActivity("idle");
      stopRemoteStream();
      appendEvent(`Remote STT recording failed: ${errorName(error)}`);
    }
  };

  const captureEnvironment = () => {
    const summary: EnvironmentSummary = {
      device: inferDevice(navigator.userAgent),
      online: navigator.onLine,
      secureContext: window.isSecureContext,
      speechRecognition:
        recognitionConstructor() === null ? "absent" : "present",
    };

    setEnvironmentSummary(summary);
    appendEvent(`Device: ${formatDevice(summary.device)}`);
    appendEvent(`Secure context: ${summary.secureContext}`);
    appendEvent(`Online: ${summary.online}`);
    appendEvent(`SpeechRecognition constructor: ${summary.speechRecognition}`);
  };

  const submitReport = async () => {
    const report: DiagnosticReportSubmission = {
      capturedAt: new Date().toISOString(),
      environment: {
        online: navigator.onLine,
        secureContext: window.isSecureContext,
        speechRecognition:
          recognitionConstructor() === null ? "absent" : "present",
      },
      events,
      finalTranscript,
      interimTranscript,
      notes,
      offlineRecognition: offlineResult,
      results: {
        delayedAudioUnlock: unlockResult,
        progressiveAudio: progressiveResult,
        remoteTranscription: remoteResult,
        speechRecognition: speechResult,
      },
      remoteTranscriptions,
      speechSampleId,
    };

    setSubmissionState("submitting");
    setSubmissionMessage("");

    try {
      const response = await fetch("/api/diagnostics/reports", {
        body: JSON.stringify(report),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = diagnosticReportResponseSchema.parse(
        await response.json(),
      );
      setSubmissionState("submitted");
      setSubmissionMessage(`Report submitted. Reference: ${result.reportId}`);
      appendEvent(`Diagnostic report submitted: ${result.reportId}`);
    } catch (error) {
      setSubmissionState("failed");
      setSubmissionMessage("The diagnostic report could not be submitted.");
      appendEvent(`Diagnostic report submission failed: ${errorName(error)}`);
    }
  };

  useEffect(() => {
    const delayedAudio = delayedAudioRef.current;
    const progressiveAudio = progressiveAudioRef.current;

    return () => {
      keepListeningRef.current = false;
      recognitionRef.current?.abort();

      if (recognitionRestartRef.current !== null) {
        clearTimeout(recognitionRestartRef.current);
      }

      if (recognitionStopRef.current !== null) {
        clearTimeout(recognitionStopRef.current);
      }

      if (delayedTimerRef.current !== null) {
        clearTimeout(delayedTimerRef.current);
      }

      if (remoteStopRef.current !== null) {
        clearTimeout(remoteStopRef.current);
      }

      const remoteRecorder = remoteRecorderRef.current;
      if (remoteRecorder !== null) {
        remoteRecorder.onstop = null;
        if (remoteRecorder.state !== "inactive") {
          remoteRecorder.stop();
        }
      }
      stopRemoteStream();
      delayedAudio?.pause();
      progressiveAudio?.pause();
    };
  }, []);

  const speechSample = getSpeechSample(speechSampleId);

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-bold">Device diagnostics</h1>
        <p>
          Check voice and audio behavior on this browser. Submitting sends the
          results, notes, and visible transcripts to the server. Reports are
          logged but not stored yet.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Environment</h2>
        <button className="border px-3 py-2" onClick={captureEnvironment}>
          Capture environment
        </button>
        {environmentSummary ? (
          <dl
            aria-label="Captured environment"
            aria-live="polite"
            className="grid gap-2 text-sm"
          >
            <div>
              <dt className="font-semibold">Device</dt>
              <dd>{formatDevice(environmentSummary.device)}</dd>
            </div>
            <div>
              <dt className="font-semibold">Secure context</dt>
              <dd>{environmentSummary.secureContext ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Online</dt>
              <dd>{environmentSummary.online ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Speech recognition API</dt>
              <dd>{environmentSummary.speechRecognition}</dd>
            </div>
            <div>
              <dt className="font-semibold">User agent</dt>
              <dd className="break-words">
                {environmentSummary.device.userAgent}
              </dd>
            </div>
          </dl>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Web Speech API</h2>
        <p>
          Read the selected sentence, then pause long enough for recognition to
          end and restart. Use the same sentence on each device for comparison.
          The test stops automatically after 60 seconds.
        </p>
        <fieldset className="space-y-2">
          <legend className="font-semibold">Test sentence</legend>
          {SPEECH_SAMPLES.map((sample) => (
            <label className="block" key={sample.id}>
              <input
                checked={speechSampleId === sample.id}
                className="mr-2"
                disabled={
                  speechResult === "running" || remoteResult === "running"
                }
                name="speech-sample"
                onChange={() => selectSpeechSample(sample.id)}
                type="radio"
                value={sample.id}
              />
              {sample.label}
            </label>
          ))}
        </fieldset>
        <p className="border p-3 text-lg">
          <span className="block text-sm font-semibold">Read aloud</span>
          {speechSample.text}
        </p>
        <div className="flex gap-3">
          <button
            className="border px-3 py-2 disabled:opacity-50"
            disabled={remoteResult === "running"}
            onClick={startSpeechTest}
          >
            Start speech test
          </button>
          <button className="border px-3 py-2" onClick={stopSpeechTest}>
            Stop
          </button>
        </div>
        <p aria-live="polite">Result: {speechResult}</p>
        <dl>
          <dt className="font-semibold">Expected sentence</dt>
          <dd>{speechSample.text}</dd>
          <dt className="font-semibold">Interim transcript</dt>
          <dd>{interimTranscript || "—"}</dd>
          <dt className="font-semibold">Final transcript</dt>
          <dd>{finalTranscript || "—"}</dd>
        </dl>
        <label className="block">
          Repeat after loading the page with the network disconnected:
          <select
            className="ml-2 border px-2 py-1"
            onChange={(event) => {
              const result = event.target.value;

              if (
                result === "not-tested" ||
                result === "worked" ||
                result === "failed"
              ) {
                setOfflineResult(result);
              }
            }}
            value={offlineResult}
          >
            <option value="not-tested">Not tested</option>
            <option value="worked">Recognition worked</option>
            <option value="failed">Recognition failed</option>
          </select>
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          3. Remote speech-to-text comparison
        </h2>
        <p>
          Record the selected sentence once. The recording is sent through
          Vercel AI Gateway to OpenAI and xAI, then discarded by this app. The
          Gateway and providers process the audio under their own retention
          policies; zero-data retention is not currently available for the
          OpenAI route.
        </p>
        <p className="border p-3 text-lg">
          <span className="block text-sm font-semibold">Read aloud</span>
          {speechSample.text}
        </p>
        <div className="flex gap-3">
          <button
            className="border px-3 py-2 disabled:opacity-50"
            disabled={remoteResult === "running" || speechResult === "running"}
            onClick={() => void startRemoteRecording()}
          >
            Record for remote comparison
          </button>
          <button
            className="border px-3 py-2 disabled:opacity-50"
            disabled={remoteActivity !== "recording"}
            onClick={stopRemoteRecording}
          >
            Stop and transcribe
          </button>
        </div>
        <p aria-live="polite">
          Result: {remoteResult}
          {remoteActivity === "recording"
            ? " (recording)"
            : remoteActivity === "transcribing"
              ? " (transcribing)"
              : ""}
        </p>
        <dl className="space-y-2">
          {REMOTE_TRANSCRIPTION_MODELS.map((model) => {
            const transcription = remoteTranscriptions.find(
              (candidate) => candidate.model === model.id,
            );

            return (
              <div key={model.id}>
                <dt className="font-semibold">{model.label}</dt>
                <dd>
                  {transcription
                    ? `${transcription.text || "—"} (${transcription.latencyMs}ms)`
                    : "—"}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Delayed audio unlock</h2>
        <p>
          The tap calls play immediately on silence. After 1.5 seconds the
          source changes to a tone and play is called again. Pass only if the
          tone is audible without another tap.
        </p>
        <button className="border px-3 py-2" onClick={startUnlockTest}>
          Run delayed audio test
        </button>
        <p aria-live="polite">Result: {unlockResult}</p>
        <audio
          controls
          onError={() => {
            setUnlockResult("failed");
            appendEvent("Delayed audio element emitted an error");
          }}
          onPlaying={() => {
            if (delayedPhaseRef.current === "delayed") {
              setUnlockResult("passed");
              appendEvent("Delayed tone started playing");
            }
          }}
          ref={delayedAudioRef}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Progressive audio response</h2>
        <p>
          The server sends six seconds of audio over about five seconds.
          Starting before 4.5 seconds is a clear progressive-playback pass; the
          exact time is recorded below.
        </p>
        <button className="border px-3 py-2" onClick={startProgressiveTest}>
          Run progressive audio test
        </button>
        <p aria-live="polite">Result: {progressiveResult}</p>
        <audio
          controls
          onEnded={() => appendEvent("Progressive tone ended")}
          onError={() => {
            setProgressiveResult("failed");
            appendEvent("Progressive audio element emitted an error");
          }}
          onPlaying={() => {
            if (progressiveHasStartedRef.current) {
              return;
            }

            progressiveHasStartedRef.current = true;
            const elapsed = Math.round(
              performance.now() - progressiveStartedAtRef.current,
            );
            const passed =
              elapsed > 0 &&
              elapsed <
                Math.min(PROGRESSIVE_THRESHOLD_MS, STREAM_RESPONSE_COMPLETE_MS);
            setProgressiveResult(passed ? "passed" : "failed");
            appendEvent(`Progressive tone started after ${elapsed}ms`);
          }}
          ref={progressiveAudioRef}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Notes and report</h2>
        <label className="block">
          Record permission behavior, recognition accuracy, rapid tapping, and
          anything surprising.
          <textarea
            className="mt-2 block min-h-32 w-full border p-2"
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
        </label>
        <button
          className="border px-3 py-2 disabled:opacity-50"
          disabled={submissionState === "submitting"}
          onClick={() => void submitReport()}
        >
          {submissionState === "submitting"
            ? "Submitting…"
            : "Submit diagnostic report"}
        </button>
        <p aria-live="polite">{submissionMessage}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Event log</h2>
        <ol className="list-decimal space-y-1 pl-6" aria-live="polite">
          {events.map((event) => (
            <li key={event.id}>
              +{event.milliseconds}ms — {event.message}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
