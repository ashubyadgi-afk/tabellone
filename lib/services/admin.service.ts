import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";

const OPEN_REQUEST_STATUSES = ["submitted", "under_review"] as const;
const COMMISSION_STATUSES = [
  "approved",
  "payment_pending",
  "paid",
  "confirmed",
] as const;
const COMPLETED_REQUEST_STATUSES = ["paid", "confirmed"] as const;
const CANCELLED_REQUEST_STATUSES = ["cancelled", "rejected", "expired"] as const;

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

/** Extended admin KPI board — Phase-1-safe remaps of marketplace admin metrics. */
export async function getAdminKpiBoard() {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const trendStart = startOfMonth(subMonths(now, 5));
  const months = Array.from({ length: 6 }, (_, i) => {
    const start = startOfMonth(addMonths(trendStart, i));
    return {
      key: format(start, "yyyy-MM"),
      label: format(start, "MMM yyyy"),
      short: format(start, "MMM"),
      start,
      end: startOfMonth(addMonths(start, 1)),
    };
  });

  const [
    gmvAgg,
    commissionAgg,
    activeUsers,
    newOwnersThisMonth,
    newAdvertisersThisMonth,
    activeOwners,
    activeAdvertisers,
    inactiveOwners,
    inactiveAdvertisers,
    newBookingsThisMonth,
    completedBookings,
    cancelledBookings,
    totalBookingsEver,
    bookingValueAgg,
    paymentsCompleted,
    paymentsFailed,
    paymentsRefunded,
    paymentsPending,
    settlementPending,
    rejectedListings,
    approvedListings,
    totalListings,
    listedSpaces,
    occupiedListed,
    openConcerns,
    pendingListings,
    pendingRequests,
    pendingOwnerKyc,
    pendingAdvertiserKyc,
    trendRequests,
    trendPayments,
    recentPayments,
    topAdvertiserRows,
    topPublisherSpaces,
    bookingCityRows,
  ] = await Promise.all([
    prisma.bookingRequest.aggregate({
      where: { status: { in: [...COMMISSION_STATUSES] } },
      _sum: { customerPrice: true, commissionAmount: true, ownerPayout: true },
      _count: true,
    }),
    prisma.bookingRequest.aggregate({
      where: { status: { in: [...COMMISSION_STATUSES] } },
      _sum: { commissionAmount: true, customerPrice: true },
    }),
    prisma.user.count({ where: { status: "active", role: { in: ["owner", "advertiser"] } } }),
    prisma.organization.count({
      where: { type: "owner", createdAt: { gte: thisMonthStart, lte: thisMonthEnd } },
    }),
    prisma.organization.count({
      where: { type: "advertiser", createdAt: { gte: thisMonthStart, lte: thisMonthEnd } },
    }),
    prisma.organization.count({ where: { type: "owner", status: "active" } }),
    prisma.organization.count({ where: { type: "advertiser", status: "active" } }),
    prisma.organization.count({ where: { type: "owner", status: { not: "active" } } }),
    prisma.organization.count({ where: { type: "advertiser", status: { not: "active" } } }),
    prisma.bookingRequest.count({
      where: { createdAt: { gte: thisMonthStart, lte: thisMonthEnd } },
    }),
    prisma.bookingRequest.count({
      where: { status: { in: [...COMPLETED_REQUEST_STATUSES] } },
    }),
    prisma.bookingRequest.count({
      where: { status: { in: [...CANCELLED_REQUEST_STATUSES] } },
    }),
    prisma.bookingRequest.count(),
    prisma.bookingRequest.aggregate({
      where: { status: { in: [...COMMISSION_STATUSES] } },
      _avg: { customerPrice: true },
      _sum: { customerPrice: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { status: "completed" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.count({ where: { status: "failed" } }),
    prisma.payment.count({ where: { status: "refunded" } }),
    prisma.payment.count({ where: { status: { in: ["pending", "processing"] } } }),
    prisma.bookingRequest.count({ where: { status: "payment_pending" } }),
    prisma.marketplaceListing.count({ where: { status: "rejected" } }),
    prisma.marketplaceListing.count({ where: { status: "approved" } }),
    prisma.marketplaceListing.count(),
    prisma.adSpace.count({ where: { marketplaceListingStatus: "listed" } }),
    prisma.adSpace.count({
      where: {
        marketplaceListingStatus: "listed",
        bookings: {
          some: {
            status: { in: ["confirmed", "active"] },
            startDate: { lte: now },
            endDate: { gte: now },
          },
        },
      },
    }),
    prisma.concern.count({ where: { status: { in: ["open", "in_review"] } } }),
    prisma.marketplaceListing.count({
      where: { status: { in: ["submitted", "under_review"] } },
    }),
    prisma.bookingRequest.count({
      where: { status: { in: [...OPEN_REQUEST_STATUSES] } },
    }),
    prisma.ownerProfile.count({ where: { verificationStatus: { not: "approved" } } }),
    prisma.advertiserProfile.count({
      where: { verificationStatus: { not: "approved" } },
    }),
    prisma.bookingRequest.findMany({
      where: {
        createdAt: { gte: trendStart },
        status: { in: [...COMMISSION_STATUSES] },
      },
      select: {
        createdAt: true,
        customerPrice: true,
        commissionAmount: true,
        ownerPayout: true,
      },
    }),
    prisma.payment.findMany({
      where: { status: "completed", paidAt: { gte: trendStart } },
      select: { paidAt: true, amount: true },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        amount: true,
        method: true,
        status: true,
        paidAt: true,
        createdAt: true,
        organization: { select: { id: true, name: true } },
        bookingRequest: {
          select: {
            id: true,
            status: true,
            adSpace: {
              select: {
                name: true,
                organization: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.bookingRequest.groupBy({
      by: ["organizationId"],
      where: { status: { in: [...COMMISSION_STATUSES] } },
      _sum: { customerPrice: true, commissionAmount: true },
      _count: { id: true },
      orderBy: { _sum: { customerPrice: "desc" } },
      take: 6,
    }),
    prisma.adSpace.findMany({
      where: { organization: { type: "owner" } },
      select: {
        organizationId: true,
        marketplaceListingStatus: true,
        organization: { select: { id: true, name: true } },
        bookingRequests: {
          where: { status: { in: [...COMMISSION_STATUSES] } },
          select: { ownerPayout: true, customerPrice: true },
        },
      },
    }),
    prisma.bookingRequest.findMany({
      where: { status: { in: [...COMMISSION_STATUSES] } },
      select: {
        customerPrice: true,
        adSpace: { select: { city: true } },
      },
    }),
  ]);

  const gmv = gmvAgg._sum.customerPrice ?? 0;
  const platformCommission = commissionAgg._sum.commissionAmount ?? 0;
  const takeRate = gmv > 0 ? Math.round((platformCommission / gmv) * 1000) / 10 : 0;
  const cancellationRate =
    totalBookingsEver > 0
      ? Math.round((cancelledBookings / totalBookingsEver) * 1000) / 10
      : 0;
  const averageOrderValue = bookingValueAgg._avg.customerPrice ?? 0;
  const fillRate =
    listedSpaces > 0
      ? Math.round((occupiedListed / listedSpaces) * 1000) / 10
      : 0;

  const revenueTrend = months.map((month) => {
    const reqs = trendRequests.filter(
      (r) => r.createdAt >= month.start && r.createdAt < month.end
    );
    const pays = trendPayments.filter(
      (p) => p.paidAt && p.paidAt >= month.start && p.paidAt < month.end
    );
    return {
      month: month.short,
      label: month.label,
      gmv: reqs.reduce((sum, r) => sum + (r.customerPrice ?? 0), 0),
      commission: reqs.reduce((sum, r) => sum + (r.commissionAmount ?? 0), 0),
      payouts: reqs.reduce((sum, r) => sum + (r.ownerPayout ?? 0), 0),
      collected: pays.reduce((sum, p) => sum + p.amount, 0),
    };
  });

  const advertiserIds = topAdvertiserRows.map((r) => r.organizationId);
  const advertiserOrgs = advertiserIds.length
    ? await prisma.organization.findMany({
        where: { id: { in: advertiserIds } },
        select: { id: true, name: true },
      })
    : [];
  const advertiserName = new Map(advertiserOrgs.map((o) => [o.id, o.name]));

  const topAdvertisers = topAdvertiserRows.map((row) => {
    const spend = row._sum.customerPrice ?? 0;
    const bookings = row._count.id;
    return {
      id: row.organizationId,
      name: advertiserName.get(row.organizationId) ?? "Advertiser",
      spend,
      bookings,
      commission: row._sum.commissionAmount ?? 0,
      repeatRate: bookings > 1 ? Math.round(((bookings - 1) / bookings) * 1000) / 10 : 0,
    };
  });

  const publisherMap = new Map<
    string,
    { id: string; name: string; inventory: number; listed: number; revenue: number }
  >();
  for (const space of topPublisherSpaces) {
    const row = publisherMap.get(space.organizationId) ?? {
      id: space.organization.id,
      name: space.organization.name,
      inventory: 0,
      listed: 0,
      revenue: 0,
    };
    row.inventory += 1;
    if (space.marketplaceListingStatus === "listed") row.listed += 1;
    row.revenue += space.bookingRequests.reduce((sum, br) => sum + (br.ownerPayout ?? 0), 0);
    publisherMap.set(space.organizationId, row);
  }
  const topPublishers = [...publisherMap.values()]
    .map((row) => ({
      ...row,
      fillRate: row.listed > 0 ? Math.round((row.listed / row.inventory) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const cityRevenue = new Map<string, { revenue: number; bookings: number }>();
  for (const row of bookingCityRows) {
    const city = row.adSpace.city?.trim() || "Unspecified";
    const cur = cityRevenue.get(city) ?? { revenue: 0, bookings: 0 };
    cur.revenue += row.customerPrice ?? 0;
    cur.bookings += 1;
    cityRevenue.set(city, cur);
  }
  const geographic = [...cityRevenue.entries()]
    .map(([label, v]) => ({ label, value: v.revenue, bookings: v.bookings }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const alerts: Array<{ id: string; title: string; href: string }> = [];
  if (paymentsFailed > 0) {
    alerts.push({
      id: "pay-fail",
      title: `${paymentsFailed} failed payment${paymentsFailed === 1 ? "" : "s"}`,
      href: "/admin/booking-requests",
    });
  }
  if (pendingOwnerKyc + pendingAdvertiserKyc > 0) {
    alerts.push({
      id: "kyc",
      title: `${pendingOwnerKyc + pendingAdvertiserKyc} KYC / verification pending`,
      href: "/admin/owners",
    });
  }
  if (openConcerns > 0) {
    alerts.push({
      id: "concerns",
      title: `${openConcerns} open quer${openConcerns === 1 ? "y" : "ies"} / disputes`,
      href: "/admin/queries",
    });
  }
  if (rejectedListings > 0) {
    alerts.push({
      id: "rejected",
      title: `${rejectedListings} rejected listing${rejectedListings === 1 ? "" : "s"}`,
      href: "/admin/listings",
    });
  }
  if (settlementPending > 0) {
    alerts.push({
      id: "settle",
      title: `${settlementPending} booking${settlementPending === 1 ? "" : "s"} awaiting payment`,
      href: "/admin/booking-requests",
    });
  }

  return {
    business: {
      gmv,
      netRevenue: platformCommission,
      platformCommission,
      takeRate,
      activeUsers,
      ownerPayoutBooked: gmvAgg._sum.ownerPayout ?? 0,
      pricedBookings: gmvAgg._count,
    },
    users: {
      newAdvertisers: newAdvertisersThisMonth,
      newPublishers: newOwnersThisMonth,
      activeAdvertisers,
      activePublishers: activeOwners,
      churned: inactiveOwners + inactiveAdvertisers,
    },
    bookings: {
      newThisMonth: newBookingsThisMonth,
      completed: completedBookings,
      cancelled: cancelledBookings,
      cancellationRate,
      averageOrderValue,
    },
    payments: {
      successfulAmount: paymentsCompleted._sum.amount ?? 0,
      successfulCount: paymentsCompleted._count,
      failed: paymentsFailed,
      refunds: paymentsRefunded,
      pending: paymentsPending,
      settlementPending,
    },
    inventory: {
      totalListings,
      approved: approvedListings,
      rejected: rejectedListings,
      available: Math.max(0, listedSpaces - occupiedListed),
      listed: listedSpaces,
      fillRate,
    },
    moderation: {
      pendingListings,
      pendingRequests,
      openConcerns,
      pendingKyc: pendingOwnerKyc + pendingAdvertiserKyc,
    },
    revenueTrend,
    geographic,
    alerts,
    topAdvertisers,
    topPublishers,
    recentTransactions: recentPayments.map((p) => ({
      id: p.id,
      bookingId: p.bookingRequest.id,
      advertiser: p.organization.name,
      advertiserId: p.organization.id,
      publisher: p.bookingRequest.adSpace.organization.name,
      publisherId: p.bookingRequest.adSpace.organization.id,
      spaceName: p.bookingRequest.adSpace.name,
      amount: p.amount,
      status: p.status,
      method: p.method,
      at: p.paidAt ?? p.createdAt,
    })),
  };
}

export async function listOwnerOrganizations(options?: {
  q?: string;
  take?: number;
}) {
  const orgs = await prisma.organization.findMany({
    where: { type: "owner", ...orgSearchWhere(options?.q) },
    orderBy: { createdAt: "desc" },
    take: options?.take ?? 100,
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
    take: options?.take ?? 100,
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
