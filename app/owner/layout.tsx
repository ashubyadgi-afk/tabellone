import { redirect } from "next/navigation";
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
        <main className="flex-1 p-6 lg:p-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
