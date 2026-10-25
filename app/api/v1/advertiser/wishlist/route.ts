import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import { apiError } from "@/lib/api/errors";

export async function GET() {
  const session = await requireApiRole(["advertiser"]);
  if (!session || !session.organizationId) return unauthorized();

  const items = await prisma.wishlistItem.findMany({
    where: { organizationId: session.organizationId },
    include: { adSpace: { include: { organization: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: items });
}

export async function POST(request: Request) {
  const session = await requireApiRole(["advertiser"]);
  if (!session || !session.organizationId) return unauthorized();

  const { adSpaceId } = await request.json();
  if (!adSpaceId) return apiError("VALIDATION_ERROR", "adSpaceId required", 400);

  const item = await prisma.wishlistItem.upsert({
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

  const count = await prisma.wishlistItem.count({
    where: { organizationId: session.organizationId },
  });
  return NextResponse.json({ data: item, count });
}

export async function DELETE(request: Request) {
  const session = await requireApiRole(["advertiser"]);
  if (!session || !session.organizationId) return unauthorized();

  const { adSpaceId } = await request.json();
  await prisma.wishlistItem.deleteMany({
    where: {
      organizationId: session.organizationId,
      adSpaceId,
    },
  });

  const count = await prisma.wishlistItem.count({
    where: { organizationId: session.organizationId },
  });
  return NextResponse.json({ ok: true, count });
}
