import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import { processPayment } from "@/lib/services/booking-request.service";
import { apiError } from "@/lib/api/errors";

export async function POST(request: Request) {
  const session = await requireApiRole(["advertiser"]);
  if (!session || !session.organizationId) return unauthorized();

  const { bookingRequestId, method } = await request.json();
  const result = await processPayment(
    bookingRequestId,
    session.organizationId,
    method || "upi"
  );

  if (result.error) return apiError("VALIDATION_ERROR", result.error, 400);
  return NextResponse.json({ data: result.payment });
}
