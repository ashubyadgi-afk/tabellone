import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Append serverless-friendly query params without parsing the URL.
 * `new URL()` can corrupt Neon passwords that contain special characters.
 */
function databaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;

  const extras: string[] = [];
  if (!/[?&]connection_limit=/.test(raw)) extras.push("connection_limit=1");
  if (!/[?&]connect_timeout=/.test(raw)) extras.push("connect_timeout=10");

  if (!extras.length) return raw;
  return `${raw}${raw.includes("?") ? "&" : "?"}${extras.join("&")}`;
}

function createPrismaClient() {
  const url = databaseUrl();
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(url ? { datasources: { db: { url } } } : {}),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse the client across warm serverless invocations.
globalForPrisma.prisma = prisma;
