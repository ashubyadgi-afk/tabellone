import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import { submitBookingRequest } from "@/lib/services/booking-request.service";
import { apiError } from "@/lib/api/errors";

export async function GET() {
  const session = await requireApiRole(["advertiser"]);
  if (!session || !session.organizationId) return unauthorized();

  const requests = await prisma.bookingRequest.findMany({
    where: { organizationId: session.organizationId },
    include: {
      adSpace: true,
      campaign: true,
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: requests });
}

export async function POST(request: Request) {
  const session = await requireApiRole(["advertiser"]);
  if (!session || !session.organizationId) return unauthorized();

  const body = await request.json();
  const result = await submitBookingRequest({
    organizationId: session.organizationId,
    adSpaceId: body.adSpaceId,
    campaignId: body.campaignId,
    startDate: new Date(body.startDate),
    endDate: new Date(body.endDate),
    creativeUrl: body.creativeUrl,
    campaignNotes: body.campaignNotes,
  });

  if (result.error) return apiError("VALIDATION_ERROR", result.error, 400);
  return NextResponse.json({ data: result.request });
}
