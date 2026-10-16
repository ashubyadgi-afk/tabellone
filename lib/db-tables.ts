import { prisma } from "@/lib/db";

const KNOWN_PUBLIC_TABLES = new Set([
  "ad_spaces",
  "bookings",
  "booking_requests",
  "cart_items",
  "clients",
  "invoices",
  "marketplace_listings",
  "payments",
  "wishlist_items",
]);

/** Safe only for fixed table names from KNOWN_PUBLIC_TABLES. */
export async function publicTableExists(tableName: string): Promise<boolean> {
  if (!KNOWN_PUBLIC_TABLES.has(tableName)) {
    throw new Error(`publicTableExists: unknown table ${tableName}`);
  }

  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '${tableName}'
    ) AS "exists"`
  );
  return Boolean(rows[0]?.exists);
}

export function isMissingPrismaTable(error: unknown, tableName?: string): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  const message =
    "message" in error ? String((error as { message?: string }).message) : "";
  if (code === "P2021" || /does not exist/i.test(message)) {
    if (!tableName) return true;
    return new RegExp(tableName, "i").test(message);
  }
  return false;
}

export function isMissingCartTable(error: unknown): boolean {
  return isMissingPrismaTable(error, "cart_items");
}
