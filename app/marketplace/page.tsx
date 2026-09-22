import { Suspense } from "react";
import { PublicNav } from "@/components/layout/PublicNav";
import { AiChatWidget } from "@/components/marketplace/AiChatWidget";
import { AdSpaceCard } from "@/components/marketplace/AdSpaceCard";
import { MarketplaceSearchForm } from "@/components/marketplace/MarketplaceSearchForm";
import { PopularFilters } from "@/components/marketplace/PopularFilters";
import {
  listPublicAdSpaces,
  marketplaceFiltersFromParams,
} from "@/lib/services/marketplace.service";
import { pricePublicListings } from "@/lib/services/pricing.service";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    type?: string;
    city?: string;
    search?: string;
    location?: string;
    size?: string;
    from?: string;
    to?: string;
    availMonths?: string;
    minSize?: string;
    minRating?: string;
    view?: string;
  }>;
};

export default async function MarketplacePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = marketplaceFiltersFromParams(params);
  const spaces = await listPublicAdSpaces(filters);
  const priced = await pricePublicListings(spaces);

  const searched = Boolean(
    params.view === "results" ||
      params.from ||
      params.to ||
      params.location ||
      params.city ||
      params.type ||
      params.size ||
      params.search ||
      params.availMonths ||
      params.minSize ||
      params.minRating
  );

  const dateRange =
    params.from || params.to
      ? ` · ${params.from || "…"} to ${params.to || "…"}`
      : "";

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />

      <div className="mx-auto max-w-7xl px-6 pt-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f]">Browse AdSpaces</h1>
        <p className="mt-2 text-slate-500">
          {spaces.length} verified listing{spaces.length !== 1 ? "s" : ""}{" "}
          available
          {params.type ? ` · ${params.type}` : ""}
          {params.location || params.city
            ? ` · ${params.location || params.city}`
            : ""}
          {params.size ? ` · ${params.size}` : ""}
          {params.minSize ? ` · ${params.minSize}+` : ""}
          {params.availMonths ? ` · ${params.availMonths}+ months` : ""}
          {params.minRating ? ` · ${params.minRating}★+` : ""}
          {dateRange}
        </p>
      </div>

      <div className="sticky top-16 z-40 mt-4 border-y border-slate-200/80 bg-slate-50/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <MarketplaceSearchForm
            key={[
              params.from,
              params.to,
              params.location,
              params.type,
              params.size,
              params.availMonths,
              params.minSize,
              params.minRating,
              params.view,
            ].join("|")}
            values={{
              from: params.from,
              to: params.to,
              location: params.location || params.search || params.city,
              type: params.type,
              size: params.size,
              availMonths: params.availMonths,
              minSize: params.minSize,
              minRating: params.minRating,
            }}
          />
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className={searched ? "lg:flex lg:items-start lg:gap-8" : ""}>
          {searched ? (
            <div className="mb-6 w-full shrink-0 lg:mb-0 lg:w-72">
              <Suspense>
                <PopularFilters />
              </Suspense>
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            {priced.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <p className="text-slate-500">
                  No listings match those filters. Sample spaces are available{" "}
                  <span className="font-medium text-slate-700">
                    1 Sep 2026 – 31 Mar 2027
                  </span>
                  , except where already booked. Try clearing a popular filter.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {priced.map(({ space, customerPrice }) => (
                  <AdSpaceCard
                    key={space.id}
                    space={space}
                    customerPrice={customerPrice}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <AiChatWidget />
    </div>
  );
}
