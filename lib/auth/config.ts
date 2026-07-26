import { z } from "zod";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
export const OAUTH_PROXY_MAX_AGE_SECONDS = 30;

const secretSchema = z.string().min(32, "must contain at least 32 characters");

const environmentSchema = z.object({
  BETTER_AUTH_SECRET: secretSchema,
  OAUTH_PROXY_SECRET: secretSchema,
  GOOGLE_CLIENT_ID: z.string().trim().min(1),
  GOOGLE_CLIENT_SECRET: z.string().trim().min(1),
  BETTER_AUTH_PRODUCTION_URL: z.url(),
  BETTER_AUTH_ALLOWED_HOSTS: z.string().trim().min(1),
});

const hostPatternSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .refine((host) => !host.includes("://"), "must not include a protocol")
  .refine((host) => !host.includes("/"), "must not include a path")
  .refine((host) => !/\s/.test(host), "must not contain whitespace")
  .refine(
    (host) => host !== "*.vercel.app" && host !== "**.vercel.app",
    "must be scoped to this Vercel project and team",
  );

export type AuthConfig = {
  allowedHosts: string[];
  betterAuthSecret: string;
  googleClientId: string;
  googleClientSecret: string;
  oauthProxySecret: string;
  productionURL: string;
};

export function parseAuthConfig(
  environment: Record<string, string | undefined>,
): AuthConfig {
  const parsed = environmentSchema.parse(environment);
  const productionURL = new URL(parsed.BETTER_AUTH_PRODUCTION_URL);

  if (
    productionURL.origin !== parsed.BETTER_AUTH_PRODUCTION_URL ||
    (productionURL.protocol !== "https:" &&
      productionURL.hostname !== "localhost")
  ) {
    throw new Error(
      "BETTER_AUTH_PRODUCTION_URL must be an HTTPS origin without a trailing slash",
    );
  }

  const allowedHosts = z
    .array(hostPatternSchema)
    .min(1)
    .parse(parsed.BETTER_AUTH_ALLOWED_HOSTS.split(","));

  if (!allowedHosts.includes(productionURL.host.toLowerCase())) {
    throw new Error(
      "BETTER_AUTH_ALLOWED_HOSTS must include the production URL host",
    );
  }

  return {
    allowedHosts,
    betterAuthSecret: parsed.BETTER_AUTH_SECRET,
    googleClientId: parsed.GOOGLE_CLIENT_ID,
    googleClientSecret: parsed.GOOGLE_CLIENT_SECRET,
    oauthProxySecret: parsed.OAUTH_PROXY_SECRET,
    productionURL: productionURL.origin,
  };
}

export function readAuthConfig(): AuthConfig {
  return parseAuthConfig(process.env);
}
