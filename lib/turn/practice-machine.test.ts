import { describe, expect, it } from "vitest";

import {
  initialPracticeState,
  practiceReducer,
  toTurnHistory,
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
      audioUrl: "blob:reply-1",
      text: "Their light passes through moving air.",
      turnId: 1,
      type: "receive",
    });
    const idle = practiceReducer(speaking, { turnId: 1, type: "idle" });

    expect(thinking.history).toEqual([
      { role: "user", text: "Why do stars twinkle?", turnId: 1 },
    ]);
    expect(speaking.history).toEqual([
      { role: "user", text: "Why do stars twinkle?", turnId: 1 },
      {
        role: "assistant",
        text: "Their light passes through moving air.",
        audioUrl: "blob:reply-1",
        turnId: 1,
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
        audioUrl: "blob:stale",
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
      history: [{ role: "user", text: "A completed turn.", turnId: 1 }],
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

  it("keeps only the newest twenty history entries", () => {
    const history: PracticeState["history"] = Array.from(
      { length: 20 },
      (_, index) =>
        index % 2 === 0
          ? { role: "user", text: `Turn ${index}`, turnId: index }
          : {
              audioUrl: `blob:reply-${index}`,
              role: "assistant",
              text: `Turn ${index}`,
              turnId: index,
            },
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
      turnId: 1,
    });
  });

  it("marks replay as speaking without adding a conversation turn", () => {
    const state: PracticeState = {
      ...initialPracticeState,
      activeTurnId: 4,
      history: [
        { role: "user", text: "Why?", turnId: 4 },
        {
          audioUrl: "blob:reply-4",
          role: "assistant",
          text: "Because.",
          turnId: 4,
        },
      ],
    };

    const replaying = practiceReducer(state, { turnId: 4, type: "replay" });

    expect(replaying).toMatchObject({
      history: state.history,
      lifecycle: "speaking",
    });
  });

  it("removes client-only replay fields from submitted history", () => {
    expect(
      toTurnHistory([
        { role: "user", text: "Why?", turnId: 1 },
        {
          audioUrl: "blob:reply-1",
          role: "assistant",
          text: "Because.",
          turnId: 1,
        },
      ]),
    ).toEqual([
      { role: "user", text: "Why?" },
      { role: "assistant", text: "Because." },
    ]);
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
