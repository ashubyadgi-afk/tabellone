import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import {
  ensureListingReviewHistory,
  submitMarketplaceListing,
} from "@/lib/services/listing-review.service";
import { apiError } from "@/lib/api/errors";

const eventsInclude = {
  orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
  include: {
    actor: { select: { email: true, role: true } },
  },
};

export async function GET() {
  const session = await requireApiRole(["owner"]);
  if (!session || !session.organizationId) return unauthorized();

  const listings = await prisma.marketplaceListing.findMany({
    where: { adSpace: { organizationId: session.organizationId } },
    include: { adSpace: true, events: eventsInclude },
    orderBy: { updatedAt: "desc" },
  });

  const missingHistory = listings.filter((listing) => listing.events.length === 0);
  if (missingHistory.length > 0) {
    await Promise.all(missingHistory.map((listing) => ensureListingReviewHistory(listing)));
    const refreshed = await prisma.marketplaceListing.findMany({
      where: { adSpace: { organizationId: session.organizationId } },
      include: { adSpace: true, events: eventsInclude },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ data: refreshed });
  }

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

  const listing = await submitMarketplaceListing({
    adSpaceId: adSpace.id,
    title: body.title || adSpace.name,
    description: body.description,
    ownershipType: body.ownershipType,
    documentNotes: body.documentNotes,
    actorUserId: session.userId,
  });

  return NextResponse.json({ data: listing });
}
