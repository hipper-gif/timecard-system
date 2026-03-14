import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForDb = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  adapter: PrismaMariaDb | undefined;
};

function getAdapter() {
  if (globalForDb.adapter) return globalForDb.adapter;

  const url = new URL(process.env.DATABASE_URL!);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    connectionLimit: 3,
    acquireTimeout: 30000,
    idleTimeout: 60,
    minimumIdle: 1,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.adapter = adapter;
  }

  return adapter;
}

export const prisma =
  globalForDb.prisma ??
  new PrismaClient({
    adapter: getAdapter(),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForDb.prisma = prisma;
