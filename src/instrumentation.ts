/**
 * Runs once when the server starts (`next dev` and `next start`). Checking
 * the environment here turns a missing or malformed variable into a startup
 * failure instead of an error on the first request that needs it.
 * `next build` hits the same check when it loads the routes.
 */
export async function register() {
  // Node-only code lives in its own module so it is never bundled for the
  // Edge runtime.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { checkEnvironment } = await import("./instrumentation-node");
    await checkEnvironment();
  }
}
