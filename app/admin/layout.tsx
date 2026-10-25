import { getLiveSession, redirectToRoleArea } from "@/lib/auth/live-session";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = redirectToRoleArea(await getLiveSession(), "admin");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <AdminSidebar email={session.email} />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
          <div className="flex h-16 items-center px-6 lg:px-8">
            <p className="text-sm font-medium text-slate-500">Admin Console</p>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
