import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import { reviewBookingRequest } from "@/lib/services/booking-request.service";
import { apiError } from "@/lib/api/errors";

export async function GET() {
  const session = await requireApiRole(["admin"]);
  if (!session) return unauthorized();

  const requests = await prisma.bookingRequest.findMany({
    where: { status: { in: ["submitted", "under_review"] } },
    include: {
      adSpace: { include: { organization: true } },
      organization: true,
      campaign: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({ data: requests });
}

export async function PATCH(request: Request) {
  const session = await requireApiRole(["admin"]);
  if (!session) return unauthorized();

  const { id, action, reviewNotes } = await request.json();
  if (!id || !action) return apiError("VALIDATION_ERROR", "id and action required", 400);

  const result = await reviewBookingRequest(id, action, reviewNotes);
  if (result.error) return apiError("VALIDATION_ERROR", result.error, 400);

  return NextResponse.json({ data: result.request });
}
