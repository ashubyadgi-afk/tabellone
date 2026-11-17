import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentMethod, PaymentStatus } from "@prisma/client";

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  upi: "UPI",
  card: "Card",
  wallet: "Wallet",
  bank_transfer: "Bank transfer",
};

function statusVariant(status: PaymentStatus): "success" | "warning" | "default" | "muted" {
  if (status === "completed") return "success";
  if (status === "failed" || status === "refunded") return "muted";
  return "warning";
}

export default async function AdvertiserPaymentsPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const [payments, due] = await Promise.all([
    prisma.payment.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: "desc" },
      include: {
        bookingRequest: {
          select: {
            customerPrice: true,
            startDate: true,
            endDate: true,
            adSpace: { select: { name: true, city: true } },
            campaign: { select: { name: true } },
          },
        },
      },
    }),
    prisma.bookingRequest.findMany({
      where: { organizationId: session.organizationId, status: "payment_pending" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        customerPrice: true,
        startDate: true,
        endDate: true,
        adSpace: { select: { name: true, city: true } },
        campaign: { select: { name: true } },
      },
    }),
  ]);

  const paid = payments.filter((payment) => payment.status === "completed");
  const paidTotal = paid.reduce((sum, payment) => sum + payment.amount, 0);
  const dueTotal = due.reduce((sum, request) => sum + request.customerPrice, 0);

  return (
    <div>
      <PageHeader
        title="Payments"
        description="What you have paid, and bookings that still need payment"
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-sm text-slate-500">Paid</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(paidTotal)}</p>
          <p className="mt-1 text-xs text-slate-400">{paid.length} completed</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-sm text-slate-500">Due now</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(dueTotal)}</p>
          <p className="mt-1 text-xs text-slate-400">{due.length} awaiting payment</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-sm text-slate-500">All payments</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{payments.length}</p>
          <p className="mt-1 text-xs text-slate-400">Including pending and failed</p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Due now</h2>
          <Link href="/advertiser/booking-requests" className="text-sm font-medium text-[#4C4BFF] hover:underline">
            Pay from Bookings
          </Link>
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Ad space</th>
                <th className="px-5 py-3">Campaign</th>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {due.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                    Nothing is waiting for payment.
                  </td>
                </tr>
              ) : (
                due.map((request) => (
                  <tr key={request.id}>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {request.adSpace.name}
                      {request.adSpace.city ? (
                        <p className="text-xs font-normal text-slate-500">{request.adSpace.city}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{request.campaign?.name || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDate(request.startDate)} – {formatDate(request.endDate)}
                    </td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(request.customerPrice)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Payment history</h2>
        <p className="mt-1 text-sm text-slate-500">Every payment recorded for this advertiser account</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Ad space</th>
                <th className="px-5 py-3">Campaign</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No payment history yet.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDate(payment.paidAt ?? payment.createdAt)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {payment.bookingRequest.adSpace.name}
                      {payment.bookingRequest.adSpace.city ? (
                        <p className="text-xs font-normal text-slate-500">{payment.bookingRequest.adSpace.city}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {payment.bookingRequest.campaign?.name || "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{METHOD_LABEL[payment.method]}</td>
                    <td className="px-5 py-3 text-slate-500">{payment.transactionRef || "—"}</td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(payment.amount)}</td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariant(payment.status)}>{STATUS_LABEL[payment.status]}</Badge>
                    </td>
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
