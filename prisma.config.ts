import { defineConfig } from "prisma/config";

// The Prisma CLI does not load .env files on its own (Prisma 7).
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // File is optional.
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection on Neon. Fall back to
    // DATABASE_URL for local Postgres. `prisma generate` needs neither, so
    // this must not throw when both are unset (it runs on postinstall).
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
});
