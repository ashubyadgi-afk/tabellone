import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { isStoredAdSpacePhotoUrl } from "@/lib/ad-space-photos";
import { parseDimensions, requiresAdSpaceDimensions } from "@/lib/marketplace/search";
import { submitAdSpaceForReview } from "@/lib/services/listing-review.service";

const storedPhotoUrl = z
  .string()
  .refine(isStoredAdSpacePhotoUrl, "Invalid photo URL");

const schema = z
  .object({
    adSpaceNumber: z.string().min(1),
    name: z.string().min(1),
    adSpaceType: z.string().default("billboard"),
    city: z.string().optional(),
    state: z.string().optional(),
    address: z.string().optional(),
    dimensions: z.string().optional(),
    basePrice: z.number().optional(),
    footfall: z.number().int().optional(),
    peakHours: z.string().optional(),
    notes: z.string().optional(),
    availableFrom: z.string().optional(),
    availableTo: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
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
      .default("active"),
  })
  .superRefine((data, ctx) => {
    if (data.photoUrls.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cover photo is required",
        path: ["photoUrls"],
      });
    }
    if (requiresAdSpaceDimensions(data.adSpaceType) && !parseDimensions(data.dimensions)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Width and height are required",
        path: ["dimensions"],
      });
    }
  });

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });

  const items = await prisma.adSpace.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    include: { bookings: { where: { status: { in: ["confirmed", "active"] } } } },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });

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

  try {
    const { availableFrom, availableTo, photoUrls, ...rest } = parsed.data;
    const adSpace = await prisma.adSpace.create({
      data: {
        ...rest,
        photoUrl: photoUrls[0] ?? null,
        photoUrls,
        organizationId: session.organizationId,
        availableFrom: availableFrom ? new Date(availableFrom) : undefined,
        availableTo: availableTo ? new Date(availableTo) : undefined,
      },
    });
    await submitAdSpaceForReview(adSpace, session.userId);
    return NextResponse.json(adSpace, { status: 201 });
  } catch {
    return NextResponse.json({ error: { message: "Ad space number already exists" } }, { status: 409 });
  }
}
