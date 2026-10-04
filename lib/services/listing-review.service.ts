import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/services/notification.service";

type ReviewableAdSpace = {
  id: string;
  name: string;
  imdStatus: string;
};

/** Owner-saved ad spaces (anything other than a draft) wait for admin approve/reject. */
export async function submitAdSpaceForReview(adSpace: ReviewableAdSpace) {
  if (adSpace.imdStatus === "draft") return null;

  const existing = await prisma.marketplaceListing.findUnique({
    where: { adSpaceId: adSpace.id },
  });
  if (existing && existing.status !== "draft") return existing;

  const listing = await prisma.marketplaceListing.upsert({
    where: { adSpaceId: adSpace.id },
    create: {
      adSpaceId: adSpace.id,
      title: adSpace.name,
      status: "submitted",
      submittedAt: new Date(),
    },
    update: {
      title: adSpace.name,
      status: "submitted",
      submittedAt: new Date(),
    },
  });

  await createNotification({
    type: "listing",
    title: "New ad space submitted",
    message: `${adSpace.name} is waiting for admin approval.`,
    link: "/admin/listings",
  });

  return listing;
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
