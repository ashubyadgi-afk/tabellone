import { NextResponse } from "next/server";
import { getPublicAdSpace } from "@/lib/services/marketplace.service";
import { calculatePricingFromDb } from "@/lib/services/pricing.service";
import { apiError } from "@/lib/api/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const space = await getPublicAdSpace(id);
  if (!space) return apiError("NOT_FOUND", "Ad space not found", 404);

  const pricing = space.basePrice
    ? await calculatePricingFromDb(space.basePrice)
    : null;

  return NextResponse.json({ data: space, pricing });
}
