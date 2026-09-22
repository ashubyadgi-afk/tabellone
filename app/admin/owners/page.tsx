import { PageHeader, Badge, Card, Input, Button } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { listOwnerOrganizations } from "@/lib/services/admin.service";

function verificationBadge(status?: string | null) {
  if (!status) return <Badge variant="muted">no profile</Badge>;
  if (status === "approved") return <Badge variant="success">approved</Badge>;
  return <Badge variant="warning">{status.replaceAll("_", " ")}</Badge>;
}

export default async function AdminOwnersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const owners = await listOwnerOrganizations({ q });

  return (
    <div>
      <PageHeader
        title="Owner firms"
        description="Ad-space owners: contact, verification, and inventory counts"
        action={
          <form className="flex gap-2">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search name, email, city…"
              className="w-64"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
        }
      />
      <Card className="overflow-hidden">
        {owners.length === 0 ? (
          <p className="px-6 py-10 text-sm text-slate-500">
            No owner firms match this search.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Firm</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Branch</th>
                  <th className="px-6 py-3">Verification</th>
                  <th className="px-6 py-3">Ad spaces</th>
                  <th className="px-6 py-3">IMD bookings</th>
                  <th className="px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {owners.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/owners/${org.id}`}
                        className="font-medium text-slate-900 hover:text-[#4C4BFF]"
                      >
                        {org.name}
                      </Link>
                      {org.brandName && (
                        <p className="text-xs text-slate-500">{org.brandName}</p>
                      )}
                      <p className="text-xs text-slate-400">{org.email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <p>{org.contactPerson || "—"}</p>
                      <p className="text-xs text-slate-500">
                        {org.contactPhone || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {org.branchLocation || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {verificationBadge(org.verificationStatus)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {org.adSpaceCount} total · {org.listedCount} listed
                    </td>
                    <td className="px-6 py-4 text-slate-600">{org.bookingCount}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(org.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
