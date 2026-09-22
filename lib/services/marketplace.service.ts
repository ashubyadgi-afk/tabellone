import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { endOfDay, isValid, parseISO, startOfDay } from "date-fns";
import { haversineKm, matchesMinSize, matchesSize, remainingAvailabilityDays, AD_SPACE_LOCATIONS } from "@/lib/marketplace/search";

export type MarketplaceFilters = {
  type?: string;
  city?: string;
  state?: string;
  location?: string;
  size?: string;
  minSize?: string;
  minRating?: number;
  availMonths?: number;
  startDate?: Date;
  endDate?: Date;
  minPrice?: number;
  maxPrice?: number;
  minFootfall?: number;
  search?: string;
  types?: string[];
  take?: number;
  /** Reserved for nearby search (lat/lng + radius). */
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
};

function parseDay(value?: string): Date | undefined {
  if (!value?.trim()) return undefined;
  const raw = value.trim();
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00` : raw;
  const date = parseISO(iso);
  return isValid(date) ? date : undefined;
}

export function marketplaceFiltersFromParams(
  params: Record<string, string | undefined>
): MarketplaceFilters {
  let startDate = parseDay(
    params.from || params.dateFrom || params.startDate
  );
  let endDate = parseDay(params.to || params.dateTo || params.endDate);
  if (startDate && !endDate) endDate = startDate;
  if (endDate && !startDate) startDate = endDate;
  if (startDate && endDate && startDate > endDate) {
    const swap = startDate;
    startDate = endDate;
    endDate = swap;
  }

  const lat = params.lat ? Number(params.lat) : undefined;
  const lng = params.lng ? Number(params.lng) : undefined;
  const radiusKm = params.radiusKm ? Number(params.radiusKm) : undefined;

  return {
    type: params.type || undefined,
    city: params.city || undefined,
    state: params.state || undefined,
    location: params.location || undefined,
    size: params.size || undefined,
    minSize: params.minSize || undefined,
    minRating: params.minRating ? Number(params.minRating) : undefined,
    availMonths: params.availMonths ? Number(params.availMonths) : undefined,
    startDate,
    endDate,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    minFootfall: params.minFootfall ? Number(params.minFootfall) : undefined,
    search: params.search || undefined,
    latitude: lat !== undefined && !Number.isNaN(lat) ? lat : undefined,
    longitude: lng !== undefined && !Number.isNaN(lng) ? lng : undefined,
    radiusKm:
      radiusKm !== undefined && !Number.isNaN(radiusKm) ? radiusKm : undefined,
  };
}

export function buildMarketplaceWhere(
  filters: MarketplaceFilters
): Prisma.AdSpaceWhereInput {
  const where: Prisma.AdSpaceWhereInput = {
    marketplaceListingStatus: "listed",
    marketplaceListing: { status: "approved" },
    imdStatus: "active",
  };

  if (filters.types?.length) {
    where.adSpaceType = { in: filters.types };
  } else if (filters.type) {
    where.adSpaceType = filters.type;
  }
  if (filters.city) where.city = { contains: filters.city, mode: "insensitive" };
  if (filters.state) where.state = { contains: filters.state, mode: "insensitive" };
  if (filters.minPrice) where.basePrice = { gte: filters.minPrice };
  if (filters.maxPrice) {
    where.basePrice = { ...(where.basePrice as object), lte: filters.maxPrice };
  }
  if (filters.minFootfall) where.footfall = { gte: filters.minFootfall };

  if (filters.minRating && !Number.isNaN(filters.minRating)) {
    where.rating = { gte: filters.minRating };
  }

  const location = filters.location || filters.search;
  if (location) {
    const knownCity = AD_SPACE_LOCATIONS.some(
      (item) => item.value.toLowerCase() === location.toLowerCase()
    );
    if (knownCity) {
      where.city = { equals: location, mode: "insensitive" };
    } else {
      where.OR = [
        { name: { contains: location, mode: "insensitive" } },
        { city: { contains: location, mode: "insensitive" } },
        { state: { contains: location, mode: "insensitive" } },
        { address: { contains: location, mode: "insensitive" } },
      ];
    }
  }

  if (filters.startDate && filters.endDate) {
    const rangeStart = startOfDay(filters.startDate);
    const rangeEnd = endOfDay(filters.endDate);
    where.AND = [
      {
        OR: [{ availableFrom: null }, { availableFrom: { lte: rangeStart } }],
      },
      {
        OR: [{ availableTo: null }, { availableTo: { gte: rangeEnd } }],
      },
      {
        bookings: {
          none: {
            status: { in: ["confirmed", "active"] },
            startDate: { lte: rangeEnd },
            endDate: { gte: rangeStart },
          },
        },
      },
      {
        bookingRequests: {
          none: {
            status: { in: ["approved", "payment_pending", "paid", "confirmed"] },
            startDate: { lte: rangeEnd },
            endDate: { gte: rangeStart },
          },
        },
      },
    ];
  }

  return where;
}

const listingInclude = {
  organization: { select: { name: true, brandName: true } },
  marketplaceListing: true,
  bookings: {
    where: { status: { in: ["confirmed" as const, "active" as const] } },
    select: { startDate: true, endDate: true, status: true },
  },
} satisfies Prisma.AdSpaceInclude;

function isDatabaseUnreachable(err: unknown) {
  const name = (err as { name?: string })?.name ?? "";
  const message = String((err as { message?: string })?.message ?? "");
  return (
    name === "PrismaClientInitializationError" ||
    message.includes("Can't reach database server")
  );
}

export async function listPublicAdSpaces(filters: MarketplaceFilters = {}) {
  let spaces;
  try {
    spaces = await prisma.adSpace.findMany({
      where: buildMarketplaceWhere(filters),
      include: listingInclude,
      orderBy: { createdAt: "desc" },
      take: filters.take,
    });
  } catch (err) {
    if (isDatabaseUnreachable(err)) {
      console.error("Database is not reachable; showing an empty marketplace.");
      return [];
    }
    throw err;
  }

  return spaces.filter((space) => {
    if (!matchesSize(space.dimensions, filters.size)) return false;
    if (!matchesMinSize(space.dimensions, filters.minSize)) return false;
    if (filters.availMonths && !Number.isNaN(filters.availMonths)) {
      const days = remainingAvailabilityDays(space, filters.startDate);
      const needed = filters.availMonths * 30;
      if (days == null || days < needed) return false;
    }
    if (
      filters.latitude != null &&
      filters.longitude != null &&
      filters.radiusKm != null
    ) {
      if (space.latitude == null || space.longitude == null) return false;
      return (
        haversineKm(
          filters.latitude,
          filters.longitude,
          space.latitude,
          space.longitude
        ) <= filters.radiusKm
      );
    }
    return true;
  });
}

export async function getPublicAdSpace(id: string) {
  return prisma.adSpace.findFirst({
    where: {
      id,
      marketplaceListingStatus: "listed",
      marketplaceListing: { status: "approved" },
    },
    include: listingInclude,
  });
}

export async function checkAvailability(
  adSpaceId: string,
  startDate: Date,
  endDate: Date
) {
  const conflicts = await prisma.bookingRequest.findMany({
    where: {
      adSpaceId,
      status: { in: ["approved", "payment_pending", "paid", "confirmed"] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });

  const imdConflicts = await prisma.booking.findMany({
    where: {
      adSpaceId,
      status: { in: ["confirmed", "active"] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });

  return conflicts.length === 0 && imdConflicts.length === 0;
}
