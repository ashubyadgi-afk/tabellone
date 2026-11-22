import { Input, Button } from "@/components/ui";
import { PageBanner, TotalCard } from "@/components/dashboard/DashboardUI";
import {
  FirmCard,
  FirmEmptyState,
  StatusFilterChips,
  isApproved,
  needsReview,
  parseFirmStatusFilter,
} from "@/components/admin/FirmListUI";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listAdvertiserOrganizations } from "@/lib/services/admin.service";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  Megaphone,
  Inbox,
} from "lucide-react";

export default async function AdminAdvertisersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status: statusRaw } = await searchParams;
  const status = parseFirmStatusFilter(statusRaw);
  const advertisers = await listAdvertiserOrganizations({ q });

  const approvedCount = advertisers.filter((org) => isApproved(org.verificationStatus)).length;
  const reviewCount = advertisers.filter((org) => needsReview(org.verificationStatus)).length;
  const campaignsTotal = advertisers.reduce((sum, org) => sum + org.campaignCount, 0);
  const openRequestsTotal = advertisers.reduce((sum, org) => sum + org.openRequestCount, 0);

  const filtered = advertisers.filter((org) => {
    if (status === "approved") return isApproved(org.verificationStatus);
    if (status === "needs_review") return needsReview(org.verificationStatus);
    return true;
  });

  return (
    <div className="space-y-6">
      <PageBanner
        title="Advertiser firms"
        description="Advertisers: tax IDs, campaigns, booking requests, and subscription"
        action={
          <form className="flex gap-2">
            {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <TotalCard label="Total firms" value={advertisers.length} icon={Building2} accent="indigo" />
        <TotalCard label="Approved" value={approvedCount} icon={CheckCircle2} accent="emerald" />
        <TotalCard label="Needs review" value={reviewCount} icon={ClipboardList} accent="amber" />
        <TotalCard label="Campaigns" value={campaignsTotal} icon={Megaphone} accent="violet" />
        <TotalCard label="Open requests" value={openRequestsTotal} icon={Inbox} accent="orange" />
      </div>

      <StatusFilterChips
        basePath="/admin/advertisers"
        q={q}
        status={status}
        counts={{ all: advertisers.length, approved: approvedCount, needs_review: reviewCount }}
      />

      {filtered.length === 0 ? (
        <FirmEmptyState text="No advertiser firms match this search." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((org) => (
            <FirmCard
              key={org.id}
              href={`/admin/advertisers/${org.id}`}
              title={org.name}
              subtitle={org.sector}
              email={org.email}
              status={org.verificationStatus}
              metrics={[
                { label: "Campaigns", value: org.campaignCount },
                { label: "Open", value: org.openRequestCount },
                {
                  label: "Wallet",
                  value:
                    org.walletBalance == null ? "—" : formatCurrency(org.walletBalance),
                },
              ]}
              details={
                <>
                  <p>
                    <span className="font-medium text-slate-600">Contact</span>{" "}
                    {org.contactPerson || "—"}
                    {org.contactPhone ? ` · ${org.contactPhone}` : ""}
                  </p>
                  <p>
                    <span className="font-medium text-slate-600">GST</span> {org.gstNumber || "—"}
                    <span className="mx-1.5 text-slate-300">·</span>
                    <span className="font-medium text-slate-600">PAN</span> {org.panMasked || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-600">Plan</span>{" "}
                    {org.subscriptionPlan
                      ? `${org.subscriptionPlan} (${org.subscriptionStatus})`
                      : "No plan"}
                    <span className="mx-1.5 text-slate-300">·</span>
                    {org.bookingRequestCount} requests total
                  </p>
                </>
              }
              footer={<span>Joined {formatDate(org.createdAt)}</span>}
            />
          ))}
        </div>
      )}
    </div>
  );
}
