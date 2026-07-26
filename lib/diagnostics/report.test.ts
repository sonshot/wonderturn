import { describe, expect, it } from "vitest";

import { diagnosticReportSubmissionSchema } from "./report";

const validReport = {
  capturedAt: "2026-07-26T05:54:34.212Z",
  environment: {
    online: true,
    secureContext: true,
    speechRecognition: "present",
  },
  events: [
    {
      id: 1,
      message: "Speech recognition started",
      milliseconds: 100,
    },
  ],
  finalTranscript: "hello",
  interimTranscript: "",
  notes: "",
  offlineRecognition: "not-tested",
  results: {
    delayedAudioUnlock: "passed",
    progressiveAudio: "failed",
    speechRecognition: "passed",
  },
  speechSampleId: "everyday",
};

describe("diagnosticReportSubmissionSchema", () => {
  it("accepts the diagnostic report contract", () => {
    expect(diagnosticReportSubmissionSchema.parse(validReport)).toEqual(
      validReport,
    );
  });

  it("rejects unknown fields", () => {
    expect(() =>
      diagnosticReportSubmissionSchema.parse({
        ...validReport,
        deviceLabel: "manually supplied",
      }),
    ).toThrow();
  });

  it("rejects an unknown speech sample", () => {
    expect(() =>
      diagnosticReportSubmissionSchema.parse({
        ...validReport,
        speechSampleId: "made-up-sentence",
      }),
    ).toThrow();
  });
});
