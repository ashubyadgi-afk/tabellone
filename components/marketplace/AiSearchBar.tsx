"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { AdSpaceCard } from "./AdSpaceCard";
import { calculatePricing } from "@/lib/pricing/calculate";

type SearchResult = {
  id: string;
  name: string;
  adSpaceType: string;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  basePrice?: number | null;
  footfall?: number | null;
  peakHours?: string | null;
    dimensions?: string | null;
    photoUrl?: string | null;
    photoUrls?: string[] | null;
    organization?: { name: string; brandName?: string | null };
};

export function AiSearchBar({ compact }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const res = await fetch("/api/v1/ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    setExplanation(data.explanation);
    setResults(data.results || []);
    setLoading(false);
  }

  const pricingConfig = {
    commissionRate: 0.1,
    gstRate: 0.18,
    tdsRate: 0.02,
    platformGstRate: 0.18,
  };

  return (
    <div className={compact ? "" : "w-full"}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="AI search: e.g. billboard in Mumbai under 1 lakh"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            suppressHydrationWarning
          />
        </div>
        <button
          onClick={search}
          disabled={loading}
          className="flex items-center gap-2 rounded-2xl bg-[#1e3a5f] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#2d4a6f] disabled:opacity-50"
          suppressHydrationWarning
        >
          <Search className="h-4 w-4" />
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {searched && (
        <div className="mt-6">
          <p className="text-sm text-slate-600">{explanation}</p>
          {results.length > 0 ? (
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((space) => {
                const customerPrice = space.basePrice
                  ? calculatePricing(space.basePrice, pricingConfig).customerPrice
                  : null;
                return (
                  <AdSpaceCard
                    key={space.id}
                    space={space}
                    customerPrice={customerPrice}
                  />
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No matching AdSpaces found.</p>
          )}
        </div>
      )}
    </div>
  );
}
