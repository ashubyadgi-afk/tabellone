"use client";

import { useEffect, useState } from "react";
import { Button, Badge } from "@/components/ui";
import {
  EmptyState,
  PageBanner,
  Panel,
  SURFACE,
  TABLE_HEAD,
  TABLE_ROW,
  TotalCard,
} from "@/components/advertiser/AdvertiserUI";
import { CalendarClock, CheckCircle2, History, IndianRupee, MapPin } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type Request = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  customerPrice: number;
  submittedAt: string;
  reviewNotes?: string | null;
  adSpace: { name: string; city?: string | null };
  campaign?: { name: string } | null;
  payment?: { status: string; amount?: number; paidAt?: string | null } | null;
};

const STATUS_LABEL: Record<string, string> = {
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

function statusLabel(status: string) {
  return STATUS_LABEL[status] || status.replaceAll("_", " ");
}

function statusVariant(status: string): "success" | "warning" | "default" | "muted" {
  if (status === "rejected" || status === "cancelled" || status === "expired") return "muted";
  if (status === "confirmed" || status === "paid" || status === "approved") return "success";
  if (status === "submitted" || status === "under_review" || status === "payment_pending") return "warning";
  return "default";
}

export default function AdvertiserBookingRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    fetch("/api/v1/advertiser/booking-requests")
      .then((r) => r.json())
      .then((d) => setRequests(d.data || []));
  }, []);

  async function pay(id: string) {
    const res = await fetch("/api/v1/advertiser/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingRequestId: id, method: "upi" }),
    });
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "confirmed", payment: { status: "completed" } } : r
        )
      );
    }
  }

  const paidTotal = requests.reduce(
    (sum, request) =>
      request.payment?.status === "completed" ? sum + (request.payment.amount ?? request.customerPrice) : sum,
    0
  );

  return (
    <div>
      <PageBanner title="Booking requests" description="Track and pay for approved bookings" />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <TotalCard label="All bookings" value={requests.length} icon={CalendarClock} accent="indigo" />
        <TotalCard
          label="Asked amount"
          value={formatCurrency(requests.reduce((sum, request) => sum + request.customerPrice, 0))}
          icon={IndianRupee}
          accent="violet"
        />
        <TotalCard label="Paid" value={formatCurrency(paidTotal)} icon={CheckCircle2} accent="emerald" />
      </div>

      {requests.length === 0 ? (
        <div className={SURFACE}>
          <EmptyState icon={CalendarClock} text="No booking requests yet." />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {requests.map((req) => (
            <div
              key={req.id}
              className={cn(
                SURFACE,
                "flex flex-wrap items-center justify-between gap-4 p-5 transition hover:ring-[#4C4BFF]/25"
              )}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold tracking-tight text-slate-900">{req.adSpace.name}</p>
                  <Badge variant={statusVariant(req.status)}>{statusLabel(req.status)}</Badge>
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                  {req.adSpace.city ? (
                    <>
                      <MapPin className="h-3.5 w-3.5" />
                      {`${req.adSpace.city} · `}
                    </>
                  ) : null}
                  {formatDate(req.startDate)} → {formatDate(req.endDate)}
                </p>
                {req.campaign ? <p className="mt-0.5 text-xs text-slate-400">{req.campaign.name}</p> : null}
                <p className="mt-2 text-lg font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(req.customerPrice)}
                </p>
              </div>
              {req.status === "payment_pending" && (
                <Button size="sm" onClick={() => pay(req.id)}>
                  Pay now (UPI)
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Panel
        className="mt-8"
        title="Booking history"
        description="Every request, including paid, confirmed, and rejected bookings"
        icon={History}
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={TABLE_HEAD}>
              <tr>
                <th className="px-5 py-3">Ad space</th>
                <th className="px-5 py-3">Campaign</th>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon={History} text="No booking history yet." />
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className={TABLE_ROW}>
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {req.adSpace.name}
                      {req.reviewNotes ? (
                        <p className="mt-1 text-xs font-normal text-slate-500">{req.reviewNotes}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{req.campaign?.name || "—"}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                      {formatDate(req.startDate)} – {formatDate(req.endDate)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900 tabular-nums">
                      {formatCurrency(req.customerPrice)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusVariant(req.status)}>{statusLabel(req.status)}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {req.payment ? statusLabel(req.payment.status) : "—"}
                      {req.payment?.paidAt ? ` · ${formatDate(req.payment.paidAt)}` : ""}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">{formatDate(req.submittedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
