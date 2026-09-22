import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { OwnerSidebar } from "@/components/layout/OwnerSidebar";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    redirect("/login");
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
  });

  if (!org) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <OwnerSidebar
        organizationName={org.name}
        userEmail={session.email}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-6 lg:px-8">
            <p className="text-sm text-slate-500">
              Phase 1 · Inventory Management Dashboard
            </p>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              IMD Active
            </span>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
