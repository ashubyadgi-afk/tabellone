import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getImdDashboardStats } from "@/lib/services/imd.service";
import { StatCard, Badge } from "@/components/ui";
import { Panel } from "@/components/dashboard/DashboardUI";
import { BannerAccountActions } from "@/components/layout/BannerAccountActions";
import {
  BookingTrendChart,
  InventoryMixChart,
  InvoiceTrendChart,
  OccupancyChart,
  SpacesByTypeChart,
  TopSpacesChart,
} from "@/components/owner/OwnerDashboardCharts";
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
  PieChart,
  Activity,
  LayoutGrid,
  IndianRupee,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ImdDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const stats = await getImdDashboardStats(session.organizationId);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4C4BFF] via-[#5E49F6] to-[#8C47EE] px-7 py-8 text-white shadow-[0_20px_40px_-20px_rgba(76,75,255,0.6)] sm:px-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-[#F06B3B]/30 blur-3xl" />
        <BannerAccountActions className="absolute right-5 top-5 z-10 sm:right-7" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Owner</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Inventory Management Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              IMD — manage AdSpaces, clients, bookings, and invoices
            </p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <Link
              href="/owner/imd/ad-spaces/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#4C4BFF] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-white/95"
            >
              <Plus className="h-4 w-4" /> Ad Space
            </Link>
            <Link
              href="/owner/imd/bookings/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-white/25"
            >
              <Plus className="h-4 w-4" /> Booking
            </Link>
          </div>
        </div>
      </section>

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

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Inventory mix" description="Ad Spaces by IMD status" icon={PieChart}>
          <InventoryMixChart data={stats.charts.inventoryMix} />
        </Panel>
        <Panel title="Occupancy today" description="Active spaces booked vs available" icon={Activity}>
          <OccupancyChart data={stats.charts.occupancy} />
        </Panel>
        <Panel title="Spaces by type" description="Inventory mix by format" icon={LayoutGrid}>
          <SpacesByTypeChart data={stats.charts.spacesByType} />
        </Panel>
        <Panel title="Top spaces" description="Most booked Ad Spaces" icon={MapPin}>
          <TopSpacesChart data={stats.charts.topSpaces} />
        </Panel>
        <Panel title="Invoice revenue" description="Issued invoice totals over 6 months" icon={IndianRupee}>
          <InvoiceTrendChart data={stats.charts.invoiceTrend} />
        </Panel>
        <Panel title="Booking activity" description="Bookings created over 6 months" icon={TrendingUp}>
          <BookingTrendChart data={stats.charts.bookingTrend} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Recent clients"
          icon={Users}
          bodyClassName="p-0"
          aside={
            <Link href="/owner/imd/clients" className="text-sm font-semibold text-[#4C4BFF] hover:underline">
              View all
            </Link>
          }
        >
          <ul className="divide-y divide-slate-100">
            {stats.recentClients.length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-slate-500">No clients yet</li>
            ) : (
              stats.recentClients.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3 transition hover:bg-slate-50/80">
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
        </Panel>

        <Panel
          title="Recent activity"
          icon={CalendarClock}
          bodyClassName="p-0"
          aside={
            <Link href="/owner/imd/bookings" className="text-sm font-semibold text-[#4C4BFF] hover:underline">
              View all
            </Link>
          }
        >
          <ul className="divide-y divide-slate-100">
            {stats.recentBookings.length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-slate-500">No bookings yet</li>
            ) : (
              stats.recentBookings.map((b) => (
                <li key={b.id} className="px-5 py-3 transition hover:bg-slate-50/80">
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
        </Panel>
      </div>
    </div>
  );
}
