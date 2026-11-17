import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

export default async function AdvertiserWalletPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const wallet = await prisma.wallet.findUnique({
    where: { organizationId: session.organizationId },
    select: { balance: true },
  });

  const balance = wallet?.balance ?? 0;

  return (
    <div>
      <PageHeader
        title="Wallet"
        description="Money kept in your Tabellone wallet"
      />
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Tabellone wallet</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{formatCurrency(balance)}</p>
        {balance === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Nothing is in the wallet right now.</p>
        ) : null}
      </div>
    </div>
  );
}
