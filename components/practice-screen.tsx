"use client";

import { useEffect, useReducer, useRef, useState, type RefObject } from "react";

import { turnFailureSchema, turnResponseSchema } from "@/lib/turn/contracts";
import { ERROR_RESPONSES } from "@/lib/turn/fixed-responses";
import {
  initialPracticeState,
  practiceReducer,
  type MicrophoneStatus,
  type PracticeState,
  type VoiceLifecycle,
} from "@/lib/turn/practice-machine";
import { mergeRecognitionSegments } from "@/lib/turn/recognition-transcript";

const TURN_TIMEOUT_MS = 15_000;
const RECORDING_LIMIT_MS = 60_000;

export function PracticeScreen() {
  const [state, dispatch] = useReducer(practiceReducer, initialPracticeState);
  const [level, setLevel] = useState(0);
  const [longThinkingTurn, setLongThinkingTurn] = useState<number | null>(null);
  const stateRef = useRef(state);
  const turnCounterRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recognitionTurnRef = useRef(0);
  const shouldListenRef = useRef(false);
  const submitOnEndRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const latestTranscriptRef = useRef("");
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (state.lifecycle !== "thinking") {
      return;
    }

    const turnId = state.activeTurnId;
    const timer = setTimeout(() => setLongThinkingTurn(turnId), 4_000);
    return () => clearTimeout(timer);
  }, [state.activeTurnId, state.lifecycle]);

  useEffect(() => {
    const playback = playbackRef.current;

    function interruptWhenHidden() {
      if (document.visibilityState !== "hidden") {
        return;
      }

      const turnId = ++turnCounterRef.current;
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
      shouldListenRef.current = false;
      submitOnEndRef.current = false;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      playbackRef.current?.pause();
      stopListeningCue(recordingTimerRef, setLevel);
      dispatch({ turnId, type: "interrupt" });
    }

    document.addEventListener("visibilitychange", interruptWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", interruptWhenHidden);
      requestControllerRef.current?.abort();
      shouldListenRef.current = false;
      submitOnEndRef.current = false;
      recognitionRef.current?.abort();
      playback?.pause();
      stopListeningCue(recordingTimerRef, setLevel);
    };
  }, []);

  function stopActiveWork(turnId: number) {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    shouldListenRef.current = false;
    submitOnEndRef.current = false;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    playbackRef.current?.pause();
    stopListeningCue(recordingTimerRef, setLevel);
    dispatch({ turnId, type: "interrupt" });
  }

  async function permissionAfterDenial(): Promise<
    Exclude<MicrophoneStatus, "ready">
  > {
    try {
      const permission = await navigator.permissions.query({
        name: "microphone",
      });
      return permission.state === "denied" ? "blocked" : "needed";
    } catch {
      return "needed";
    }
  }

  function unlockPlayback() {
    const audio = playbackRef.current;

    if (audio === null) {
      return;
    }

    audio.pause();
    audio.src = `/api/diagnostics/audio?mode=silence&run=${Date.now()}`;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }

  async function playError(turnId: number) {
    if (turnCounterRef.current !== turnId) {
      return;
    }

    const repeated = stateRef.current.errorCount > 0;
    dispatch({ turnId, type: "fail" });
    const audio = playbackRef.current;

    if (audio !== null) {
      audio.pause();
      audio.src = repeated
        ? "/audio/fixed/error-repeated.mp3"
        : "/audio/fixed/error-first.mp3";
      audio.currentTime = 0;
      await audio.play().catch(() => undefined);
    }
  }

  async function submitTurn(turnId: number, said: string) {
    if (turnCounterRef.current !== turnId) {
      return;
    }

    const history = stateRef.current.history;
    dispatch({ said, turnId, type: "think" });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TURN_TIMEOUT_MS);
    requestControllerRef.current = controller;

    try {
      const response = await fetch("/api/turn", {
        body: JSON.stringify({ history, said }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: controller.signal,
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        turnFailureSchema.parse(body);
        throw new Error("Turn request failed");
      }

      const result = turnResponseSchema.parse(body);

      if (turnCounterRef.current !== turnId) {
        return;
      }

      dispatch({ text: result.text, turnId, type: "receive" });
      const audio = playbackRef.current;

      if (audio === null) {
        throw new Error("Playback element unavailable");
      }

      audio.pause();
      audio.src = `data:audio/mpeg;base64,${result.audio}`;
      audio.currentTime = 0;
      await audio.play();
    } catch {
      await playError(turnId);
    } finally {
      clearTimeout(timeout);
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
    }
  }

  function completeListening(turnId: number) {
    if (turnCounterRef.current !== turnId) {
      return;
    }

    shouldListenRef.current = false;
    submitOnEndRef.current = true;
    stopListeningCue(recordingTimerRef, setLevel);

    if (recognitionRef.current === null) {
      submitOnEndRef.current = false;
      void submitTurn(turnId, latestTranscriptRef.current);
      return;
    }

    try {
      recognitionRef.current.stop();
    } catch {
      recognitionRef.current = null;
      submitOnEndRef.current = false;
      void submitTurn(turnId, latestTranscriptRef.current);
    }
  }

  async function startListening() {
    const turnId = ++turnCounterRef.current;
    stopActiveWork(turnId);
    unlockPlayback();
    finalTranscriptRef.current = "";
    latestTranscriptRef.current = "";

    try {
      const Recognition =
        window.SpeechRecognition ?? window.webkitSpeechRecognition;

      if (Recognition === undefined) {
        await playError(turnId);
        return;
      }

      dispatch({ turnId, type: "listen" });
      shouldListenRef.current = true;
      submitOnEndRef.current = false;

      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognitionTurnRef.current = turnId;
      recognitionRef.current = recognition;

      const showActivity = (nextLevel: number) => {
        if (
          recognitionRef.current === recognition &&
          turnCounterRef.current === turnId &&
          shouldListenRef.current
        ) {
          setLevel(nextLevel);
        }
      };

      recognition.onaudiostart = () => showActivity(0.2);
      recognition.onsoundstart = () => showActivity(0.55);
      recognition.onspeechstart = () => showActivity(1);
      recognition.onspeechend = () => showActivity(0.55);
      recognition.onsoundend = () => showActivity(0.2);
      recognition.onaudioend = () => showActivity(0);

      recognition.onresult = (event) => {
        if (
          recognitionRef.current !== recognition ||
          turnCounterRef.current !== turnId
        ) {
          return;
        }

        showActivity(1);
        const segments = [];

        for (
          let index = event.resultIndex;
          index < event.results.length;
          index += 1
        ) {
          const result = event.results[index];
          const transcript = result?.[0]?.transcript ?? "";

          if (result !== undefined) {
            segments.push({ isFinal: result.isFinal, transcript });
          }
        }

        const update = mergeRecognitionSegments(
          finalTranscriptRef.current,
          segments,
        );
        finalTranscriptRef.current = update.finalTranscript;
        latestTranscriptRef.current = update.latestTranscript;
        dispatch({
          text: latestTranscriptRef.current,
          turnId,
          type: "interim",
        });
      };

      recognition.onerror = (event) => {
        if (event.error === "aborted" || event.error === "no-speech") {
          return;
        }

        shouldListenRef.current = false;
        submitOnEndRef.current = false;
        stopListeningCue(recordingTimerRef, setLevel);

        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          void permissionAfterDenial().then((microphone) => {
            if (turnCounterRef.current === turnId) {
              dispatch({ microphone, turnId, type: "permission" });
            }
          });
          return;
        }

        void playError(turnId);
      };

      recognition.onend = () => {
        if (
          recognitionTurnRef.current !== turnId ||
          turnCounterRef.current !== turnId
        ) {
          return;
        }

        if (shouldListenRef.current) {
          setLevel(0);
          try {
            recognition.start();
          } catch {
            shouldListenRef.current = false;
            stopListeningCue(recordingTimerRef, setLevel);
            void playError(turnId);
          }
          return;
        }

        recognitionRef.current = null;

        if (submitOnEndRef.current) {
          submitOnEndRef.current = false;
          void submitTurn(turnId, latestTranscriptRef.current);
        }
      };

      recognition.start();
      recordingTimerRef.current = setTimeout(
        () => completeListening(turnId),
        RECORDING_LIMIT_MS,
      );
    } catch (error) {
      if (turnCounterRef.current !== turnId) {
        return;
      }

      shouldListenRef.current = false;
      submitOnEndRef.current = false;
      recognitionRef.current = null;
      stopListeningCue(recordingTimerRef, setLevel);

      if (
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "SecurityError")
      ) {
        const microphone = await permissionAfterDenial();

        if (turnCounterRef.current === turnId) {
          dispatch({ microphone, turnId, type: "permission" });
        }
        return;
      }

      await playError(turnId);
    }
  }

  function startOver() {
    const turnId = ++turnCounterRef.current;
    stopActiveWork(turnId);
    dispatch({ turnId, type: "reset" });
  }

  function activateTalkControl() {
    if (state.lifecycle === "listening") {
      completeListening(state.activeTurnId);
      return;
    }

    void startListening();
  }

  return (
    <main className="bg-canvas mx-auto flex min-h-dvh w-full max-w-[42rem] flex-col">
      <PracticeHeader onStartOver={startOver} />
      <Transcript state={state} />
      <ControlZone
        level={level}
        onActivate={activateTalkControl}
        state={state}
        stillThinking={
          state.lifecycle === "thinking" &&
          longThinkingTurn === state.activeTurnId
        }
      />
      <audio
        className="hidden"
        onEnded={() => {
          if (stateRef.current.lifecycle === "speaking") {
            dispatch({
              turnId: stateRef.current.activeTurnId,
              type: "idle",
            });
          }
        }}
        preload="auto"
        ref={playbackRef}
      />
    </main>
  );
}

