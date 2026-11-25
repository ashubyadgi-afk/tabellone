import Link from "next/link";
import { getLiveSession, redirectToRoleArea } from "@/lib/auth/live-session";
import { getImdDashboardStats } from "@/lib/services/imd.service";
import { StatCard, Badge } from "@/components/ui";
import { Panel } from "@/components/dashboard/DashboardUI";
import { BannerAccountActions } from "@/components/layout/BannerAccountActions";
import {
  LazyBookingTrendChart as BookingTrendChart,
  LazyInvoiceTrendChart as InvoiceTrendChart,
  LazyOccupancyChart as OccupancyChart,
  LazyRevenueBreakdownChart as RevenueBreakdownChart,
  LazySpacesByTypeChart as SpacesByTypeChart,
  LazyTopSpacesChart as TopSpacesChart,
} from "@/components/charts/lazy";
import {
  Layers,
  CheckCircle2,
  CalendarClock,
  CalendarCheck,
  AlertTriangle,
  FileText,
  Plus,
  PieChart,
  Activity,
  LayoutGrid,
  IndianRupee,
  TrendingUp,
  MapPin,
  ClipboardList,
  Wallet,
  Percent,
  Wrench,
  FileWarning,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ImdDashboardPage() {
  const { session, organizationName } = redirectToRoleArea(
    await getLiveSession(),
    "owner"
  );

  const stats = await getImdDashboardStats(session.organizationId);
  const greetingName = organizationName?.trim() || "Owner";
  const momLabel =
    stats.billing.momDelta === 0
      ? "Same as last month"
      : stats.billing.momDelta > 0
        ? `+${stats.billing.momDelta}% vs last month`
        : `${stats.billing.momDelta}% vs last month`;

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
              Welcome, {greetingName}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              Inventory Management Dashboard — Ad Spaces, clients, bookings, and invoices
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
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
            <Link
              href="/owner/imd/clients/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-white/25"
            >
              <Plus className="h-4 w-4" /> Client
            </Link>
            <Link
              href="/owner/imd/invoices"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-white/25"
            >
              <FileText className="h-4 w-4" /> Invoices
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Lifetime invoiced"
          value={formatCurrency(stats.billing.lifetimeInvoiced)}
          icon={Wallet}
          accent="blue"
          href="/owner/imd/invoices"
        />
        <StatCard
          label="Invoiced this month"
          value={formatCurrency(stats.billing.invoicedThisMonth)}
          sub={momLabel}
          icon={IndianRupee}
          accent="emerald"
          href="/owner/imd/invoices"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(stats.billing.outstandingAmount)}
          sub={`${stats.billing.outstandingCount} issued`}
          icon={FileWarning}
          accent="amber"
          href="/owner/imd/invoices"
        />
        <StatCard
          label="Paid"
          value={formatCurrency(stats.billing.paidAmount)}
          sub={`${stats.billing.paidCount} invoices`}
          icon={CheckCircle2}
          accent="violet"
          href="/owner/imd/invoices"
        />
      </div>

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
          label="Draft spaces"
          value={stats.draftAdSpaces}
          icon={ClipboardList}
          accent="slate"
          href="/owner/imd/ad-spaces"
        />
        <StatCard
          label="Maintenance"
          value={stats.maintenanceAdSpaces}
          icon={Wrench}
          accent="slate"
          href="/owner/imd/ad-spaces?filter=inactive"
        />
        <StatCard
          label="Occupancy (month)"
          value={`${stats.occupancyPercent}%`}
          sub="Booked days ÷ capacity"
          icon={Percent}
          accent="rose"
          href="/owner/imd/calendar"
        />
        <StatCard
          label="Expiring (7d)"
          value={stats.expiringSoon}
          icon={AlertTriangle}
          accent="rose"
          href="/owner/imd/bookings"
        />
      </div>

      {stats.alerts.length > 0 ? (
        <Panel title="Notices" description="Things that may need attention" icon={AlertTriangle}>
          <ul className="space-y-2">
            {stats.alerts.map((alert) => (
              <li key={alert.id}>
                <Link
                  href={alert.href}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-slate-50"
                >
                  <span className="text-slate-700">{alert.title}</span>
                  <span className="shrink-0 text-xs font-semibold text-[#4C4BFF]">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Invoice revenue" description="Issued invoice totals over 6 months" icon={IndianRupee}>
          <InvoiceTrendChart data={stats.charts.invoiceTrend} />
        </Panel>
        <Panel title="Booking activity" description="Bookings and booked value over 6 months" icon={TrendingUp}>
          <BookingTrendChart data={stats.charts.bookingTrend} />
        </Panel>
        <Panel title="Occupancy today" description="Active spaces booked vs available" icon={Activity}>
          <OccupancyChart data={stats.charts.occupancy} />
        </Panel>
        <Panel title="Top earning spaces" description="Ranked by invoiced / booked amount" icon={MapPin}>
          <TopSpacesChart data={stats.charts.topSpaces} />
        </Panel>
        <Panel title="Spaces by type" description="Inventory mix by format" icon={LayoutGrid}>
          <SpacesByTypeChart data={stats.charts.spacesByType} />
        </Panel>
        <Panel title="Revenue by format" description="Booked / invoiced amount by ad space type" icon={PieChart}>
          <RevenueBreakdownChart data={stats.charts.revenueByType} />
        </Panel>
        <Panel title="Revenue by client" description="Top clients by booked / invoiced amount" icon={IndianRupee}>
          <RevenueBreakdownChart data={stats.charts.revenueByClient} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Work queue"
          description="Drafts and bookings needing invoices"
          icon={ClipboardList}
          bodyClassName="p-0"
        >
          <div className="grid grid-cols-3 gap-px border-b border-slate-100 bg-slate-100">
            <Link
              href="/owner/imd/bookings"
              className="bg-white px-4 py-3 text-center transition hover:bg-slate-50"
            >
              <p className="text-lg font-semibold tabular-nums text-slate-900">
                {stats.workQueue.draftBookings}
              </p>
              <p className="text-[11px] text-slate-500">Draft bookings</p>
            </Link>
            <Link
              href="/owner/imd/ad-spaces"
              className="bg-white px-4 py-3 text-center transition hover:bg-slate-50"
            >
              <p className="text-lg font-semibold tabular-nums text-slate-900">
                {stats.workQueue.draftAdSpaces}
              </p>
              <p className="text-[11px] text-slate-500">Draft spaces</p>
            </Link>
            <Link
              href="/owner/imd/invoices"
              className="bg-white px-4 py-3 text-center transition hover:bg-slate-50"
            >
              <p className="text-lg font-semibold tabular-nums text-slate-900">
                {stats.workQueue.uninvoiced}
              </p>
              <p className="text-[11px] text-slate-500">Need invoice</p>
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {stats.workQueue.uninvoicedItems.length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-slate-500">
                No bookings waiting for invoices
              </li>
            ) : (
              stats.workQueue.uninvoicedItems.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{b.adSpace.name}</p>
                    <p className="text-xs text-slate-500">{b.client.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-900">
                      {b.amount != null ? formatCurrency(b.amount) : "—"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(b.startDate)} → {formatDate(b.endDate)}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Panel>

        <Panel
          title="Upcoming bookings"
          description="Next confirmed and active bookings"
          icon={CalendarClock}
          bodyClassName="p-0"
          aside={
            <Link href="/owner/imd/bookings" className="text-sm font-semibold text-[#4C4BFF] hover:underline">
              View all
            </Link>
          }
        >
          <ul className="divide-y divide-slate-100">
            {stats.upcomingBookingRows.length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-slate-500">No upcoming bookings</li>
            ) : (
              stats.upcomingBookingRows.map((b) => (
                <li key={b.id} className="px-5 py-3 transition hover:bg-slate-50/80">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{b.adSpace.name}</p>
                      <p className="text-xs text-slate-500">
                        {b.client.name}
                        {b.adSpace.adSpaceType
                          ? ` · ${b.adSpace.adSpaceType.replaceAll("_", " ")}`
                          : ""}
                      </p>
                    </div>
                    <Badge variant="success">{b.status}</Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-400">
                    <span>
                      {formatDate(b.startDate)} → {formatDate(b.endDate)}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-600">
                      {b.amount != null ? formatCurrency(b.amount) : "—"}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Recent invoices"
          description="Latest issued invoices"
          icon={FileText}
          bodyClassName="p-0"
          aside={
            <Link href="/owner/imd/invoices" className="text-sm font-semibold text-[#4C4BFF] hover:underline">
              View all
            </Link>
          }
        >
          <ul className="divide-y divide-slate-100">
            {stats.recentInvoices.length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-slate-500">No invoices yet</li>
            ) : (
              stats.recentInvoices.map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={`/owner/imd/invoices/${inv.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-slate-50/80"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{inv.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">
                        {inv.booking.client.name} · {inv.booking.adSpace.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-slate-900">
                        {formatCurrency(inv.totalAmount)}
                      </p>
                      <p className="text-xs capitalize text-slate-400">
                        {inv.status} · {formatDate(inv.issuedAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </Panel>

        <Panel
          title="Recent activity"
          description="Bookings and invoices"
          icon={Activity}
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-slate-100">
            {stats.activity.length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-slate-500">No recent activity</li>
            ) : (
              stats.activity.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-slate-50/80"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.subtitle}</p>
                    </div>
                    <p className="shrink-0 text-xs text-slate-400">{formatDate(item.at)}</p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
