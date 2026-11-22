import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui";
import { PageBanner, SURFACE } from "@/components/dashboard/DashboardUI";
import { Crown } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

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
      <PageBanner title="Subscription" description="Manage your Tabellone plan" />
      {subscription && (
        <div className={cn(SURFACE, "relative mb-8 flex flex-wrap items-center gap-4 overflow-hidden p-6")}>
          <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#4C4BFF] to-[#8C47EE]" />
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4C4BFF] to-[#8C47EE] text-white">
            <Crown className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold tracking-tight text-slate-900">
              Current plan: {subscription.plan.name}
            </p>
            <p className="text-sm text-slate-500">
              {formatCurrency(subscription.plan.priceMonthly)}/month ·
              Expires {formatDate(subscription.expiresAt)}
            </p>
          </div>
          <Badge variant="success">{subscription.status}</Badge>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const current = subscription?.planId === plan.id;
          return (
            <div
              key={plan.id}
              className={cn(
                SURFACE,
                "relative overflow-hidden p-6 transition hover:-translate-y-0.5",
                current && "ring-2 ring-[#4C4BFF]/60"
              )}
            >
              {current ? (
                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4C4BFF] to-[#8C47EE]" />
              ) : null}
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{plan.name}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {formatCurrency(plan.priceMonthly)}
                <span className="text-sm font-normal text-slate-500">/mo</span>
              </p>
              <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-500">{plan.features}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
