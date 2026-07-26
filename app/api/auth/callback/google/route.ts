import { NextResponse, type NextRequest } from "next/server";

import { isAllowedEmail } from "@/lib/auth/allowlist";
import { verifyGoogleIdToken } from "@/lib/auth/google";
import {
  issueSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session";

const CSRF_COOKIE_NAME = "g_csrf_token";

function toSignIn(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete(CSRF_COOKIE_NAME);
  return response;
}

/**
 * Google Identity Services' redirect UX mode POSTs here with the ID token
 * and its CSRF pair: the value it wrote to the `g_csrf_token` cookie on our
 * origin, repeated in the body. See
 * https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData();
  const credential = formData.get("credential");
  const bodyCsrfToken = formData.get("g_csrf_token");
  const cookieCsrfToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (
    typeof credential !== "string" ||
    typeof bodyCsrfToken !== "string" ||
    !cookieCsrfToken ||
    bodyCsrfToken !== cookieCsrfToken
  ) {
    return toSignIn(request);
  }

  let email: string;
  try {
    ({ email } = await verifyGoogleIdToken(credential));
  } catch {
    return toSignIn(request);
  }

  if (!isAllowedEmail(email)) {
    const denied = NextResponse.redirect(new URL("/denied", request.url));
    denied.cookies.delete(CSRF_COOKIE_NAME);
    return denied;
  }

  const token = await issueSessionToken(email);
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  response.cookies.delete(CSRF_COOKIE_NAME);
  return response;
}
