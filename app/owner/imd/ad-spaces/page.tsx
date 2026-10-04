import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  AD_SPACE_LIST_COPY,
  IMD_STATUS_LABELS,
  listOwnerAdSpaces,
  parseAdSpaceListFilter,
  type AdSpaceListFilter,
} from "@/lib/services/imd.service";
import { PageHeader, Button, Card, Badge } from "@/components/ui";
import { Plus, Pencil } from "lucide-react";
import { DeleteAdSpaceButton } from "@/components/ad-space/DeleteAdSpaceButton";
import { formatCurrency, cn } from "@/lib/utils";
import { adSpacePhotos } from "@/lib/ad-space-photos";
import { adSpaceTypeLabel } from "@/lib/marketplace/search";

const LIST_FILTERS: { value: AdSpaceListFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "available", label: "Available" },
];

function filterHref(filter: AdSpaceListFilter) {
  return filter === "all" ? "/owner/imd/ad-spaces" : `/owner/imd/ad-spaces?filter=${filter}`;
}

type PageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function AdSpacesPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const filter = parseAdSpaceListFilter(params.filter);
  const copy = AD_SPACE_LIST_COPY[filter];
  const items = await listOwnerAdSpaces(session.organizationId, filter);

  return (
    <div>
      <PageHeader
        title={copy.title}
        description={copy.description}
        action={
          <Link href="/owner/imd/ad-spaces/new">
            <Button>
              <Plus className="h-4 w-4" /> New Ad Space
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {LIST_FILTERS.map((item) => (
          <Link
            key={item.value}
            href={filterHref(item.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              filter === item.value
                ? "bg-[#1e3a5f] text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

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
                  {copy.empty}{" "}
                  {filter === "all" ? (
                    <Link
                      href="/owner/imd/ad-spaces/new"
                      className="text-[#1e3a5f] hover:underline"
                    >
                      Create your first
                    </Link>
                  ) : (
                    <Link href="/owner/imd/ad-spaces" className="text-[#1e3a5f] hover:underline">
                      View all
                    </Link>
                  )}
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
                    <td className="px-6 py-4 text-slate-600">
                      {adSpaceTypeLabel(a.adSpaceType)}
                    </td>
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
                      <div className="inline-flex items-center justify-end gap-4">
                        <Link
                          href={`/owner/imd/ad-spaces/${a.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1e3a5f] hover:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        <DeleteAdSpaceButton id={a.id} />
                      </div>
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
