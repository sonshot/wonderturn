import type { TurnRequest } from "./contracts";

export type VoiceLifecycle =
  "error" | "idle" | "listening" | "speaking" | "thinking";

export type MicrophoneStatus = "blocked" | "needed" | "ready";

export type PracticeState = {
  activeTurnId: number;
  errorCount: number;
  history: TurnRequest["history"];
  interimText: string;
  lifecycle: VoiceLifecycle;
  microphone: MicrophoneStatus;
};

export type PracticeAction =
  | { turnId: number; type: "listen" }
  | { turnId: number; type: "interrupt" }
  | { text: string; turnId: number; type: "interim" }
  | { said: string; turnId: number; type: "think" }
  | { text: string; turnId: number; type: "receive" }
  | { turnId: number; type: "idle" }
  | { turnId: number; type: "fail" }
  | {
      microphone: Exclude<MicrophoneStatus, "ready">;
      turnId: number;
      type: "permission";
    }
  | { turnId: number; type: "reset" };

export const initialPracticeState: PracticeState = {
  activeTurnId: 0,
  errorCount: 0,
  history: [],
  interimText: "",
  lifecycle: "idle",
  microphone: "ready",
};

function isCurrent(state: PracticeState, turnId: number) {
  return state.activeTurnId === turnId;
}

function appendHistory(
  history: PracticeState["history"],
  entry: PracticeState["history"][number],
) {
  return [...history, entry].slice(-20);
}

export function practiceReducer(
  state: PracticeState,
  action: PracticeAction,
): PracticeState {
  if (action.type === "listen") {
    return {
      ...state,
      activeTurnId: action.turnId,
      interimText: "",
      lifecycle: "listening",
      microphone: "ready",
    };
  }

  if (action.type === "reset") {
    return { ...initialPracticeState, activeTurnId: action.turnId };
  }

  if (action.type === "interrupt") {
    return {
      ...state,
      activeTurnId: action.turnId,
      interimText: "",
      lifecycle: "idle",
      microphone: "ready",
    };
  }

  if (!isCurrent(state, action.turnId)) {
    return state;
  }

  switch (action.type) {
    case "fail":
      return {
        ...state,
        errorCount: state.errorCount + 1,
        interimText: "",
        lifecycle: "error",
      };
    case "idle":
      return {
        ...state,
        interimText: "",
        lifecycle: "idle",
        microphone: "ready",
      };
    case "interim":
      return { ...state, interimText: action.text };
    case "permission":
      return {
        ...state,
        interimText: "",
        lifecycle: "idle",
        microphone: action.microphone,
      };
    case "receive":
      return {
        ...state,
        history: appendHistory(state.history, {
          role: "assistant",
          text: action.text,
        }),
        interimText: "",
        lifecycle: "speaking",
      };
    case "think": {
      const said = action.said.trim();

      return {
        ...state,
        history:
          said === ""
            ? state.history
            : appendHistory(state.history, { role: "user", text: said }),
        interimText: "",
        lifecycle: "thinking",
      };
    }
  }
}
