import Link from "next/link";
import { getLiveSession, redirectToRoleArea } from "@/lib/auth/live-session";
import { getAdvertiserDashboard } from "@/lib/services/advertiser-dashboard.service";
import { Badge } from "@/components/ui";
import { Panel, SURFACE } from "@/components/dashboard/DashboardUI";
import { BannerAccountActions } from "@/components/layout/BannerAccountActions";
import {
  LazyCityReachChart as CityReachChart,
  LazyCostEfficiencyChart as CostEfficiencyChart,
  LazySpendByTypeChart as SpendByTypeChart,
  LazySpendTrendChart as SpendTrendChart,
  LazyStatusDonut as StatusDonut,
  LazyCampaignBudgetChart as CampaignBudgetChart,
} from "@/components/charts/lazy";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  FileImage,
  Gauge,
  Hourglass,
  IndianRupee,
  LayoutGrid,
  Lightbulb,
  MapPin,
  Megaphone,
  PieChart,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  XCircle,
  Activity,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { BookingRequestStatus } from "@prisma/client";

const TONE_STYLES = {
  rose: {
    row: "bg-rose-50/80 ring-rose-100 hover:bg-rose-50",
    badge: "bg-rose-100 text-rose-700",
    icon: "bg-rose-100 text-rose-600",
    cta: "text-rose-700",
  },
  amber: {
    row: "bg-amber-50/80 ring-amber-100 hover:bg-amber-50",
    badge: "bg-amber-100 text-amber-800",
    icon: "bg-amber-100 text-amber-600",
    cta: "text-amber-800",
  },
  orange: {
    row: "bg-orange-50/80 ring-orange-100 hover:bg-orange-50",
    badge: "bg-orange-100 text-orange-800",
    icon: "bg-orange-100 text-orange-600",
    cta: "text-orange-800",
  },
  violet: {
    row: "bg-[#8C47EE]/8 ring-[#8C47EE]/15 hover:bg-[#8C47EE]/12",
    badge: "bg-[#8C47EE]/15 text-[#6B2FD4]",
    icon: "bg-[#8C47EE]/15 text-[#8C47EE]",
    cta: "text-[#6B2FD4]",
  },
  emerald: {
    row: "bg-emerald-50/80 ring-emerald-100 hover:bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-800",
    icon: "bg-emerald-100 text-emerald-600",
    cta: "text-emerald-800",
  },
  indigo: {
    row: "bg-[#4C4BFF]/8 ring-[#4C4BFF]/15 hover:bg-[#4C4BFF]/12",
    badge: "bg-[#4C4BFF]/12 text-[#4C4BFF]",
    icon: "bg-[#4C4BFF]/12 text-[#4C4BFF]",
    cta: "text-[#4C4BFF]",
  },
  slate: {
    row: "bg-slate-50 ring-slate-200/80 hover:bg-slate-100/80",
    badge: "bg-slate-200/70 text-slate-700",
    icon: "bg-slate-200/80 text-slate-600",
    cta: "text-slate-700",
  },
} as const;

type ToneKey = keyof typeof TONE_STYLES;

const ACTION_ICONS: Record<string, LucideIcon> = {
  pay: CreditCard,
  creative: FileImage,
  rejected: XCircle,
  approval: Clock,
  expiring: Hourglass,
};

const REC_ICONS: Record<string, LucideIcon> = {
  "rec-pay": AlertTriangle,
  "rec-camp": Megaphone,
  "rec-space": CheckCircle2,
  "rec-format": Lightbulb,
  "rec-wallet": Wallet,
  "rec-browse": LayoutGrid,
};

