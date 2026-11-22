import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  AD_SPACE_LIST_COPY,
  IMD_STATUS_LABELS,
  listOwnerAdSpaces,
  parseAdSpaceListFilter,
  type AdSpaceListFilter,
} from "@/lib/services/imd.service";
import { Button, Badge } from "@/components/ui";
import { PageBanner, TotalCard, SURFACE } from "@/components/dashboard/DashboardUI";
import { Plus, Pencil, Layers, CheckCircle2, XCircle, CalendarClock, MapPin } from "lucide-react";
import { DeleteAdSpaceButton } from "@/components/ad-space/DeleteAdSpaceButton";
import { formatCurrency, cn } from "@/lib/utils";
import { adSpacePhotos } from "@/lib/ad-space-photos";
import { adSpaceTypeLabel } from "@/lib/marketplace/search";
import { endOfDay, startOfDay } from "date-fns";

const LIST_FILTERS: { value: AdSpaceListFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "available", label: "Available" },
];

function filterHref(filter: AdSpaceListFilter) {
  return filter === "all" ? "/owner/imd/ad-spaces" : `/owner/imd/ad-spaces?filter=${filter}`;
}

function isBookedToday(bookings: Array<{ startDate: Date; endDate: Date }>) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  return bookings.some((b) => b.startDate <= todayEnd && b.endDate >= todayStart);
}

function statusAccent(status: string) {
  if (status === "active") return "from-emerald-400 to-emerald-500";
  if (status === "under_maintenance") return "from-amber-400 to-amber-500";
  return "from-slate-300 to-slate-400";
}

type PageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function AdSpacesPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const filter = parseAdSpaceListFilter(params.filter);
  const copy = AD_SPACE_LIST_COPY[filter];
  const allItems = await listOwnerAdSpaces(session.organizationId, "all");

  const activeCount = allItems.filter((a) => a.imdStatus === "active").length;
  const inactiveCount = allItems.filter(
    (a) => a.imdStatus === "inactive" || a.imdStatus === "under_maintenance"
  ).length;
  const availableCount = allItems.filter(
    (a) => a.imdStatus === "active" && !isBookedToday(a.bookings)
  ).length;

  const items = allItems.filter((space) => {
    const booked = isBookedToday(space.bookings);
    if (filter === "active") return space.imdStatus === "active";
    if (filter === "inactive") {
      return space.imdStatus === "inactive" || space.imdStatus === "under_maintenance";
    }
    if (filter === "available") return space.imdStatus === "active" && !booked;
    return true;
  });

  const filterCounts: Record<AdSpaceListFilter, number> = {
    all: allItems.length,
    active: activeCount,
    inactive: inactiveCount,
    available: availableCount,
  };

  return (
    <div className="space-y-6">
      <PageBanner
        title={copy.title}
        description={copy.description}
        action={
          <Link href="/owner/imd/ad-spaces/new">
            <Button>
              <Plus className="h-4 w-4" /> New Ad Space
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TotalCard label="Total spaces" value={allItems.length} icon={Layers} accent="indigo" />
        <TotalCard label="Active" value={activeCount} icon={CheckCircle2} accent="emerald" />
        <TotalCard label="Inactive" value={inactiveCount} icon={XCircle} accent="slate" />
        <TotalCard label="Available now" value={availableCount} icon={CalendarClock} accent="violet" />
      </div>

      <div className="flex flex-wrap gap-2">
        {LIST_FILTERS.map((item) => {
          const active = filter === item.value;
          return (
            <Link
              key={item.value}
              href={filterHref(item.value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                )}
              >
                {filterCounts[item.value]}
              </span>
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className={cn(SURFACE, "px-6 py-12 text-center text-sm text-slate-500")}>
          {copy.empty}{" "}
          {filter === "all" ? (
            <Link href="/owner/imd/ad-spaces/new" className="font-semibold text-[#4C4BFF] hover:underline">
              Create your first
            </Link>
          ) : (
            <Link href="/owner/imd/ad-spaces" className="font-semibold text-[#4C4BFF] hover:underline">
              View all
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((a) => {
            const cover = adSpacePhotos(a)[0];
            const location = [a.city, a.state].filter(Boolean).join(", ") || "—";
            return (
              <article key={a.id} className={cn(SURFACE, "relative overflow-hidden")}>
                <span className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", statusAccent(a.imdStatus))} />
                {cover ? (
                  <div className="relative h-36 overflow-hidden bg-slate-100">
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                    <div className="absolute left-3 top-3">
                      <Badge variant={a.imdStatus === "active" ? "success" : "muted"}>
                        {IMD_STATUS_LABELS[a.imdStatus]}
                      </Badge>
                    </div>
                  </div>
                ) : null}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/owner/imd/ad-spaces/${a.id}/edit`}
                        className="block truncate text-[15px] font-semibold tracking-tight text-slate-900 hover:text-[#4C4BFF]"
                      >
                        {a.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-400">{a.adSpaceNumber}</p>
                    </div>
                    {!cover ? (
                      <Badge variant={a.imdStatus === "active" ? "success" : "muted"}>
                        {IMD_STATUS_LABELS[a.imdStatus]}
                      </Badge>
                    ) : null}
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Type
                      </dt>
                      <dd className="mt-1 truncate text-sm font-semibold text-slate-900">
                        {adSpaceTypeLabel(a.adSpaceType)}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Price
                      </dt>
                      <dd className="mt-1 truncate text-sm font-semibold tabular-nums text-slate-900">
                        {a.basePrice ? formatCurrency(a.basePrice) : "—"}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Bookings
                      </dt>
                      <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
                        {a.bookings.length}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{location}</span>
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <Link
                      href={`/owner/imd/ad-spaces/${a.id}/edit`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4C4BFF] hover:underline"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                    <DeleteAdSpaceButton id={a.id} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
