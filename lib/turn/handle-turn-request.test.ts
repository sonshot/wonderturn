import { describe, expect, it, vi } from "vitest";

import { FIXED_RESPONSES } from "./fixed-responses";
import {
  handleTurnRequest,
  type TurnHandlerDependencies,
} from "./handle-turn-request";
import type { InputClassification } from "./run-text-turn";

function request(body: unknown) {
  return new Request("https://wonderturn.vercel.app/api/turn", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

function dependencies(): TurnHandlerDependencies {
  return {
    authorize: vi.fn(async () => true),
    getFixedAudio: vi.fn(() => "Zml4ZWQ="),
    logFailure: vi.fn(),
    synthesizeSpeech: vi.fn(async () => "cmVwbHk="),
    text: {
      classifyInput: vi.fn(
        async (): Promise<InputClassification> => "ordinary",
      ),
      clearCandidate: vi.fn(async () => true),
      generateCandidate: vi.fn(async () => "A complete reply."),
    },
  };
}

describe("turn request handler", () => {
  it("rejects unauthorized requests before parsing or model work", async () => {
    const adapters = dependencies();
    vi.mocked(adapters.authorize).mockResolvedValue(false);

    const response = await handleTurnRequest(request({}), adapters);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      category: "authorization",
    });
    expect(adapters.text.classifyInput).not.toHaveBeenCalled();
    expect(adapters.logFailure).toHaveBeenCalledWith({
      category: "authorization",
      endpoint: "/api/turn",
      status: 401,
    });
  });

  it("rejects malformed input with the content-free validation shape", async () => {
    const adapters = dependencies();
    const response = await handleTurnRequest(
      request({ history: [], said: "x".repeat(1_001) }),
      adapters,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ category: "validation" });
    expect(adapters.text.classifyInput).not.toHaveBeenCalled();
  });

  it("returns a cleared reply with its prepared speech", async () => {
    const adapters = dependencies();
    const response = await handleTurnRequest(
      request({ history: [], said: "Why do stars twinkle?" }),
      adapters,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      audio: "cmVwbHk=",
      kind: "reply",
      text: "A complete reply.",
    });
    expect(adapters.synthesizeSpeech).toHaveBeenCalledWith(
      "A complete reply.",
      expect.any(AbortSignal),
    );
  });

  it("returns bundled audio for a fixed outcome", async () => {
    const adapters = dependencies();
    vi.mocked(adapters.text.classifyInput).mockResolvedValue("disclosure");
    const response = await handleTurnRequest(
      request({ history: [], said: "Someone hurt me." }),
      adapters,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      audio: "Zml4ZWQ=",
      kind: "disclosure",
      text: FIXED_RESPONSES.disclosure,
    });
    expect(adapters.getFixedAudio).toHaveBeenCalledWith("disclosure");
    expect(adapters.synthesizeSpeech).not.toHaveBeenCalled();
  });

  it("fails closed without exposing an upstream error", async () => {
    const adapters = dependencies();
    vi.mocked(adapters.text.classifyInput).mockRejectedValue(
      new Error("provider payload"),
    );
    const response = await handleTurnRequest(
      request({ history: [], said: "Why?" }),
      adapters,
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ category: "upstream" });
    expect(adapters.logFailure).toHaveBeenCalledWith({
      category: "upstream",
      endpoint: "/api/turn",
      status: 502,
    });
  });
});
