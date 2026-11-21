import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui";
import {
  EmptyState,
  PageBanner,
  Panel,
  TABLE_HEAD,
  TABLE_ROW,
  TotalCard,
} from "@/components/advertiser/AdvertiserUI";
import { AlarmClock, ArrowUpRight, CheckCircle2, Receipt, Wallet } from "lucide-react";
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
      <PageBanner title="Payments" description="What you have paid, and bookings that still need payment" />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <TotalCard
          label="Paid"
          value={formatCurrency(paidTotal)}
          sub={`${paid.length} completed`}
          icon={CheckCircle2}
          accent="emerald"
        />
        <TotalCard
          label="Due now"
          value={formatCurrency(dueTotal)}
          sub={`${due.length} awaiting payment`}
          icon={AlarmClock}
          accent="rose"
        />
        <TotalCard
          label="All payments"
          value={payments.length}
          sub="Including pending and failed"
          icon={Wallet}
          accent="indigo"
        />
      </div>

      <Panel
        title="Due now"
        icon={AlarmClock}
        bodyClassName="p-0"
        aside={
          <Link
            href="/advertiser/booking-requests"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#4C4BFF] hover:text-[#3d3ce8]"
          >
            Pay from Bookings
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={TABLE_HEAD}>
              <tr>
                <th className="px-5 py-3">Ad space</th>
                <th className="px-5 py-3">Campaign</th>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {due.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState icon={AlarmClock} text="Nothing is waiting for payment." />
                  </td>
                </tr>
              ) : (
                due.map((request) => (
                  <tr key={request.id} className={TABLE_ROW}>
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {request.adSpace.name}
                      {request.adSpace.city ? (
                        <p className="text-xs font-normal text-slate-500">{request.adSpace.city}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{request.campaign?.name || "—"}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                      {formatDate(request.startDate)} – {formatDate(request.endDate)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900 tabular-nums">
                      {formatCurrency(request.customerPrice)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        className="mt-8"
        title="Payment history"
        description="Every payment recorded for this advertiser account"
        icon={Receipt}
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={TABLE_HEAD}>
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Ad space</th>
                <th className="px-5 py-3">Campaign</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon={Receipt} text="No payment history yet." />
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className={TABLE_ROW}>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                      {formatDate(payment.paidAt ?? payment.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {payment.bookingRequest.adSpace.name}
                      {payment.bookingRequest.adSpace.city ? (
                        <p className="text-xs font-normal text-slate-500">{payment.bookingRequest.adSpace.city}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {payment.bookingRequest.campaign?.name || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{METHOD_LABEL[payment.method]}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{payment.transactionRef || "—"}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900 tabular-nums">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusVariant(payment.status)}>{STATUS_LABEL[payment.status]}</Badge>
                    </td>
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
