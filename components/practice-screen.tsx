"use client";

import { useEffect, useReducer, useRef, useState, type RefObject } from "react";

import { ControlZone } from "@/components/practice/control-zone";
import { Transcript } from "@/components/practice/transcript";
import { turnFailureSchema, turnResponseSchema } from "@/lib/turn/contracts";
import {
  initialPracticeState,
  practiceReducer,
  toTurnHistory,
  type MicrophoneStatus,
} from "@/lib/turn/practice-machine";
import { audioBlobFromBase64 } from "@/lib/turn/replay-audio";
import {
  assembleRecognitionResults,
  type RecognitionSegment,
} from "@/lib/turn/recognition-transcript";

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
  const completedTranscriptRef = useRef("");
  const latestTranscriptRef = useRef("");
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackRef = useRef<HTMLAudioElement | null>(null);
  const playbackRunRef = useRef(0);
  const replayAudioUrlsRef = useRef(new Set<string>());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const retainedUrls = new Set(
      state.history.flatMap((entry) =>
        entry.role === "assistant" ? [entry.audioUrl] : [],
      ),
    );

    for (const audioUrl of replayAudioUrlsRef.current) {
      if (!retainedUrls.has(audioUrl)) {
        URL.revokeObjectURL(audioUrl);
        replayAudioUrlsRef.current.delete(audioUrl);
      }
    }
  }, [state.history]);

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
    const replayAudioUrls = replayAudioUrlsRef.current;

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
      playbackRunRef.current += 1;
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
      playbackRunRef.current += 1;
      playback?.pause();
      for (const audioUrl of replayAudioUrls) {
        URL.revokeObjectURL(audioUrl);
      }
      replayAudioUrls.clear();
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
    playbackRunRef.current += 1;
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
    playbackRunRef.current += 1;
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

    const history = toTurnHistory(stateRef.current.history);
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

      const audio = playbackRef.current;

      if (audio === null) {
        throw new Error("Playback element unavailable");
      }

      const audioUrl = URL.createObjectURL(audioBlobFromBase64(result.audio));
      replayAudioUrlsRef.current.add(audioUrl);
      dispatch({
        audioUrl,
        text: result.text,
        turnId,
        type: "receive",
      });
      playbackRunRef.current += 1;
      audio.pause();
      audio.src = audioUrl;
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
    completedTranscriptRef.current = "";
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
        const segments: RecognitionSegment[] = [];

        for (let index = 0; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result?.[0]?.transcript ?? "";

          if (result !== undefined) {
            segments.push({ isFinal: result.isFinal, transcript });
          }
        }

        const currentSession = assembleRecognitionResults(segments);
        latestTranscriptRef.current =
          `${completedTranscriptRef.current} ${currentSession.latestTranscript}`.trim();
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
          completedTranscriptRef.current = latestTranscriptRef.current;
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

  async function replayReply(audioUrl: string) {
    if (state.lifecycle !== "idle" && state.lifecycle !== "speaking") {
      return;
    }

    const audio = playbackRef.current;
    const turnId = state.activeTurnId;

    if (audio === null) {
      await playError(turnId);
      return;
    }

    const playbackRun = ++playbackRunRef.current;
    audio.pause();
    audio.src = audioUrl;
    audio.currentTime = 0;
    dispatch({ turnId, type: "replay" });

    try {
      await audio.play();
    } catch {
      if (
        playbackRunRef.current === playbackRun &&
        turnCounterRef.current === turnId
      ) {
        await playError(turnId);
      }
    }
  }

  return (
    <main className="bg-canvas mx-auto flex min-h-dvh w-full max-w-[42rem] flex-col">
      <PracticeHeader onStartOver={startOver} />
      <Transcript onReplay={replayReply} state={state} />
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
