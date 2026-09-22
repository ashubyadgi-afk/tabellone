import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { isStoredAdSpacePhotoUrl } from "@/lib/ad-space-photos";

const storedPhotoUrl = z
  .string()
  .refine(isStoredAdSpacePhotoUrl, "Invalid photo URL");

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
  photoUrls: z.array(storedPhotoUrl).min(1, "Cover photo is required").max(3),
  imdStatus: z.enum([
    "draft",
    "active",
    "inactive",
    "under_maintenance",
    "temporarily_unavailable",
    "archived",
  ]).optional(),
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

  try {
    const { availableFrom, availableTo, photoUrls, ...rest } = parsed.data;
    const adSpace = await prisma.adSpace.update({
      where: { id },
      data: {
        ...rest,
        photoUrl: photoUrls[0],
        photoUrls,
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
    return NextResponse.json(adSpace);
  } catch {
    return NextResponse.json(
      { error: { message: "Ad space number already exists" } },
      { status: 409 }
    );
  }
}
