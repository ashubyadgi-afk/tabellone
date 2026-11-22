import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { BOOKING_STATUS_LABELS, IMD_STATUS_LABELS } from "@/lib/services/imd.service";
import { adSpaceTypeLabel } from "@/lib/marketplace/search";
import { HoverInfo } from "@/components/owner/HoverInfo";
import { Button, Badge } from "@/components/ui";
import { PageBanner, TotalCard, SURFACE } from "@/components/dashboard/DashboardUI";
import {
  Plus,
  CalendarCheck,
  CalendarClock,
  FileText,
  IndianRupee,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

function bookingAccent(status: string) {
  if (status === "active") return "from-emerald-400 to-emerald-500";
  if (status === "confirmed") return "from-[#4C4BFF] to-[#8C47EE]";
  if (status === "completed") return "from-slate-300 to-slate-400";
  if (status === "cancelled") return "from-rose-400 to-rose-500";
  return "from-amber-400 to-amber-500";
}

function bookingBadgeVariant(status: string): "success" | "warning" | "muted" | "default" {
  if (status === "active" || status === "confirmed") return "success";
  if (status === "cancelled") return "warning";
  if (status === "completed") return "muted";
  return "default";
}

export default async function BookingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const items = await prisma.booking.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { startDate: "desc" },
    include: {
      adSpace: true,
      client: { include: { _count: { select: { bookings: true } } } },
      invoice: true,
    },
  });

  const now = new Date();
  const activeCount = items.filter((b) => b.status === "active").length;
  const upcomingCount = items.filter(
    (b) => (b.status === "confirmed" || b.status === "active") && b.startDate > now
  ).length;
  const withInvoice = items.filter((b) => Boolean(b.invoice)).length;
  const totalAmount = items.reduce((sum, b) => sum + (b.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageBanner
        title="Bookings"
        description="Client bookings linked to Ad Spaces"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/owner/imd/clients/new">
              <Button variant="secondary">
                <Plus className="h-4 w-4" /> Add Client
              </Button>
            </Link>
            <Link href="/owner/imd/bookings/new">
              <Button>
                <Plus className="h-4 w-4" /> New Booking
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TotalCard label="Total bookings" value={items.length} icon={CalendarCheck} accent="indigo" />
        <TotalCard label="Active" value={activeCount} icon={CalendarClock} accent="emerald" />
        <TotalCard label="Upcoming" value={upcomingCount} icon={CalendarClock} accent="violet" />
        <TotalCard
          label="Booked value"
          value={formatCurrency(totalAmount)}
          sub={`${withInvoice} with invoice`}
          icon={IndianRupee}
          accent="orange"
        />
      </div>

      {items.length === 0 ? (
        <div className={cn(SURFACE, "px-6 py-12 text-center text-sm text-slate-500")}>
          No bookings yet.{" "}
          <Link href="/owner/imd/bookings/new" className="font-semibold text-[#4C4BFF] hover:underline">
            Create your first
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((b) => (
            <article key={b.id} className={cn(SURFACE, "relative overflow-hidden p-5")}>
              <span className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", bookingAccent(b.status))} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-[15px] font-semibold tracking-tight text-slate-900">
                    <HoverInfo
                      label={b.adSpace.name}
                      title={b.adSpace.name}
                      rows={[
                        { label: "Type", value: adSpaceTypeLabel(b.adSpace.adSpaceType) || "—" },
                        {
                          label: "City",
                          value: [b.adSpace.city, b.adSpace.state].filter(Boolean).join(", ") || "—",
                        },
                        { label: "Address", value: b.adSpace.address || "—" },
                        { label: "Size", value: b.adSpace.dimensions || "—" },
                        { label: "Status", value: IMD_STATUS_LABELS[b.adSpace.imdStatus] },
                        {
                          label: "Base price",
                          value: b.adSpace.basePrice ? formatCurrency(b.adSpace.basePrice) : "—",
                        },
                      ]}
                    />
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    <HoverInfo
                      label={b.client.name}
                      title={b.client.name}
                      rows={[
                        { label: "Business", value: b.client.businessName || "—" },
                        { label: "Email", value: b.client.email || "—" },
                        { label: "Phone", value: b.client.contactPhone || "—" },
                        { label: "Address", value: b.client.address || "—" },
                        { label: "Added on", value: formatDate(b.client.createdAt) },
                        { label: "Bookings", value: String(b.client._count.bookings) },
                      ]}
                    />
                    {b.client.businessName ? ` · ${b.client.businessName}` : ""}
                  </p>
                </div>
                <Badge variant={bookingBadgeVariant(b.status)}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Period
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">
                    {formatDate(b.startDate)}
                    <span className="mx-1 text-slate-300">→</span>
                    {formatDate(b.endDate)}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Amount
                  </dt>
                  <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
                    {b.amount ? formatCurrency(b.amount) : "—"}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-400">{adSpaceTypeLabel(b.adSpace.adSpaceType)}</span>
                {b.invoice ? (
                  <Link
                    href={`/owner/imd/invoices/${b.invoice.id}`}
                    className="inline-flex items-center gap-1.5 font-semibold text-[#4C4BFF] hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {b.invoice.invoiceNumber}
                  </Link>
                ) : (
                  <span className="text-slate-400">No invoice</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
