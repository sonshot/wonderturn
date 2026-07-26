import { cookies } from "next/headers";

import { isAllowedEmail } from "@/lib/auth/allowlist";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { DeniedState } from "@/components/denied-state";
import { SignInGate } from "@/components/sign-in-gate";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return <SignInGate />;
  }

  // P6: re-checked on every request, not only at sign-in.
  if (!isAllowedEmail(session.email)) {
    return <DeniedState />;
  }

  return <main />;
}
