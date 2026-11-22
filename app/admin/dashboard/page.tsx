import { StatCard, Badge } from "@/components/ui";
import { Panel, TABLE_HEAD, TABLE_ROW } from "@/components/dashboard/DashboardUI";
import { BannerAccountActions } from "@/components/layout/BannerAccountActions";
import {
  CitiesBarChart,
  CommissionMixChart,
  FirmGrowthChart,
  RevenueBars,
  TypesDonut,
} from "@/components/admin/AdminDashboardCharts";
import {
  Users,
  Building2,
  ClipboardCheck,
  IndianRupee,
  Layers,
  MapPin,
  Megaphone,
  ShieldAlert,
  TrendingUp,
  Receipt,
  PieChart,
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

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="text-sm font-semibold text-[#4C4BFF] hover:underline">
      View all
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const [stats, insights, owners, advertisers] = await Promise.all([
    getAdminHqStats(),
    getAdminInsights(),
    listOwnerOrganizations({ take: 8 }),
    listAdvertiserOrganizations({ take: 8 }),
  ]);

  const commissionSlices = [
    { name: "Platform commission", value: insights.commission.commissionAmount, color: "#8C47EE" },
    { name: "GST on commission", value: insights.commission.gstOnCommission, color: "#f59e0b" },
    { name: "TDS", value: insights.commission.tdsAmount, color: "#64748b" },
    { name: "Owner payout", value: insights.commission.ownerPayout, color: "#10b981" },
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4C4BFF] via-[#5E49F6] to-[#8C47EE] px-7 py-8 text-white shadow-[0_20px_40px_-20px_rgba(76,75,255,0.6)] sm:px-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-[#F06B3B]/30 blur-3xl" />
        <BannerAccountActions className="absolute right-5 top-5 z-10 sm:right-7" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Platform overview</h1>
          <p className="mt-2 max-w-xl text-sm text-white/80">
            Head-office view of owner firms, advertisers, inventory, and activity
          </p>
        </div>
      </section>

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

      <div>
        <div className="flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-gradient-to-b from-[#4C4BFF] to-[#8C47EE]" />
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">Performance snapshot</h2>
            <p className="text-xs text-slate-500">
              Growth, booked commission, and where inventory sits. Not a live payment ledger.
            </p>
          </div>
        </div>
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
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Firm growth (6 months)"
          description="New owner vs advertiser organizations by month joined"
          icon={TrendingUp}
        >
          <FirmGrowthChart data={insights.growth} />
        </Panel>
        <Panel
          title="Revenue snapshot"
          description="Booked commission, GST, owner payout, and collected payments"
          icon={IndianRupee}
        >
          <RevenueBars
            commission={insights.commission.commissionAmount}
            gst={insights.commission.gstOnCommission}
            ownerPayout={insights.commission.ownerPayout}
            collected={insights.commission.collectedPayments}
          />
        </Panel>
        <Panel title="Popular cities" description="Ad spaces by city" icon={MapPin}>
          <CitiesBarChart data={insights.popularCities} />
        </Panel>
        <Panel title="Popular types" description="Ad spaces by format" icon={PieChart}>
          <TypesDonut data={insights.popularTypes} />
        </Panel>
        <Panel
          title="Commission mix"
          description="From approved / paid / confirmed booking requests"
          icon={Receipt}
          className="xl:col-span-2"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <CommissionMixChart data={commissionSlices} />
            <div className="rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-slate-200/70 lg:min-w-[220px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Customer price (gross)
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
                {formatCurrency(insights.commission.customerPrice)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Across {insights.commission.bookingCount} priced booking requests
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Owners"
          description="Newest firms and inventory"
          icon={Building2}
          bodyClassName="p-0"
          aside={<ViewAll href="/admin/owners" />}
        >
          {owners.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">No owner firms yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className="px-6 py-3">Firm</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Inventory</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {owners.map((org) => (
                  <tr key={org.id} className={TABLE_ROW}>
                    <td className="px-6 py-3">
                      <Link
                        href={`/admin/owners/${org.id}`}
                        className="font-medium text-slate-900 hover:text-[#4C4BFF]"
                      >
                        {org.name}
                      </Link>
                      <p className="text-xs text-slate-500">{org.branchLocation || "—"}</p>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      <p>{org.contactPerson || "—"}</p>
                      <p className="text-xs text-slate-500">{org.email}</p>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {org.adSpaceCount} spaces · {org.listedCount} listed
                    </td>
                    <td className="px-6 py-3">{verificationBadge(org.verificationStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel
          title="Advertisers"
          description="Campaigns and open requests"
          icon={Users}
          bodyClassName="p-0"
          aside={<ViewAll href="/admin/advertisers" />}
        >
          {advertisers.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">No advertiser firms yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className="px-6 py-3">Firm</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Activity</th>
                  <th className="px-6 py-3">GST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advertisers.map((org) => (
                  <tr key={org.id} className={TABLE_ROW}>
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
        </Panel>
      </div>
      <p className="text-xs text-slate-400">
        Snapshot as of {formatDate(new Date())}. Open a firm for full details.
      </p>
    </div>
  );
}
