"use client";

import { useEffect, useState } from "react";
import { PageHeader, Button, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";

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
      <PageHeader title="Booking requests" description="Track and pay for approved bookings" />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-sm text-slate-500">All bookings</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{requests.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-sm text-slate-500">Asked amount</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(requests.reduce((sum, request) => sum + request.customerPrice, 0))}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-sm text-slate-500">Paid</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(paidTotal)}</p>
        </div>
      </div>
      <div className="space-y-4">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div>
              <p className="font-semibold text-slate-900">{req.adSpace.name}</p>
              <p className="text-sm text-slate-500">
                {req.adSpace.city ? `${req.adSpace.city} · ` : ""}
                {formatDate(req.startDate)} → {formatDate(req.endDate)}
              </p>
              {req.campaign ? <p className="text-xs text-slate-400">{req.campaign.name}</p> : null}
              <p className="mt-1 font-medium text-[#1e3a5f]">
                {formatCurrency(req.customerPrice)}
              </p>
              <Badge variant={statusVariant(req.status)}>{statusLabel(req.status)}</Badge>
            </div>
            {req.status === "payment_pending" && (
              <Button size="sm" onClick={() => pay(req.id)}>
                Pay now (UPI)
              </Button>
            )}
          </div>
        ))}
        {requests.length === 0 && (
          <p className="text-slate-500">No booking requests yet.</p>
        )}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Booking history</h2>
        <p className="mt-1 text-sm text-slate-500">Every request, including paid, confirmed, and rejected bookings</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Ad space</th>
                <th className="px-5 py-3">Campaign</th>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No booking history yet.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id}>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {req.adSpace.name}
                      {req.reviewNotes ? (
                        <p className="mt-1 text-xs font-normal text-slate-500">{req.reviewNotes}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{req.campaign?.name || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDate(req.startDate)} – {formatDate(req.endDate)}
                    </td>
                    <td className="px-5 py-3">{formatCurrency(req.customerPrice)}</td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariant(req.status)}>{statusLabel(req.status)}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {req.payment ? statusLabel(req.payment.status) : "—"}
                      {req.payment?.paidAt ? ` · ${formatDate(req.payment.paidAt)}` : ""}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(req.submittedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
