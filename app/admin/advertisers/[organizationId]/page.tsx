import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, Badge, Card } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getAdvertiserOrganizationDetail } from "@/lib/services/admin.service";

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

export default async function AdminAdvertiserDetailPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const org = await getAdvertiserOrganizationDetail(organizationId);
  if (!org) notFound();

  return (
    <div>
      <PageHeader
        title={org.name}
        description="Read-only advertiser firm details"
        action={
          <Link
            href="/admin/advertisers"
            className="text-sm font-semibold text-[#4C4BFF] hover:underline"
          >
            Back to advertisers
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
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Advertiser profile</h2>
          <div className="mb-3">{verificationBadge(org.verificationStatus)}</div>
          <Row label="GST" value={org.gstNumber} />
          <Row label="PAN" value={org.panMasked} />
          <Row
            label="Wallet"
            value={
              org.walletBalance == null ? "None" : formatCurrency(org.walletBalance)
            }
          />
          <Row
            label="Subscription"
            value={
              org.subscriptionPlan
                ? `${org.subscriptionPlan} (${org.subscriptionStatus})`
                : "None"
            }
          />
          <Row label="Wishlist items" value={org.wishlistCount} />
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
          Campaigns
        </h2>
        {org.campaigns.length === 0 ? (
          <p className="px-6 py-6 text-sm text-slate-500">No campaigns yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Product / sector</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Budget</th>
                  <th className="px-6 py-3">Dates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {org.campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="px-6 py-3 font-medium">{campaign.name}</td>
                    <td className="px-6 py-3 text-slate-600">
                      {[campaign.productService, campaign.sector]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </td>
                    <td className="px-6 py-3">{campaign.targetLocation || "—"}</td>
                    <td className="px-6 py-3">
                      {campaign.budget != null
                        ? formatCurrency(campaign.budget)
                        : "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {campaign.startDate || campaign.endDate
                        ? `${campaign.startDate ? formatDate(campaign.startDate) : "—"} – ${
                            campaign.endDate ? formatDate(campaign.endDate) : "—"
                          }`
                        : "—"}
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
          Booking requests
        </h2>
        {org.bookingRequests.length === 0 ? (
          <p className="px-6 py-6 text-sm text-slate-500">No booking requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Space</th>
                  <th className="px-6 py-3">Campaign</th>
                  <th className="px-6 py-3">Dates</th>
                  <th className="px-6 py-3">Customer price</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {org.bookingRequests.map((req) => (
                  <tr key={req.id}>
                    <td className="px-6 py-3">
                      <p>{req.adSpace.name}</p>
                      <p className="text-xs text-slate-500">{req.adSpace.city || "—"}</p>
                    </td>
                    <td className="px-6 py-3">{req.campaign?.name || "—"}</td>
                    <td className="px-6 py-3 text-slate-600">
                      {formatDate(req.startDate)} – {formatDate(req.endDate)}
                    </td>
                    <td className="px-6 py-3">
                      {formatCurrency(req.customerPrice)}
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        variant={
                          req.status === "approved" ? "success" : "warning"
                        }
                      >
                        {req.status.replaceAll("_", " ")}
                      </Badge>
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
