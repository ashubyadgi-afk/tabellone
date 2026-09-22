import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { GenerateInvoiceButton } from "./GenerateInvoiceButton";

export default async function InvoicesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { issuedAt: "desc" },
    include: {
      booking: { include: { adSpace: true, client: true } },
    },
  });

  const bookingsWithoutInvoice = await prisma.booking.findMany({
    where: {
      organizationId: session.organizationId,
      invoice: null,
      status: { in: ["confirmed", "active", "completed"] },
    },
    include: { adSpace: true, client: true },
    take: 10,
  });

  return (
    <div>
      <PageHeader title="Invoices" description="Generate and print invoices from bookings" />

      {bookingsWithoutInvoice.length > 0 && (
        <Card className="mb-6 p-6">
          <h2 className="font-semibold text-slate-900">Ready to invoice</h2>
          <ul className="mt-4 space-y-3">
            {bookingsWithoutInvoice.map((b) => (
              <li key={b.id} className="flex items-center justify-between text-sm">
                <span>
                  {b.adSpace.name} · {b.client.name} · {formatDate(b.startDate)}
                </span>
                <GenerateInvoiceButton bookingId={b.id} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-4">Invoice #</th>
              <th className="px-6 py-4">Booking</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Issued</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No invoices yet</td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-mono text-xs">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4">
                    {inv.booking.adSpace.name} / {inv.booking.client.name}
                  </td>
                  <td className="px-6 py-4 font-medium">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(inv.issuedAt)}</td>
                  <td className="px-6 py-4">
                    <Link href={`/owner/imd/invoices/${inv.id}`} className="text-[#1e3a5f] hover:underline">
                      View / Print
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
