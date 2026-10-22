import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  schemaEnsure?: Promise<void>;
  schemaReady?: boolean;
};

const base =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = base;

const AD_SPACE_COLUMN_SQL = [
  `ALTER TABLE "ad_spaces" ADD COLUMN IF NOT EXISTS "amenities" TEXT`,
  `ALTER TABLE "ad_spaces" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION`,
  `ALTER TABLE "ad_spaces" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION`,
  `ALTER TABLE "ad_spaces" ADD COLUMN IF NOT EXISTS "photo_url" TEXT`,
  `ALTER TABLE "ad_spaces" ADD COLUMN IF NOT EXISTS "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[]`,
  `ALTER TABLE "ad_spaces" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION`,
  `ALTER TABLE "ad_spaces" ADD COLUMN IF NOT EXISTS "available_from" TIMESTAMP(3)`,
  `ALTER TABLE "ad_spaces" ADD COLUMN IF NOT EXISTS "available_to" TIMESTAMP(3)`,
];

const REQUIRED_AD_SPACE_COLUMNS = [
  "amenities",
  "latitude",
  "longitude",
  "photo_url",
  "photo_urls",
  "rating",
  "available_from",
  "available_to",
];

async function ensureSchema() {
  if (globalForPrisma.schemaReady) return;
  if (!globalForPrisma.schemaEnsure) {
    globalForPrisma.schemaEnsure = (async () => {
      const rows = await base.$queryRawUnsafe<Array<{ column_name: string }>>(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'ad_spaces'`
      );
      const have = new Set(rows.map((row) => row.column_name));
      const missing = REQUIRED_AD_SPACE_COLUMNS.filter((column) => !have.has(column));
      if (missing.length) {
        for (const sql of AD_SPACE_COLUMN_SQL) {
          await base.$executeRawUnsafe(sql);
        }
      }
      globalForPrisma.schemaReady = true;
    })().catch((error) => {
      globalForPrisma.schemaEnsure = undefined;
      console.error("ensureSchema failed (continuing):", error);
      globalForPrisma.schemaReady = true;
    });
  }
  await globalForPrisma.schemaEnsure;
}

export const prisma = base.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        await ensureSchema();
        return query(args);
      },
    },
  },
});
