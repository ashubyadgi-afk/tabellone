import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, Badge, Card } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getOwnerOrganizationDetail } from "@/lib/services/admin.service";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value ?? "—"}</span>
    </div>
  );
}

function verificationBadge(status?: string | null) {
  if (!status) return <Badge variant="muted">no profile</Badge>;
  if (status === "approved") return <Badge variant="success">approved</Badge>;
  return <Badge variant="warning">{status.replaceAll("_", " ")}</Badge>;
}

export default async function AdminOwnerDetailPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const org = await getOwnerOrganizationDetail(organizationId);
  if (!org) notFound();

  return (
    <div>
      <PageHeader
        title={org.name}
        description="Read-only owner firm details"
        action={
          <Link
            href="/admin/owners"
            className="text-sm font-semibold text-[#4C4BFF] hover:underline"
          >
            Back to owners
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Company</h2>
          <Row label="Legal name" value={org.name} />
          <Row label="Brand" value={org.brandName} />
          <Row label="Sector" value={org.sector} />
          <Row label="Org email" value={org.email} />
          <Row label="Contact person" value={org.contactPerson} />
          <Row label="Phone" value={org.contactPhone} />
          <Row label="Branch" value={org.branchLocation} />
          <Row label="Org status" value={org.status} />
          <Row label="Joined" value={formatDate(org.createdAt)} />
        </Card>
        <Card className="p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Owner profile</h2>
          <div className="mb-3">{verificationBadge(org.verificationStatus)}</div>
          <Row label="Agency" value={org.agencyName} />
          <Row label="Office address" value={org.officeAddress} />
          <Row label="Spaces claimed" value={org.totalAdSpacesClaimed} />
          <Row label="Inventory" value={`${org.adSpaces.length} · ${org.listedCount} listed`} />
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-900">
          Login accounts
        </h2>
        {org.users.length === 0 ? (
          <p className="px-6 py-6 text-sm text-slate-500">No users on this firm.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {org.users.map((user) => (
                <tr key={user.email}>
                  <td className="px-6 py-3">{user.email}</td>
                  <td className="px-6 py-3 capitalize">{user.role}</td>
                  <td className="px-6 py-3">{user.status}</td>
                  <td className="px-6 py-3 text-slate-500">
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="mt-6 overflow-hidden">
        <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-900">
          Inventory
        </h2>
        {org.adSpaces.length === 0 ? (
          <p className="px-6 py-6 text-sm text-slate-500">No ad spaces yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Space</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">City</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">IMD</th>
                  <th className="px-6 py-3">Marketplace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {org.adSpaces.map((space) => (
                  <tr key={space.id}>
                    <td className="px-6 py-3">
                      <p className="font-medium">{space.name}</p>
                      <p className="text-xs text-slate-500">{space.adSpaceNumber}</p>
                    </td>
                    <td className="px-6 py-3 capitalize">{space.adSpaceType}</td>
                    <td className="px-6 py-3">
                      {[space.city, space.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-6 py-3">
                      {space.basePrice != null ? formatCurrency(space.basePrice) : "—"}
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        variant={space.imdStatus === "active" ? "success" : "muted"}
                      >
                        {space.imdStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        variant={
                          space.marketplaceListingStatus === "listed"
                            ? "success"
                            : "muted"
                        }
                      >
                        {space.marketplaceListingStatus.replaceAll("_", " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-6 overflow-hidden">
        <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-900">
          Recent IMD bookings
        </h2>
        {org.bookings.length === 0 ? (
          <p className="px-6 py-6 text-sm text-slate-500">No IMD bookings yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Space</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Dates</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {org.bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-3">{booking.adSpace.name}</td>
                  <td className="px-6 py-3">{booking.client.name}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
                  </td>
                  <td className="px-6 py-3">
                    {booking.amount != null ? formatCurrency(booking.amount) : "—"}
                  </td>
                  <td className="px-6 py-3 capitalize">{booking.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
