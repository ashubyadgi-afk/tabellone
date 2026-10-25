import { redirect } from "next/navigation";
import { getLiveSession, redirectToRoleArea } from "@/lib/auth/live-session";
import { prisma } from "@/lib/db";
import { AdvertiserSidebar } from "@/components/layout/AdvertiserSidebar";

export default async function AdvertiserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = redirectToRoleArea(await getLiveSession(), "advertiser");

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
  });
  if (!org) redirect("/api/v1/auth/session-reset");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdvertiserSidebar
        organizationName={org.name}
        userEmail={session.email}
      />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
          <div className="flex h-14 items-center px-6 lg:px-8">
            <p className="text-sm text-slate-500">Advertiser Dashboard</p>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
