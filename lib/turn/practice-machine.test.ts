import { describe, expect, it } from "vitest";

import {
  initialPracticeState,
  practiceReducer,
  type PracticeState,
} from "./practice-machine";

describe("practice state machine", () => {
  it("moves one turn through listening, thinking, speaking, and idle", () => {
    const listening = practiceReducer(initialPracticeState, {
      turnId: 1,
      type: "listen",
    });
    const thinking = practiceReducer(listening, {
      said: "Why do stars twinkle?",
      turnId: 1,
      type: "think",
    });
    const speaking = practiceReducer(thinking, {
      text: "Their light passes through moving air.",
      turnId: 1,
      type: "receive",
    });
    const idle = practiceReducer(speaking, { turnId: 1, type: "idle" });

    expect(thinking.history).toEqual([
      { role: "user", text: "Why do stars twinkle?" },
    ]);
    expect(speaking.history).toEqual([
      { role: "user", text: "Why do stars twinkle?" },
      {
        role: "assistant",
        text: "Their light passes through moving air.",
      },
    ]);
    expect(idle.lifecycle).toBe("idle");
  });

  it("ignores every result from an obsolete turn", () => {
    const newer = practiceReducer(initialPracticeState, {
      turnId: 2,
      type: "listen",
    });

    expect(
      practiceReducer(newer, {
        text: "Stale reply.",
        turnId: 1,
        type: "receive",
      }),
    ).toBe(newer);
    expect(practiceReducer(newer, { turnId: 1, type: "fail" })).toBe(newer);
  });

  it("interrupts obsolete work without clearing completed history", () => {
    const state: PracticeState = {
      ...initialPracticeState,
      activeTurnId: 1,
      history: [{ role: "user", text: "A completed turn." }],
      lifecycle: "thinking",
    };
    const interrupted = practiceReducer(state, {
      turnId: 2,
      type: "interrupt",
    });

    expect(interrupted).toMatchObject({
      activeTurnId: 2,
      history: state.history,
      lifecycle: "idle",
    });
  });

  it("repairs the latest human turn and every reply based on it", () => {
    const state: PracticeState = {
      ...initialPracticeState,
      activeTurnId: 2,
      history: [
        { role: "user", text: "Tell me about volcanoes." },
        { role: "assistant", text: "Volcanoes release hot rock and gas." },
        { role: "user", text: "Tell me about telephones." },
        { role: "assistant", text: "Telephones carry voices over distance." },
      ],
      lifecycle: "speaking",
    };
    const repairing = practiceReducer(state, {
      turnId: 3,
      type: "repair",
    });

    expect(repairing).toMatchObject({
      activeTurnId: 3,
      history: state.history.slice(0, 2),
      interimText: "",
      lifecycle: "listening",
    });
  });

  it("repairs a human turn while its reply is still pending", () => {
    const state: PracticeState = {
      ...initialPracticeState,
      activeTurnId: 2,
      history: [
        { role: "user", text: "Tell me about volcanoes." },
        { role: "assistant", text: "Volcanoes release hot rock and gas." },
        { role: "user", text: "Tell me about telephones." },
      ],
      lifecycle: "thinking",
    };
    const repairing = practiceReducer(state, {
      turnId: 3,
      type: "repair",
    });

    expect(repairing.history).toEqual(state.history.slice(0, 2));
  });

  it("keeps only the newest twenty history entries", () => {
    const history: PracticeState["history"] = Array.from(
      { length: 20 },
      (_, index) => ({
        role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
        text: `Turn ${index}`,
      }),
    );
    const listening = practiceReducer(
      { ...initialPracticeState, history },
      { turnId: 1, type: "listen" },
    );
    const thinking = practiceReducer(listening, {
      said: "Newest",
      turnId: 1,
      type: "think",
    });

    expect(thinking.history).toHaveLength(20);
    expect(thinking.history[0]?.text).toBe("Turn 1");
    expect(thinking.history.at(-1)).toEqual({
      role: "user",
      text: "Newest",
    });
  });

  it("tracks repeat failures and resets the whole sitting", () => {
    const listening = practiceReducer(initialPracticeState, {
      turnId: 1,
      type: "listen",
    });
    const failed = practiceReducer(listening, { turnId: 1, type: "fail" });
    const retried = practiceReducer(failed, { turnId: 2, type: "listen" });
    const failedAgain = practiceReducer(retried, {
      turnId: 2,
      type: "fail",
    });
    const reset = practiceReducer(failedAgain, {
      turnId: 3,
      type: "reset",
    });

    expect(failedAgain.errorCount).toBe(2);
    expect(reset).toEqual({ ...initialPracticeState, activeTurnId: 3 });
  });
});
