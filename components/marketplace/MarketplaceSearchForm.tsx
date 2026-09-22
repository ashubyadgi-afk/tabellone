import Link from "next/link";
import { CalendarRange, MapPin, Maximize2, LayoutGrid, MapPinned } from "lucide-react";
import {
  AD_SPACE_LOCATIONS,
  AD_SPACE_SIZE_PRESETS,
  AD_SPACE_TYPES,
  type MarketplaceSearchValues,
} from "@/lib/marketplace/search";
import { cn } from "@/lib/utils";

type MarketplaceSearchFormProps = {
  values?: MarketplaceSearchValues;
  variant?: "light" | "dark";
  action?: string;
};

export function MarketplaceSearchForm({
  values = {},
  variant = "light",
  action = "/marketplace",
}: MarketplaceSearchFormProps) {
  const dark = variant === "dark";
  const labelClass = cn(
    "mb-1.5 block text-xs font-semibold uppercase tracking-wide",
    dark ? "text-slate-300" : "text-slate-500"
  );
  const fieldClass = cn(
    "w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition",
    dark
      ? "border-white/20 bg-white text-slate-900 focus:ring-2 focus:ring-orange-400/40"
      : "border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20"
  );

  return (
    <form
      method="GET"
      action={action}
      className={cn(
        "rounded-2xl p-5",
        dark
          ? "border border-white/15 bg-white/10 backdrop-blur-md"
          : "border border-slate-200 bg-white shadow-sm"
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <label htmlFor="from" className={labelClass}>
            <span className="inline-flex items-center gap-1.5">
              <CalendarRange className="h-3.5 w-3.5" />
              Available from
            </span>
          </label>
          <input
            id="from"
            type="date"
            name="from"
            min="2026-09-01"
            max="2027-03-31"
            defaultValue={values.from}
            className={fieldClass}
            suppressHydrationWarning
          />
        </div>
        <div>
          <label htmlFor="to" className={labelClass}>
            Available to
          </label>
          <input
            id="to"
            type="date"
            name="to"
            min="2026-09-01"
            max="2027-03-31"
            defaultValue={values.to}
            className={fieldClass}
            suppressHydrationWarning
          />
        </div>
        <div>
          <label htmlFor="location" className={labelClass}>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Location
            </span>
          </label>
          <select
            id="location"
            name="location"
            defaultValue={values.location || ""}
            className={fieldClass}
            suppressHydrationWarning
          >
            <option value="">All locations</option>
            {AD_SPACE_LOCATIONS.map((location) => (
              <option key={location.value} value={location.value}>
                {location.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="type" className={labelClass}>
            <span className="inline-flex items-center gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              Type of space
            </span>
          </label>
          <select
            id="type"
            name="type"
            defaultValue={values.type || ""}
            className={fieldClass}
            suppressHydrationWarning
          >
            <option value="">All types</option>
            {AD_SPACE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="size" className={labelClass}>
            <span className="inline-flex items-center gap-1.5">
              <Maximize2 className="h-3.5 w-3.5" />
              Size
            </span>
          </label>
          <select
            id="size"
            name="size"
            defaultValue={values.size || ""}
            className={fieldClass}
            suppressHydrationWarning
          >
            <option value="">Any size</option>
            {AD_SPACE_SIZE_PRESETS.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col justify-end">
          {values.availMonths ? (
            <input type="hidden" name="availMonths" value={values.availMonths} />
          ) : null}
          {values.minSize ? (
            <input type="hidden" name="minSize" value={values.minSize} />
          ) : null}
          {values.minRating ? (
            <input type="hidden" name="minRating" value={values.minRating} />
          ) : null}
          <input type="hidden" name="view" value="results" />
          <label className={labelClass}>Search</label>
          <button
            type="submit"
            className="w-full rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-400"
            suppressHydrationWarning
          >
            Search
          </button>
        </div>
      </div>
      <div
        className={cn(
          "mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs",
          dark ? "text-slate-400" : "text-slate-500"
        )}
      >
        <p>
          Search campaign dates inside each listing’s availability window. Demo
          inventory runs 1 Sep 2026 – 31 Mar 2027.
        </p>
        <span
          className="inline-flex cursor-not-allowed items-center gap-1 opacity-70"
          title="Geolocation search will be added in a later release"
        >
          <MapPinned className="h-3.5 w-3.5" />
          Near me — coming soon
        </span>
        {(values.from ||
          values.to ||
          values.location ||
          values.type ||
          values.size) && (
          <Link
            href="/marketplace"
            className={cn(
              "font-medium underline-offset-2 hover:underline",
              dark ? "text-slate-300" : "text-slate-600"
            )}
          >
            Clear filters
          </Link>
        )}
      </div>
    </form>
  );
}
