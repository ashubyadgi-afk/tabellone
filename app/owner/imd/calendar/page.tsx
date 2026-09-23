import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader, Card, Badge, Button } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import {
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isValid,
  isWithinInterval,
  parse,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

function monthFromParam(value?: string) {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const parsed = parse(`${value}-01`, "yyyy-MM-dd", new Date());
    if (isValid(parsed)) return startOfMonth(parsed);
  }
  return startOfMonth(new Date());
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { month } = await searchParams;
  const monthStart = monthFromParam(month);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthKey = format(monthStart, "yyyy-MM");
  const prevKey = format(subMonths(monthStart, 1), "yyyy-MM");
  const nextKey = format(addMonths(monthStart, 1), "yyyy-MM");
  const thisKey = format(startOfMonth(new Date()), "yyyy-MM");

  const bookings = await prisma.booking.findMany({
    where: {
      organizationId: session.organizationId,
      status: { in: ["confirmed", "active"] },
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
    },
    include: { adSpace: true, client: true },
  });

  function bookingsForDay(day: Date) {
    return bookings.filter((b) =>
      isWithinInterval(day, { start: b.startDate, end: b.endDate })
    );
  }

  return (
    <div>
      <PageHeader
        title="Availability Calendar"
        description={format(monthStart, "MMMM yyyy")}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/owner/imd/calendar?month=${prevKey}`}>
              <Button variant="secondary" type="button">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
            </Link>
            {monthKey !== thisKey && (
              <Link href="/owner/imd/calendar">
                <Button variant="secondary" type="button">
                  This month
                </Button>
              </Link>
            )}
            <Link href={`/owner/imd/calendar?month=${nextKey}`}>
              <Button variant="secondary" type="button">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      />
      <Card className="p-6">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const dayBookings = bookingsForDay(day);
            const booked = dayBookings.length > 0;
            const dateValue = format(day, "yyyy-MM-dd");
            return (
              <Link
                key={dateValue}
                href={`/owner/imd/bookings/new?startDate=${dateValue}&endDate=${dateValue}`}
                className={`min-h-[88px] rounded-xl border p-2 text-left transition hover:border-[#4C4BFF]/40 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4C4BFF]/30 ${
                  booked
                    ? "border-orange-200 bg-orange-50/80"
                    : "border-slate-100 bg-slate-50/50"
                }`}
              >
                <span className="text-xs font-semibold text-slate-700">
                  {format(day, "d")}
                </span>
                <div className="mt-1 space-y-1">
                  {dayBookings.slice(0, 2).map((b) => (
                    <p key={b.id} className="truncate text-[10px] text-orange-800">
                      {b.adSpace.name}
                    </p>
                  ))}
                  {dayBookings.length > 2 && (
                    <p className="text-[10px] text-slate-500">
                      +{dayBookings.length - 2} more
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="font-semibold">Upcoming bookings</h2>
        <ul className="mt-4 space-y-3">
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-500">No bookings this month</p>
          ) : (
            bookings.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between text-sm border-b border-slate-100 pb-2"
              >
                <div>
                  <p className="font-medium">{b.adSpace.name}</p>
                  <p className="text-xs text-slate-500">{b.client.name}</p>
                </div>
                <div className="text-right">
                  <Badge variant="warning">
                    {formatDate(b.startDate)} – {formatDate(b.endDate)}
                  </Badge>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
