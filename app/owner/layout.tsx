import { redirect } from "next/navigation";
import { getLiveSession, redirectToRoleArea } from "@/lib/auth/live-session";
import { OwnerSidebar } from "@/components/layout/OwnerSidebar";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, organizationName } = redirectToRoleArea(
    await getLiveSession(),
    "owner"
  );

  if (!organizationName) {
    redirect("/api/v1/auth/session-reset");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 print:block print:h-auto print:overflow-visible print:bg-white">
      <div className="print:hidden">
        <OwnerSidebar
          organizationName={organizationName}
          userEmail={session.email}
        />
      </div>
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto print:h-auto print:overflow-visible">
        <main className="flex-1 px-6 pb-6 pt-3 lg:px-8 lg:pb-8 lg:pt-3 print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
