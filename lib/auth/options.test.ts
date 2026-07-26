import { describe, expect, it } from "vitest";

import type { AuthConfig } from "./config";
import { OAUTH_PROXY_MAX_AGE_SECONDS, SESSION_MAX_AGE_SECONDS } from "./config";
import { createBetterAuthOptions } from "./options";

const config: AuthConfig = {
  allowedHosts: [
    "wonderturn.vercel.app",
    "wonderturn-*-daohoangson.vercel.app",
    "localhost:3000",
  ],
  betterAuthSecret: "s".repeat(32),
  googleClientId: "google-client-id",
  googleClientSecret: "google-client-secret",
  oauthProxySecret: "p".repeat(32),
  productionURL: "https://wonderturn.vercel.app",
};

describe("createBetterAuthOptions", () => {
  it("uses a fixed encrypted stateless session", () => {
    const options = createBetterAuthOptions(config);

    expect(options).not.toHaveProperty("database");
    expect(options.session).toMatchObject({
      expiresIn: SESSION_MAX_AGE_SECONDS,
      disableSessionRefresh: true,
      cookieCache: {
        enabled: true,
        maxAge: SESSION_MAX_AGE_SECONDS,
        strategy: "jwe",
        refreshCache: false,
      },
    });
    expect(options.account).toMatchObject({
      storeStateStrategy: "cookie",
      storeAccountCookie: true,
    });
  });

  it("pins Google and the production OAuth proxy contract", () => {
    const options = createBetterAuthOptions(config);

    expect(options.baseURL).toEqual({
      allowedHosts: config.allowedHosts,
      protocol: "auto",
    });
    expect(options.socialProviders?.google).toMatchObject({
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
      prompt: "select_account",
      mapProfileToUser: expect.any(Function),
    });
    expect(options.plugins).toHaveLength(1);
    expect(options.plugins?.[0]).toMatchObject({
      id: "oauth-proxy",
      options: {
        productionURL: config.productionURL,
        secret: config.oauthProxySecret,
        maxAge: OAUTH_PROXY_MAX_AGE_SECONDS,
      },
    });
  });
});
