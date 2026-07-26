import { describe, expect, it, vi } from "vitest";

import { FIXED_RESPONSES } from "./fixed-responses";
import {
  runTextTurn,
  type InputClassification,
  type TextTurnDependencies,
} from "./run-text-turn";

function dependencies(classification: InputClassification = "ordinary") {
  return {
    classifyInput: vi.fn(async () => classification),
    clearCandidate: vi.fn(async () => true),
    generateCandidate: vi.fn(async () => "A complete reply."),
  };
}

describe("runTextTurn", () => {
  it("returns the fixed nudge for empty recognition without model work", async () => {
    const adapters = dependencies();

    await expect(
      runTextTurn({ history: [], said: "  " }, adapters),
    ).resolves.toEqual({
      kind: "nudge",
      text: FIXED_RESPONSES.nudge,
    });
    expect(adapters.classifyInput).not.toHaveBeenCalled();
    expect(adapters.generateCandidate).not.toHaveBeenCalled();
  });

  it("starts classification and candidate generation together", async () => {
    let resolveClassification:
      ((classification: InputClassification) => void) | undefined;
    const classification = new Promise<InputClassification>((resolve) => {
      resolveClassification = resolve;
    });
    const adapters = dependencies();
    adapters.classifyInput.mockImplementation(async () => classification);

    const turn = runTextTurn({ history: [], said: "Why?" }, adapters);

    expect(adapters.classifyInput).toHaveBeenCalledOnce();
    expect(adapters.generateCandidate).toHaveBeenCalledOnce();
    resolveClassification?.("ordinary");
    await expect(turn).resolves.toMatchObject({ kind: "reply" });
  });

  it("gives disclosure precedence and discards a failed candidate", async () => {
    let candidateSignal: AbortSignal | undefined;
    const adapters: TextTurnDependencies = {
      classifyInput: vi.fn(
        async (): Promise<InputClassification> => "disclosure",
      ),
      clearCandidate: vi.fn(async () => true),
      generateCandidate: vi.fn(async (input) => {
        candidateSignal = input.signal;
        throw new Error("discard me");
      }),
    };

    await expect(
      runTextTurn({ history: [], said: "Help me." }, adapters),
    ).resolves.toEqual({
      kind: "disclosure",
      text: FIXED_RESPONSES.disclosure,
    });
    expect(adapters.clearCandidate).not.toHaveBeenCalled();
    expect(candidateSignal?.aborted).toBe(true);
  });

  it("returns redirect when clearing rejects and discards failed preparation", async () => {
    const adapters = dependencies();
    adapters.clearCandidate.mockResolvedValue(false);
    let preparationSignal: AbortSignal | undefined;

    await expect(
      runTextTurn({ history: [], said: "Tell me." }, adapters, {
        prepareCandidate: async (_candidate, signal) => {
          preparationSignal = signal;
          throw new Error("discard speculative audio");
        },
      }),
    ).resolves.toEqual({
      kind: "redirect",
      text: FIXED_RESPONSES.redirect,
    });
    expect(preparationSignal?.aborted).toBe(true);
  });

  it("releases the immutable cleared reply and prepared audio together", async () => {
    const adapters = dependencies();

    await expect(
      runTextTurn({ history: [], said: "What is magma?" }, adapters, {
        candidateOverride:
          "**Magma** is melted rock. It can cool into solid rock.",
        prepareCandidate: async (candidate) => `audio:${candidate}`,
      }),
    ).resolves.toEqual({
      audio: "audio:Magma is melted rock. It can cool into solid rock.",
      kind: "reply",
      text: "Magma is melted rock. It can cool into solid rock.",
    });
    expect(adapters.generateCandidate).not.toHaveBeenCalled();
    expect(adapters.clearCandidate).toHaveBeenCalledWith(
      "Magma is melted rock. It can cool into solid rock.",
      expect.any(AbortSignal),
    );
  });

  it("fails closed when the required clearing check fails", async () => {
    const adapters = dependencies();
    adapters.clearCandidate.mockRejectedValue(new Error("check unavailable"));

    await expect(
      runTextTurn({ history: [], said: "Why?" }, adapters),
    ).rejects.toThrow("check unavailable");
  });

  it("fails closed when input classification fails", async () => {
    const adapters = dependencies();
    adapters.classifyInput.mockRejectedValue(
      new Error("classifier unavailable"),
    );

    await expect(
      runTextTurn({ history: [], said: "Why?" }, adapters),
    ).rejects.toThrow("classifier unavailable");
  });

  it("fails closed when ordinary candidate generation fails", async () => {
    const adapters = dependencies();
    adapters.generateCandidate.mockRejectedValue(
      new Error("generation unavailable"),
    );

    await expect(
      runTextTurn({ history: [], said: "Why?" }, adapters),
    ).rejects.toThrow("generation unavailable");
  });

  it("fails closed when required reply preparation fails after a pass", async () => {
    const adapters = dependencies();

    await expect(
      runTextTurn({ history: [], said: "Why?" }, adapters, {
        prepareCandidate: async () => {
          throw new Error("speech unavailable");
        },
      }),
    ).rejects.toThrow("speech unavailable");
  });
});
