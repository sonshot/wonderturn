export const SPEECH_SAMPLES = [
  {
    id: "everyday",
    label: "Everyday sentence",
    text: "After school, I made a sandwich and finished my homework.",
  },
  {
    id: "names-and-numbers",
    label: "Names and numbers",
    text: "Maya packed three green apples and a blue notebook for school.",
  },
  {
    id: "question",
    label: "Question",
    text: "Could you tell me why the moon changes shape at night?",
  },
] as const;

export const SPEECH_SAMPLE_IDS = [
  "everyday",
  "names-and-numbers",
  "question",
] as const;

export type SpeechSampleId = (typeof SPEECH_SAMPLE_IDS)[number];

export function getSpeechSample(id: SpeechSampleId) {
  const sample = SPEECH_SAMPLES.find((candidate) => candidate.id === id);

  if (sample === undefined) {
    throw new Error(`Unknown speech sample: ${id}`);
  }

  return sample;
}
