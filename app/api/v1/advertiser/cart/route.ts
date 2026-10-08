import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import { apiError } from "@/lib/api/errors";
import { countCartItems } from "@/lib/services/cart.service";

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

export async function GET() {
  const session = await requireApiRole(["advertiser"]);
  if (!session || !session.organizationId) return unauthorized();

  try {
    const items = await prisma.cartItem.findMany({
      where: { organizationId: session.organizationId },
      include: { adSpace: { include: { organization: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: items });
  } catch (error) {
    if (isMissingCartTable(error)) {
      return NextResponse.json({ data: [] });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const session = await requireApiRole(["advertiser"]);
  if (!session || !session.organizationId) return unauthorized();

  const { adSpaceId } = await request.json();
  if (!adSpaceId) return apiError("VALIDATION_ERROR", "adSpaceId required", 400);

  const adSpace = await prisma.adSpace.findFirst({
    where: {
      id: adSpaceId,
      marketplaceListingStatus: "listed",
      marketplaceListing: { status: "approved" },
    },
  });
  if (!adSpace) return apiError("NOT_FOUND", "Ad space not found", 404);

  try {
    const item = await prisma.cartItem.upsert({
      where: {
        organizationId_adSpaceId: {
          organizationId: session.organizationId,
          adSpaceId,
        },
      },
      create: {
        organizationId: session.organizationId,
        adSpaceId,
      },
      update: {},
    });

    const count = await countCartItems(session.organizationId);
    return NextResponse.json({ data: item, count });
  } catch (error) {
    if (isMissingCartTable(error)) {
      return apiError(
        "SERVICE_UNAVAILABLE",
        "Cart is not available yet. Production database needs cart_items table (run prisma db push against Neon).",
        503
      );
    }
    throw error;
  }
}

export async function DELETE(request: Request) {
  const session = await requireApiRole(["advertiser"]);
  if (!session || !session.organizationId) return unauthorized();

  const { adSpaceId } = await request.json();
  try {
    await prisma.cartItem.deleteMany({
      where: {
        organizationId: session.organizationId,
        adSpaceId,
      },
    });
    const count = await countCartItems(session.organizationId);
    return NextResponse.json({ ok: true, count });
  } catch (error) {
    if (isMissingCartTable(error)) {
      return NextResponse.json({ ok: true, count: 0 });
    }
    throw error;
  }
}
