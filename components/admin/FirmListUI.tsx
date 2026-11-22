import Link from "next/link";
import { Badge } from "@/components/ui";
import { SURFACE } from "@/components/dashboard/DashboardUI";
import { cn } from "@/lib/utils";

export type FirmStatusFilter = "all" | "approved" | "needs_review";

export function parseFirmStatusFilter(raw?: string): FirmStatusFilter {
  if (raw === "approved" || raw === "needs_review") return raw;
  return "all";
}

export function isApproved(status?: string | null) {
  return status === "approved";
}

export function needsReview(status?: string | null) {
  return status !== "approved";
}

export function verificationBadge(status?: string | null) {
  if (!status) return <Badge variant="muted">no profile</Badge>;
  if (status === "approved") return <Badge variant="success">approved</Badge>;
  if (status === "rejected") return <Badge variant="warning">rejected</Badge>;
  return <Badge variant="warning">{status.replaceAll("_", " ")}</Badge>;
}

export function verificationAccent(status?: string | null) {
  if (status === "approved") return "from-emerald-400 to-emerald-500";
  if (!status) return "from-slate-300 to-slate-400";
  return "from-amber-400 to-amber-500";
}

export function StatusFilterChips({
  basePath,
  q,
  status,
  counts,
}: {
  basePath: string;
  q?: string;
  status: FirmStatusFilter;
  counts: { all: number; approved: number; needs_review: number };
}) {
  const chips: { id: FirmStatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "approved", label: "Approved" },
    { id: "needs_review", label: "Needs review" },
  ];

  function href(id: FirmStatusFilter) {
    const params = new URLSearchParams();
    if (q?.trim()) params.set("q", q.trim());
    if (id !== "all") params.set("status", id);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const active = status === chip.id;
        return (
          <Link
            key={chip.id}
            href={href(chip.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
              active
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {chip.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              )}
            >
              {counts[chip.id]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function FirmCard({
  href,
  title,
  subtitle,
  email,
  status,
  metrics,
  details,
  footer,
}: {
  href: string;
  title: string;
  subtitle?: string | null;
  email: string;
  status?: string | null;
  metrics: { label: string; value: string | number }[];
  details?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        SURFACE,
        "group relative block overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(15,23,42,0.05),0_16px_32px_-12px_rgba(76,75,255,0.25)] hover:ring-[#4C4BFF]/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4C4BFF]/40"
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          verificationAccent(status)
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold tracking-tight text-slate-900 group-hover:text-[#4C4BFF]">
            {title}
          </h2>
          {subtitle ? <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p> : null}
          <p className="mt-0.5 truncate text-xs text-slate-400">{email}</p>
        </div>
        {verificationBadge(status)}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              {metric.label}
            </dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900">{metric.value}</dd>
          </div>
        ))}
      </dl>

      {details ? <div className="mt-4 space-y-1 text-xs text-slate-500">{details}</div> : null}
      {footer ? <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">{footer}</div> : null}
    </Link>
  );
}

export function FirmEmptyState({ text }: { text: string }) {
  return (
    <div className={cn(SURFACE, "px-6 py-12 text-center text-sm text-slate-500")}>{text}</div>
  );
}
