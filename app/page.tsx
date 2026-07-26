import { headers } from "next/headers";

import { isAllowedEmail } from "@/lib/auth/allowlist";
import { auth } from "@/lib/auth/server";
import { DeniedState } from "@/components/denied-state";
import { PracticeScreen } from "@/components/practice-screen";
import { SignInGate } from "@/components/sign-in-gate";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <SignInGate />;
  }

  // P6: re-checked on every request, not only at sign-in.
  if (!isAllowedEmail(session.user.email)) {
    return <DeniedState />;
  }

  return <PracticeScreen />;
}
