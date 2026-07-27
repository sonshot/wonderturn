import { describe, expect, it, vi } from "vitest";

import {
  handleTranscriptionTokenRequest,
  type TranscriptionTokenHandlerDependencies,
} from "./handle-transcription-token-request";

function dependencies(
  overrides: Partial<TranscriptionTokenHandlerDependencies> = {},
): TranscriptionTokenHandlerDependencies {
  return {
    authorize: vi.fn(async () => true),
    mintToken: vi.fn(async () => "vcst_test-token"),
    ...overrides,
  };
}

describe("handleTranscriptionTokenRequest", () => {
  it("mints a no-store token for an authorized session", async () => {
    const response = await handleTranscriptionTokenRequest(
      new Request("https://wonderturn.test/api/transcriptions/token", {
        method: "POST",
      }),
      dependencies(),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      token: "vcst_test-token",
    });
  });

  it("rejects an unauthorized session before minting", async () => {
    const mintToken = vi.fn(async () => "vcst_test-token");
    const response = await handleTranscriptionTokenRequest(
      new Request("https://wonderturn.test/api/transcriptions/token", {
        method: "POST",
      }),
      dependencies({
        authorize: vi.fn(async () => false),
        mintToken,
      }),
    );

    expect(response.status).toBe(401);
    expect(mintToken).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      category: "authorization",
    });
  });

  it("fails closed when Gateway token minting fails", async () => {
    const logFailure = vi.fn();
    const response = await handleTranscriptionTokenRequest(
      new Request("https://wonderturn.test/api/transcriptions/token", {
        method: "POST",
      }),
      dependencies({
        logFailure,
        mintToken: vi.fn(async () => {
          throw new Error("Gateway unavailable");
        }),
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ category: "upstream" });
    expect(logFailure).toHaveBeenCalledWith({
      category: "upstream",
      endpoint: "/api/transcriptions/token",
      status: 502,
    });
  });

  it("fails closed when Gateway returns a malformed client secret", async () => {
    const response = await handleTranscriptionTokenRequest(
      new Request("https://wonderturn.test/api/transcriptions/token", {
        method: "POST",
      }),
      dependencies({
        logFailure: vi.fn(),
        mintToken: vi.fn(async () => "not-a-client-secret"),
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ category: "upstream" });
  });
});
