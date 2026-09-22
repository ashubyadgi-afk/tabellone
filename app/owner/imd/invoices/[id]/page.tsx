import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrintButton } from "./PrintButton";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      organization: true,
      booking: { include: { adSpace: true, client: true } },
    },
  });

  if (!invoice) notFound();

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:shadow-none print:border-none">
        <div className="flex justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">Tabellone</h1>
            <p className="text-sm text-slate-500">Advertising Space Invoice</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-semibold">{invoice.invoiceNumber}</p>
            <p className="text-sm text-slate-500">{formatDate(invoice.issuedAt)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 text-sm">
          <div>
            <p className="font-semibold text-slate-900">From</p>
            <p className="mt-2 text-slate-600">{invoice.organization.name}</p>
            <p className="text-slate-500">{invoice.organization.email}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Bill to</p>
            <p className="mt-2 text-slate-600">{invoice.booking.client.name}</p>
            {invoice.booking.client.businessName && (
              <p className="text-slate-500">{invoice.booking.client.businessName}</p>
            )}
            {invoice.booking.client.email && (
              <p className="text-slate-500">{invoice.booking.client.email}</p>
            )}
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="py-2">Description</th>
              <th className="py-2">Period</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-4">
                <p className="font-medium">{invoice.booking.adSpace.name}</p>
                <p className="text-xs text-slate-500">{invoice.booking.adSpace.adSpaceNumber}</p>
              </td>
              <td className="py-4 text-slate-600">
                {formatDate(invoice.booking.startDate)} – {formatDate(invoice.booking.endDate)}
              </td>
              <td className="py-4 text-right font-semibold">
                {formatCurrency(invoice.totalAmount)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="pt-4 text-right font-semibold">Total</td>
              <td className="pt-4 text-right text-lg font-bold text-[#1e3a5f]">
                {formatCurrency(invoice.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
