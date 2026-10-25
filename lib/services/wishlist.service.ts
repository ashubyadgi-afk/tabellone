import { prisma } from "@/lib/db";
import { isMissingPrismaTable } from "@/lib/db-tables";

function isMissingWishlistTable(error: unknown) {
  return isMissingPrismaTable(error, "wishlist_items");
}

export async function listWishlistAdSpaceIds(organizationId: string): Promise<string[]> {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { organizationId },
      select: { adSpaceId: true },
    });
    return items.map((item) => item.adSpaceId);
  } catch (error) {
    if (isMissingWishlistTable(error)) return [];
    throw error;
  }
}

export async function countWishlistItems(organizationId: string): Promise<number> {
  try {
    return await prisma.wishlistItem.count({ where: { organizationId } });
  } catch (error) {
    if (isMissingWishlistTable(error)) return 0;
    throw error;
  }
}
