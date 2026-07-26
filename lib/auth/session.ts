import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

export const SESSION_COOKIE_NAME = "session";

/** P11 — fixed lifetime from issuance; never extended by activity. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

const SessionPayloadSchema = z.object({ email: z.email() });

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function issueSessionToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("180d")
    .sign(getSecretKey());
}

/** Returns null for a missing, tampered, or expired token — treated as signed out, not an error. */
export async function verifySessionToken(
  token: string,
): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return SessionPayloadSchema.parse(payload);
  } catch {
    return null;
  }
}
