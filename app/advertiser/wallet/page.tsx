import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageBanner } from "@/components/dashboard/DashboardUI";
import { Wallet } from "lucide-react";
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
      <PageBanner title="Wallet" description="Money kept in your Tabellone wallet" />
      <div className="relative max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E1B4B] via-[#3B2A9E] to-[#8C47EE] p-7 text-white shadow-[0_24px_48px_-24px_rgba(76,75,255,0.7)]">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-[#F06B3B]/30 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Tabellone wallet</p>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <Wallet className="h-5 w-5" />
          </span>
        </div>
        <p className="relative mt-8 text-4xl font-semibold tracking-tight tabular-nums">{formatCurrency(balance)}</p>
        {balance === 0 ? (
          <p className="relative mt-3 text-sm text-white/75">Nothing is in the wallet right now.</p>
        ) : null}
      </div>
    </div>
  );
}
