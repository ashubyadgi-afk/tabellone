import { PageHeader, Badge, Card, Input, Button } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { listAdvertiserOrganizations } from "@/lib/services/admin.service";

function verificationBadge(status?: string | null) {
  if (!status) return <Badge variant="muted">no profile</Badge>;
  if (status === "approved") return <Badge variant="success">approved</Badge>;
  return <Badge variant="warning">{status.replaceAll("_", " ")}</Badge>;
}

export default async function AdminAdvertisersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const advertisers = await listAdvertiserOrganizations({ q });

  return (
    <div>
      <PageHeader
        title="Advertiser firms"
        description="Advertisers: tax IDs, campaigns, booking requests, and subscription"
        action={
          <form className="flex gap-2">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search name, email, sector…"
              className="w-64"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
        }
      />
      <Card className="overflow-hidden">
        {advertisers.length === 0 ? (
          <p className="px-6 py-10 text-sm text-slate-500">
            No advertiser firms match this search.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Firm</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">GST / PAN</th>
                  <th className="px-6 py-3">Verification</th>
                  <th className="px-6 py-3">Campaigns</th>
                  <th className="px-6 py-3">Requests</th>
                  <th className="px-6 py-3">Wallet / plan</th>
                  <th className="px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advertisers.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/advertisers/${org.id}`}
                        className="font-medium text-slate-900 hover:text-[#4C4BFF]"
                      >
                        {org.name}
                      </Link>
                      <p className="text-xs text-slate-500">{org.sector || "—"}</p>
                      <p className="text-xs text-slate-400">{org.email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <p>{org.contactPerson || "—"}</p>
                      <p className="text-xs text-slate-500">
                        {org.contactPhone || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <p>{org.gstNumber || "GST —"}</p>
                      <p className="text-xs text-slate-500">
                        PAN {org.panMasked || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {verificationBadge(org.verificationStatus)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{org.campaignCount}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {org.bookingRequestCount} total · {org.openRequestCount} open
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <p>
                        {org.walletBalance == null
                          ? "No wallet"
                          : formatCurrency(org.walletBalance)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {org.subscriptionPlan
                          ? `${org.subscriptionPlan} (${org.subscriptionStatus})`
                          : "No plan"}
                      </p>
                    </td>
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
