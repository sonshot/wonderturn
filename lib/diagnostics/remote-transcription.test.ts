import { describe, expect, it } from "vitest";

import {
  remoteTranscriptionRequestSchema,
  remoteTranscriptionResponseSchema,
} from "./remote-transcription";

describe("remote transcription contracts", () => {
  it("accepts a short supported recording", () => {
    const audio = new File([new Uint8Array([1, 2, 3])], "sample.webm", {
      type: "audio/webm;codecs=opus",
    });

    expect(
      remoteTranscriptionRequestSchema.parse({
        audio,
        speechSampleId: "everyday",
      }),
    ).toEqual({ audio, speechSampleId: "everyday" });
  });

  it("rejects unsupported audio", () => {
    const audio = new File(["not audio"], "sample.txt", {
      type: "text/plain",
    });

    expect(() =>
      remoteTranscriptionRequestSchema.parse({
        audio,
        speechSampleId: "everyday",
      }),
    ).toThrow();
  });

  it("requires one result from each configured model", () => {
    expect(() =>
      remoteTranscriptionResponseSchema.parse({ results: [] }),
    ).toThrow();
  });
});
