import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { BOOKING_STATUS_LABELS } from "@/lib/services/imd.service";
import { PageHeader, Button, Card, Badge } from "@/components/ui";
import { Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function BookingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const items = await prisma.booking.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { startDate: "desc" },
    include: { adSpace: true, client: true, invoice: true },
  });

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Client bookings linked to Ad Spaces"
        action={
          <Link href="/owner/imd/bookings/new">
            <Button><Plus className="h-4 w-4" /> New Booking</Button>
          </Link>
        }
      />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-4">Ad Space</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Period</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No bookings yet</td>
              </tr>
            ) : (
              items.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium">{b.adSpace.name}</td>
                  <td className="px-6 py-4">{b.client.name}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatDate(b.startDate)} – {formatDate(b.endDate)}
                  </td>
                  <td className="px-6 py-4">{b.amount ? formatCurrency(b.amount) : "—"}</td>
                  <td className="px-6 py-4">
                    <Badge variant="success">{BOOKING_STATUS_LABELS[b.status]}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    {b.invoice ? (
                      <Link href={`/owner/imd/invoices/${b.invoice.id}`} className="text-[#1e3a5f] hover:underline">
                        {b.invoice.invoiceNumber}
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
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
