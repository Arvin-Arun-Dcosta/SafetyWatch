export async function checkEnvironment() {
  try {
    await import("@/lib/env");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    // Next.js would otherwise keep a server running that cannot serve anything.
    process.exit(1);
  }
}
