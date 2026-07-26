import type { BetterAuthOptions } from "better-auth";
import { oAuthProxy } from "better-auth/plugins";

import {
  OAUTH_PROXY_MAX_AGE_SECONDS,
  SESSION_MAX_AGE_SECONDS,
  type AuthConfig,
} from "./config";

export function createBetterAuthOptions(config: AuthConfig): BetterAuthOptions {
  return {
    appName: "Wonderturn",
    secret: config.betterAuthSecret,
    baseURL: {
      allowedHosts: config.allowedHosts,
      protocol: "auto",
    },
    socialProviders: {
      google: {
        clientId: config.googleClientId,
        clientSecret: config.googleClientSecret,
        prompt: "select_account",
        mapProfileToUser: () => ({
          name: "",
          image: undefined,
        }),
      },
    },
    session: {
      expiresIn: SESSION_MAX_AGE_SECONDS,
      disableSessionRefresh: true,
      cookieCache: {
        enabled: true,
        maxAge: SESSION_MAX_AGE_SECONDS,
        strategy: "jwe",
        refreshCache: false,
      },
    },
    account: {
      storeStateStrategy: "cookie",
      storeAccountCookie: true,
    },
    advanced: {
      cookiePrefix: "wonderturn",
    },
    plugins: [
      oAuthProxy({
        productionURL: config.productionURL,
        secret: config.oauthProxySecret,
        maxAge: OAUTH_PROXY_MAX_AGE_SECONDS,
      }),
    ],
  };
}
