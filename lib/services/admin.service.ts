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
  ] = await Promise.all([
    prisma.organization.count({ where: { type: "owner" } }),
    prisma.organization.count({ where: { type: "advertiser" } }),
    prisma.adSpace.count(),
    prisma.adSpace.count({ where: { marketplaceListingStatus: "listed" } }),
    prisma.adSpace.count({ where: { imdStatus: "active" } }),
  ]);

  const [
    campaigns,
    openBookingRequests,
    approvedListings,
    pendingListings,
    pendingRequests,
  ] = await Promise.all([
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
  ]);

  const [
    pendingOwnerVerification,
    pendingAdvertiserVerification,
    revenue,
    cityRows,
  ] = await Promise.all([
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

/** Extended admin KPI board — few bulk queries, compute in memory (Neon pool-safe). */
export async function getAdminKpiBoard() {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
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

  // Batch 1 — core rows (max 4 concurrent)
  const [bookingRequests, payments, organizations, adSpaces] = await Promise.all([
    prisma.bookingRequest.findMany({
      select: {
        id: true,
        organizationId: true,
        status: true,
        createdAt: true,
        customerPrice: true,
        commissionAmount: true,
        ownerPayout: true,
        adSpace: {
          select: {
            name: true,
            city: true,
            organizationId: true,
            organization: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.payment.findMany({
      select: {
        id: true,
        amount: true,
        status: true,
        method: true,
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
    prisma.organization.findMany({
      select: { id: true, name: true, type: true, status: true, createdAt: true },
    }),
    prisma.adSpace.findMany({
      select: {
        organizationId: true,
        marketplaceListingStatus: true,
        imdStatus: true,
        city: true,
        organization: { select: { id: true, name: true, type: true } },
        bookings: {
          where: {
            status: { in: ["confirmed", "active"] },
            startDate: { lte: now },
            endDate: { gte: now },
          },
          select: { id: true },
          take: 1,
        },
      },
    }),
  ]);

  // Batch 2 — small counts
  const [activeUsers, openConcerns, pendingOwnerKyc, pendingAdvertiserKyc, listingGroups] =
    await Promise.all([
      prisma.user.count({
        where: { status: "active", role: { in: ["owner", "advertiser"] } },
      }),
      prisma.concern.count({ where: { status: { in: ["open", "in_review"] } } }),
      prisma.ownerProfile.count({ where: { verificationStatus: { not: "approved" } } }),
      prisma.advertiserProfile.count({
        where: { verificationStatus: { not: "approved" } },
      }),
      prisma.marketplaceListing.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

  const priced = bookingRequests.filter((r) =>
    (COMMISSION_STATUSES as readonly string[]).includes(r.status)
  );
  const gmv = priced.reduce((sum, r) => sum + (r.customerPrice ?? 0), 0);
  const platformCommission = priced.reduce((sum, r) => sum + (r.commissionAmount ?? 0), 0);
  const ownerPayoutBooked = priced.reduce((sum, r) => sum + (r.ownerPayout ?? 0), 0);
  const takeRate = gmv > 0 ? Math.round((platformCommission / gmv) * 1000) / 10 : 0;

  const completedBookings = bookingRequests.filter((r) =>
    (COMPLETED_REQUEST_STATUSES as readonly string[]).includes(r.status)
  ).length;
  const cancelledBookings = bookingRequests.filter((r) =>
    (CANCELLED_REQUEST_STATUSES as readonly string[]).includes(r.status)
  ).length;
  const totalBookingsEver = bookingRequests.length;
  const cancellationRate =
    totalBookingsEver > 0
      ? Math.round((cancelledBookings / totalBookingsEver) * 1000) / 10
      : 0;
  const newBookingsThisMonth = bookingRequests.filter(
    (r) => r.createdAt >= thisMonthStart && r.createdAt <= thisMonthEnd
  ).length;
  const averageOrderValue =
    priced.length > 0
      ? priced.reduce((sum, r) => sum + (r.customerPrice ?? 0), 0) / priced.length
      : 0;
  const settlementPending = bookingRequests.filter((r) => r.status === "payment_pending").length;
  const pendingRequests = bookingRequests.filter((r) =>
    (OPEN_REQUEST_STATUSES as readonly string[]).includes(r.status)
  ).length;

  const completedPays = payments.filter((p) => p.status === "completed");
  const paymentsFailed = payments.filter((p) => p.status === "failed").length;
  const paymentsRefunded = payments.filter((p) => p.status === "refunded").length;
  const paymentsPending = payments.filter((p) =>
    ["pending", "processing"].includes(p.status)
  ).length;

  const listingCount = (status: string) =>
    listingGroups.find((g) => g.status === status)?._count._all ?? 0;
  const totalListings = listingGroups.reduce((sum, g) => sum + g._count._all, 0);
  const approvedListings = listingCount("approved");
  const rejectedListings = listingCount("rejected");
  const pendingListings =
    listingCount("submitted") + listingCount("under_review");

  const listedSpaces = adSpaces.filter((s) => s.marketplaceListingStatus === "listed").length;
  const occupiedListed = adSpaces.filter(
    (s) => s.marketplaceListingStatus === "listed" && s.bookings.length > 0
  ).length;
  const fillRate =
    listedSpaces > 0 ? Math.round((occupiedListed / listedSpaces) * 1000) / 10 : 0;

  const owners = organizations.filter((o) => o.type === "owner");
  const advertisers = organizations.filter((o) => o.type === "advertiser");
  const newPublishers = owners.filter(
    (o) => o.createdAt >= thisMonthStart && o.createdAt <= thisMonthEnd
  ).length;
  const newAdvertisers = advertisers.filter(
    (o) => o.createdAt >= thisMonthStart && o.createdAt <= thisMonthEnd
  ).length;
  const activePublishers = owners.filter((o) => o.status === "active").length;
  const activeAdvertisers = advertisers.filter((o) => o.status === "active").length;
  const churned =
    owners.filter((o) => o.status !== "active").length +
    advertisers.filter((o) => o.status !== "active").length;

  const revenueTrend = months.map((month) => {
    const reqs = priced.filter(
      (r) => r.createdAt >= month.start && r.createdAt < month.end
    );
    const pays = completedPays.filter((p) => {
      const at = p.paidAt ?? p.createdAt;
      return at >= month.start && at < month.end;
    });
    return {
      month: month.short,
      label: month.label,
      gmv: reqs.reduce((sum, r) => sum + (r.customerPrice ?? 0), 0),
      commission: reqs.reduce((sum, r) => sum + (r.commissionAmount ?? 0), 0),
      payouts: reqs.reduce((sum, r) => sum + (r.ownerPayout ?? 0), 0),
      collected: pays.reduce((sum, p) => sum + p.amount, 0),
    };
  });

  const advertiserSpend = new Map<
    string,
    { spend: number; bookings: number; commission: number }
  >();
  for (const r of priced) {
    const row = advertiserSpend.get(r.organizationId) ?? {
      spend: 0,
      bookings: 0,
      commission: 0,
    };
    row.spend += r.customerPrice ?? 0;
    row.bookings += 1;
    row.commission += r.commissionAmount ?? 0;
    advertiserSpend.set(r.organizationId, row);
  }
  const orgName = new Map(organizations.map((o) => [o.id, o.name]));
  const topAdvertisers = [...advertiserSpend.entries()]
    .map(([id, row]) => ({
      id,
      name: orgName.get(id) ?? "Advertiser",
      spend: row.spend,
      bookings: row.bookings,
      commission: row.commission,
      repeatRate:
        row.bookings > 1
          ? Math.round(((row.bookings - 1) / row.bookings) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 6);

  const publisherMap = new Map<
    string,
    { id: string; name: string; inventory: number; listed: number; revenue: number }
  >();
  for (const space of adSpaces) {
    if (space.organization.type !== "owner") continue;
    const row = publisherMap.get(space.organizationId) ?? {
      id: space.organization.id,
      name: space.organization.name,
      inventory: 0,
      listed: 0,
      revenue: 0,
    };
    row.inventory += 1;
    if (space.marketplaceListingStatus === "listed") row.listed += 1;
    publisherMap.set(space.organizationId, row);
  }
  for (const r of priced) {
    const pubId = r.adSpace.organizationId;
    const row = publisherMap.get(pubId);
    if (row) row.revenue += r.ownerPayout ?? 0;
  }
  const topPublishers = [...publisherMap.values()]
    .map((row) => ({
      ...row,
      fillRate:
        row.inventory > 0 ? Math.round((row.listed / row.inventory) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const cityRevenue = new Map<string, { revenue: number; bookings: number }>();
  for (const r of priced) {
    const city = r.adSpace.city?.trim() || "Unspecified";
    const cur = cityRevenue.get(city) ?? { revenue: 0, bookings: 0 };
    cur.revenue += r.customerPrice ?? 0;
    cur.bookings += 1;
    cityRevenue.set(city, cur);
  }
  const geographic = [...cityRevenue.entries()]
    .map(([label, v]) => ({ label, value: v.revenue, bookings: v.bookings }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const pendingKyc = pendingOwnerKyc + pendingAdvertiserKyc;
  const alerts: Array<{ id: string; title: string; href: string }> = [];
  if (paymentsFailed > 0) {
    alerts.push({
      id: "pay-fail",
      title: `${paymentsFailed} failed payment${paymentsFailed === 1 ? "" : "s"}`,
      href: "/admin/booking-requests",
    });
  }
  if (pendingKyc > 0) {
    alerts.push({
      id: "kyc",
      title: `${pendingKyc} KYC / verification pending`,
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

  const recentPayments = [...payments]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  return {
    business: {
      gmv,
      netRevenue: platformCommission,
      platformCommission,
      takeRate,
      activeUsers,
      ownerPayoutBooked,
      pricedBookings: priced.length,
    },
    users: {
      newAdvertisers,
      newPublishers,
      activeAdvertisers,
      activePublishers,
      churned,
    },
    bookings: {
      newThisMonth: newBookingsThisMonth,
      completed: completedBookings,
      cancelled: cancelledBookings,
      cancellationRate,
      averageOrderValue,
    },
    payments: {
      successfulAmount: completedPays.reduce((sum, p) => sum + p.amount, 0),
      successfulCount: completedPays.length,
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
      pendingKyc,
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
