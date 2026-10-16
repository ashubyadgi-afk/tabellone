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

  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean | string }>>(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '${tableName}'
    ) AS "exists"`
  );
  const value = rows[0]?.exists;
  return value === true || value === "t" || value === "true";
}

/** Deletes related rows; no-ops when the table is missing in production. */
export async function deleteCartItemsForAdSpace(adSpaceId: string): Promise<void> {
  try {
    await prisma.cartItem.deleteMany({ where: { adSpaceId } });
  } catch (error) {
    if (!isMissingCartTable(error)) throw error;
  }
}

export async function deleteWishlistItemsForAdSpace(adSpaceId: string): Promise<void> {
  try {
    await prisma.wishlistItem.deleteMany({ where: { adSpaceId } });
  } catch (error) {
    if (!isMissingPrismaTable(error, "wishlist_items")) throw error;
  }
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
