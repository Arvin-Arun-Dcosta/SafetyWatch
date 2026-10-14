/**
 * Canonical public URL of the site, without a trailing slash. Used for
 * metadata, robots.txt and the sitemap, and as the default auth base URL.
 *
 * NEXT_PUBLIC_ variables are inlined at build time, so changing the value
 * needs a new build.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production" ? "https://safetywatch.arvin.life" : "http://localhost:3000")
).replace(/\/+$/, "");

export const SITE_NAME = "SafetyWatch";
export const SITE_DESCRIPTION = "A platform for reporting and managing crime incidents";
