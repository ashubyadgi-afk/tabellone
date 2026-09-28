import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { IMD_STATUS_LABELS } from "@/lib/services/imd.service";
import { PageHeader, Button, Card, Badge } from "@/components/ui";
import { Plus, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { adSpacePhotos } from "@/lib/ad-space-photos";
import { adSpaceTypeLabel } from "@/lib/marketplace/search";

export default async function AdSpacesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const items = await prisma.adSpace.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      bookings: { where: { status: { in: ["confirmed", "active"] } } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Ad Spaces"
        description="Your advertising inventory in IMD"
        action={
          <Link href="/owner/imd/ad-spaces/new">
            <Button><Plus className="h-4 w-4" /> New Ad Space</Button>
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-4">ID / Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Base price</th>
              <th className="px-6 py-4">Bookings</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  No Ad Spaces yet.{" "}
                  <Link href="/owner/imd/ad-spaces/new" className="text-[#1e3a5f] hover:underline">
                    Create your first
                  </Link>
                </td>
              </tr>
            ) : (
              items.map((a) => {
                const cover = adSpacePhotos(a)[0];
                return (
                <tr key={a.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {cover ? (
                        <img
                          src={cover}
                          alt=""
                          className="h-10 w-14 rounded-lg object-cover"
                        />
                      ) : null}
                      <div>
                        <Link
                          href={`/owner/imd/ad-spaces/${a.id}/edit`}
                          className="font-medium text-slate-900 hover:text-[#1e3a5f] hover:underline"
                        >
                          {a.name}
                        </Link>
                        <p className="text-xs text-slate-500">{a.adSpaceNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{adSpaceTypeLabel(a.adSpaceType)}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {[a.city, a.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={a.imdStatus === "active" ? "success" : "muted"}>
                      {IMD_STATUS_LABELS[a.imdStatus]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {a.basePrice ? formatCurrency(a.basePrice) : "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{a.bookings.length}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/owner/imd/ad-spaces/${a.id}/edit`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1e3a5f] hover:underline"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
