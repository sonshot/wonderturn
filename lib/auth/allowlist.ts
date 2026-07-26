import { z } from "zod";

const allowedEmailsSchema = z
  .string()
  .trim()
  .min(1)
  .transform((raw) =>
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
  .pipe(z.array(z.email()).min(1));

function readAllowlist(): string[] {
  return allowedEmailsSchema.parse(process.env.ALLOWED_EMAILS);
}

/** Checked per request (never cached), so removing an account ends its access. */
export function isAllowedEmail(email: string): boolean {
  return readAllowlist().includes(email.toLowerCase());
}
