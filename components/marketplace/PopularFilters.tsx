"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AD_SPACE_TYPES,
  POPULAR_AVAILABILITY,
  POPULAR_MIN_RATINGS,
  POPULAR_MIN_SIZES,
} from "@/lib/marketplace/search";
import { cn } from "@/lib/utils";

type FilterGroupProps = {
  title: string;
  param: string;
  options: readonly { value: string; label: string }[];
};

function FilterGroup({ title, param, options }: FilterGroupProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(param);

  function select(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (current === value) next.delete(param);
    else next.set(param, value);
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </legend>
      <div role="radiogroup" className="space-y-1">
        {options.map((option) => {
          const checked = current === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => select(option.value)}
              suppressHydrationWarning
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition",
                checked
                  ? "bg-orange-50 text-[#1e3a5f]"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  checked
                    ? "border-orange-500 bg-orange-500"
                    : "border-slate-300 bg-white"
                )}
              >
                {checked ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : null}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PopularFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasPopular =
    searchParams.has("availMonths") ||
    searchParams.has("type") ||
    searchParams.has("minSize") ||
    searchParams.has("minRating");

  function clearPopular() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("availMonths");
    next.delete("type");
    next.delete("minSize");
    next.delete("minRating");
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-36">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[#1e3a5f]">Popular filters</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Select to refine. Click again to clear.
          </p>
        </div>
        {hasPopular ? (
          <button
            type="button"
            onClick={clearPopular}
            suppressHydrationWarning
            className="shrink-0 text-xs font-medium text-orange-600 hover:underline"
          >
            Reset
          </button>
        ) : null}
      </div>
      <div className="space-y-5">
        <FilterGroup
          title="Display by availability"
          param="availMonths"
          options={POPULAR_AVAILABILITY}
        />
        <FilterGroup
          title="Display by space type"
          param="type"
          options={AD_SPACE_TYPES}
        />
        <FilterGroup
          title="Display by size"
          param="minSize"
          options={POPULAR_MIN_SIZES}
        />
        <FilterGroup
          title="Display by rating"
          param="minRating"
          options={POPULAR_MIN_RATINGS}
        />
      </div>
    </aside>
  );
}
