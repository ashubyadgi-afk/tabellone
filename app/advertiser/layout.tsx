import { redirect } from "next/navigation";
import { getLiveSession, redirectToRoleArea } from "@/lib/auth/live-session";
import { AdvertiserSidebar } from "@/components/layout/AdvertiserSidebar";

export default async function AdvertiserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, organizationName } = redirectToRoleArea(
    await getLiveSession(),
    "advertiser"
  );

  if (!organizationName) redirect("/api/v1/auth/session-reset");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdvertiserSidebar
        organizationName={organizationName}
        userEmail={session.email}
      />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto">
        <main className="flex-1 px-6 pb-6 pt-3 lg:px-8 lg:pb-8 lg:pt-3">{children}</main>
      </div>
    </div>
  );
}
