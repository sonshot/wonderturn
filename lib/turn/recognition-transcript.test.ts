import { describe, expect, it } from "vitest";

import { mergeRecognitionSegments } from "./recognition-transcript";

describe("recognition transcript assembly", () => {
  it("keeps only the newest cumulative interim hypothesis", () => {
    expect(
      mergeRecognitionSegments("", [
        { isFinal: false, transcript: "tell" },
        { isFinal: false, transcript: "tell me" },
        { isFinal: false, transcript: "tell me something" },
        {
          isFinal: false,
          transcript: "tell me something funny about elephant",
        },
      ]),
    ).toEqual({
      finalTranscript: "",
      latestTranscript: "tell me something funny about elephant",
    });
  });

  it("retains finalized speech before the newest interim hypothesis", () => {
    expect(
      mergeRecognitionSegments("hello", [
        { isFinal: true, transcript: "there" },
        { isFinal: false, transcript: "tell" },
        { isFinal: false, transcript: "tell me a joke" },
      ]),
    ).toEqual({
      finalTranscript: "hello there",
      latestTranscript: "hello there tell me a joke",
    });
  });
});
