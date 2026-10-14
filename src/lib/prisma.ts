import "server-only";

import { setDefaultAutoSelectFamilyAttemptTimeout } from "node:net";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

// Node gives each resolved address only 250 ms to connect before moving on to
// the next. A database in a distant region can need longer, which surfaces as
// ETIMEDOUT on new connections, so allow a full second per address.
setDefaultAutoSelectFamilyAttemptTimeout(1000);

// One client per server process. In development the module is re-evaluated on
// every hot reload, so the instance is parked on globalThis to avoid opening a
// new connection pool each time.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
