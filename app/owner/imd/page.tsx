import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getImdDashboardStats } from "@/lib/services/imd.service";
import { Card, StatCard, PageHeader, Badge, Button } from "@/components/ui";
import {
  Layers,
  CheckCircle2,
  XCircle,
  CalendarClock,
  CalendarCheck,
  AlertTriangle,
  Users,
  FileText,
  Plus,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ImdDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const stats = await getImdDashboardStats(session.organizationId);

  return (
    <div>
      <PageHeader
        title="Inventory Management Dashboard"
        description="IMD — manage AdSpaces, clients, bookings, and invoices"
        action={
          <div className="flex gap-2">
            <Link href="/owner/imd/ad-spaces/new">
              <Button size="sm"><Plus className="h-4 w-4" /> Ad Space</Button>
            </Link>
            <Link href="/owner/imd/bookings/new">
              <Button size="sm" variant="secondary"><Plus className="h-4 w-4" /> Booking</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Ad Spaces"
          value={stats.totalAdSpaces}
          icon={Layers}
          accent="blue"
          href="/owner/imd/ad-spaces"
        />
        <StatCard
          label="Active"
          value={stats.activeAdSpaces}
          icon={CheckCircle2}
          accent="emerald"
          href="/owner/imd/ad-spaces?filter=active"
        />
        <StatCard
          label="Inactive / maintenance"
          value={stats.inactiveAdSpaces}
          icon={XCircle}
          accent="slate"
          href="/owner/imd/ad-spaces?filter=inactive"
        />
        <StatCard
          label="Booked now"
          value={stats.currentlyBooked}
          icon={CalendarCheck}
          accent="amber"
          href="/owner/imd/calendar"
        />
        <StatCard
          label="Available"
          value={stats.available}
          icon={CalendarClock}
          accent="violet"
          href="/owner/imd/ad-spaces?filter=available"
        />
        <StatCard
          label="Upcoming (30d)"
          value={stats.upcomingBookings}
          icon={CalendarClock}
          accent="blue"
          href="/owner/imd/bookings"
        />
        <StatCard
          label="Expiring (7d)"
          value={stats.expiringSoon}
          icon={AlertTriangle}
          accent="rose"
          href="/owner/imd/bookings"
        />
        <StatCard
          label="Invoices this month"
          value={stats.invoicesThisMonth}
          sub={formatCurrency(stats.invoiceTotalThisMonth)}
          icon={FileText}
          accent="emerald"
          href="/owner/imd/invoices"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" /> Recent clients
            </h2>
            <Link href="/owner/imd/clients" className="text-sm text-[#1e3a5f] hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {stats.recentClients.length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-slate-500">No clients yet</li>
            ) : (
              stats.recentClients.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{c.name}</p>
                    {c.businessName && (
                      <p className="text-xs text-slate-500">{c.businessName}</p>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{formatDate(c.createdAt)}</p>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-slate-400" /> Recent activity
            </h2>
            <Link href="/owner/imd/bookings" className="text-sm text-[#1e3a5f] hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {stats.recentBookings.length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-slate-500">No bookings yet</li>
            ) : (
              stats.recentBookings.map((b) => (
                <li key={b.id} className="px-6 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{b.adSpace.name}</p>
                      <p className="text-xs text-slate-500">{b.client.name}</p>
                    </div>
                    <Badge variant="success">{b.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDate(b.startDate)} → {formatDate(b.endDate)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