function stopListeningCue(
  recordingTimerRef: RefObject<ReturnType<typeof setTimeout> | null>,
  setLevel: (value: number) => void,
) {
  if (recordingTimerRef.current !== null) {
    clearTimeout(recordingTimerRef.current);
    recordingTimerRef.current = null;
  }
  setLevel(0);
}

function PracticeHeader({ onStartOver }: { onStartOver: () => void }) {
  return (
    <header className="gap-md px-lg max-[359px]:px-md flex min-h-16 items-center justify-between pt-[env(safe-area-inset-top)]">
      <h1 className="font-reading text-section-title">Practice</h1>
      <button
        type="button"
        className="rounded-control border-line-strong bg-canvas px-md text-button text-ink focus-visible:ring-focus focus-visible:ring-offset-canvas min-h-12 border py-[14px] focus-visible:ring-3 focus-visible:ring-offset-2 focus-visible:outline-none"
        onClick={onStartOver}
      >
        Start over
      </button>
    </header>
  );
}

function Transcript({ state }: { state: PracticeState }) {
  const notice =
    state.microphone === "needed"
      ? "I need to hear you to practice. Tap Allow, then choose Allow again when your phone asks."
      : state.microphone === "blocked"
        ? "This page can't use the microphone yet. A grown-up can switch it back on in your browser's settings for this site."
        : null;
  const error =
    state.lifecycle === "error"
      ? state.errorCount > 1
        ? ERROR_RESPONSES.repeated
        : ERROR_RESPONSES.first
      : null;
  const isEmpty =
    state.history.length === 0 &&
    state.interimText === "" &&
    notice === null &&
    error === null;

  if (isEmpty) {
    return (
      <section
        aria-labelledby="empty-transcript-title"
        className="gap-xs px-lg max-[359px]:px-md flex min-h-[120px] flex-1 flex-col justify-center overflow-y-auto pb-[8%]"
      >
        <h2
          id="empty-transcript-title"
          className="font-reading text-section-title"
        >
          Ready when you are
        </h2>
        <p className="text-body text-ink-muted">
          Tap Talk and say what you&apos;d like to practice.
        </p>
      </section>
    );
  }

  return (
    <section className="px-lg py-xl max-[359px]:px-md min-h-[120px] flex-1 overflow-y-auto">
      <ol aria-live="off" className="gap-lg flex flex-col" role="log">
        {state.history.map((entry, index) => (
          <li key={`${index}-${entry.role}`} className="gap-xxs flex flex-col">
            <span className="text-meta text-ink-muted">
              {entry.role === "user" ? "You" : "AI reply"}
            </span>
            <p className="font-reading text-transcript text-ink">
              {entry.text}
            </p>
          </li>
        ))}
        {state.lifecycle === "listening" && state.interimText !== "" ? (
          <li className="gap-xxs flex flex-col">
            <span className="text-meta text-ink-muted">You</span>
            <p className="font-reading text-transcript text-ink">
              {state.interimText}
            </p>
          </li>
        ) : null}
      </ol>
      {notice !== null ? (
        <p className="mt-lg text-body text-ink">{notice}</p>
      ) : null}
      {error !== null ? (
        <p
          className="bg-error-bg text-error-ink rounded-notice mt-lg p-md text-body"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}

function ControlZone({
  level,
  onActivate,
  state,
  stillThinking,
}: {
  level: number;
  onActivate: () => void;
  state: PracticeState;
  stillThinking: boolean;
}) {
  const presentation = controlPresentation(state, stillThinking);

  return (
    <section
      aria-label="Talk controls"
      className="bg-plinth px-lg pt-md max-[359px]:px-md flex flex-col items-center pb-[calc(var(--spacing-md)+env(safe-area-inset-bottom))]"
    >
      <div
        aria-atomic="true"
        aria-live="polite"
        className={`mb-md gap-xs text-body inline-flex min-h-8 items-center ${presentation.statusClass}`}
      >
        <StatusIcon
          lifecycle={state.lifecycle}
          level={level}
          microphone={state.microphone}
        />
        {presentation.status}
      </div>
      <button
        type="button"
        aria-label={
          state.microphone === "needed"
            ? "Allow microphone"
            : presentation.action
        }
        className={`bg-primary p-md text-button text-on-primary after:border-primary-active focus-visible:ring-focus focus-visible:ring-offset-canvas relative inline-flex min-h-[104px] min-w-[104px] touch-manipulation flex-col items-center justify-center rounded-full transition-transform duration-100 after:pointer-events-none after:absolute after:inset-[6px] after:rounded-full after:border-[1.5px] focus-visible:ring-3 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${
          state.lifecycle === "listening"
            ? "before:border-primary before:absolute before:-inset-2 before:rounded-full before:border"
            : ""
        }`}
        onClick={onActivate}
      >
        {state.lifecycle === "listening" ? <StopIcon /> : <MicrophoneIcon />}
        <span className="mt-xxs">{presentation.action}</span>
      </button>
    </section>
  );
}

function controlPresentation(state: PracticeState, stillThinking: boolean) {
  if (state.lifecycle === "error") {
    return {
      action: "Try again",
      status: "Something went wrong",
      statusClass: "text-error-ink",
    };
  }
  if (state.lifecycle === "listening") {
    return {
      action: "Done",
      status: "Listening",
      statusClass: "text-ink-muted",
    };
  }
  if (state.lifecycle === "thinking") {
    return {
      action: "Talk",
      status: stillThinking ? "Still thinking" : "Thinking",
      statusClass: "bg-thinking-bg text-thinking-ink rounded-full px-sm",
    };
  }
  if (state.lifecycle === "speaking") {
    return {
      action: "Talk",
      status: "Speaking",
      statusClass: "bg-speaking-bg text-speaking-ink rounded-full px-sm",
    };
  }
  if (state.microphone === "needed") {
    return {
      action: "Allow",
      status: "Microphone needed",
      statusClass: "text-ink",
    };
  }
  if (state.microphone === "blocked") {
    return {
      action: "Try again",
      status: "Microphone blocked",
      statusClass: "text-ink",
    };
  }
  return { action: "Talk", status: "Ready", statusClass: "text-ink-muted" };
}

function StatusIcon({
  level,
  lifecycle,
  microphone,
}: {
  level: number;
  lifecycle: VoiceLifecycle;
  microphone: MicrophoneStatus;
}) {
  if (lifecycle === "listening") {
    return <LevelMeter level={level} />;
  }
  if (lifecycle === "thinking") {
    return <span aria-hidden="true">•••</span>;
  }
  if (lifecycle === "speaking") {
    return <SpeakerIcon />;
  }
  if (lifecycle === "error") {
    return <span aria-hidden="true">!</span>;
  }
  if (microphone !== "ready") {
    return <MicrophoneIcon />;
  }
  return <ReadyIcon />;
}

function LevelMeter({ level }: { level: number }) {
  const heights = [0.35, 0.7, 1, 0.55];

  return (
    <span
      aria-hidden="true"
      className="gap-xxs flex h-6 items-end motion-reduce:items-center"
    >
      {heights.map((weight, index) => (
        <span
          key={index}
          className="bg-ink-muted w-0.5 rounded-full transition-[height] duration-100 motion-reduce:h-1! motion-reduce:transition-none"
          style={{ height: `${4 + level * weight * 20}px` }}
        />
      ))}
    </span>
  );
}

function ReadyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="7" />
    </svg>
  );
}

function MicrophoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="currentColor"
    >
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    >
      <path d="M5 10v4h4l5 4V6l-5 4H5Z" />
      <path d="M17 9a4 4 0 0 1 0 6" />
    </svg>
  );
}
