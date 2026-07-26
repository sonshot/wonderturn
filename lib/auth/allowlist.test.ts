import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isAllowedEmail } from "./allowlist";

describe("isAllowedEmail", () => {
  const originalAllowedEmails = process.env.ALLOWED_EMAILS;

  beforeEach(() => {
    process.env.ALLOWED_EMAILS = "parent@example.com, Kid@Example.com";
  });

  afterEach(() => {
    process.env.ALLOWED_EMAILS = originalAllowedEmails;
  });

  it("matches an allowlisted email", () => {
    expect(isAllowedEmail("parent@example.com")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isAllowedEmail("kid@example.com")).toBe(true);
  });

  it("rejects an email not on the list", () => {
    expect(isAllowedEmail("stranger@example.com")).toBe(false);
  });

  it("throws when unconfigured", () => {
    delete process.env.ALLOWED_EMAILS;
    expect(() => isAllowedEmail("parent@example.com")).toThrow();
  });
});
