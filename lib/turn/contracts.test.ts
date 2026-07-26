import { describe, expect, it } from "vitest";

import {
  turnFailureSchema,
  turnRequestSchema,
  turnResponseSchema,
} from "./contracts";

describe("turn contracts", () => {
  it("accepts the bounded request shape", () => {
    expect(
      turnRequestSchema.parse({
        history: [
          { role: "user", text: "Why do stars twinkle?" },
          { role: "assistant", text: "Their light passes through moving air." },
        ],
        said: "What kind of air?",
      }),
    ).toEqual({
      history: [
        { role: "user", text: "Why do stars twinkle?" },
        { role: "assistant", text: "Their light passes through moving air." },
      ],
      said: "What kind of air?",
    });
  });

  it("rejects an unbounded or expanded request", () => {
    expect(() =>
      turnRequestSchema.parse({
        history: Array.from({ length: 21 }, () => ({
          role: "user",
          text: "Hello.",
        })),
        said: "Hello.",
      }),
    ).toThrow();
    expect(() =>
      turnRequestSchema.parse({
        history: [],
        said: "x".repeat(1_001),
      }),
    ).toThrow();
    expect(() =>
      turnRequestSchema.parse({
        history: [],
        said: "Hello.",
        trusted: true,
      }),
    ).toThrow();
  });

  it("requires the complete text and base64 audio response", () => {
    expect(
      turnResponseSchema.parse({
        audio: "AQID",
        kind: "reply",
        text: "A complete reply.",
      }),
    ).toEqual({
      audio: "AQID",
      kind: "reply",
      text: "A complete reply.",
    });
    expect(() =>
      turnResponseSchema.parse({
        audio: "not base64",
        kind: "reply",
        text: "A complete reply.",
      }),
    ).toThrow();
  });

  it("keeps the failure response content-free", () => {
    expect(turnFailureSchema.parse({ category: "upstream" })).toEqual({
      category: "upstream",
    });
    expect(() =>
      turnFailureSchema.parse({
        category: "upstream",
        detail: "provider payload",
      }),
    ).toThrow();
  });
});
