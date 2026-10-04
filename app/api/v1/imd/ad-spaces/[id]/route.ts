import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  adSpacePhotos,
  isAllowedAdSpacePhotoUrl,
} from "@/lib/ad-space-photos";
import { parseDimensions, requiresAdSpaceDimensions } from "@/lib/marketplace/search";
import { submitAdSpaceForReview } from "@/lib/services/listing-review.service";

const storedPhotoUrl = z.string().min(1);

const schema = z.object({
  adSpaceNumber: z.string().min(1),
  name: z.string().min(1),
  adSpaceType: z.string().default("billboard"),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  dimensions: z.string().optional(),
  basePrice: z.number().optional().nullable(),
  footfall: z.number().int().optional().nullable(),
  peakHours: z.string().optional(),
  notes: z.string().optional(),
  availableFrom: z.string().optional().nullable(),
  availableTo: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  photoUrls: z.array(storedPhotoUrl).max(3).default([]),
  imdStatus: z
    .enum([
      "draft",
      "active",
      "inactive",
      "under_maintenance",
      "temporarily_unavailable",
      "archived",
    ])
    .optional(),
});

async function getOwned(id: string, organizationId: string) {
  return prisma.adSpace.findFirst({
    where: { id, organizationId },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await params;
  const item = await getOwned(id, session.organizationId);
  if (!item) {
    return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwned(id, session.organizationId);
  if (!existing) {
    return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          message: parsed.error.errors[0]?.message || "Validation failed",
          details: parsed.error.errors,
        },
      },
      { status: 400 }
    );
  }

  const alreadyStored = adSpacePhotos(existing);
  const photoUrls = parsed.data.photoUrls ?? [];
  if (photoUrls.some((url) => !isAllowedAdSpacePhotoUrl(url, alreadyStored))) {
    return NextResponse.json(
      { error: { message: "Invalid photo URL" } },
      { status: 400 }
    );
  }

  if (
    requiresAdSpaceDimensions(parsed.data.adSpaceType) &&
    !parseDimensions(parsed.data.dimensions)
  ) {
    return NextResponse.json(
      { error: { message: "Width and height are required" } },
      { status: 400 }
    );
  }

  const nextStatus = parsed.data.imdStatus ?? existing.imdStatus;
  if (nextStatus !== "draft" && photoUrls.length < 1) {
    return NextResponse.json(
      { error: { message: "Cover photo is required" } },
      { status: 400 }
    );
  }

  try {
    const { availableFrom, availableTo, photoUrls: urls, ...rest } = parsed.data;
    const adSpace = await prisma.adSpace.update({
      where: { id },
      data: {
        ...rest,
        photoUrl: urls[0] ?? null,
        photoUrls: urls,
        city: rest.city || null,
        state: rest.state || null,
        address: rest.address || null,
        dimensions: rest.dimensions || null,
        peakHours: rest.peakHours || null,
        notes: rest.notes || null,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableTo: availableTo ? new Date(availableTo) : null,
      },
    });
    if (adSpace.imdStatus !== "draft") {
      await submitAdSpaceForReview(adSpace);
    }
    return NextResponse.json(adSpace);
  } catch {
    return NextResponse.json(
      { error: { message: "Ad space number already exists" } },
      { status: 409 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.organizationId) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwned(id, session.organizationId);
  if (!existing) {
    return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const requests = await tx.bookingRequest.findMany({
        where: { adSpaceId: id },
        select: { id: true },
      });
      const requestIds = requests.map((request) => request.id);
      if (requestIds.length > 0) {
        await tx.payment.deleteMany({ where: { bookingRequestId: { in: requestIds } } });
        await tx.bookingRequest.deleteMany({ where: { adSpaceId: id } });
      }

      const bookings = await tx.booking.findMany({
        where: { adSpaceId: id },
        select: { id: true },
      });
      const bookingIds = bookings.map((booking) => booking.id);
      if (bookingIds.length > 0) {
        await tx.invoice.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await tx.booking.deleteMany({ where: { adSpaceId: id } });
      }

      await tx.wishlistItem.deleteMany({ where: { adSpaceId: id } });
      await tx.cartItem.deleteMany({ where: { adSpaceId: id } });
      await tx.marketplaceListing.deleteMany({ where: { adSpaceId: id } });
      await tx.adSpace.delete({ where: { id } });
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: { message: "Could not delete this ad space." } },
      { status: 500 }
    );
  }
}
