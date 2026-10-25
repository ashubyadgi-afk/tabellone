import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader, StatCard } from "@/components/ui";
import { MarketplaceSearchForm } from "@/components/marketplace/MarketplaceSearchForm";
import { Megaphone, Heart, CalendarClock, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function AdvertiserDashboardPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const orgId = session.organizationId;
  const [campaigns, wishlist, requests, payments, wallet] = await Promise.all([
    prisma.campaign.count({ where: { organizationId: orgId } }),
    prisma.wishlistItem.count({ where: { organizationId: orgId } }),
    prisma.bookingRequest.count({ where: { organizationId: orgId } }),
    prisma.payment.aggregate({
      where: { organizationId: orgId, status: "completed" },
      _sum: { amount: true },
    }),
    prisma.wallet.findUnique({ where: { organizationId: orgId } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Manage campaigns, bookings, and payments"
      />
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Find available AdSpaces
        </h2>
        <MarketplaceSearchForm />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Campaigns"
          value={campaigns}
          icon={Megaphone}
          accent="blue"
          href="/advertiser/campaigns"
        />
        <StatCard
          label="Wishlist"
          value={wishlist}
          icon={Heart}
          accent="rose"
          href="/wishlist"
        />
        <StatCard
          label="Booking requests"
          value={requests}
          icon={CalendarClock}
          accent="amber"
          href="/advertiser/booking-requests"
        />
        <StatCard
          label="Wallet balance"
          value={formatCurrency(wallet?.balance ?? 0)}
          sub={`Spent: ${formatCurrency(payments._sum.amount ?? 0)}`}
          icon={CreditCard}
          accent="emerald"
          href="/advertiser/wallet"
        />
      </div>
    </div>
  );
}
