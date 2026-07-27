export const SPEECH_END_SILENCE_MS = 3_000;
export const SPEECH_LEVEL_THRESHOLD = 0.1;

export type SpeechEndDetector = {
  observe: (level: number) => void;
  stop: () => void;
};

export function createSpeechEndDetector(
  onSpeechEnded: () => void,
): SpeechEndDetector {
  let heardSpeech = false;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;

  function clearSilenceTimer() {
    if (silenceTimer === null) {
      return;
    }

    clearTimeout(silenceTimer);
    silenceTimer = null;
  }

  return {
    observe(level) {
      if (level >= SPEECH_LEVEL_THRESHOLD) {
        heardSpeech = true;
        clearSilenceTimer();
        return;
      }

      if (!heardSpeech || silenceTimer !== null) {
        return;
      }

      silenceTimer = setTimeout(() => {
        silenceTimer = null;
        onSpeechEnded();
      }, SPEECH_END_SILENCE_MS);
    },
    stop() {
      heardSpeech = false;
      clearSilenceTimer();
    },
  };
}
