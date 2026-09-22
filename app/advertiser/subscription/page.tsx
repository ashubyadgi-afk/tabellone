import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdvertiserSubscriptionPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const subscription = await prisma.subscription.findFirst({
    where: { organizationId: session.organizationId, status: "active" },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  const plans = await prisma.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: { priceMonthly: "asc" },
  });

  return (
    <div>
      <PageHeader title="Subscription" description="Manage your Tabellone plan" />
      {subscription && (
        <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="font-semibold text-emerald-900">
            Current plan: {subscription.plan.name}
          </p>
          <p className="text-sm text-emerald-700">
            {formatCurrency(subscription.plan.priceMonthly)}/month ·
            Expires {formatDate(subscription.expiresAt)}
          </p>
          <div className="mt-2">
            <Badge variant="success">{subscription.status}</Badge>
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <p className="font-semibold text-slate-900">{plan.name}</p>
            <p className="mt-2 text-2xl font-bold text-[#1e3a5f]">
              {formatCurrency(plan.priceMonthly)}
              <span className="text-sm font-normal text-slate-500">/mo</span>
            </p>
            <p className="mt-2 text-sm text-slate-500">{plan.features}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
