import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui";
import { EmptyState, Panel, TotalCard } from "@/components/advertiser/AdvertiserUI";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Hourglass,
  IndianRupee,
  LayoutGrid,
  Megaphone,
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

  const [requests, spent, expiringCampaigns] = await Promise.all([
    prisma.bookingRequest.findMany({
      where: { organizationId: orgId },
      orderBy: { endDate: "asc" },
      include: { adSpace: { select: { name: true, city: true } }, campaign: { select: { name: true } } },
    }),
    prisma.payment.aggregate({
      where: { organizationId: orgId, status: "completed" },
      _sum: { amount: true },
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
          value={formatCurrency(spent._sum.amount ?? 0)}
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
