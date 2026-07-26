import Script from "next/script";

/**
 * Renders Google Identity Services' own "Sign in with Google" button via its
 * codeless HTML API (redirect UX mode), so branding is provider-owned rather
 * than a hand-built stand-in. It posts an ID token straight to
 * /api/auth/callback/google.
 */
export function SignInGate() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[42rem] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm">AI voice practice</p>
      <h1 className="text-2xl font-medium">Ready to practice?</h1>
      <p className="text-base">
        Sign in with your family&apos;s approved Google account to continue.
      </p>
      <div
        id="g_id_onload"
        data-client_id={clientId}
        data-login_uri="/api/auth/callback/google"
        data-ux_mode="redirect"
      />
      <div className="g_id_signin" data-type="standard" />
      <Script src="https://accounts.google.com/gsi/client" async defer />
    </main>
  );
}
