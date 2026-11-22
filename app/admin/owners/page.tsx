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
import { formatDate } from "@/lib/utils";
import { listOwnerOrganizations } from "@/lib/services/admin.service";
import { Building2, CheckCircle2, ClipboardList, Layers, MapPin } from "lucide-react";

export default async function AdminOwnersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status: statusRaw } = await searchParams;
  const status = parseFirmStatusFilter(statusRaw);
  const owners = await listOwnerOrganizations({ q });

  const approvedCount = owners.filter((org) => isApproved(org.verificationStatus)).length;
  const reviewCount = owners.filter((org) => needsReview(org.verificationStatus)).length;
  const adSpacesTotal = owners.reduce((sum, org) => sum + org.adSpaceCount, 0);
  const listedTotal = owners.reduce((sum, org) => sum + org.listedCount, 0);

  const filtered = owners.filter((org) => {
    if (status === "approved") return isApproved(org.verificationStatus);
    if (status === "needs_review") return needsReview(org.verificationStatus);
    return true;
  });

  return (
    <div className="space-y-6">
      <PageBanner
        title="Owner firms"
        description="Ad-space owners: contact, verification, and inventory counts"
        action={
          <form className="flex gap-2">
            {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <TotalCard label="Total firms" value={owners.length} icon={Building2} accent="indigo" />
        <TotalCard label="Approved" value={approvedCount} icon={CheckCircle2} accent="emerald" />
        <TotalCard label="Needs review" value={reviewCount} icon={ClipboardList} accent="amber" />
        <TotalCard label="Ad spaces" value={adSpacesTotal} icon={Layers} accent="violet" />
        <TotalCard label="Listed" value={listedTotal} icon={MapPin} accent="orange" />
      </div>

      <StatusFilterChips
        basePath="/admin/owners"
        q={q}
        status={status}
        counts={{ all: owners.length, approved: approvedCount, needs_review: reviewCount }}
      />

      {filtered.length === 0 ? (
        <FirmEmptyState text="No owner firms match this search." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((org) => (
            <FirmCard
              key={org.id}
              href={`/admin/owners/${org.id}`}
              title={org.name}
              subtitle={org.brandName}
              email={org.email}
              status={org.verificationStatus}
              metrics={[
                { label: "Spaces", value: org.adSpaceCount },
                { label: "Listed", value: org.listedCount },
                { label: "Bookings", value: org.bookingCount },
              ]}
              details={
                <>
                  <p>
                    <span className="font-medium text-slate-600">Contact</span>{" "}
                    {org.contactPerson || "—"}
                    {org.contactPhone ? ` · ${org.contactPhone}` : ""}
                  </p>
                  <p>
                    <span className="font-medium text-slate-600">Branch</span>{" "}
                    {org.branchLocation || "—"}
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
