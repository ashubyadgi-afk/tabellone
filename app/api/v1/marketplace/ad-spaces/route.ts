import { NextResponse } from "next/server";
import {
  listPublicAdSpaces,
  marketplaceFiltersFromParams,
} from "@/lib/services/marketplace.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = marketplaceFiltersFromParams({
    type: searchParams.get("type") || undefined,
    city: searchParams.get("city") || undefined,
    state: searchParams.get("state") || undefined,
    location: searchParams.get("location") || undefined,
    size: searchParams.get("size") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    availMonths: searchParams.get("availMonths") || undefined,
    minSize: searchParams.get("minSize") || undefined,
    minRating: searchParams.get("minRating") || undefined,
    minPrice: searchParams.get("minPrice") || undefined,
    maxPrice: searchParams.get("maxPrice") || undefined,
    minFootfall: searchParams.get("minFootfall") || undefined,
    search: searchParams.get("search") || undefined,
    lat: searchParams.get("lat") || undefined,
    lng: searchParams.get("lng") || undefined,
    radiusKm: searchParams.get("radiusKm") || undefined,
  });

  const spaces = await listPublicAdSpaces(filters);
  return NextResponse.json({ data: spaces });
}
