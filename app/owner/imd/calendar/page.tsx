import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader, Card, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isWithinInterval,
} from "date-fns";

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

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
        description={format(now, "MMMM yyyy")}
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
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[88px] rounded-xl border p-2 text-left transition ${
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
                    <p className="text-[10px] text-slate-500">+{dayBookings.length - 2} more</p>
                  )}
                </div>
              </div>
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
              <li key={b.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
                <div>
                  <p className="font-medium">{b.adSpace.name}</p>
                  <p className="text-xs text-slate-500">{b.client.name}</p>
                </div>
                <div className="text-right">
                  <Badge variant="warning">{formatDate(b.startDate)} – {formatDate(b.endDate)}</Badge>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
