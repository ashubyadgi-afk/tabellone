import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { HoverInfo } from "@/components/owner/HoverInfo";
import { Button } from "@/components/ui";
import { PageBanner, TotalCard, SURFACE } from "@/components/dashboard/DashboardUI";
import { Plus, Users, CalendarCheck, UserPlus, Mail } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export default async function ClientsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const items = await prisma.client.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    include: { bookings: true },
  });

  const withBookings = items.filter((c) => c.bookings.length > 0).length;
  const withEmail = items.filter((c) => Boolean(c.email?.trim())).length;
  const totalBookings = items.reduce((sum, c) => sum + c.bookings.length, 0);

  return (
    <div className="space-y-6">
      <PageBanner
        title="Clients"
        description="Manage client records for internal bookings"
        action={
          <Link href="/owner/imd/clients/new">
            <Button>
              <Plus className="h-4 w-4" /> Add Client
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TotalCard label="Total clients" value={items.length} icon={Users} accent="indigo" />
        <TotalCard label="With bookings" value={withBookings} icon={CalendarCheck} accent="emerald" />
        <TotalCard label="Total bookings" value={totalBookings} icon={UserPlus} accent="violet" />
        <TotalCard label="With email" value={withEmail} icon={Mail} accent="orange" />
      </div>

      {items.length === 0 ? (
        <div className={cn(SURFACE, "px-6 py-12 text-center text-sm text-slate-500")}>
          No clients yet.{" "}
          <Link href="/owner/imd/clients/new" className="font-semibold text-[#4C4BFF] hover:underline">
            Add your first
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => (
            <article key={c.id} className={cn(SURFACE, "relative overflow-hidden p-5")}>
              <span
                className={cn(
                  "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
                  c.bookings.length > 0 ? "from-emerald-400 to-emerald-500" : "from-slate-300 to-slate-400"
                )}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-[15px] font-semibold tracking-tight text-slate-900">
                    <HoverInfo
                      label={c.name}
                      title={c.name}
                      rows={[
                        { label: "Business", value: c.businessName || "—" },
                        { label: "Email", value: c.email || "—" },
                        { label: "Phone", value: c.contactPhone || "—" },
                        { label: "Address", value: c.address || "—" },
                        { label: "Added on", value: formatDate(c.createdAt) },
                        { label: "Bookings", value: String(c.bookings.length) },
                      ]}
                    />
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{c.businessName || "No business name"}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-600">
                  {c.bookings.length} booking{c.bookings.length === 1 ? "" : "s"}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Email</dt>
                  <dd className="mt-1 truncate text-sm font-medium text-slate-900">{c.email || "—"}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Phone</dt>
                  <dd className="mt-1 truncate text-sm font-medium text-slate-900">{c.contactPhone || "—"}</dd>
                </div>
              </dl>

              <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                Added {formatDate(c.createdAt)}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
