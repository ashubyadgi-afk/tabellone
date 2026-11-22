import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { BannerAccountActions } from "@/components/layout/BannerAccountActions";

export type Accent = "indigo" | "amber" | "emerald" | "violet" | "rose" | "slate" | "orange";

const ACCENTS: Record<Accent, { bar: string; tile: string }> = {
  indigo: { bar: "from-[#4C4BFF] to-[#6D6BFF]", tile: "bg-[#4C4BFF]/10 text-[#4C4BFF]" },
  amber: { bar: "from-amber-400 to-amber-500", tile: "bg-amber-50 text-amber-600" },
  emerald: { bar: "from-emerald-400 to-emerald-500", tile: "bg-emerald-50 text-emerald-600" },
  violet: { bar: "from-[#8C47EE] to-[#B06CFF]", tile: "bg-[#8C47EE]/10 text-[#8C47EE]" },
  rose: { bar: "from-rose-400 to-rose-500", tile: "bg-rose-50 text-rose-600" },
  slate: { bar: "from-slate-300 to-slate-400", tile: "bg-slate-100 text-slate-600" },
  orange: { bar: "from-orange-400 to-[#F06B3B]", tile: "bg-orange-50 text-orange-600" },
};

export const SURFACE =
  "rounded-2xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70";

export const TABLE_HEAD =
  "border-b border-slate-100 bg-slate-50/70 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500";
export const TABLE_ROW = "transition hover:bg-slate-50/80";

export function PageBanner({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-[#4C4BFF] via-[#5E49F6] to-[#8C47EE] px-6 py-5 text-white shadow-[0_14px_30px_-18px_rgba(76,75,255,0.6)] sm:px-7">
      <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <BannerAccountActions className="absolute right-4 top-4 z-10 sm:right-5" />
      <div className="relative flex flex-col gap-4 pr-24 sm:flex-row sm:items-end sm:justify-between sm:pr-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm text-white/80">{description}</p> : null}
        </div>
        {action ? (
          <div className="self-start rounded-xl bg-white/95 p-1.5 text-slate-900 shadow-lg shadow-black/10 sm:mt-10 sm:self-auto">
            {action}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function SurfaceCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(SURFACE, className)}>{children}</div>;
}

export function TotalCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  href,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent: Accent;
  href?: string;
  className?: string;
}) {
  const style = ACCENTS[accent];
  const body = (
    <>
      <span className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", style.bar)} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", style.tile)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-[2rem] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-400">{sub ?? "\u00a0"}</span>
        {href ? (
          <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#4C4BFF]" />
        ) : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          SURFACE,
          "group relative block overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(15,23,42,0.05),0_16px_32px_-12px_rgba(76,75,255,0.25)] hover:ring-[#4C4BFF]/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4C4BFF]/40",
          className
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={cn(SURFACE, "relative overflow-hidden p-5", className)}>{body}</div>;
}

export function Panel({
  title,
  description,
  icon: Icon,
  aside,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn(SURFACE, "overflow-hidden", className)}>
      <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C4BFF]/10 to-[#8C47EE]/10 text-[#4C4BFF]">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h2>
          {description ? <p className="text-xs text-slate-500">{description}</p> : null}
        </div>
        {aside}
      </header>
      <div className={bodyClassName ?? "p-5"}>{children}</div>
    </section>
  );
}

export function CountPill({ value }: { value: number }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 tabular-nums">
      {value}
    </span>
  );
}

export function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-200/70">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm text-slate-500">{text}</p>
    </div>
  );
}
