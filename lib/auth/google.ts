import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";

const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = ["accounts.google.com", "https://accounts.google.com"];

const jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

const GoogleIdTokenPayloadSchema = z.object({
  email: z.email(),
  email_verified: z.literal(true),
});

/** Verifies signature, issuer, audience, and expiry; parses only the claims this app consumes. */
export async function verifyGoogleIdToken(
  idToken: string,
): Promise<{ email: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: GOOGLE_ISSUERS,
    audience: clientId,
  });

  const { email } = GoogleIdTokenPayloadSchema.parse(payload);
  return { email: email.toLowerCase() };
}
