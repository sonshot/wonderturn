export function DeniedState() {
  return (
    <main className="px-lg py-xl max-[359px]:px-md mx-auto flex min-h-dvh w-full max-w-[42rem] items-center justify-center">
      <div className="gap-md flex w-full max-w-[24rem] flex-col items-center text-center">
        <h1 className="font-reading text-screen-title">
          Not available to this account
        </h1>
        <p className="text-body text-ink-muted">
          You&apos;re signed in, but this account can&apos;t use Wonderturn.
        </p>
      </div>
    </main>
  );
}
