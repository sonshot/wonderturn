function readAllowlist(): string[] {
  const raw = process.env.ALLOWED_EMAILS;
  if (!raw) {
    throw new Error("ALLOWED_EMAILS is not configured");
  }
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Checked per request (never cached), so removing an account ends its access. */
export function isAllowedEmail(email: string): boolean {
  return readAllowlist().includes(email.toLowerCase());
}
