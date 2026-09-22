import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import { apiError } from "@/lib/api/errors";

export async function GET() {
  const session = await requireApiRole(["advertiser"]);
  if (!session || !session.organizationId) return unauthorized();

  const campaigns = await prisma.campaign.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: campaigns });
}

export async function POST(request: Request) {
  const session = await requireApiRole(["advertiser"]);
  if (!session || !session.organizationId) return unauthorized();

  const body = await request.json();
  if (!body.name) return apiError("VALIDATION_ERROR", "Campaign name required", 400);

  const campaign = await prisma.campaign.create({
    data: {
      organizationId: session.organizationId,
      name: body.name,
      productService: body.productService,
      sector: body.sector,
      targetLocation: body.targetLocation,
      budget: body.budget ? Number(body.budget) : undefined,
      preferredSize: body.preferredSize,
      expectedFootfall: body.expectedFootfall
        ? Number(body.expectedFootfall)
        : undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      creativeUrl: body.creativeUrl,
      notes: body.notes,
    },
  });

  return NextResponse.json({ data: campaign });
}
