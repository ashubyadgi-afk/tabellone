import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import { reviewMarketplaceListing } from "@/lib/services/listing-review.service";
import { apiError } from "@/lib/api/errors";

export async function GET() {
  const session = await requireApiRole(["admin"]);
  if (!session) return unauthorized();

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
  if (typeof id !== "string" || !id) {
    return apiError("VALIDATION_ERROR", "Listing is required", 400);
  }

  const result = await reviewMarketplaceListing({
    id,
    action,
    reason,
    actorUserId: session.userId,
  });
  if (result.error === "NOT_FOUND") {
    return apiError("NOT_FOUND", "Listing not found", 404);
  }
  if (result.error === "ALREADY_REVIEWED") {
    return apiError("CONFLICT", "This listing is no longer waiting for review", 409);
  }

  return NextResponse.json({ data: result.listing });
}
