export function DeniedState() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[42rem] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-medium">Not available to this account</h1>
      <p className="text-base">
        You&apos;re signed in, but this account can&apos;t use Wonderturn.
      </p>
    </main>
  );
}
