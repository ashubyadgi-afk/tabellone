import type { ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/services/notification.service";

type ReviewableAdSpace = {
  id: string;
  name: string;
  imdStatus: string;
};

type ListingSnapshot = {
  id: string;
  status: ListingStatus;
  reviewNotes: string | null;
  reviewedAt: Date | null;
  reviewedById: string | null;
  submittedAt: Date | null;
};

const listingEventsInclude = {
  orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
  include: {
    actor: { select: { email: true, role: true } },
  },
} satisfies Prisma.ListingReviewEventFindManyArgs;

export const adminListingInclude = {
  adSpace: { include: { organization: true } },
  events: listingEventsInclude,
} satisfies Prisma.MarketplaceListingInclude;

const OPEN_LISTING_STATUSES: ListingStatus[] = ["submitted", "under_review"];

/** Keep a decision that was stored only on the listing, before review history existed. */
export async function ensureListingReviewHistory(listing: ListingSnapshot | null) {
  if (!listing) return;
  const count = await prisma.listingReviewEvent.count({
    where: { listingId: listing.id },
  });
  if (count > 0) return;

  if (listing.submittedAt) {
    await prisma.listingReviewEvent.create({
      data: {
        listingId: listing.id,
        action: "submitted",
        createdAt: listing.submittedAt,
      },
    });
  }

  if (
    (listing.status === "approved" || listing.status === "rejected") &&
    (listing.reviewNotes || listing.reviewedAt)
  ) {
    await prisma.listingReviewEvent.create({
      data: {
        listingId: listing.id,
        action: listing.status,
        reason: listing.reviewNotes,
        actorUserId: listing.reviewedById,
        createdAt: listing.reviewedAt ?? listing.submittedAt ?? new Date(),
      },
    });
  }
}

export async function submitMarketplaceListing(input: {
  adSpaceId: string;
  title: string;
  description?: string | null;
  ownershipType?: string | null;
  documentNotes?: string | null;
  actorUserId?: string | null;
}) {
  const existing = await prisma.marketplaceListing.findUnique({
    where: { adSpaceId: input.adSpaceId },
  });
  if (
    existing &&
    existing.status !== "draft" &&
    existing.status !== "rejected"
  ) {
    return existing;
  }

  await ensureListingReviewHistory(existing);

  const listing = await prisma.marketplaceListing.upsert({
    where: { adSpaceId: input.adSpaceId },
    create: {
      adSpaceId: input.adSpaceId,
      title: input.title,
      description: input.description,
      ownershipType: input.ownershipType,
      documentNotes: input.documentNotes,
      status: "submitted",
      submittedAt: new Date(),
    },
    update: {
      title: input.title,
      description: input.description,
      ownershipType: input.ownershipType,
      documentNotes: input.documentNotes,
      status: "submitted",
      submittedAt: new Date(),
      reviewNotes: null,
      reviewedAt: null,
      reviewedById: null,
    },
  });

  await prisma.listingReviewEvent.create({
    data: {
      listingId: listing.id,
      action: existing?.status === "rejected" ? "resubmitted" : "submitted",
      actorUserId: input.actorUserId ?? null,
    },
  });

  await createNotification({
    type: "listing",
    title:
      existing?.status === "rejected"
        ? "Listing resubmitted"
        : "New listing submitted",
    message:
      existing?.status === "rejected"
        ? `${input.title} was corrected and resubmitted for admin review.`
        : `Listing submitted for ${input.title} — pending admin review.`,
    link: `/admin/listings/${listing.id}`,
  });

  return listing;
}

/** Owner-saved ad spaces (anything other than a draft) wait for admin approve/reject. */
export async function submitAdSpaceForReview(
  adSpace: ReviewableAdSpace,
  actorUserId?: string | null
) {
  if (adSpace.imdStatus === "draft") return null;

  return submitMarketplaceListing({
    adSpaceId: adSpace.id,
    title: adSpace.name,
    actorUserId,
  });
}

/** Catch ad spaces saved before review was queued automatically. */
export async function queueAdSpacesAwaitingReview() {
  const spaces = await prisma.adSpace.findMany({
    where: {
      imdStatus: { not: "draft" },
      marketplaceListing: { is: null },
    },
    select: { id: true, name: true, imdStatus: true },
  });

  for (const space of spaces) {
    await submitAdSpaceForReview(space);
  }
}

export async function getAdminListing(id: string) {
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id },
    include: adminListingInclude,
  });
  if (!listing) return null;
  if (listing.events.length > 0) return listing;

  await ensureListingReviewHistory(listing);
  return prisma.marketplaceListing.findUnique({
    where: { id },
    include: adminListingInclude,
  });
}

export async function reviewMarketplaceListing(input: {
  id: string;
  action: "approve" | "reject";
  reason: string;
  actorUserId: string;
}) {
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: input.id },
    include: { adSpace: true, events: { select: { id: true } } },
  });
  if (!listing) return { error: "NOT_FOUND" as const };
  if (!OPEN_LISTING_STATUSES.includes(listing.status)) {
    return { error: "ALREADY_REVIEWED" as const };
  }

  if (listing.events.length === 0) {
    await ensureListingReviewHistory(listing);
  }

  const status = input.action === "approve" ? "approved" : "rejected";
  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.marketplaceListing.update({
      where: { id: listing.id },
      data: {
        status,
        reviewNotes: input.reason,
        reviewedAt: new Date(),
        reviewedById: input.actorUserId,
      },
    });

    await tx.adSpace.update({
      where: { id: listing.adSpaceId },
      data: {
        marketplaceListingStatus:
          input.action === "approve" ? "listed" : "not_listed",
      },
    });

    await tx.listingReviewEvent.create({
      data: {
        listingId: listing.id,
        action: status,
        reason: input.reason,
        actorUserId: input.actorUserId,
      },
    });

    return saved;
  });

  await createNotification({
    organizationId: listing.adSpace.organizationId,
    type: input.action === "approve" ? "approval" : "rejection",
    title: input.action === "approve" ? "Listing approved" : "Listing rejected",
    message: `Your listing for ${listing.adSpace.name} has been ${
      input.action === "approve"
        ? "approved and is now public"
        : "rejected"
    }. Reason: ${input.reason}`,
    link: "/owner/marketplace",
  });

  return { listing: updated };
}
