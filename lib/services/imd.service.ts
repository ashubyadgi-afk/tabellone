import { prisma } from "@/lib/db";
import type { BookingStatus, ImdStatus } from "@prisma/client";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  format,
  max as maxDate,
  min as minDate,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  inactive: "#94a3b8",
  under_maintenance: "#f59e0b",
  draft: "#64748b",
  temporarily_unavailable: "#F06B3B",
};

const TYPE_COLORS = ["#4C4BFF", "#8C47EE", "#F06B3B", "#10b981", "#E647A7", "#f59e0b"];

function overlapCalendarDays(
  rangeStart: Date,
  rangeEnd: Date,
  windowStart: Date,
  windowEnd: Date
): number {
  const start = maxDate([rangeStart, windowStart]);
  const end = minDate([rangeEnd, windowEnd]);
  if (end < start) return 0;
  return differenceInCalendarDays(end, start) + 1;
}

export async function getImdDashboardStats(organizationId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const in30Days = addDays(now, 30);
  const in7Days = addDays(now, 7);
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
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
  const daysInMonth = differenceInCalendarDays(thisMonthEnd, thisMonthStart) + 1;

  const [
    adSpaces,
    upcomingBookings,
    expiringSoon,
    recentClients,
    invoiceSummary,
    recentBookings,
    invoices,
    bookings,
    billingAggs,
    draftBookingsCount,
    draftAdSpacesCount,
    uninvoicedBookings,
    uninvoicedCount,
    upcomingBookingRows,
    occupancyBookings,
    revenueBookings,
    recentInvoices,
  ] = await Promise.all([
    prisma.adSpace.findMany({
      where: { organizationId, imdStatus: { not: "archived" } },
      select: {
        id: true,
        name: true,
        city: true,
        adSpaceType: true,
        imdStatus: true,
        bookings: {
          where: { status: { in: ["confirmed", "active"] } },
          select: { startDate: true, endDate: true },
        },
        _count: { select: { bookings: true } },
      },
    }),
    prisma.booking.count({
      where: {
        organizationId,
        status: { in: ["confirmed", "active"] },
        startDate: { gte: now, lte: in30Days },
      },
    }),
    prisma.booking.count({
      where: {
        organizationId,
        status: { in: ["confirmed", "active"] },
        endDate: { gte: now, lte: in7Days },
      },
    }),
    prisma.client.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.invoice.aggregate({
      where: {
        organizationId,
        issuedAt: { gte: thisMonthStart },
        status: { not: "void" },
      },
      _count: true,
      _sum: { totalAmount: true },
    }),
    prisma.booking.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { adSpace: true, client: true },
    }),
    prisma.invoice.findMany({
      where: { organizationId, issuedAt: { gte: trendStart }, status: { not: "void" } },
      select: { issuedAt: true, totalAmount: true, status: true },
    }),
    prisma.booking.findMany({
      where: { organizationId, createdAt: { gte: trendStart } },
      select: { createdAt: true, status: true, amount: true },
    }),
    Promise.all([
      prisma.invoice.aggregate({
        where: { organizationId, status: { not: "void" } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: {
          organizationId,
          status: { not: "void" },
          issuedAt: { gte: thisMonthStart },
        },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: {
          organizationId,
          status: { not: "void" },
          issuedAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { organizationId, status: "issued" },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: { organizationId, status: "paid" },
        _sum: { totalAmount: true },
        _count: true,
      }),
    ]),
    prisma.booking.count({
      where: { organizationId, status: "draft" },
    }),
    prisma.adSpace.count({
      where: { organizationId, imdStatus: "draft" },
    }),
    prisma.booking.findMany({
      where: {
        organizationId,
        status: { in: ["confirmed", "active"] },
        invoice: null,
      },
      select: {
        id: true,
        amount: true,
        startDate: true,
        endDate: true,
        adSpace: { select: { name: true } },
        client: { select: { name: true } },
      },
      orderBy: { startDate: "asc" },
      take: 8,
    }),
    prisma.booking.count({
      where: {
        organizationId,
        status: { in: ["confirmed", "active"] },
        invoice: null,
      },
    }),
    prisma.booking.findMany({
      where: {
        organizationId,
        status: { in: ["confirmed", "active"] },
        OR: [
          { startDate: { gte: todayStart } },
          { startDate: { lte: todayEnd }, endDate: { gte: todayStart } },
        ],
      },
      select: {
        id: true,
        status: true,
        amount: true,
        startDate: true,
        endDate: true,
        adSpace: { select: { name: true, adSpaceType: true } },
        client: { select: { name: true } },
      },
      orderBy: { startDate: "asc" },
      take: 8,
    }),
    prisma.booking.findMany({
      where: {
        organizationId,
        status: { in: ["confirmed", "active", "completed"] },
        startDate: { lte: thisMonthEnd },
        endDate: { gte: thisMonthStart },
      },
      select: {
        adSpaceId: true,
        startDate: true,
        endDate: true,
        adSpace: { select: { imdStatus: true } },
      },
    }),
    prisma.booking.findMany({
      where: {
        organizationId,
        status: { in: ["confirmed", "active", "completed"] },
      },
      select: {
        amount: true,
        adSpaceId: true,
        clientId: true,
        adSpace: { select: { id: true, name: true, city: true, adSpaceType: true } },
        client: { select: { id: true, name: true } },
        invoice: { select: { totalAmount: true, status: true } },
      },
    }),
    prisma.invoice.findMany({
      where: { organizationId, status: { not: "void" } },
      orderBy: { issuedAt: "desc" },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        status: true,
        issuedAt: true,
        booking: {
          select: {
            client: { select: { name: true } },
            adSpace: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const [
    lifetimeAgg,
    thisMonthAgg,
    lastMonthAgg,
    outstandingAgg,
    paidAgg,
  ] = billingAggs;

  const totalAdSpaces = adSpaces.length;
  const activeAdSpaces = adSpaces.filter((a) => a.imdStatus === "active").length;
  const draftAdSpaces = adSpaces.filter((a) => a.imdStatus === "draft").length;
  const maintenanceAdSpaces = adSpaces.filter(
    (a) => a.imdStatus === "under_maintenance"
  ).length;
  const inactiveAdSpaces = adSpaces.filter(
    (a) => a.imdStatus === "inactive" || a.imdStatus === "under_maintenance"
  ).length;

  const bookedTodayIds = new Set<string>();
  for (const space of adSpaces) {
    for (const b of space.bookings) {
      if (b.startDate <= todayEnd && b.endDate >= todayStart) {
        bookedTodayIds.add(space.id);
      }
    }
  }

  const currentlyBooked = bookedTodayIds.size;
  const available = Math.max(0, activeAdSpaces - currentlyBooked);

  const statusCounts = new Map<string, number>();
  for (const space of adSpaces) {
    statusCounts.set(space.imdStatus, (statusCounts.get(space.imdStatus) ?? 0) + 1);
  }
  const inventoryMix = [...statusCounts.entries()].map(([name, value]) => ({
    name: name.replaceAll("_", " "),
    value,
    color: STATUS_COLORS[name] ?? "#94a3b8",
  }));

  const occupancy = [
    { name: "Booked now", value: currentlyBooked, color: "#F06B3B" },
    { name: "Available", value: available, color: "#4C4BFF" },
  ];

  const typeCounts = new Map<string, number>();
  for (const space of adSpaces) {
    const key = space.adSpaceType || "other";
    typeCounts.set(key, (typeCounts.get(key) ?? 0) + 1);
  }
  const spacesByType = [...typeCounts.entries()]
    .map(([label, value], i) => ({
      label: label.replaceAll("_", " "),
      value,
      color: TYPE_COLORS[i % TYPE_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  const invoiceTrend = months.map((month) => {
    const inMonth = invoices.filter(
      (inv) => inv.issuedAt >= month.start && inv.issuedAt < month.end
    );
    return {
      month: month.short,
      label: month.label,
      amount: inMonth.reduce((sum, inv) => sum + inv.totalAmount, 0),
      count: inMonth.length,
    };
  });

  const bookingTrend = months.map((month) => {
    const inMonth = bookings.filter(
      (b) => b.createdAt >= month.start && b.createdAt < month.end
    );
    return {
      month: month.short,
      label: month.label,
      bookings: inMonth.length,
      amount: inMonth.reduce((sum, b) => sum + (b.amount ?? 0), 0),
    };
  });

  const activeSpaceIds = new Set(
    adSpaces.filter((s) => s.imdStatus === "active").map((s) => s.id)
  );
  let bookedDays = 0;
  for (const b of occupancyBookings) {
    if (!activeSpaceIds.has(b.adSpaceId)) continue;
    bookedDays += overlapCalendarDays(
      b.startDate,
      b.endDate,
      thisMonthStart,
      thisMonthEnd
    );
  }
  const capacityDays = activeAdSpaces * daysInMonth;
  const occupancyPercent =
    capacityDays > 0 ? Math.min(100, Math.round((bookedDays / capacityDays) * 1000) / 10) : 0;

  const revenueBySpace = new Map<
    string,
    { name: string; city: string; revenue: number; bookings: number }
  >();
  const revenueByType = new Map<string, number>();
  const revenueByClient = new Map<string, { name: string; revenue: number }>();

  for (const b of revenueBookings) {
    const amount =
      b.invoice && b.invoice.status !== "void"
        ? b.invoice.totalAmount
        : b.amount ?? 0;
    if (amount <= 0) continue;

    const space = revenueBySpace.get(b.adSpaceId) ?? {
      name: b.adSpace.name,
      city: b.adSpace.city ?? "—",
      revenue: 0,
      bookings: 0,
    };
    space.revenue += amount;
    space.bookings += 1;
    revenueBySpace.set(b.adSpaceId, space);

    const typeKey = b.adSpace.adSpaceType || "other";
    revenueByType.set(typeKey, (revenueByType.get(typeKey) ?? 0) + amount);

    const client = revenueByClient.get(b.clientId) ?? {
      name: b.client.name,
      revenue: 0,
    };
    client.revenue += amount;
    revenueByClient.set(b.clientId, client);
  }

  const topSpaces = [...revenueBySpace.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map((row) => ({
      name: row.name,
      bookings: row.bookings,
      revenue: row.revenue,
      city: row.city,
    }));

  // Fallback: if no revenue yet, show by booking count (keeps chart useful)
  const topSpacesFallback =
    topSpaces.length > 0
      ? topSpaces
      : [...adSpaces]
          .sort((a, b) => b._count.bookings - a._count.bookings)
          .slice(0, 6)
          .map((space) => ({
            name: space.name,
            bookings: space._count.bookings,
            revenue: 0,
            city: space.city ?? "—",
          }))
          .filter((row) => row.bookings > 0);

  const revenueByTypeChart = [...revenueByType.entries()]
    .map(([label, value], i) => ({
      label: label.replaceAll("_", " "),
      value,
      color: TYPE_COLORS[i % TYPE_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const revenueByClientChart = [...revenueByClient.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map((row, i) => ({
      label: row.name,
      value: row.revenue,
      color: TYPE_COLORS[i % TYPE_COLORS.length],
    }));

  const lifetimeInvoiced = lifetimeAgg._sum.totalAmount ?? 0;
  const invoicedThisMonth = thisMonthAgg._sum.totalAmount ?? 0;
  const invoicedLastMonth = lastMonthAgg._sum.totalAmount ?? 0;
  const momDelta =
    invoicedLastMonth > 0
      ? Math.round(((invoicedThisMonth - invoicedLastMonth) / invoicedLastMonth) * 1000) / 10
      : invoicedThisMonth > 0
        ? 100
        : 0;

  const idleActiveSpaces = adSpaces.filter((space) => {
    if (space.imdStatus !== "active") return false;
    return !space.bookings.some(
      (b) => b.endDate >= todayStart && b.startDate <= addDays(todayStart, 30)
    );
  });

  const alerts: Array<{ id: string; tone: "amber" | "rose" | "slate"; title: string; href: string }> =
    [];
  if ((outstandingAgg._count ?? 0) > 0) {
    alerts.push({
      id: "outstanding",
      tone: "amber",
      title: `${outstandingAgg._count} unpaid invoice${outstandingAgg._count === 1 ? "" : "s"} (${formatAmountShort(outstandingAgg._sum.totalAmount ?? 0)})`,
      href: "/owner/imd/invoices",
    });
  }
  if (expiringSoon > 0) {
    alerts.push({
      id: "expiring",
      tone: "rose",
      title: `${expiringSoon} booking${expiringSoon === 1 ? "" : "s"} ending within 7 days`,
      href: "/owner/imd/bookings",
    });
  }
  if (idleActiveSpaces.length > 0) {
    alerts.push({
      id: "idle",
      tone: "slate",
      title: `${idleActiveSpaces.length} active space${idleActiveSpaces.length === 1 ? "" : "s"} with no booking in the next 30 days`,
      href: "/owner/imd/ad-spaces?filter=available",
    });
  }
  if (uninvoicedCount > 0) {
    alerts.push({
      id: "uninvoiced",
      tone: "amber",
      title: `${uninvoicedCount} confirmed booking${uninvoicedCount === 1 ? "" : "s"} waiting for an invoice`,
      href: "/owner/imd/invoices",
    });
  }

  const activity: Array<{
    id: string;
    kind: "booking" | "invoice";
    title: string;
    subtitle: string;
    at: Date;
    href: string;
  }> = [
    ...recentBookings.map((b) => ({
      id: `booking-${b.id}`,
      kind: "booking" as const,
      title: `Booking · ${b.adSpace.name}`,
      subtitle: `${b.client.name} · ${b.status}`,
      at: b.createdAt,
      href: "/owner/imd/bookings",
    })),
    ...recentInvoices.map((inv) => ({
      id: `invoice-${inv.id}`,
      kind: "invoice" as const,
      title: `Invoice · ${inv.invoiceNumber}`,
      subtitle: `${inv.booking.client.name} · ${inv.status}`,
      at: inv.issuedAt,
      href: `/owner/imd/invoices/${inv.id}`,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  return {
    totalAdSpaces,
    activeAdSpaces,
    inactiveAdSpaces,
    draftAdSpaces,
    maintenanceAdSpaces,
    currentlyBooked,
    available,
    upcomingBookings,
    expiringSoon,
    recentClients,
    recentBookings,
    invoicesThisMonth: invoiceSummary._count,
    invoiceTotalThisMonth: invoiceSummary._sum.totalAmount ?? 0,
    billing: {
      lifetimeInvoiced,
      invoicedThisMonth,
      invoicedLastMonth,
      momDelta,
      outstandingAmount: outstandingAgg._sum.totalAmount ?? 0,
      outstandingCount: outstandingAgg._count ?? 0,
      paidAmount: paidAgg._sum.totalAmount ?? 0,
      paidCount: paidAgg._count ?? 0,
    },
    occupancyPercent,
    workQueue: {
      draftBookings: draftBookingsCount,
      draftAdSpaces: draftAdSpacesCount,
      uninvoiced: uninvoicedCount,
      uninvoicedItems: uninvoicedBookings,
    },
    upcomingBookingRows,
    recentInvoices,
    alerts,
    activity,
    charts: {
      inventoryMix,
      occupancy,
      spacesByType,
      invoiceTrend,
      bookingTrend,
      topSpaces: topSpacesFallback,
      revenueByType: revenueByTypeChart,
      revenueByClient: revenueByClientChart,
    },
  };
}

function formatAmountShort(value: number) {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)}Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${Math.round(value / 1_000)}K`;
  return `₹${Math.round(value)}`;
}

export function datesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 <= end2 && end1 >= start2;
}

export async function checkBookingConflict(
  organizationId: string,
  adSpaceId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string
) {
  const conflicts = await prisma.booking.findMany({
    where: {
      organizationId,
      adSpaceId,
      status: { in: ["confirmed", "active"] },
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
    },
  });

  return conflicts.some((b) =>
    datesOverlap(startDate, endDate, b.startDate, b.endDate)
  );
}

export async function generateInvoiceNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${organizationId.slice(0, 8).toUpperCase()}-${year}`;
  const count = await prisma.invoice.count({
    where: {
      organizationId,
      invoiceNumber: { startsWith: prefix },
    },
  });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

export type AdSpaceListFilter = "all" | "active" | "inactive" | "available";

export function parseAdSpaceListFilter(raw?: string): AdSpaceListFilter {
  if (raw === "active" || raw === "inactive" || raw === "available") return raw;
  return "all";
}

export const AD_SPACE_LIST_COPY: Record<
  AdSpaceListFilter,
  { title: string; description: string; empty: string }
> = {
  all: {
    title: "Ad Spaces",
    description: "Your advertising inventory in IMD",
    empty: "No Ad Spaces yet.",
  },
  active: {
    title: "Active Ad Spaces",
    description: "Spaces currently marked Active",
    empty: "No active Ad Spaces.",
  },
  inactive: {
    title: "Inactive Ad Spaces",
    description: "Spaces marked Inactive or Under Maintenance",
    empty: "No inactive Ad Spaces.",
  },
  available: {
    title: "Available Ad Spaces",
    description: "Active spaces that are not booked today",
    empty: "No available Ad Spaces right now.",
  },
};

function isBookedToday(
  bookings: Array<{ startDate: Date; endDate: Date }>,
  todayStart: Date,
  todayEnd: Date
) {
  return bookings.some((b) => b.startDate <= todayEnd && b.endDate >= todayStart);
}

export async function listOwnerAdSpaces(
  organizationId: string,
  filter: AdSpaceListFilter
) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const items = await prisma.adSpace.findMany({
    where: { organizationId, imdStatus: { not: "archived" } },
    orderBy: { createdAt: "desc" },
    include: {
      bookings: {
        where: { status: { in: ["confirmed", "active"] } },
        select: { id: true, startDate: true, endDate: true },
      },
    },
  });

  return items.filter((space) => {
    const booked = isBookedToday(space.bookings, todayStart, todayEnd);
    if (filter === "active") return space.imdStatus === "active";
    if (filter === "inactive") {
      return space.imdStatus === "inactive" || space.imdStatus === "under_maintenance";
    }
    if (filter === "available") return space.imdStatus === "active" && !booked;
    return true;
  });
}

export const IMD_STATUS_LABELS: Record<ImdStatus, string> = {
  draft: "Draft",
  active: "Active",
  inactive: "Inactive",
  under_maintenance: "Under Maintenance",
  temporarily_unavailable: "Temporarily Unavailable",
  archived: "Archived",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};
