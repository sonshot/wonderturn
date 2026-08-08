import { SpeakerIcon } from "@/components/practice/voice-icons";
import { ERROR_RESPONSES } from "@/lib/turn/fixed-responses";
import type { PracticeState } from "@/lib/turn/practice-machine";

export function Transcript({
  onReplay,
  state,
}: {
  onReplay: (audioUrl: string) => void;
  state: PracticeState;
}) {
  const notice =
    state.microphone === "needed"
      ? "I need to hear you to practice. Tap Allow, then choose Allow again when your phone asks."
      : state.microphone === "blocked"
        ? "This page can't use the microphone yet. A grown-up can switch it back on in your browser's settings for this site."
        : null;
  const error =
    state.lifecycle === "error"
      ? state.errorCount > 1
        ? ERROR_RESPONSES.repeated
        : ERROR_RESPONSES.first
      : null;
  const isEmpty =
    state.history.length === 0 &&
    state.interimText === "" &&
    notice === null &&
    error === null;
  const canReplay =
    state.lifecycle === "idle" || state.lifecycle === "speaking";

  if (isEmpty) {
    return (
      <section
        aria-labelledby="empty-transcript-title"
        className="gap-xs px-lg max-[359px]:px-md flex min-h-[120px] flex-1 flex-col justify-center overflow-y-auto pb-[8%]"
      >
        <h2
          id="empty-transcript-title"
          className="font-reading text-section-title"
        >
          Ready when you are
        </h2>
        <p className="text-body text-ink-muted">
          Tap Talk and say what you&apos;d like to practice.
        </p>
      </section>
    );
  }

  return (
    <section className="px-lg py-xl max-[359px]:px-md min-h-[120px] flex-1 overflow-y-auto">
      <ol aria-live="off" className="gap-lg flex flex-col" role="log">
        {state.history.map((entry) => (
          <li
            key={`${entry.turnId}-${entry.role}`}
            className="gap-xxs flex flex-col"
          >
            <span className="text-meta text-ink-muted">
              {entry.role === "user" ? (
                "You"
              ) : (
                <span className="gap-xs inline-flex flex-wrap items-center">
                  AI reply
                  {canReplay ? (
                    <span className="gap-xxs inline-flex items-center font-normal tracking-normal">
                      <span className="[&>svg]:size-4">
                        <SpeakerIcon />
                      </span>
                      Tap to hear again
                    </span>
                  ) : null}
                </span>
              )}
            </span>
            {entry.role === "assistant" && canReplay ? (
              <button
                type="button"
                aria-label={`Hear AI reply again: ${entry.text}`}
                className="font-reading text-transcript text-ink rounded-control focus-visible:ring-focus focus-visible:ring-offset-canvas min-h-12 w-full touch-manipulation text-left focus-visible:ring-3 focus-visible:ring-offset-2 focus-visible:outline-none"
                onClick={() => onReplay(entry.audioUrl)}
              >
                {entry.text}
              </button>
            ) : (
              <p className="font-reading text-transcript text-ink">
                {entry.text}
              </p>
            )}
          </li>
        ))}
        {state.lifecycle === "listening" && state.interimText !== "" ? (
          <li className="gap-xxs flex flex-col">
            <span className="text-meta text-ink-muted">You</span>
            <p className="font-reading text-transcript text-ink">
              {state.interimText}
            </p>
          </li>
        ) : null}
      </ol>
      {notice !== null ? (
        <p className="mt-lg text-body text-ink">{notice}</p>
      ) : null}
      {error !== null ? (
        <p
          className="bg-error-bg text-error-ink rounded-notice mt-lg p-md text-body"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
