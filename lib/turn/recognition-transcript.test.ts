import { describe, expect, it } from "vitest";

import { assembleRecognitionResults } from "./recognition-transcript";

describe("recognition transcript assembly", () => {
  it("assembles the complete current result list in index order", () => {
    expect(
      assembleRecognitionResults([
        { isFinal: true, transcript: "tell me" },
        { isFinal: true, transcript: "something funny" },
        { isFinal: false, transcript: "about" },
        { isFinal: false, transcript: "elephants" },
      ]),
    ).toEqual({
      finalTranscript: "tell me something funny",
      latestTranscript: "tell me something funny about elephants",
    });
  });

  it("rebuilds a replaced result instead of appending the previous event", () => {
    const first = assembleRecognitionResults([
      { isFinal: false, transcript: "tell" },
    ]);
    const second = assembleRecognitionResults([
      { isFinal: false, transcript: "tell me" },
    ]);
    const third = assembleRecognitionResults([
      {
        isFinal: false,
        transcript: "tell me something funny about elephants",
      },
    ]);

    expect(first.latestTranscript).toBe("tell");
    expect(second.latestTranscript).toBe("tell me");
    expect(third).toEqual({
      finalTranscript: "",
      latestTranscript: "tell me something funny about elephants",
    });
  });

  it("reflects removal of an interim result from the current list", () => {
    expect(
      assembleRecognitionResults([
        { isFinal: true, transcript: "hello hello" },
      ]),
    ).toEqual({
      finalTranscript: "hello hello",
      latestTranscript: "hello hello",
    });
  });
});
