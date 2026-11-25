import { getLiveSession, redirectToRoleArea } from "@/lib/auth/live-session";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = redirectToRoleArea(await getLiveSession(), "admin");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdminSidebar email={session.email} />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto">
        <main className="flex-1 px-6 pb-6 pt-3 lg:px-8 lg:pb-8 lg:pt-3">{children}</main>
      </div>
    </div>
  );
}