const STATUS_LABEL: Record<BookingRequestStatus, string> = {
  draft: "Draft",
  submitted: "Pending approval",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  payment_pending: "Payment due",
  paid: "Paid",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  expired: "Expired",
};

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
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  items: MetricItem[];
}) {
  return (
    <Panel title={title} description={description} icon={Icon} bodyClassName="p-0">
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
          return item.href ? (
            <Link key={item.label} href={item.href} className="block px-4 py-4 hover:bg-slate-50/80">
              {inner}
            </Link>
          ) : (
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

export default async function AdvertiserDashboardPage() {
  const { session, organizationName } = redirectToRoleArea(
    await getLiveSession(),
    "advertiser"
  );

  const data = await getAdvertiserDashboard(session.organizationId);
  const greeting = data.greetingName || organizationName || "Advertiser";

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4C4BFF] via-[#5E49F6] to-[#8C47EE] px-7 py-7 text-white shadow-[0_20px_40px_-20px_rgba(76,75,255,0.6)] sm:px-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-[#F06B3B]/30 blur-3xl" />
        <BannerAccountActions className="absolute right-5 top-5 z-10 sm:right-7" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Advertiser</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome, {greeting}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/80">
            Campaigns, bookings, spend, and what needs your attention next
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/advertiser/campaigns"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#4C4BFF] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-white/95"
            >
              <Plus className="h-4 w-4" /> Create campaign
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-white/25"
            >
              Browse ad spaces <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/advertiser/wallet"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-white/25"
            >
              <Wallet className="h-4 w-4" /> Add funds
            </Link>
          </div>
          <div className="mt-6 grid gap-5 border-t border-white/15 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <HeroStat
              label="Active campaigns"
              value={data.kpis.activeCampaigns}
              hint={`${data.kpis.totalCampaigns} total`}
            />
            <HeroStat
              label="Total spend"
              value={formatCurrency(data.kpis.totalSpend)}
              hint="Completed payments"
            />
            <HeroStat
              label="Est. daily reach"
              value={data.kpis.estimatedReach.toLocaleString("en-IN")}
              hint="Footfall of approved spaces"
            />
            <HeroStat
              label="Avg cost / 1k"
              value={data.kpis.avgCpm != null ? formatCurrency(data.kpis.avgCpm) : "—"}
              hint="Footfall CPM proxy (not CTR/ROAS)"
            />
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <Panel
            title="Spend vs booked value"
            description="Paid amounts and booked request value over 6 months"
            icon={TrendingUp}
          >
            <SpendTrendChart data={data.spendTrend} />
          </Panel>
          <Panel
            title="Campaign budget use"
            description="How much of each campaign budget is already booked"
            icon={Target}
          >
            <CampaignBudgetChart data={data.charts.campaignBudget} />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Pending actions" description="What to clear next" icon={Clock}>
            {data.pendingActions.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">You are all caught up.</p>
            ) : (
              <ul className="space-y-2.5">
                {data.pendingActions.map((action) => {
                  const tone = TONE_STYLES[action.tone as ToneKey] ?? TONE_STYLES.slate;
                  const Icon = ACTION_ICONS[action.id] ?? AlertTriangle;
                  return (
                    <li key={action.id}>
                      <Link
                        href={action.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3.5 py-3 ring-1 transition",
                          tone.row
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            tone.icon
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]",
                              tone.badge
                            )}
                          >
                            {action.label}
                          </span>
                          <p className="mt-1 text-sm font-medium text-slate-800">{action.title}</p>
                        </div>
                        <span className={cn("shrink-0 text-xs font-semibold", tone.cta)}>Open</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Recommendations" description="Suggested next steps" icon={Sparkles}>
            <ul className="space-y-2.5">
              {data.recommendations.map((rec) => {
                const tone = TONE_STYLES[rec.tone as ToneKey] ?? TONE_STYLES.indigo;
                const Icon = REC_ICONS[rec.id] ?? Lightbulb;
                return (
                  <li key={rec.id}>
                    <Link
                      href={rec.href}
                      className={cn(
                        "flex items-start gap-3 rounded-xl px-3.5 py-3 ring-1 transition",
                        tone.row
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          tone.icon
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]",
                            tone.badge
                          )}
                        >
                          {rec.label}
                        </span>
                        <p className="mt-1 text-sm font-medium leading-snug text-slate-800">
                          {rec.title}
                        </p>
                      </div>
                      <ArrowUpRight className={cn("mt-1 h-4 w-4 shrink-0", tone.cta)} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <MetricBoard
          title="Performance KPIs"
          description="Spend and reach proxies — no click/conversion tracking in Phase 1"
          icon={Target}
          items={[
            {
              label: "Active campaigns",
              value: data.kpis.activeCampaigns,
              href: "/advertiser/campaigns",
              emphasize: true,
            },
            {
              label: "Total spend",
              value: formatCurrency(data.kpis.totalSpend),
              href: "/advertiser/payments",
              emphasize: true,
            },
            {
              label: "Live bookings",
              value: data.kpis.liveBookings,
              href: "/advertiser/booking-requests",
            },
            {
              label: "Est. reach / day",
              value: data.kpis.estimatedReach.toLocaleString("en-IN"),
              hint: "Sum of space footfall",
            },
            {
              label: "Avg CPM proxy",
              value: data.kpis.avgCpm != null ? formatCurrency(data.kpis.avgCpm) : "—",
              hint: "Cost per 1k footfall",
            },
            {
              label: "Pending approval",
              value: data.kpis.pendingApproval,
              href: "/advertiser/booking-requests",
            },
          ]}
        />

        <MetricBoard
          title="Campaign status"
          description="Derived from campaign dates and booking requests"
          icon={Megaphone}
          items={[
            { label: "Live", value: data.campaignStatus.live, emphasize: true },
            { label: "Scheduled", value: data.campaignStatus.scheduled },
            { label: "Pending approval", value: data.campaignStatus.pendingApproval },
            { label: "Completed", value: data.campaignStatus.completed },
            { label: "Rejected", value: data.campaignStatus.rejected },
            { label: "Draft / other", value: data.campaignStatus.draft },
          ]}
        />

        <MetricBoard
          title="Wallet / payments"
          description="Balance and payment pipeline"
          icon={Wallet}
          items={[
            {
              label: "Available balance",
              value: formatCurrency(data.wallet.balance),
              href: "/advertiser/wallet",
              emphasize: true,
            },
            {
              label: "Pending payments",
              value: data.wallet.pendingPayments,
              hint: formatCurrency(data.wallet.pendingAmount),
              href: "/advertiser/payments",
            },
            {
              label: "Payment due (bookings)",
              value: data.kpis.paymentDue,
              href: "/advertiser/payments",
            },
            {
              label: "Completed payments",
              value: data.wallet.completedCount,
            },
            {
              label: "Refunds",
              value: data.wallet.refunds,
              hint: formatCurrency(data.wallet.refundAmount),
            },
            {
              label: "Total bookings",
              value: data.totals.bookings,
              href: "/advertiser/booking-requests",
            },
          ]}
        />

        <Panel title="Booking status mix" description="Where your booking requests stand" icon={PieChart}>
          <StatusDonut data={data.statusSlices} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Upcoming bookings"
          description="Next live and scheduled ad spaces"
          icon={CalendarClock}
          bodyClassName="p-0"
          aside={
            <Link
              href="/advertiser/booking-requests"
              className="text-sm font-semibold text-[#4C4BFF] hover:underline"
            >
              View all
            </Link>
          }
        >
          {data.upcomingBookings.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No upcoming bookings.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.upcomingBookings.map((b) => (
                <li key={b.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{b.spaceName}</p>
                    <p className="text-xs text-slate-500">
                      {b.format.replaceAll("_", " ")}
                      {b.city ? ` · ${b.city}` : ""} · {b.publisher}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatDate(b.startDate)} → {formatDate(b.endDate)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-900">
                      {formatCurrency(b.amount)}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-[#4C4BFF]">{b.countdown}</p>
                    <div className="mt-1 flex justify-end">
                      <Badge variant="default">{STATUS_LABEL[b.status]}</Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent activity"
          description="Bookings and payments"
          icon={Activity}
          bodyClassName="p-0"
        >
          {data.recentActivity.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No recent activity.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentActivity.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-slate-50/80"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{item.title}</p>
                      <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
                    </div>
                    <p className="shrink-0 text-xs text-slate-400">{formatDate(item.at)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Top campaigns"
          description="By booked / paid spend"
          icon={Megaphone}
          bodyClassName="p-0"
          aside={
            <Link href="/advertiser/campaigns" className="text-sm font-semibold text-[#4C4BFF] hover:underline">
              View all
            </Link>
          }
        >
          {data.topCampaigns.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              Link bookings to campaigns to see leaders here.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.topCampaigns.map((row, index) => (
                <li key={row.id}>
                  <Link
                    href="/advertiser/campaigns"
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50/80"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4C4BFF]/10 text-xs font-semibold text-[#4C4BFF]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-500">
                        {row.bookings} bookings · reach {row.reach.toLocaleString("en-IN")}
                        {row.cpm != null ? ` · CPM ${formatCurrency(row.cpm)}` : ""}
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
          title="Top ad spaces"
          description="By spend — publisher and format"
          icon={LayoutGrid}
          bodyClassName="p-0"
          aside={
            <Link href="/marketplace" className="text-sm font-semibold text-[#4C4BFF] hover:underline">
              Browse
            </Link>
          }
        >
          {data.topSpaces.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No approved spaces yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.topSpaces.map((row, index) => (
                <li key={`${row.name}-${index}`} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8C47EE]/10 text-xs font-semibold text-[#8C47EE]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-500">
                      {row.publisher} · {row.format.replaceAll("_", " ")}
                      {row.cpm != null ? ` · CPM ${formatCurrency(row.cpm)}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                    {formatCurrency(row.spend)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Spend by format" description="Approved booking value" icon={PieChart}>
          <SpendByTypeChart data={data.charts.typeSlices} />
        </Panel>
        <Panel
          title="Audience · locations"
          description="Footfall reach by city (no device/age data yet)"
          icon={MapPin}
        >
          <CityReachChart data={data.charts.cityReach} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Cost efficiency"
          description="Lower cost per 1,000 footfall is better"
          icon={Gauge}
        >
          <CostEfficiencyChart data={data.charts.efficiency} />
        </Panel>

        <div className={cn(SURFACE, "overflow-hidden p-5")}>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C4BFF]/10 to-[#8C47EE]/10 text-[#4C4BFF]">
              <CreditCard className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Quick links</h2>
              <p className="text-xs text-slate-500">Jump to common advertiser tasks</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { href: "/advertiser/campaigns", label: "Campaigns", icon: Megaphone },
              { href: "/advertiser/booking-requests", label: "Bookings", icon: CalendarClock },
              { href: "/advertiser/payments", label: "Payments", icon: IndianRupee },
              { href: "/advertiser/wallet", label: "Wallet", icon: Wallet },
              { href: "/marketplace", label: "Marketplace", icon: LayoutGrid },
              { href: "/advertiser/wishlist", label: "Wishlist", icon: Target },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200/70 transition hover:bg-white hover:text-[#4C4BFF]"
              >
                <link.icon className="h-4 w-4 text-[#4C4BFF]" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Snapshot as of {formatDate(new Date())}. Impressions, clicks, CTR, CPA, and ROAS are not tracked in Phase 1 — reach uses ad-space footfall proxies.
      </p>
    </div>
  );
}
