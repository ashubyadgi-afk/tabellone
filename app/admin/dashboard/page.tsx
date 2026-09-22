import { prisma } from "@/lib/db";
import { StatCard, PageHeader } from "@/components/ui";
import { Users, Building2, ClipboardCheck, IndianRupee } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [
    owners,
    advertisers,
    pendingListings,
    pendingRequests,
    revenue,
  ] = await Promise.all([
    prisma.organization.count({ where: { type: "owner" } }),
    prisma.organization.count({ where: { type: "advertiser" } }),
    prisma.marketplaceListing.count({
      where: { status: { in: ["submitted", "under_review"] } },
    }),
    prisma.bookingRequest.count({
      where: { status: { in: ["submitted", "under_review"] } },
    }),
    prisma.payment.aggregate({
      where: { status: "completed" },
      _sum: { amount: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Platform overview"
        description="Monitor owners, advertisers, listings, and revenue"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Owners"
          value={owners}
          icon={Building2}
          accent="blue"
          href="/admin/users"
        />
        <StatCard
          label="Advertisers"
          value={advertisers}
          icon={Users}
          accent="violet"
          href="/admin/users"
        />
        <StatCard
          label="Pending reviews"
          value={pendingListings + pendingRequests}
          sub={`${pendingListings} listings · ${pendingRequests} bookings`}
          icon={ClipboardCheck}
          accent="amber"
          href="/admin/listings"
        />
        <StatCard
          label="Total revenue"
          value={formatCurrency(revenue._sum.amount ?? 0)}
          icon={IndianRupee}
          accent="emerald"
          href="/admin/booking-requests"
        />
      </div>
    </div>
  );
}
