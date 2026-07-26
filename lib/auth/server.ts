import { betterAuth } from "better-auth";

import { readAuthConfig } from "./config";
import { createBetterAuthOptions } from "./options";

export const auth = betterAuth(createBetterAuthOptions(readAuthConfig()));
