import { Badge } from "@/components/ui";
import {
  Panel,
  SURFACE,
  TABLE_HEAD,
  TABLE_ROW,
} from "@/components/dashboard/DashboardUI";
import { BannerAccountActions } from "@/components/layout/BannerAccountActions";
import {
  LazyAdminRevenueTrendChart as AdminRevenueTrendChart,
  LazyCitiesBarChart as CitiesBarChart,
  LazyCommissionMixChart as CommissionMixChart,
  LazyFirmGrowthChart as FirmGrowthChart,
  LazyGeographicRevenueChart as GeographicRevenueChart,
  LazyRevenueBars as RevenueBars,
  LazyTypesDonut as TypesDonut,
} from "@/components/charts/lazy";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  Building2,
  ClipboardCheck,
  IndianRupee,
  Layers,
  MapPin,
  Megaphone,
  TrendingUp,
  Receipt,
  PieChart,
  CreditCard,
  AlertTriangle,
  Activity,
  Package,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  getAdminHqStats,
  getAdminInsights,
  getAdminKpiBoard,
  listAdvertiserOrganizations,
  listOwnerOrganizations,
} from "@/lib/services/admin.service";

function verificationBadge(status?: string | null) {
  if (!status) return <Badge variant="muted">no profile</Badge>;
  if (status === "approved") return <Badge variant="success">approved</Badge>;
  if (status === "rejected") return <Badge variant="warning">rejected</Badge>;
  return <Badge variant="warning">{status.replaceAll("_", " ")}</Badge>;
}

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="text-sm font-semibold text-[#4C4BFF] hover:underline">
      View all
    </Link>
  );
}

type MetricItem = {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  emphasize?: boolean;
};

