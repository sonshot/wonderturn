import { describe, expect, it } from "vitest";
import { matchesHostPattern } from "better-auth";

import {
  OAUTH_PROXY_MAX_AGE_SECONDS,
  parseAuthConfig,
  SESSION_MAX_AGE_SECONDS,
} from "./config";

const validEnvironment = {
  BETTER_AUTH_SECRET: "s".repeat(32),
  OAUTH_PROXY_SECRET: "p".repeat(32),
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
  BETTER_AUTH_PRODUCTION_URL: "https://wonderturn.com",
  BETTER_AUTH_ALLOWED_HOSTS:
    "wonderturn.com, wonderturn-*-sonshot.vercel.app, localhost:3000",
};

describe("parseAuthConfig", () => {
  it("parses the production and project-scoped preview hosts", () => {
    expect(parseAuthConfig(validEnvironment)).toEqual({
      allowedHosts: [
        "wonderturn.com",
        "wonderturn-*-sonshot.vercel.app",
        "localhost:3000",
      ],
      betterAuthSecret: "s".repeat(32),
      googleClientId: "google-client-id",
      googleClientSecret: "google-client-secret",
      oauthProxySecret: "p".repeat(32),
      productionURL: "https://wonderturn.com",
    });
  });

  it("rejects a wildcard that trusts every Vercel project", () => {
    expect(() =>
      parseAuthConfig({
        ...validEnvironment,
        BETTER_AUTH_ALLOWED_HOSTS: "wonderturn.com,*.vercel.app",
      }),
    ).toThrow();
  });

  it("matches current and future branch previews without matching another project", () => {
    const pattern = "wonderturn-*-sonshot.vercel.app";

    expect(
      matchesHostPattern("wonderturn-git-today-sonshot.vercel.app", pattern),
    ).toBe(true);
    expect(
      matchesHostPattern(
        "wonderturn-git-future-branch-sonshot.vercel.app",
        pattern,
      ),
    ).toBe(true);
    expect(
      matchesHostPattern(
        "another-project-git-today-sonshot.vercel.app",
        pattern,
      ),
    ).toBe(false);
  });

  it("requires the production host in the dynamic host allowlist", () => {
    expect(() =>
      parseAuthConfig({
        ...validEnvironment,
        BETTER_AUTH_ALLOWED_HOSTS: "wonderturn-*-sonshot.vercel.app",
      }),
    ).toThrow("must include the production URL host");
  });

  it("requires separate secrets of at least 32 characters", () => {
    expect(() =>
      parseAuthConfig({
        ...validEnvironment,
        OAUTH_PROXY_SECRET: "too-short",
      }),
    ).toThrow();
  });

  it("requires one exact HTTPS production origin", () => {
    expect(() =>
      parseAuthConfig({
        ...validEnvironment,
        BETTER_AUTH_PRODUCTION_URL: "https://wonderturn.com/",
      }),
    ).toThrow("must be an HTTPS origin");
  });
});

describe("auth lifetimes", () => {
  it("keeps a fixed 180-day session and a 30-second proxy payload", () => {
    expect(SESSION_MAX_AGE_SECONDS).toBe(60 * 60 * 24 * 180);
    expect(OAUTH_PROXY_MAX_AGE_SECONDS).toBe(30);
  });
});
