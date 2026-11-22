import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui";
import { EmptyState, Panel, TotalCard } from "@/components/advertiser/AdvertiserUI";
import {
  BookingTimeline,
  CampaignBudgetChart,
  CityReachChart,
  CostEfficiencyChart,
  SpendByTypeChart,
  SpendTrendChart,
  StatusDonut,
  type CampaignPoint,
  type CityPoint,
  type EfficiencyPoint,
  type ScheduleRow,
  type Slice,
  type SpendPoint,
} from "@/components/advertiser/DashboardCharts";
import {
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CalendarRange,
  Gauge,
  CheckCircle2,
  Clock,
  Hourglass,
  IndianRupee,
  LayoutGrid,
  MapPin,
  Megaphone,
  PieChart,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { BookingRequestStatus } from "@prisma/client";

const PENDING: BookingRequestStatus[] = ["submitted", "under_review"];
const APPROVED: BookingRequestStatus[] = ["approved", "payment_pending", "paid", "confirmed"];
const LIVE: BookingRequestStatus[] = ["paid", "confirmed"];

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

const TYPE_STYLE: Record<string, { label: string; color: string }> = {
  billboard: { label: "Billboard", color: "#4C4BFF" },
  digital: { label: "Digital", color: "#8C47EE" },
  mall: { label: "Mall", color: "#10b981" },
  vehicle: { label: "Vehicle", color: "#F06B3B" },
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function statusVariant(status: BookingRequestStatus): "success" | "warning" | "default" | "muted" {
  if (status === "rejected" || status === "cancelled" || status === "expired") return "muted";
  if (LIVE.includes(status) || status === "approved") return "success";
  if (PENDING.includes(status) || status === "payment_pending") return "warning";
  return "default";
}

export default async function AdvertiserDashboardPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const orgId = session.organizationId;
  const now = new Date();
  const inSevenDays = new Date(now);
  inSevenDays.setDate(inSevenDays.getDate() + 7);

  const [requests, payments, campaigns, expiringCampaigns] = await Promise.all([
    prisma.bookingRequest.findMany({
      where: { organizationId: orgId },
      orderBy: { endDate: "asc" },
      include: {
        adSpace: { select: { name: true, city: true, adSpaceType: true, footfall: true } },
        campaign: { select: { name: true } },
      },
    }),
    prisma.payment.findMany({
      where: { organizationId: orgId, status: "completed" },
      select: { amount: true, paidAt: true, createdAt: true },
    }),
    prisma.campaign.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, budget: true },
    }),
    prisma.campaign.findMany({
      where: {
        organizationId: orgId,
        endDate: { gte: now, lte: inSevenDays },
      },
      orderBy: { endDate: "asc" },
      select: { id: true, name: true, endDate: true },
    }),
  ]);

  const spentTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const approvedRequests = requests.filter((request) => APPROVED.includes(request.status));

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 3 + index, 1);
    return {
      key: monthKey(date),
      label: date.toLocaleString("en-IN", { month: "short" }),
      start: date.getTime(),
    };
  });
  const windowStart = months[0].start;
  const windowEnd = new Date(now.getFullYear(), now.getMonth() + 3, 1).getTime();
  const spendByMonth = new Map<string, SpendPoint>(
    months.map((month) => [month.key, { month: month.label, paid: 0, booked: 0 }])
  );
  for (const payment of payments) {
    const point = spendByMonth.get(monthKey(payment.paidAt ?? payment.createdAt));
    if (point) point.paid += payment.amount;
  }
  for (const request of approvedRequests) {
    const point = spendByMonth.get(monthKey(request.startDate));
    if (point) point.booked += request.customerPrice;
  }
  const spendTrend = [...spendByMonth.values()];

  const statusSlices: Slice[] = [
    { name: "In review", value: 0, color: "#f59e0b" },
    { name: "Approved", value: 0, color: "#10b981" },
    { name: "Payment due", value: 0, color: "#f43f5e" },
    { name: "Live", value: 0, color: "#4C4BFF" },
    { name: "Rejected", value: 0, color: "#94a3b8" },
    { name: "Closed", value: 0, color: "#cbd5e1" },
  ];
  for (const request of requests) {
    const status = request.status;
    const index =
      status === "submitted" || status === "under_review" || status === "draft"
        ? 0
        : status === "approved"
          ? 1
          : status === "payment_pending"
            ? 2
            : LIVE.includes(status)
              ? 3
              : status === "rejected"
                ? 4
                : 5;
    statusSlices[index].value += 1;
  }
  const decided = requests.filter((request) => request.status !== "draft" && !PENDING.includes(request.status));
  const approvalRate = decided.length
    ? Math.round(
        (decided.filter((request) => APPROVED.includes(request.status)).length / decided.length) * 100
      )
    : null;

  const typeSlices: Slice[] = Object.entries(TYPE_STYLE).map(([type, style]) => ({
    name: style.label,
    color: style.color,
    value: approvedRequests
      .filter((request) => request.adSpace.adSpaceType === type)
      .reduce((sum, request) => sum + request.customerPrice, 0),
  }));

  const reachByCity = new Map<string, number>();
  for (const request of approvedRequests) {
    if (!request.adSpace.footfall) continue;
    const city = request.adSpace.city || "Other";
    reachByCity.set(city, (reachByCity.get(city) ?? 0) + request.adSpace.footfall);
  }
  const cityReach: CityPoint[] = [...reachByCity.entries()]
    .map(([city, footfall]) => ({ city, footfall }))
    .sort((a, b) => b.footfall - a.footfall)
    .slice(0, 6);
  const totalReach = cityReach.reduce((sum, point) => sum + point.footfall, 0);

  const campaignBudget: CampaignPoint[] = campaigns
    .map((campaign) => ({
      name: campaign.name,
      budget: campaign.budget ?? 0,
      booked: approvedRequests
        .filter((request) => request.campaignId === campaign.id)
        .reduce((sum, request) => sum + request.customerPrice, 0),
    }))
    .filter((point) => point.budget > 0 || point.booked > 0)
    .slice(0, 6);

  const scheduleRows: ScheduleRow[] = requests
    .filter(
      (request) =>
        !["rejected", "cancelled", "expired"].includes(request.status) &&
        request.endDate.getTime() >= windowStart &&
        request.startDate.getTime() < windowEnd
    )
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .map((request) => {
      const slice = LIVE.includes(request.status)
        ? statusSlices[3]
        : request.status === "payment_pending"
          ? statusSlices[2]
          : request.status === "approved"
            ? statusSlices[1]
            : statusSlices[0];
      return {
        id: request.id,
        name: request.adSpace.name,
        start: request.startDate.getTime(),
        end: request.endDate.getTime(),
        status: slice.name,
        color: slice.color,
      };
    });

  const efficiency: EfficiencyPoint[] = approvedRequests
    .filter((request) => request.adSpace.footfall)
    .map((request) => ({
      name: request.adSpace.name,
      cost: Math.round(request.customerPrice / ((request.adSpace.footfall ?? 1) / 1000)),
    }))
    .sort((a, b) => a.cost - b.cost)
    .slice(0, 6);

  const bookings = requests.length;
  const pending = requests.filter((request) => PENDING.includes(request.status)).length;
  const approved = requests.filter((request) => APPROVED.includes(request.status)).length;
  const paymentDue = requests.filter((request) => request.status === "payment_pending").length;
  const rejected = requests.filter((request) => request.status === "rejected").length;
  const expiringBookings = requests.filter(
    (request) =>
      LIVE.includes(request.status) &&
      request.endDate >= now &&
      request.endDate <= inSevenDays
  );

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4C4BFF] via-[#5E49F6] to-[#8C47EE] px-7 py-8 text-white shadow-[0_20px_40px_-20px_rgba(76,75,255,0.6)] sm:px-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-[#F06B3B]/30 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Advertiser</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Overview</h1>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              Your advertisements, approvals, spend, and what is ending soon
            </p>
          </div>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 self-start rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#4C4BFF] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-white/95 sm:self-auto"
          >
            Browse marketplace
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TotalCard label="Bookings" value={bookings} icon={CalendarClock} accent="indigo" href="/advertiser/booking-requests" />
        <TotalCard label="Pending approval" value={pending} icon={Clock} accent="amber" href="/advertiser/booking-requests" />
        <TotalCard label="Approved" value={approved} icon={CheckCircle2} accent="emerald" href="/advertiser/booking-requests" />
        <TotalCard
          label="Spent"
          value={formatCurrency(spentTotal)}
          sub="Paid on advertisements"
          icon={IndianRupee}
          accent="violet"
          href="/advertiser/payments"
        />
        <TotalCard label="Payment due" value={paymentDue} icon={IndianRupee} accent="rose" href="/advertiser/payments" />
        <TotalCard label="Rejected" value={rejected} icon={XCircle} accent="slate" href="/advertiser/booking-requests" />
        <TotalCard
          label="Expiring"
          value={expiringBookings.length + expiringCampaigns.length}
          sub="Within 7 days"
          icon={Megaphone}
          accent="orange"
          href="/advertiser/campaigns"
          className="sm:col-span-2"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          title="Spend by month"
          description="Paid amounts and booked value, last 3 months and next 2"
          icon={TrendingUp}
          className="lg:col-span-3"
        >
          <SpendTrendChart data={spendTrend} />
        </Panel>
        <Panel
          title="Booking status"
          description="Where your booking requests stand"
          icon={PieChart}
          className="lg:col-span-2"
          aside={
            approvalRate !== null ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                {approvalRate}% approved
              </span>
            ) : null
          }
        >
          <StatusDonut data={statusSlices} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Spend by ad type" description="Approved booking value per format" icon={BarChart3}>
          <SpendByTypeChart data={typeSlices} />
        </Panel>
        <Panel
          title="Reach by city"
          description="Daily footfall of your approved ad spaces"
          icon={MapPin}
          aside={
            totalReach > 0 ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 tabular-nums">
                {totalReach.toLocaleString("en-IN")}/day
              </span>
            ) : null
          }
        >
          <CityReachChart data={cityReach} />
        </Panel>
        <Panel title="Campaign budget" description="Budget against booked value" icon={Target}>
          <CampaignBudgetChart data={campaignBudget} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          title="Booking schedule"
          description="When each ad space runs, last 3 months and next 2"
          icon={CalendarRange}
          className="lg:col-span-3"
        >
          <BookingTimeline
            rows={scheduleRows}
            windowStart={windowStart}
            windowEnd={windowEnd}
            today={now.getTime()}
            months={months.map(({ label, start }) => ({ label, start }))}
          />
        </Panel>
        <Panel
          title="Cost per 1,000 footfall"
          description="Booked price per 1,000 daily footfall, lower is better"
          icon={Gauge}
          className="lg:col-span-2"
        >
          <CostEfficiencyChart data={efficiency} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Panel title="Advertisements" description="Ad spaces you have requested or booked" icon={LayoutGrid}>
            {requests.length === 0 ? (
              <EmptyState icon={LayoutGrid} text="No advertisements yet." />
            ) : (
              <ul className="-mx-3 divide-y divide-slate-100">
                {requests.map((request) => {
                  const expiring = expiringBookings.some((item) => item.id === request.id);
                  return (
                    <li
                      key={request.id}
                      className="flex items-start justify-between gap-4 rounded-xl px-3 py-3.5 transition hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{request.adSpace.name}</p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {request.adSpace.city ? `${request.adSpace.city} · ` : ""}
                          {formatDate(request.startDate)} – {formatDate(request.endDate)}
                        </p>
                        {request.campaign ? (
                          <p className="mt-0.5 text-xs text-slate-400">{request.campaign.name}</p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(request.customerPrice)}
                        </p>
                        <div className="mt-1.5 flex justify-end gap-1">
                          <Badge variant={statusVariant(request.status)}>{STATUS_LABEL[request.status]}</Badge>
                          {expiring ? <Badge variant="warning">Expiring</Badge> : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel title="Expiring soon" description="Bookings and campaigns ending in the next 7 days" icon={Hourglass}>
            {expiringBookings.length === 0 && expiringCampaigns.length === 0 ? (
              <EmptyState icon={Hourglass} text="Nothing is expiring this week." />
            ) : (
              <ul className="space-y-2">
                {expiringBookings.map((request) => (
                  <li
                    key={request.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-orange-50/60 px-3 py-2.5 text-sm ring-1 ring-orange-100"
                  >
                    <span className="truncate font-medium text-slate-900">{request.adSpace.name}</span>
                    <span className="shrink-0 text-orange-700">Ends {formatDate(request.endDate)}</span>
                  </li>
                ))}
                {expiringCampaigns.map((campaign) => (
                  <li
                    key={campaign.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-slate-200/70"
                  >
                    <span className="truncate font-medium text-slate-900">{campaign.name}</span>
                    <span className="shrink-0 text-slate-500">
                      Campaign ends {campaign.endDate ? formatDate(campaign.endDate) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
