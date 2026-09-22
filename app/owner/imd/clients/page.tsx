import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader, Button, Card } from "@/components/ui";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ClientsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const items = await prisma.client.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    include: { bookings: true },
  });

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Manage client records for internal bookings"
        action={
          <Link href="/owner/imd/clients/new">
            <Button><Plus className="h-4 w-4" /> Add Client</Button>
          </Link>
        }
      />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Business</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Bookings</th>
              <th className="px-6 py-4">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No clients yet
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium">{c.name}</td>
                  <td className="px-6 py-4 text-slate-600">{c.businessName || "—"}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {c.email || c.contactPhone || "—"}
                  </td>
                  <td className="px-6 py-4">{c.bookings.length}</td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(c.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
