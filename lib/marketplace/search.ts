import { formatDate, formatDateRange } from "@/lib/utils";

export const AD_SPACE_TYPES = [
  { value: "billboard", label: "Billboard" },
  { value: "digital", label: "Digital" },
  { value: "mall", label: "Mall" },
  { value: "vehicle", label: "Vehicle" },
] as const;

export const AD_SPACE_LOCATIONS = [
  { value: "Bangalore", label: "Bangalore" },
  { value: "Hubli", label: "Hubli" },
  { value: "Hyderabad", label: "Hyderabad" },
  { value: "Mumbai", label: "Mumbai" },
] as const;

export const AD_SPACE_SIZE_PRESETS = [
  { value: "40x20", label: "40 × 20 ft" },
  { value: "30x10", label: "30 × 10 ft" },
  { value: "20x10", label: "20 × 10 ft" },
  { value: "16x9", label: "16 × 9 ft" },
  { value: "10x10", label: "10 × 10 ft" },
] as const;

export type MarketplaceSearchValues = {
  from?: string;
  to?: string;
  location?: string;
  type?: string;
  size?: string;
  availMonths?: string;
  minSize?: string;
  minRating?: string;
};

export const POPULAR_AVAILABILITY = [
  { value: "1", label: "At least 1 month of availability" },
  { value: "3", label: "At least 3 months of availability" },
  { value: "6", label: "At least 6 months of availability" },
] as const;

export const POPULAR_MIN_SIZES = [
  { value: "20x10", label: "20 × 10 and above" },
  { value: "30x10", label: "30 × 10 and above" },
  { value: "40x20", label: "40 × 20 and above" },
] as const;

export const POPULAR_MIN_RATINGS = [
  { value: "4", label: "At least 4★ and above" },
  { value: "3", label: "At least 3★ and above" },
] as const;

export function normalizeSizeToken(value: string): string {
  return value.toLowerCase().replace(/×/g, "x").replace(/\s+/g, "");
}

export function matchesSize(
  dimensions: string | null | undefined,
  size: string | undefined
): boolean {
  if (!size) return true;
  if (!dimensions) return false;
  return normalizeSizeToken(dimensions).includes(normalizeSizeToken(size));
}

/** Returns [larger, smaller] side in feet, or null if dimensions cannot be parsed. */
export function parseDimensionFeet(
  value: string | null | undefined
): [number, number] | null {
  if (!value) return null;
  const match = normalizeSizeToken(value).match(
    /(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/
  );
  if (!match) return null;
  const a = Number(match[1]);
  const b = Number(match[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return a >= b ? [a, b] : [b, a];
}

export function matchesMinSize(
  dimensions: string | null | undefined,
  minSize: string | undefined
): boolean {
  if (!minSize) return true;
  const got = parseDimensionFeet(dimensions);
  const need = parseDimensionFeet(minSize);
  if (!got || !need) return false;
  return got[0] >= need[0] && got[1] >= need[1];
}

export function remainingAvailabilityDays(
  space: {
    availableFrom?: Date | string | null;
    availableTo?: Date | string | null;
    bookings?: { startDate: Date | string; endDate: Date | string }[];
  },
  from?: Date
): number | null {
  if (!space.availableTo) return null;
  const end = new Date(space.availableTo);
  let start = space.availableFrom
    ? new Date(space.availableFrom)
    : new Date();
  if (from && from > start) start = new Date(from);

  for (const booking of space.bookings || []) {
    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);
    if (bookingStart <= start && bookingEnd >= start) {
      const next = new Date(bookingEnd);
      next.setDate(next.getDate() + 1);
      if (next > start) start = next;
    }
  }

  if (end < start) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/** Approximate distance in km. Used when geo filters are supplied later. */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function availabilityLabel(space: {
  availableFrom?: Date | string | null;
  availableTo?: Date | string | null;
  bookings?: { startDate: Date | string; endDate: Date | string }[];
}): string {
  const now = new Date();
  const currentBooking = (space.bookings || []).find((booking) => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    return start <= now && end >= now;
  });
  if (currentBooking) {
    return `Booked until ${formatDate(currentBooking.endDate)}`;
  }
  const window = formatDateRange(space.availableFrom, space.availableTo);
  if (window) return `Available ${window}`;
  return "Available now";
}
