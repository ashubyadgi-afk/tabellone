import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, UserCircle } from "lucide-react";
import { getLiveSession, redirectToRoleArea } from "@/lib/auth/live-session";
import { prisma } from "@/lib/db";
import { OwnerSidebar } from "@/components/layout/OwnerSidebar";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = redirectToRoleArea(await getLiveSession(), "owner");

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
  });

  if (!org) {
    redirect("/api/v1/auth/session-reset");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 print:block print:h-auto print:overflow-visible print:bg-white">
      <div className="print:hidden">
        <OwnerSidebar
          organizationName={org.name}
          userEmail={session.email}
        />
      </div>
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto print:h-auto print:overflow-visible">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-md print:hidden">
          <div className="flex h-16 items-center justify-between px-6 lg:px-8">
            <p className="text-sm text-slate-500">
              Phase 1 · Inventory Management Dashboard
            </p>
            <div className="flex items-center gap-1">
              <Link
                href="/owner/profile/edit"
                aria-label="Profile"
                title="Profile"
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <UserCircle className="h-5 w-5" />
              </Link>
              <form action="/api/v1/auth/logout" method="POST">
                <button
                  type="submit"
                  aria-label="Sign out"
                  title="Sign out"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
