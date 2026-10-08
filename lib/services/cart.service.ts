import { prisma } from "@/lib/db";

function isMissingCartTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  const message =
    "message" in error ? String((error as { message?: string }).message) : "";
  return (
    code === "P2021" ||
    /cart_items/i.test(message) ||
    /does not exist/i.test(message)
  );
}

export async function listCartAdSpaceIds(organizationId: string): Promise<string[]> {
  try {
    const items = await prisma.cartItem.findMany({
      where: { organizationId },
      select: { adSpaceId: true },
    });
    return items.map((item) => item.adSpaceId);
  } catch (error) {
    if (isMissingCartTable(error)) return [];
    throw error;
  }
}

export async function countCartItems(organizationId: string): Promise<number> {
  try {
    return await prisma.cartItem.count({ where: { organizationId } });
  } catch (error) {
    if (isMissingCartTable(error)) return 0;
    throw error;
  }
}

export async function isAdSpaceInCart(
  organizationId: string,
  adSpaceId: string
): Promise<boolean> {
  try {
    const item = await prisma.cartItem.findUnique({
      where: {
        organizationId_adSpaceId: { organizationId, adSpaceId },
      },
      select: { id: true },
    });
    return Boolean(item);
  } catch (error) {
    if (isMissingCartTable(error)) return false;
    throw error;
  }
}
