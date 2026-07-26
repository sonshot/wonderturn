import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { issueSessionToken, verifySessionToken } from "./session";

describe("session tokens", () => {
  const originalSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.SESSION_SECRET = originalSecret;
  });

  it("round-trips the signed-in email", async () => {
    const token = await issueSessionToken("parent@example.com");
    await expect(verifySessionToken(token)).resolves.toEqual({
      email: "parent@example.com",
    });
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await issueSessionToken("parent@example.com");
    process.env.SESSION_SECRET = "a-different-secret";
    await expect(verifySessionToken(token)).resolves.toBeNull();
  });

  it("rejects a malformed token", async () => {
    await expect(verifySessionToken("not-a-token")).resolves.toBeNull();
  });
});
