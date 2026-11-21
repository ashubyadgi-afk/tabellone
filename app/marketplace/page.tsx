import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
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
import { listCartAdSpaceIds } from "@/lib/services/cart.service";
import { listWishlistAdSpaceIds } from "@/lib/services/wishlist.service";

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
  const session = await getSession();
  const filters = marketplaceFiltersFromParams(params);
  const spaces = await listPublicAdSpaces(filters);
  const priced = await pricePublicListings(spaces);
  const advertiserId =
    session?.role === "advertiser" && session.organizationId
      ? session.organizationId
      : null;
  const [cartIds, wishlistIds] = advertiserId
    ? await Promise.all([
        listCartAdSpaceIds(advertiserId).then((ids) => new Set(ids)),
        listWishlistAdSpaceIds(advertiserId).then((ids) => new Set(ids)),
      ])
    : [new Set<string>(), new Set<string>()];

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
    <div className="min-h-screen bg-gradient-to-b from-[#F3F2FF] via-[#F8F7FF] to-[#FFF6EF]">
      <PublicNav />

      <div className="relative overflow-hidden bg-gradient-to-r from-[#E9EBFF] via-[#F6EFFF] to-[#FFF1E6]">
        <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-[#4C4BFF]/20 blur-3xl" />
        <div className="pointer-events-none absolute right-10 -top-10 h-64 w-64 rounded-full bg-[#E647A7]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-1/3 h-56 w-56 rounded-full bg-[#FF8C3A]/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 pb-8 pt-10">
          <h1 className="text-3xl font-bold text-slate-900 lg:text-4xl">
            Browse <span className="tabellone-gradient">AdSpaces</span>
          </h1>
          <p className="mt-2 text-slate-600">
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
      </div>

      <div className="sticky top-16 z-40 border-b border-[#4C4BFF]/10 bg-gradient-to-r from-[#F1F0FF]/95 via-white/95 to-[#FFF3EA]/95 shadow-md shadow-[#4C4BFF]/5 backdrop-blur-md">
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
              <div className="rounded-2xl border border-[#4C4BFF]/15 bg-gradient-to-br from-white to-[#F3F2FF] p-12 text-center shadow-sm">
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
                    signedIn={Boolean(advertiserId)}
                    inCart={cartIds.has(space.id)}
                    inWishlist={wishlistIds.has(space.id)}
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
