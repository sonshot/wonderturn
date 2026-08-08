import {
  LevelMeter,
  MicrophoneIcon,
  ReadyIcon,
  SpeakerIcon,
  StopIcon,
} from "@/components/practice/voice-icons";
import type {
  MicrophoneStatus,
  PracticeState,
  VoiceLifecycle,
} from "@/lib/turn/practice-machine";

export function ControlZone({
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
