import { z } from "zod";

import { SITE_URL } from "@/lib/site";

/**
 * Server-side environment variables, validated once at startup.
 *
 * src/instrumentation.ts imports this module when the server starts, so
 * `next dev` and `next start` refuse to run when a required variable is
 * missing or malformed, and `next build` fails when it loads the routes.
 * There are deliberately no fallbacks for secrets.
 *
 * Never import this from a Client Component: none of these are NEXT_PUBLIC_.
 */
const timeZone = z.string().refine(
  (value) => {
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  },
  { error: "must be a valid IANA time zone, e.g. Asia/Kolkata" },
);

const schema = z.object({
  DATABASE_URL: z
    .string({ error: "is required" })
    .regex(/^postgres(ql)?:\/\//, { error: "must be a postgres:// URL" }),
  BETTER_AUTH_SECRET: z
    .string({ error: "is required" })
    .min(32, { error: "must be at least 32 characters (openssl rand -base64 32)" }),
  // Optional override; the auth base URL normally follows NEXT_PUBLIC_SITE_URL.
  BETTER_AUTH_URL: z.url({ error: "must be a URL, e.g. https://safetywatch.arvin.life" }).default(SITE_URL),
  GOOGLE_CLIENT_ID: z.string({ error: "is required" }).min(1, { error: "is required" }),
  GOOGLE_CLIENT_SECRET: z.string({ error: "is required" }).min(1, { error: "is required" }),
  GEMINI_API_KEY: z.string({ error: "is required" }).min(1, { error: "is required" }),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.5-flash-lite"),
  BLOB_READ_WRITE_TOKEN: z.string({ error: "is required" }).min(1, { error: "is required" }),
  APP_TIME_ZONE: timeZone.default("Asia/Kolkata"),
});

function loadEnv() {
  // Treat empty strings (e.g. `KEY=` in an env file) as missing.
  const raw = Object.fromEntries(
    Object.keys(schema.shape).map((key) => [key, process.env[key] || undefined]),
  );
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${problems}\n` +
        "Copy .env.example to .env.local and fill in the missing values.",
    );
  }
  return parsed.data;
}

export const env = loadEnv();
