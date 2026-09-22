import { NextResponse } from "next/server";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import { getAdminHqStats, getAdminInsights } from "@/lib/services/admin.service";
import { getPricingConfig } from "@/lib/services/pricing.service";

export async function GET() {
  const session = await requireApiRole(["admin"]);
  if (!session) return unauthorized();

  const [stats, insights, pricing] = await Promise.all([
    getAdminHqStats(),
    getAdminInsights(),
    getPricingConfig(),
  ]);

  return NextResponse.json({
    stats: {
      owners: stats.owners,
      advertisers: stats.advertisers,
      approvedListings: stats.approvedListings,
      listedSpaces: stats.adSpacesListed,
      bookingRequests: stats.openBookingRequests,
      pendingListings: stats.pendingListings,
      pendingRequests: stats.pendingRequests,
      pendingVerifications: stats.pendingVerifications,
      adSpacesTotal: stats.adSpacesTotal,
      campaigns: stats.campaigns,
      citiesWithAdSpaces: stats.citiesWithAdSpaces,
      totalRevenue: stats.totalRevenue,
      commissionRate: pricing.commissionRate,
      insights,
    },
  });
}
