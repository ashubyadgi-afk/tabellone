import { NextResponse } from "next/server";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import {
  getAdminListing,
  reviewMarketplaceListing,
} from "@/lib/services/listing-review.service";
import { apiError } from "@/lib/api/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiRole(["admin"]);
  if (!session) return unauthorized();

  const { id } = await params;
  const listing = await getAdminListing(id);
  if (!listing) return apiError("NOT_FOUND", "Listing not found", 404);

  return NextResponse.json({ data: listing });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiRole(["admin"]);
  if (!session) return unauthorized();

  const { id } = await params;
  const { action, reviewNotes } = await request.json();
  const reason = typeof reviewNotes === "string" ? reviewNotes.trim() : "";
  if (action !== "approve" && action !== "reject") {
    return apiError("VALIDATION_ERROR", "Choose approve or reject", 400);
  }
  if (!reason) {
    return apiError("VALIDATION_ERROR", "Reason is required", 400);
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

  const listing = await getAdminListing(id);
  return NextResponse.json({ data: listing });
}
