import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar email={session.email} />
      <div className="flex flex-1 flex-col min-w-0">
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
