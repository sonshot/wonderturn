export type RecognitionSegment = {
  isFinal: boolean;
  transcript: string;
};

export function mergeRecognitionSegments(
  currentFinal: string,
  segments: readonly RecognitionSegment[],
) {
  let finalTranscript = currentFinal.trim();
  let interimTranscript = "";

  for (const segment of segments) {
    const transcript = segment.transcript.trim();

    if (transcript === "") {
      continue;
    }

    if (segment.isFinal) {
      finalTranscript = `${finalTranscript} ${transcript}`.trim();
    } else {
      interimTranscript = transcript;
    }
  }

  return {
    finalTranscript,
    latestTranscript: `${finalTranscript} ${interimTranscript}`.trim(),
  };
}
