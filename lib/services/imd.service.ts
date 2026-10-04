import { prisma } from "@/lib/db";
import type { BookingStatus, ImdStatus } from "@prisma/client";
import { addDays, endOfDay, startOfDay, isWithinInterval, parseISO } from "date-fns";

export async function getImdDashboardStats(organizationId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const in30Days = addDays(now, 30);
  const in7Days = addDays(now, 7);

  const adSpaces = await prisma.adSpace.findMany({
    where: { organizationId, imdStatus: { not: "archived" } },
    include: {
      bookings: {
        where: { status: { in: ["confirmed", "active"] } },
      },
    },
  });

  const totalAdSpaces = adSpaces.length;
  const activeAdSpaces = adSpaces.filter((a) => a.imdStatus === "active").length;
  const inactiveAdSpaces = adSpaces.filter(
    (a) => a.imdStatus === "inactive" || a.imdStatus === "under_maintenance"
  ).length;

  const bookedTodayIds = new Set<string>();
  for (const space of adSpaces) {
    for (const b of space.bookings) {
      if (
        b.startDate <= todayEnd &&
        b.endDate >= todayStart
      ) {
        bookedTodayIds.add(space.id);
      }
    }
  }

  const currentlyBooked = bookedTodayIds.size;
  const available = activeAdSpaces - currentlyBooked;

  const upcomingBookings = await prisma.booking.count({
    where: {
      organizationId,
      status: { in: ["confirmed", "active"] },
      startDate: { gte: now, lte: in30Days },
    },
  });

  const expiringSoon = await prisma.booking.count({
    where: {
      organizationId,
      status: { in: ["confirmed", "active"] },
      endDate: { gte: now, lte: in7Days },
    },
  });

  const recentClients = await prisma.client.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const invoiceSummary = await prisma.invoice.aggregate({
    where: {
      organizationId,
      issuedAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
    },
    _count: true,
    _sum: { totalAmount: true },
  });

  const recentBookings = await prisma.booking.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { adSpace: true, client: true },
  });

  return {
    totalAdSpaces,
    activeAdSpaces,
    inactiveAdSpaces,
    currentlyBooked,
    available: Math.max(0, available),
    upcomingBookings,
    expiringSoon,
    recentClients,
    recentBookings,
    invoicesThisMonth: invoiceSummary._count,
    invoiceTotalThisMonth: invoiceSummary._sum.totalAmount ?? 0,
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
      bookings: { where: { status: { in: ["confirmed", "active"] } } },
      marketplaceListing: { select: { status: true, reviewNotes: true } },
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
