import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import { createNotification } from "@/lib/services/notification.service";
import { apiError } from "@/lib/api/errors";

export async function GET() {
  const session = await requireApiRole(["owner"]);
  if (!session || !session.organizationId) return unauthorized();

  const listings = await prisma.marketplaceListing.findMany({
    where: { adSpace: { organizationId: session.organizationId } },
    include: { adSpace: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: listings });
}

export async function POST(request: Request) {
  const session = await requireApiRole(["owner"]);
  if (!session || !session.organizationId) return unauthorized();

  const body = await request.json();
  const adSpace = await prisma.adSpace.findFirst({
    where: { id: body.adSpaceId, organizationId: session.organizationId },
  });
  if (!adSpace) return apiError("NOT_FOUND", "Ad space not found", 404);

  const listing = await prisma.marketplaceListing.upsert({
    where: { adSpaceId: adSpace.id },
    create: {
      adSpaceId: adSpace.id,
      title: body.title || adSpace.name,
      description: body.description,
      ownershipType: body.ownershipType,
      documentNotes: body.documentNotes,
      status: "submitted",
      submittedAt: new Date(),
    },
    update: {
      title: body.title || adSpace.name,
      description: body.description,
      ownershipType: body.ownershipType,
      documentNotes: body.documentNotes,
      status: "submitted",
      submittedAt: new Date(),
      reviewNotes: null,
      reviewedAt: null,
      reviewedById: null,
    },
  });

  await createNotification({
    type: "listing",
    title: "New listing submitted",
    message: `Listing submitted for ${adSpace.name} — pending admin review.`,
    link: "/admin/listings",
  });

  return NextResponse.json({ data: listing });
}
