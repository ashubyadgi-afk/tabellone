import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import { getPricingConfig } from "@/lib/services/pricing.service";

export async function GET() {
  const session = await requireApiRole(["admin"]);
  if (!session) return unauthorized();

  const [
    owners,
    advertisers,
    listings,
    bookingRequests,
    payments,
    listedSpaces,
    pricing,
  ] = await Promise.all([
    prisma.organization.count({ where: { type: "owner" } }),
    prisma.organization.count({ where: { type: "advertiser" } }),
    prisma.marketplaceListing.count({ where: { status: "approved" } }),
    prisma.bookingRequest.count(),
    prisma.payment.count({ where: { status: "completed" } }),
    prisma.adSpace.count({ where: { marketplaceListingStatus: "listed" } }),
    getPricingConfig(),
  ]);

  const revenue = await prisma.payment.aggregate({
    where: { status: "completed" },
    _sum: { amount: true },
  });

  return NextResponse.json({
    stats: {
      owners,
      advertisers,
      approvedListings: listings,
      listedSpaces,
      bookingRequests,
      completedPayments: payments,
      totalRevenue: revenue._sum.amount ?? 0,
      commissionRate: pricing.commissionRate,
    },
  });
}
