export type RecognitionSegment = {
  isFinal: boolean;
  transcript: string;
};

export function assembleRecognitionResults(
  segments: readonly RecognitionSegment[],
) {
  let finalTranscript = "";
  let interimTranscript = "";

  for (const segment of segments) {
    const transcript = segment.transcript.trim();

    if (transcript === "") {
      continue;
    }

    const current = segment.isFinal ? finalTranscript : interimTranscript;
    const next = `${current} ${transcript}`.trim();

    if (segment.isFinal) {
      finalTranscript = next;
    } else {
      interimTranscript = next;
    }
  }

  return {
    finalTranscript,
    latestTranscript: `${finalTranscript} ${interimTranscript}`.trim(),
  };
}
