import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { addMonths, format, startOfMonth, subMonths } from "date-fns";

const OPEN_REQUEST_STATUSES = ["submitted", "under_review"] as const;

export function maskPan(pan?: string | null) {
  const value = pan?.trim();
  if (!value) return null;
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`;
}

function orgSearchWhere(q?: string): Prisma.OrganizationWhereInput {
  const s = q?.trim();
  if (!s) return {};
  return {
    OR: [
      { name: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
      { brandName: { contains: s, mode: "insensitive" } },
      { branchLocation: { contains: s, mode: "insensitive" } },
      { contactPerson: { contains: s, mode: "insensitive" } },
      { contactPhone: { contains: s, mode: "insensitive" } },
      { sector: { contains: s, mode: "insensitive" } },
      { adSpaces: { some: { city: { contains: s, mode: "insensitive" } } } },
    ],
  };
}

function listedCount(
  spaces: { marketplaceListingStatus: string }[]
) {
  return spaces.filter((s) => s.marketplaceListingStatus === "listed").length;
}

export async function getAdminHqStats() {
  const [
    owners,
    advertisers,
    adSpacesTotal,
    adSpacesListed,
    adSpacesImdActive,
    campaigns,
    openBookingRequests,
    approvedListings,
    pendingListings,
    pendingRequests,
    pendingOwnerVerification,
    pendingAdvertiserVerification,
    revenue,
    cityRows,
  ] = await Promise.all([
    prisma.organization.count({ where: { type: "owner" } }),
    prisma.organization.count({ where: { type: "advertiser" } }),
    prisma.adSpace.count(),
    prisma.adSpace.count({ where: { marketplaceListingStatus: "listed" } }),
    prisma.adSpace.count({ where: { imdStatus: "active" } }),
    prisma.campaign.count(),
    prisma.bookingRequest.count({
      where: { status: { in: [...OPEN_REQUEST_STATUSES] } },
    }),
    prisma.marketplaceListing.count({ where: { status: "approved" } }),
    prisma.marketplaceListing.count({
      where: { status: { in: ["submitted", "under_review"] } },
    }),
    prisma.bookingRequest.count({
      where: { status: { in: [...OPEN_REQUEST_STATUSES] } },
    }),
    prisma.ownerProfile.count({
      where: { verificationStatus: { not: "approved" } },
    }),
    prisma.advertiserProfile.count({
      where: { verificationStatus: { not: "approved" } },
    }),
    prisma.payment.aggregate({
      where: { status: "completed" },
      _sum: { amount: true },
    }),
    prisma.adSpace.findMany({
      where: { city: { not: null } },
      distinct: ["city"],
      select: { city: true },
    }),
  ]);

  const citiesWithAdSpaces = cityRows.filter((r) => r.city?.trim()).length;

  return {
    owners,
    advertisers,
    adSpacesTotal,
    adSpacesListed,
    adSpacesImdActive,
    campaigns,
    openBookingRequests,
    approvedListings,
    pendingListings,
    pendingRequests,
    pendingVerifications:
      pendingOwnerVerification + pendingAdvertiserVerification,
    citiesWithAdSpaces,
    totalRevenue: revenue._sum.amount ?? 0,
  };
}

const COMMISSION_STATUSES = [
  "approved",
  "payment_pending",
  "paid",
  "confirmed",
] as const;

export async function getAdminInsights() {
  const monthStart = startOfMonth(subMonths(new Date(), 5));
  const months = Array.from({ length: 6 }, (_, i) => {
    const start = startOfMonth(addMonths(monthStart, i));
    return {
      key: format(start, "yyyy-MM"),
      label: format(start, "MMM yyyy"),
      start,
      end: startOfMonth(addMonths(start, 1)),
    };
  });

  const [orgs, commission, payments, cityGroups, typeGroups] =
    await Promise.all([
      prisma.organization.findMany({
        where: { createdAt: { gte: monthStart } },
        select: { type: true, createdAt: true },
      }),
      prisma.bookingRequest.aggregate({
        where: { status: { in: [...COMMISSION_STATUSES] } },
        _sum: {
          commissionAmount: true,
          gstOnCommission: true,
          ownerPayout: true,
          customerPrice: true,
          tdsAmount: true,
        },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { status: "completed" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.adSpace.groupBy({
        by: ["city"],
        _count: { id: true },
      }),
      prisma.adSpace.groupBy({
        by: ["adSpaceType"],
        _count: { id: true },
      }),
    ]);

  const growth = months.map((month) => {
    const inMonth = orgs.filter(
      (org) => org.createdAt >= month.start && org.createdAt < month.end
    );
    return {
      key: month.key,
      label: month.label,
      owners: inMonth.filter((o) => o.type === "owner").length,
      advertisers: inMonth.filter((o) => o.type === "advertiser").length,
    };
  });

  const popularCities = cityGroups
    .map((row) => ({
      label: row.city?.trim() || "Unspecified",
      value: row._count.id,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const popularTypes = typeGroups
    .map((row) => ({
      label: row.adSpaceType.replaceAll("_", " "),
      value: row._count.id,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return {
    growth,
    commission: {
      bookingCount: commission._count,
      commissionAmount: commission._sum.commissionAmount ?? 0,
      gstOnCommission: commission._sum.gstOnCommission ?? 0,
      tdsAmount: commission._sum.tdsAmount ?? 0,
      ownerPayout: commission._sum.ownerPayout ?? 0,
      customerPrice: commission._sum.customerPrice ?? 0,
      collectedPayments: payments._sum.amount ?? 0,
      completedPaymentCount: payments._count,
    },
    popularCities,
    popularTypes,
  };
}

export async function listOwnerOrganizations(options?: {
  q?: string;
  take?: number;
}) {
  const orgs = await prisma.organization.findMany({
    where: { type: "owner", ...orgSearchWhere(options?.q) },
    orderBy: { createdAt: "desc" },
    take: options?.take,
    include: {
      ownerProfile: true,
      users: { select: { email: true, role: true, status: true } },
      adSpaces: { select: { marketplaceListingStatus: true } },
      _count: { select: { adSpaces: true, bookings: true } },
    },
  });

  return orgs.map((org) => ({
    id: org.id,
    name: org.name,
    brandName: org.brandName,
    email: org.email,
    contactPerson: org.contactPerson,
    contactPhone: org.contactPhone,
    branchLocation: org.branchLocation,
    status: org.status,
    createdAt: org.createdAt,
    verificationStatus: org.ownerProfile?.verificationStatus ?? null,
    userEmails: org.users.map((u) => u.email),
    adSpaceCount: org._count.adSpaces,
    listedCount: listedCount(org.adSpaces),
    bookingCount: org._count.bookings,
  }));
}

export async function listAdvertiserOrganizations(options?: {
  q?: string;
  take?: number;
}) {
  const orgs = await prisma.organization.findMany({
    where: { type: "advertiser", ...orgSearchWhere(options?.q) },
    orderBy: { createdAt: "desc" },
    take: options?.take,
    include: {
      advertiserProfile: true,
      users: { select: { email: true, role: true, status: true } },
      wallet: { select: { balance: true } },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { plan: { select: { name: true, tier: true } } },
      },
      _count: { select: { campaigns: true, bookingRequests: true } },
      bookingRequests: {
        where: { status: { in: [...OPEN_REQUEST_STATUSES] } },
        select: { id: true },
      },
    },
  });

  return orgs.map((org) => {
    const sub = org.subscriptions[0];
    return {
      id: org.id,
      name: org.name,
      sector: org.sector,
      email: org.email,
      contactPerson: org.contactPerson,
      contactPhone: org.contactPhone,
      status: org.status,
      createdAt: org.createdAt,
      verificationStatus: org.advertiserProfile?.verificationStatus ?? null,
      gstNumber: org.advertiserProfile?.gstNumber ?? null,
      panMasked: maskPan(org.advertiserProfile?.panNumber),
      hasGst: Boolean(org.advertiserProfile?.gstNumber?.trim()),
      userEmails: org.users.map((u) => u.email),
      campaignCount: org._count.campaigns,
      bookingRequestCount: org._count.bookingRequests,
      openRequestCount: org.bookingRequests.length,
      walletBalance: org.wallet?.balance ?? null,
      subscriptionStatus: sub?.status ?? null,
      subscriptionPlan: sub?.plan.name ?? null,
    };
  });
}

export async function getOwnerOrganizationDetail(organizationId: string) {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, type: "owner" },
    include: {
      ownerProfile: true,
      users: {
        select: { email: true, role: true, status: true, createdAt: true },
      },
      adSpaces: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          adSpaceNumber: true,
          name: true,
          adSpaceType: true,
          city: true,
          state: true,
          basePrice: true,
          imdStatus: true,
          marketplaceListingStatus: true,
        },
      },
      bookings: {
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          adSpace: { select: { name: true } },
          client: { select: { name: true } },
        },
      },
    },
  });
  if (!org) return null;

  return {
    id: org.id,
    name: org.name,
    brandName: org.brandName,
    email: org.email,
    sector: org.sector,
    contactPerson: org.contactPerson,
    contactPhone: org.contactPhone,
    branchLocation: org.branchLocation,
    status: org.status,
    createdAt: org.createdAt,
    agencyName: org.ownerProfile?.agencyName ?? null,
    officeAddress: org.ownerProfile?.officeAddress ?? null,
    totalAdSpacesClaimed: org.ownerProfile?.totalAdSpacesClaimed ?? null,
    verificationStatus: org.ownerProfile?.verificationStatus ?? null,
    users: org.users,
    adSpaces: org.adSpaces,
    listedCount: listedCount(org.adSpaces),
    bookings: org.bookings,
  };
}

export async function getAdvertiserOrganizationDetail(organizationId: string) {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, type: "advertiser" },
    include: {
      advertiserProfile: true,
      users: {
        select: { email: true, role: true, status: true, createdAt: true },
      },
      wallet: { select: { balance: true } },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { plan: { select: { name: true, tier: true } } },
      },
      campaigns: { orderBy: { createdAt: "desc" } },
      bookingRequests: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          adSpace: { select: { name: true, city: true } },
          campaign: { select: { name: true } },
        },
      },
      _count: { select: { wishlistItems: true } },
    },
  });
  if (!org) return null;

  const sub = org.subscriptions[0];
  return {
    id: org.id,
    name: org.name,
    brandName: org.brandName,
    email: org.email,
    sector: org.sector,
    contactPerson: org.contactPerson,
    contactPhone: org.contactPhone,
    branchLocation: org.branchLocation,
    status: org.status,
    createdAt: org.createdAt,
    panMasked: maskPan(org.advertiserProfile?.panNumber),
    gstNumber: org.advertiserProfile?.gstNumber ?? null,
    verificationStatus: org.advertiserProfile?.verificationStatus ?? null,
    users: org.users,
    walletBalance: org.wallet?.balance ?? null,
    subscriptionStatus: sub?.status ?? null,
    subscriptionPlan: sub?.plan.name ?? null,
    wishlistCount: org._count.wishlistItems,
    campaigns: org.campaigns,
    bookingRequests: org.bookingRequests,
  };
}
