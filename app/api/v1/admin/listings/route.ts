import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import { createNotification } from "@/lib/services/notification.service";
import { queueAdSpacesAwaitingReview } from "@/lib/services/listing-review.service";
import { apiError } from "@/lib/api/errors";

export async function GET() {
  const session = await requireApiRole(["admin"]);
  if (!session) return unauthorized();

  await queueAdSpacesAwaitingReview();

  const listings = await prisma.marketplaceListing.findMany({
    where: { status: { in: ["submitted", "under_review"] } },
    include: {
      adSpace: { include: { organization: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({ data: listings });
}

export async function PATCH(request: Request) {
  const session = await requireApiRole(["admin"]);
  if (!session) return unauthorized();

  const { id, action, reviewNotes } = await request.json();
  const reason = typeof reviewNotes === "string" ? reviewNotes.trim() : "";
  if (action !== "approve" && action !== "reject") {
    return apiError("VALIDATION_ERROR", "Choose approve or reject", 400);
  }
  if (!reason) {
    return apiError("VALIDATION_ERROR", "Reason is required", 400);
  }

  const listing = await prisma.marketplaceListing.findUnique({
    where: { id },
    include: { adSpace: true },
  });
  if (!listing) return apiError("NOT_FOUND", "Listing not found", 404);

  const status = action === "approve" ? "approved" : "rejected";

  const updated = await prisma.$transaction(async (tx) => {
    const l = await tx.marketplaceListing.update({
      where: { id },
      data: {
        status,
        reviewNotes: reason,
        reviewedAt: new Date(),
        reviewedById: session.userId,
      },
    });

    await tx.adSpace.update({
      where: { id: listing.adSpaceId },
      data: {
        marketplaceListingStatus: action === "approve" ? "listed" : "not_listed",
      },
    });

    return l;
  });

  await createNotification({
    organizationId: listing.adSpace.organizationId,
    type: action === "approve" ? "approval" : "rejection",
    title: action === "approve" ? "Listing approved" : "Listing rejected",
    message: `Your listing for ${listing.adSpace.name} has been ${action === "approve" ? "approved and is now public" : "rejected"}. Reason: ${reason}`,
    link: "/owner/marketplace",
  });

  return NextResponse.json({ data: updated });
}
