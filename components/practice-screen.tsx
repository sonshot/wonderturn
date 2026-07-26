export function PracticeScreen() {
  return (
    <main className="bg-canvas mx-auto flex min-h-dvh w-full max-w-[42rem] flex-col">
      <PracticeHeader />
      <EmptyTranscript />
      <ControlZone />
    </main>
  );
}

function PracticeHeader() {
  return (
    <header className="gap-md px-lg max-[359px]:px-md flex min-h-16 items-center justify-between pt-[env(safe-area-inset-top)]">
      <h1 className="font-reading text-section-title">Practice</h1>
      <button
        type="button"
        className="rounded-control border-line-strong bg-canvas px-md text-button text-ink focus-visible:ring-focus focus-visible:ring-offset-canvas min-h-12 border py-[14px] focus-visible:ring-3 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Start over
      </button>
    </header>
  );
}

function EmptyTranscript() {
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

function ControlZone() {
  return (
    <section
      aria-label="Talk controls"
      className="bg-plinth px-lg pt-md max-[359px]:px-md flex flex-col items-center pb-[calc(var(--spacing-md)+env(safe-area-inset-bottom))]"
    >
      <p
        aria-live="polite"
        aria-atomic="true"
        className="mb-md gap-xs text-body text-ink-muted inline-flex items-center"
      >
        <ReadyIcon />
        Ready
      </p>
      <TalkControl />
    </section>
  );
}

function TalkControl() {
  return (
    <button
      type="button"
      className="bg-primary p-md text-button text-on-primary after:border-primary-active focus-visible:ring-focus focus-visible:ring-offset-canvas relative inline-flex min-h-[104px] min-w-[104px] touch-manipulation flex-col items-center justify-center rounded-full after:pointer-events-none after:absolute after:inset-[6px] after:rounded-full after:border-[1.5px] focus-visible:ring-3 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <MicrophoneIcon />
      <span className="mt-xxs">Talk</span>
    </button>
  );
}

function ReadyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="7" />
    </svg>
  );
}

function MicrophoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6" />
    </svg>
  );
}