function MetricBoard({
  title,
  description,
  icon: Icon,
  items,
  aside,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  items: MetricItem[];
  aside?: React.ReactNode;
}) {
  return (
    <Panel title={title} description={description} icon={Icon} aside={aside} bodyClassName="p-0">
      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-3">
        {items.map((item) => {
          const inner = (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                {item.label}
              </p>
              <p
                className={cn(
                  "mt-1.5 font-semibold tabular-nums tracking-tight text-slate-900",
                  item.emphasize ? "text-2xl" : "text-xl"
                )}
              >
                {item.value}
              </p>
              {item.hint ? <p className="mt-1 text-[11px] text-slate-400">{item.hint}</p> : null}
            </>
          );
          if (item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="block px-4 py-4 transition hover:bg-slate-50/80"
              >
                {inner}
              </Link>
            );
          }
          return (
            <div key={item.label} className="px-4 py-4">
              {inner}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function HeroStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/65">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-[1.65rem]">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-white/60">{hint}</p> : null}
    </div>
  );
}

function QueueChip({
  label,
  value,
  href,
  tone = "default",
}: {
  label: string;
  value: number;
  href: string;
  tone?: "default" | "warn" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "bg-rose-50 text-rose-700 ring-rose-100"
      : tone === "warn"
        ? "bg-amber-50 text-amber-700 ring-amber-100"
        : "bg-slate-50 text-slate-700 ring-slate-200/80";
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 ring-1 transition hover:-translate-y-0.5",
        toneClass
      )}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  // Sequential loads — Neon pool is small; parallelizing these starved connections (P2024).
  const stats = await getAdminHqStats();
  const insights = await getAdminInsights();
  const kpi = await getAdminKpiBoard();
  const owners = await listOwnerOrganizations({ take: 6 });
  const advertisers = await listAdvertiserOrganizations({ take: 6 });

  const commissionSlices = [
    { name: "Platform commission", value: insights.commission.commissionAmount, color: "#8C47EE" },
    { name: "GST on commission", value: insights.commission.gstOnCommission, color: "#f59e0b" },
    { name: "TDS", value: insights.commission.tdsAmount, color: "#64748b" },
    { name: "Owner payout", value: insights.commission.ownerPayout, color: "#10b981" },
  ];

  const pendingReviews = stats.pendingListings + stats.pendingRequests;

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4C4BFF] via-[#5E49F6] to-[#8C47EE] px-7 py-7 text-white shadow-[0_20px_40px_-20px_rgba(76,75,255,0.6)] sm:px-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-[#F06B3B]/30 blur-3xl" />
        <BannerAccountActions className="absolute right-5 top-5 z-10 sm:right-7" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Platform overview</h1>
          <p className="mt-2 max-w-xl text-sm text-white/80">
            Snapshot of booked marketplace value, firms, and queues — not a live settlement ledger
          </p>
          <div className="mt-6 grid gap-5 border-t border-white/15 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <HeroStat
              label="Booked GMV"
              value={formatCurrency(kpi.business.gmv)}
              hint={`${kpi.business.pricedBookings} priced requests`}
            />
            <HeroStat
              label="Commission"
              value={formatCurrency(kpi.business.platformCommission)}
              hint={`${kpi.business.takeRate}% take rate`}
            />
            <HeroStat
              label="Collected"
              value={formatCurrency(kpi.payments.successfulAmount)}
              hint={`${kpi.payments.successfulCount} payments`}
            />
            <HeroStat
              label="Needs attention"
              value={pendingReviews + kpi.moderation.openConcerns + kpi.moderation.pendingKyc}
              hint={`${pendingReviews} reviews · ${kpi.moderation.pendingKyc} KYC`}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Revenue trend"
          description="Booked GMV, commission, payouts, collected"
          icon={TrendingUp}
        >
          <AdminRevenueTrendChart data={kpi.revenueTrend} />
        </Panel>

        <div className="space-y-6">
          <Panel title="Action queue" description="Open items by priority" icon={ClipboardCheck}>
            <div className="grid gap-2.5">
              <QueueChip
                label="Listings to review"
                value={kpi.moderation.pendingListings}
                href="/admin/listings"
                tone={kpi.moderation.pendingListings > 0 ? "warn" : "default"}
              />
              <QueueChip
                label="Booking requests"
                value={kpi.moderation.pendingRequests}
                href="/admin/booking-requests"
                tone={kpi.moderation.pendingRequests > 0 ? "warn" : "default"}
              />
              <QueueChip
                label="KYC / verification"
                value={kpi.moderation.pendingKyc}
                href="/admin/owners"
                tone={kpi.moderation.pendingKyc > 0 ? "warn" : "default"}
              />
              <QueueChip
                label="Open queries"
                value={kpi.moderation.openConcerns}
                href="/admin/queries"
                tone={kpi.moderation.openConcerns > 0 ? "danger" : "default"}
              />
              <QueueChip
                label="Failed payments"
                value={kpi.payments.failed}
                href="/admin/booking-requests"
                tone={kpi.payments.failed > 0 ? "danger" : "default"}
              />
            </div>
          </Panel>

          {kpi.alerts.length > 0 ? (
            <Panel title="Alerts" description="Quick interventions" icon={AlertTriangle} bodyClassName="p-0">
              <ul className="divide-y divide-slate-100">
                {kpi.alerts.map((alert) => (
                  <li key={alert.id}>
                    <Link
                      href={alert.href}
                      className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition hover:bg-slate-50"
                    >
                      <span className="text-slate-700">{alert.title}</span>
                      <span className="shrink-0 text-xs font-semibold text-[#4C4BFF]">Open</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <MetricBoard
          title="Business"
          description="Marketplace economics"
          icon={IndianRupee}
          items={[
            {
              label: "Booked GMV",
              value: formatCurrency(kpi.business.gmv),
              href: "/admin/booking-requests",
              emphasize: true,
            },
            {
              label: "Commission",
              value: formatCurrency(kpi.business.platformCommission),
              href: "/admin/booking-requests",
            },
            {
              label: "Take rate",
              value: `${kpi.business.takeRate}%`,
              href: "/admin/pricing",
            },
            {
              label: "Owner payout",
              value: formatCurrency(kpi.business.ownerPayoutBooked),
              hint: "Booked, not settled",
            },
            {
              label: "Active users",
              value: kpi.business.activeUsers,
              href: "/admin/owners",
            },
            {
              label: "Collected",
              value: formatCurrency(kpi.payments.successfulAmount),
              hint: `${kpi.payments.successfulCount} done`,
            },
          ]}
        />

        <MetricBoard
          title="Users"
          description="Publishers and advertisers"
          icon={Users}
          items={[
            {
              label: "Active publishers",
              value: kpi.users.activePublishers,
              href: "/admin/owners",
              emphasize: true,
            },
            {
              label: "Active advertisers",
              value: kpi.users.activeAdvertisers,
              href: "/admin/advertisers",
              emphasize: true,
            },
            {
              label: "New publishers",
              value: kpi.users.newPublishers,
              hint: "This month",
            },
            {
              label: "New advertisers",
              value: kpi.users.newAdvertisers,
              hint: "This month",
            },
            {
              label: "Inactive firms",
              value: kpi.users.churned,
              hint: "Churn proxy",
            },
            {
              label: "Pending KYC",
              value: kpi.moderation.pendingKyc,
              href: "/admin/owners",
            },
          ]}
        />

        <MetricBoard
          title="Bookings"
          description="Marketplace booking requests"
          icon={Megaphone}
          items={[
            {
              label: "New this month",
              value: kpi.bookings.newThisMonth,
              href: "/admin/booking-requests",
              emphasize: true,
            },
            {
              label: "Completed",
              value: kpi.bookings.completed,
              hint: "Paid / confirmed",
            },
            {
              label: "Cancel rate",
              value: `${kpi.bookings.cancellationRate}%`,
              hint: `${kpi.bookings.cancelled} closed early`,
            },
            {
              label: "Avg order value",
              value: formatCurrency(kpi.bookings.averageOrderValue),
            },
            {
              label: "Open requests",
              value: kpi.moderation.pendingRequests,
              href: "/admin/booking-requests",
            },
            {
              label: "Awaiting payment",
              value: kpi.payments.settlementPending,
            },
          ]}
        />

        <MetricBoard
          title="Payments"
          description="Payment records on booking requests"
          icon={CreditCard}
          items={[
            {
              label: "Successful",
              value: formatCurrency(kpi.payments.successfulAmount),
              href: "/admin/booking-requests",
              emphasize: true,
            },
            {
              label: "Failed",
              value: kpi.payments.failed,
            },
            {
              label: "Refunds",
              value: kpi.payments.refunds,
            },
            {
              label: "Pending",
              value: kpi.payments.pending,
              hint: "Pending / processing",
            },
            {
              label: "Settlement pending",
              value: kpi.payments.settlementPending,
            },
            {
              label: "Completed count",
              value: kpi.payments.successfulCount,
            },
          ]}
        />

        <MetricBoard
          title="Inventory"
          description="Listings and supply"
          icon={Package}
          items={[
            {
              label: "Total listings",
              value: kpi.inventory.totalListings,
              href: "/admin/listings",
              emphasize: true,
            },
            {
              label: "Approved",
              value: kpi.inventory.approved,
            },
            {
              label: "Rejected",
              value: kpi.inventory.rejected,
            },
            {
              label: "Listed spaces",
              value: kpi.inventory.listed,
            },
            {
              label: "Available now",
              value: kpi.inventory.available,
            },
            {
              label: "Fill rate",
              value: `${kpi.inventory.fillRate}%`,
              hint: "Listed booked today",
            },
          ]}
        />

        <div className={cn(SURFACE, "overflow-hidden")}>
          <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C4BFF]/10 to-[#8C47EE]/10 text-[#4C4BFF]">
              <Layers className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">Platform pulse</h2>
              <p className="text-xs text-slate-500">Inventory footprint and firm counts</p>
            </div>
          </header>
          <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
            {[
              { label: "Owner firms", value: stats.owners, href: "/admin/owners" },
              { label: "Advertisers", value: stats.advertisers, href: "/admin/advertisers" },
              { label: "Ad spaces", value: stats.adSpacesTotal, hint: `${stats.adSpacesListed} listed` },
              { label: "Cities", value: stats.citiesWithAdSpaces },
            ].map((cell) => {
              const body = (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    {cell.label}
                  </p>
                  <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">{cell.value}</p>
                  {"hint" in cell && cell.hint ? (
                    <p className="mt-1 text-[11px] text-slate-400">{cell.hint}</p>
                  ) : null}
                </>
              );
              return cell.href ? (
                <Link key={cell.label} href={cell.href} className="bg-white px-4 py-4 hover:bg-slate-50">
                  {body}
                </Link>
              ) : (
                <div key={cell.label} className="bg-white px-4 py-4">
                  {body}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Revenue mix" description="Commission stack vs collected" icon={IndianRupee}>
          <RevenueBars
            commission={insights.commission.commissionAmount}
            gst={insights.commission.gstOnCommission}
            ownerPayout={insights.commission.ownerPayout}
            collected={insights.commission.collectedPayments}
          />
        </Panel>
        <Panel title="Commission split" description="Approved / paid / confirmed requests" icon={Receipt}>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <CommissionMixChart data={commissionSlices} />
            <div className="rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-slate-200/70 lg:min-w-[180px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Gross booked
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-slate-900">
                {formatCurrency(insights.commission.customerPrice)}
              </p>
            </div>
          </div>
        </Panel>
        <Panel title="Revenue by city" description="Booked marketplace GMV" icon={MapPin}>
          <GeographicRevenueChart data={kpi.geographic} />
        </Panel>
        <Panel title="Inventory by city" description="Ad spaces count" icon={MapPin}>
          <CitiesBarChart data={insights.popularCities} />
        </Panel>
        <Panel title="Firm growth" description="New orgs over 6 months" icon={TrendingUp}>
          <FirmGrowthChart data={insights.growth} />
        </Panel>
        <Panel title="Formats" description="Ad spaces by type" icon={PieChart}>
          <TypesDonut data={insights.popularTypes} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Top advertisers"
          description="By booked spend"
          icon={Users}
          bodyClassName="p-0"
          aside={<ViewAll href="/admin/advertisers" />}
        >
          {kpi.topAdvertisers.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">No priced advertiser bookings yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {kpi.topAdvertisers.map((row, index) => (
                <li key={row.id}>
                  <Link
                    href={`/admin/advertisers/${row.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50/80"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4C4BFF]/10 text-xs font-semibold text-[#4C4BFF]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-500">
                        {row.bookings} bookings · {row.repeatRate}% repeat
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                      {formatCurrency(row.spend)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Top publishers"
          description="By booked owner payout"
          icon={Building2}
          bodyClassName="p-0"
          aside={<ViewAll href="/admin/owners" />}
        >
          {kpi.topPublishers.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">No publisher earnings yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {kpi.topPublishers.map((row, index) => (
                <li key={row.id}>
                  <Link
                    href={`/admin/owners/${row.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50/80"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8C47EE]/10 text-xs font-semibold text-[#8C47EE]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-500">
                        {row.inventory} spaces · {row.listed} listed · {row.fillRate}% listed
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                      {formatCurrency(row.revenue)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Recent transactions"
        description="Latest payments"
        icon={CreditCard}
        bodyClassName="p-0"
        aside={<ViewAll href="/admin/booking-requests" />}
      >
        {kpi.recentTransactions.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-500">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className="px-5 py-3">Space / booking</th>
                  <th className="px-5 py-3">Advertiser</th>
                  <th className="px-5 py-3">Publisher</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kpi.recentTransactions.map((tx) => (
                  <tr key={tx.id} className={TABLE_ROW}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{tx.spaceName}</p>
                      <p className="text-xs text-slate-400">{formatDate(tx.at)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/advertisers/${tx.advertiserId}`}
                        className="text-slate-700 hover:text-[#4C4BFF]"
                      >
                        {tx.advertiser}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/owners/${tx.publisherId}`}
                        className="text-slate-700 hover:text-[#4C4BFF]"
                      >
                        {tx.publisher}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-semibold tabular-nums text-slate-900">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={tx.status === "completed" ? "success" : "warning"}>
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 capitalize text-slate-600">
                      {tx.method.replaceAll("_", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Newest owners"
          description="Latest publisher firms"
          icon={Building2}
          bodyClassName="p-0"
          aside={<ViewAll href="/admin/owners" />}
        >
          {owners.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">No owner firms yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {owners.map((org) => (
                <li key={org.id}>
                  <Link
                    href={`/admin/owners/${org.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-slate-50/80"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{org.name}</p>
                      <p className="text-xs text-slate-500">
                        {org.adSpaceCount} spaces · {org.listedCount} listed
                      </p>
                    </div>
                    {verificationBadge(org.verificationStatus)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Newest advertisers"
          description="Latest advertiser firms"
          icon={Users}
          bodyClassName="p-0"
          aside={<ViewAll href="/admin/advertisers" />}
        >
          {advertisers.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">No advertiser firms yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {advertisers.map((org) => (
                <li key={org.id}>
                  <Link
                    href={`/admin/advertisers/${org.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-slate-50/80"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{org.name}</p>
                      <p className="text-xs text-slate-500">
                        {org.campaignCount} campaigns · {org.openRequestCount} open
                      </p>
                    </div>
                    <Badge variant={org.hasGst ? "success" : "muted"}>
                      {org.hasGst ? "GST" : "no GST"}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Ops health"
        description="Queue depth only — infrastructure monitoring is Phase 3"
        icon={Activity}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Listing queue", value: kpi.moderation.pendingListings },
            { label: "Booking queue", value: kpi.moderation.pendingRequests },
            { label: "Payment failures", value: kpi.payments.failed },
            { label: "Open queries", value: kpi.moderation.openConcerns },
          ].map((cell) => (
            <div
              key={cell.label}
              className="rounded-xl bg-slate-50 px-4 py-3 text-center ring-1 ring-slate-200/70"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                {cell.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{cell.value}</p>
            </div>
          ))}
        </div>
      </Panel>

      <p className="text-xs text-slate-400">
        Snapshot as of {formatDate(new Date())}. Uses booking-request and payment records.
      </p>
    </div>
  );
}
