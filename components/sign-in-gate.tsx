"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth/client";

export function SignInGate() {
  const [isStarting, setIsStarting] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function signInWithGoogle() {
    setIsStarting(true);
    setHasError(false);

    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
      errorCallbackURL: "/",
    });

    if (error) {
      setHasError(true);
      setIsStarting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[42rem] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm">AI voice practice</p>
      <h1 className="text-2xl font-medium">Ready to practice?</h1>
      <p className="text-base">
        Sign in with your family&apos;s approved Google account to continue.
      </p>
      <button
        type="button"
        className="inline-flex min-h-12 items-center gap-3 rounded border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
        disabled={isStarting}
        onClick={signInWithGoogle}
      >
        <GoogleMark />
        {isStarting ? "Opening Google…" : "Continue with Google"}
      </button>
      {hasError ? (
        <p role="alert" className="text-sm">
          Something went wrong. Try again.
        </p>
      ) : null}
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="size-[18px]">
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.716v2.258h2.909c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.468-.806 5.956-2.18l-2.91-2.258c-.806.54-1.835.86-3.046.86-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.963 10.708A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.281-1.708V4.96H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.04l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.507.454 3.44 1.345l2.581-2.581C13.464.892 11.426 0 9 0A9 9 0 0 0 .956 4.96l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
