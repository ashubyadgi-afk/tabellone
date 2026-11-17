import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader, StatCard, Badge, Card } from "@/components/ui";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  IndianRupee,
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
    <div>
      <PageHeader
        title="Overview"
        description="Your advertisements, approvals, spend, and what is ending soon"
        action={
          <Link
            href="/marketplace"
            className="rounded-xl bg-[#4C4BFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3d3ce8]"
          >
            Browse marketplace
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Bookings" value={bookings} icon={CalendarClock} accent="blue" href="/advertiser/booking-requests" />
        <StatCard label="Pending approval" value={pending} icon={Clock} accent="amber" href="/advertiser/booking-requests" />
        <StatCard label="Approved" value={approved} icon={CheckCircle2} accent="emerald" href="/advertiser/booking-requests" />
        <StatCard
          label="Spent"
          value={formatCurrency(spent._sum.amount ?? 0)}
          sub="Paid on advertisements"
          icon={IndianRupee}
          accent="violet"
          href="/advertiser/payments"
        />
        <StatCard label="Payment due" value={paymentDue} icon={IndianRupee} accent="rose" href="/advertiser/payments" />
        <StatCard label="Rejected" value={rejected} icon={XCircle} accent="slate" href="/advertiser/booking-requests" />
        <StatCard
          label="Expiring"
          value={expiringBookings.length + expiringCampaigns.length}
          sub="Within 7 days"
          icon={Megaphone}
          accent="amber"
          href="/advertiser/campaigns"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold text-slate-900">Advertisements</h2>
          <p className="mt-1 text-sm text-slate-500">Ad spaces you have requested or booked</p>
          {requests.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No advertisements yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {requests.map((request) => {
                const expiring = expiringBookings.some((item) => item.id === request.id);
                return (
                  <li key={request.id} className="flex items-start justify-between gap-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{request.adSpace.name}</p>
                      <p className="text-sm text-slate-500">
                        {request.adSpace.city ? `${request.adSpace.city} · ` : ""}
                        {formatDate(request.startDate)} – {formatDate(request.endDate)}
                      </p>
                      {request.campaign ? (
                        <p className="text-xs text-slate-400">{request.campaign.name}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">{formatCurrency(request.customerPrice)}</p>
                      <div className="mt-1 flex justify-end gap-1">
                        <Badge variant={statusVariant(request.status)}>{STATUS_LABEL[request.status]}</Badge>
                        {expiring ? <Badge variant="warning">Expiring</Badge> : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-slate-900">Expiring soon</h2>
          <p className="mt-1 text-sm text-slate-500">Bookings and campaigns ending in the next 7 days</p>
          {expiringBookings.length === 0 && expiringCampaigns.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Nothing is expiring this week.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {expiringBookings.map((request) => (
                <li key={request.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-900">{request.adSpace.name}</span>
                  <span className="text-slate-500">Ends {formatDate(request.endDate)}</span>
                </li>
              ))}
              {expiringCampaigns.map((campaign) => (
                <li key={campaign.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-900">{campaign.name}</span>
                  <span className="text-slate-500">
                    Campaign ends {campaign.endDate ? formatDate(campaign.endDate) : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
