import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

/**
 * Better Auth server instance: email/password and Google sign-in, sessions
 * stored in PostgreSQL.
 *
 * Roles: `role` is a server-owned field (`input: false`), so it cannot be set
 * through sign-up, the Google profile or the update-user endpoint. The only
 * way to become an admin is the seed script (see prisma/seed.ts).
 *
 * Account linking keeps Better Auth's defaults: a Google sign-in is only
 * linked to an existing account whose email is already verified, which stops
 * someone from pre-registering another person's address with a password.
 */
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: ["USER", "ADMIN"],
        required: false,
        defaultValue: "USER",
        input: false,
      },
    },
  },
  rateLimit: {
    // Enabled in production by default. Counters live in the database so the
    // limits hold across serverless instances.
    storage: "database",
  },
});
