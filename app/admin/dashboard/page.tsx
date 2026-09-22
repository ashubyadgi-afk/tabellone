import { StatCard, PageHeader, Badge, Card } from "@/components/ui";
import {
  Users,
  Building2,
  ClipboardCheck,
  IndianRupee,
  Layers,
  MapPin,
  Megaphone,
  ShieldAlert,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  getAdminHqStats,
  getAdminInsights,
  listAdvertiserOrganizations,
  listOwnerOrganizations,
} from "@/lib/services/admin.service";

function verificationBadge(status?: string | null) {
  if (!status) return <Badge variant="muted">no profile</Badge>;
  if (status === "approved") return <Badge variant="success">approved</Badge>;
  if (status === "rejected") return <Badge variant="warning">rejected</Badge>;
  return <Badge variant="warning">{status.replaceAll("_", " ")}</Badge>;
}

function BarList({
  items,
  formatValue,
}: {
  items: { label: string; value: number }[];
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  if (items.length === 0) {
    return <p className="px-6 py-8 text-sm text-slate-500">No data yet.</p>;
  }
  return (
    <ul className="space-y-3 px-6 py-4">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="capitalize text-slate-700">{item.label}</span>
            <span className="font-medium text-slate-900">
              {formatValue ? formatValue(item.value) : item.value}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#4C4BFF] to-[#8C47EE]"
              style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminDashboardPage() {
  const [stats, insights, owners, advertisers] = await Promise.all([
    getAdminHqStats(),
    getAdminInsights(),
    listOwnerOrganizations({ take: 8 }),
    listAdvertiserOrganizations({ take: 8 }),
  ]);

  const growthMax = Math.max(
    ...insights.growth.flatMap((row) => [row.owners, row.advertisers]),
    1
  );

  return (
    <div>
      <PageHeader
        title="Platform overview"
        description="Head-office view of owner firms, advertisers, inventory, and activity"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Owner firms"
          value={stats.owners}
          icon={Building2}
          accent="blue"
          href="/admin/owners"
        />
        <StatCard
          label="Advertiser firms"
          value={stats.advertisers}
          icon={Users}
          accent="violet"
          href="/admin/advertisers"
        />
        <StatCard
          label="Pending reviews"
          value={stats.pendingListings + stats.pendingRequests}
          sub={`${stats.pendingListings} listings · ${stats.pendingRequests} bookings`}
          icon={ClipboardCheck}
          accent="amber"
          href="/admin/listings"
        />
        <StatCard
          label="Total revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={IndianRupee}
          accent="emerald"
          href="/admin/booking-requests"
        />
        <StatCard
          label="Ad spaces"
          value={stats.adSpacesTotal}
          sub={`${stats.adSpacesListed} listed · ${stats.adSpacesImdActive} IMD active`}
          icon={Layers}
          accent="blue"
          href="/admin/owners"
        />
        <StatCard
          label="Cities with inventory"
          value={stats.citiesWithAdSpaces}
          icon={MapPin}
          accent="slate"
          href="/admin/owners"
        />
        <StatCard
          label="Campaigns"
          value={stats.campaigns}
          sub={`${stats.openBookingRequests} open booking requests`}
          icon={Megaphone}
          accent="violet"
          href="/admin/advertisers"
        />
        <StatCard
          label="Pending verification"
          value={stats.pendingVerifications}
          sub="Owner and advertiser profiles not approved"
          icon={ShieldAlert}
          accent="rose"
          href="/admin/owners"
        />
      </div>

      <h2 className="mt-10 text-sm font-semibold text-slate-900">
        Performance snapshot
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Growth, booked commission, and where inventory sits. Not a live payment
        ledger.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Platform commission"
          value={formatCurrency(insights.commission.commissionAmount)}
          sub={`${insights.commission.bookingCount} priced booking requests`}
          icon={IndianRupee}
          accent="violet"
          href="/admin/booking-requests"
        />
        <StatCard
          label="GST on commission"
          value={formatCurrency(insights.commission.gstOnCommission)}
          icon={IndianRupee}
          accent="amber"
          href="/admin/pricing"
        />
        <StatCard
          label="Owner payout (booked)"
          value={formatCurrency(insights.commission.ownerPayout)}
          icon={IndianRupee}
          accent="emerald"
          href="/admin/booking-requests"
        />
        <StatCard
          label="Collected payments"
          value={formatCurrency(insights.commission.collectedPayments)}
          sub={`${insights.commission.completedPaymentCount} completed`}
          icon={IndianRupee}
          accent="blue"
          href="/admin/booking-requests"
        />
      </div>

      <div className="mt-6 grid gap-8 xl:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Firm growth (6 months)
            </h2>
            <p className="text-xs text-slate-500">
              New owner vs advertiser organizations by month joined
            </p>
          </div>
          <div className="flex h-44 items-end gap-2 px-6 pb-2 pt-4">
            {insights.growth.map((row) => (
              <div key={row.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end justify-center gap-1">
                  <div
                    className="w-3 rounded-t bg-blue-500"
                    style={{
                      height: `${Math.max((row.owners / growthMax) * 100, row.owners ? 6 : 0)}%`,
                    }}
                    title={`Owners ${row.owners}`}
                  />
                  <div
                    className="w-3 rounded-t bg-violet-500"
                    style={{
                      height: `${Math.max((row.advertisers / growthMax) * 100, row.advertisers ? 6 : 0)}%`,
                    }}
                    title={`Advertisers ${row.advertisers}`}
                  />
                </div>
                <p className="text-center text-[10px] leading-tight text-slate-500">
                  {row.label}
                </p>
                <p className="text-[10px] text-slate-400">
                  {row.owners}+{row.advertisers}
                </p>
              </div>
            ))}
          </div>
          <p className="px-6 pb-4 text-xs text-slate-500">
            <span className="mr-3 inline-block h-2 w-2 rounded-sm bg-blue-500" />{" "}
            Owners
            <span className="ml-4 mr-3 inline-block h-2 w-2 rounded-sm bg-violet-500" />{" "}
            Advertisers
          </p>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Popular cities
            </h2>
            <p className="text-xs text-slate-500">Ad spaces by city</p>
          </div>
          <BarList items={insights.popularCities} />
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Popular types
            </h2>
            <p className="text-xs text-slate-500">Ad spaces by format</p>
          </div>
          <BarList items={insights.popularTypes} />
        </Card>
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Commission mix
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            From approved / paid / confirmed booking requests
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
              <dt className="text-slate-500">Customer price (gross)</dt>
              <dd className="font-medium">
                {formatCurrency(insights.commission.customerPrice)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
              <dt className="text-slate-500">Platform commission</dt>
              <dd className="font-medium">
                {formatCurrency(insights.commission.commissionAmount)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
              <dt className="text-slate-500">GST on commission</dt>
              <dd className="font-medium">
                {formatCurrency(insights.commission.gstOnCommission)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
              <dt className="text-slate-500">TDS</dt>
              <dd className="font-medium">
                {formatCurrency(insights.commission.tdsAmount)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-slate-500">Owner payout</dt>
              <dd className="font-medium">
                {formatCurrency(insights.commission.ownerPayout)}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Owners</h2>
              <p className="text-xs text-slate-500">Newest firms and inventory</p>
            </div>
            <Link
              href="/admin/owners"
              className="text-xs font-semibold text-[#4C4BFF] hover:underline"
            >
              View all
            </Link>
          </div>
          {owners.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">No owner firms yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Firm</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Inventory</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {owners.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-3">
                      <Link
                        href={`/admin/owners/${org.id}`}
                        className="font-medium text-slate-900 hover:text-[#4C4BFF]"
                      >
                        {org.name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {org.branchLocation || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      <p>{org.contactPerson || "—"}</p>
                      <p className="text-xs text-slate-500">{org.email}</p>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {org.adSpaceCount} spaces · {org.listedCount} listed
                    </td>
                    <td className="px-6 py-3">
                      {verificationBadge(org.verificationStatus)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Advertisers</h2>
              <p className="text-xs text-slate-500">Campaigns and open requests</p>
            </div>
            <Link
              href="/admin/advertisers"
              className="text-xs font-semibold text-[#4C4BFF] hover:underline"
            >
              View all
            </Link>
          </div>
          {advertisers.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">
              No advertiser firms yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Firm</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Activity</th>
                  <th className="px-6 py-3">GST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advertisers.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-3">
                      <Link
                        href={`/admin/advertisers/${org.id}`}
                        className="font-medium text-slate-900 hover:text-[#4C4BFF]"
                      >
                        {org.name}
                      </Link>
                      <p className="text-xs text-slate-500">{org.sector || "—"}</p>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      <p>{org.contactPerson || "—"}</p>
                      <p className="text-xs text-slate-500">{org.email}</p>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {org.campaignCount} campaigns · {org.openRequestCount} open
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={org.hasGst ? "success" : "muted"}>
                        {org.hasGst ? "on file" : "missing"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Snapshot as of {formatDate(new Date())}. Open a firm for full details.
      </p>
    </div>
  );
}
