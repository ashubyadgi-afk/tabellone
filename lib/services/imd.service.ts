import { prisma } from "@/lib/db";
import type { BookingStatus, ImdStatus } from "@prisma/client";
import {
  addDays,
  addMonths,
  endOfDay,
  format,
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

export async function getImdDashboardStats(organizationId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const in30Days = addDays(now, 30);
  const in7Days = addDays(now, 7);
  const monthStart = startOfMonth(subMonths(now, 5));
  const months = Array.from({ length: 6 }, (_, i) => {
    const start = startOfMonth(addMonths(monthStart, i));
    return {
      key: format(start, "yyyy-MM"),
      label: format(start, "MMM yyyy"),
      short: format(start, "MMM"),
      start,
      end: startOfMonth(addMonths(start, 1)),
    };
  });

  const [adSpaces, upcomingBookings, expiringSoon, recentClients, invoiceSummary, recentBookings, invoices, bookings] =
    await Promise.all([
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
          issuedAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
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
        where: { organizationId, issuedAt: { gte: monthStart } },
        select: { issuedAt: true, totalAmount: true },
      }),
      prisma.booking.findMany({
        where: { organizationId, createdAt: { gte: monthStart } },
        select: { createdAt: true, status: true, amount: true },
      }),
    ]);

  const totalAdSpaces = adSpaces.length;
  const activeAdSpaces = adSpaces.filter((a) => a.imdStatus === "active").length;
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

  const topSpaces = [...adSpaces]
    .sort((a, b) => b._count.bookings - a._count.bookings)
    .slice(0, 6)
    .map((space) => ({
      name: space.name,
      bookings: space._count.bookings,
      city: space.city ?? "—",
    }))
    .filter((row) => row.bookings > 0);

  return {
    totalAdSpaces,
    activeAdSpaces,
    inactiveAdSpaces,
    currentlyBooked,
    available,
    upcomingBookings,
    expiringSoon,
    recentClients,
    recentBookings,
    invoicesThisMonth: invoiceSummary._count,
    invoiceTotalThisMonth: invoiceSummary._sum.totalAmount ?? 0,
    charts: {
      inventoryMix,
      occupancy,
      spacesByType,
      invoiceTrend,
      bookingTrend,
      topSpaces,
    },
  };
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
