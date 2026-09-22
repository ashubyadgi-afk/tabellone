import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdvertiserWalletPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const wallet = await prisma.wallet.findUnique({
    where: { organizationId: session.organizationId },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  const payments = await prisma.payment.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div>
      <PageHeader title="Wallet & payments" description="Balance and transaction history" />
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Wallet balance</p>
        <p className="text-3xl font-bold text-[#1e3a5f]">
          {formatCurrency(wallet?.balance ?? 0)}
        </p>
      </div>

      <h2 className="mb-4 font-semibold text-slate-900">Recent payments</h2>
      <div className="space-y-3">
        {payments.map((p) => (
          <div
            key={p.id}
            className="flex justify-between rounded-xl border border-slate-200 bg-white px-5 py-4"
          >
            <div>
              <p className="font-medium text-slate-900">{p.method.toUpperCase()}</p>
              <p className="text-xs text-slate-500">{formatDate(p.createdAt)}</p>
            </div>
            <p className="font-semibold text-emerald-600">
              {formatCurrency(p.amount)}
            </p>
          </div>
        ))}
        {payments.length === 0 && (
          <p className="text-slate-500">No payments yet.</p>
        )}
      </div>
    </div>
  );
}
