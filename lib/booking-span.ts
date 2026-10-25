export const MIN_BOOKING_DAYS = 7;
export const BILLING_MONTH_DAYS = 30;

export function parseBookingDay(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatBookingDay(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addBookingDays(value: string, days: number): string {
  const date = parseBookingDay(value);
  if (!date) return value;
  date.setUTCDate(date.getUTCDate() + days);
  return formatBookingDay(date);
}

export function minimumBookingEnd(start: string): string {
  return addBookingDays(start, MIN_BOOKING_DAYS - 1);
}

export function inclusiveBookingDays(start: string, end: string): number | null {
  const startDate = parseBookingDay(start);
  const endDate = parseBookingDay(end);
  if (!startDate || !endDate) return null;
  const diff = Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000);
  return diff + 1;
}

export function prorateMonthlyAmount(monthly: number, days: number): number {
  return Math.round((monthly * days * 100) / BILLING_MONTH_DAYS) / 100;
}
