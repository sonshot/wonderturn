import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createSpeechEndDetector,
  SPEECH_END_SILENCE_MS,
  SPEECH_LEVEL_THRESHOLD,
} from "./speech-end-detector";

describe("speech end detector", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not finish before speech is heard", () => {
    vi.useFakeTimers();
    const onSpeechEnded = vi.fn();
    const detector = createSpeechEndDetector(onSpeechEnded);

    detector.observe(0);
    vi.advanceTimersByTime(SPEECH_END_SILENCE_MS);

    expect(onSpeechEnded).not.toHaveBeenCalled();
  });

  it("finishes after three seconds of post-speech silence", () => {
    vi.useFakeTimers();
    const onSpeechEnded = vi.fn();
    const detector = createSpeechEndDetector(onSpeechEnded);

    detector.observe(SPEECH_LEVEL_THRESHOLD);
    detector.observe(0);
    vi.advanceTimersByTime(SPEECH_END_SILENCE_MS - 1);
    expect(onSpeechEnded).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onSpeechEnded).toHaveBeenCalledOnce();
  });

  it("restarts the silence window when speech resumes", () => {
    vi.useFakeTimers();
    const onSpeechEnded = vi.fn();
    const detector = createSpeechEndDetector(onSpeechEnded);

    detector.observe(SPEECH_LEVEL_THRESHOLD);
    detector.observe(0);
    vi.advanceTimersByTime(2_000);
    detector.observe(SPEECH_LEVEL_THRESHOLD);
    detector.observe(0);
    vi.advanceTimersByTime(2_000);
    expect(onSpeechEnded).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1_000);
    expect(onSpeechEnded).toHaveBeenCalledOnce();
  });

  it("stops a pending silence window", () => {
    vi.useFakeTimers();
    const onSpeechEnded = vi.fn();
    const detector = createSpeechEndDetector(onSpeechEnded);

    detector.observe(SPEECH_LEVEL_THRESHOLD);
    detector.observe(0);
    detector.stop();
    vi.advanceTimersByTime(SPEECH_END_SILENCE_MS);

    expect(onSpeechEnded).not.toHaveBeenCalled();
  });
});
