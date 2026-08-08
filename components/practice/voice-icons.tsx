export function LevelMeter({ level }: { level: number }) {
  const heights = [0.35, 0.7, 1, 0.55];

  return (
    <span
      aria-hidden="true"
      className="gap-xxs flex h-6 items-end motion-reduce:items-center"
    >
      {heights.map((weight, index) => (
        <span
          key={index}
          className="bg-ink-muted w-0.5 rounded-full transition-[height] duration-100 motion-reduce:h-1! motion-reduce:transition-none"
          style={{ height: `${4 + level * weight * 20}px` }}
        />
      ))}
    </span>
  );
}

export function ReadyIcon() {
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

export function MicrophoneIcon() {
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

export function StopIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="currentColor"
    >
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  );
}

export function SpeakerIcon() {
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
      <path d="M5 10v4h4l5 4V6l-5 4H5Z" />
      <path d="M17 9a4 4 0 0 1 0 6" />
    </svg>
  );
}
