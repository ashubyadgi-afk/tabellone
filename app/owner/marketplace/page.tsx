"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { PageHeader, Button, Badge } from "@/components/ui";
import {
  ListingReviewHistory,
  type ListingReviewEventView,
} from "@/components/ad-space/ListingReviewHistory";
import { formatCurrency } from "@/lib/utils";

type AdSpace = {
  id: string;
  name: string;
  basePrice: number | null;
  marketplaceListingStatus: string;
};

type Listing = {
  id: string;
  status: string;
  adSpaceId: string;
  reviewNotes: string | null;
  events: ListingReviewEventView[];
};

export default function OwnerMarketplacePage() {
  const [adSpaces, setAdSpaces] = useState<AdSpace[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/imd/ad-spaces")
      .then((r) => r.json())
      .then((d) => setAdSpaces(d.items || d.data || []));
    fetch("/api/v1/owner/marketplace/listings")
      .then((r) => r.json())
      .then((d) => setListings(d.data || []));
  }, []);

  async function submitListing(adSpaceId: string) {
    setLoading(adSpaceId);
    await fetch("/api/v1/owner/marketplace/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adSpaceId }),
    });
    const res = await fetch("/api/v1/owner/marketplace/listings");
    const data = await res.json();
    setListings(data.data || []);
    setLoading(null);
  }

  function getListing(adSpaceId: string) {
    return listings.find((l) => l.adSpaceId === adSpaceId);
  }

  return (
    <div>
      <PageHeader
        title="List on Marketplace"
        description="Submit AdSpaces for admin approval to appear publicly"
      />
      <div className="space-y-4">
        {adSpaces.map((space) => {
          const listing = getListing(space.id);
          const status = listing?.status;
          const canSubmit = !status || status === "draft" || status === "rejected";
          const needsPrice = canSubmit && status !== "rejected" && space.basePrice == null;
          const canEdit = status !== "approved";
          return (
            <div
              key={space.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div>
                <p className="font-semibold text-slate-900">{space.name}</p>
                <p className="text-sm text-slate-500">
                  {space.basePrice
                    ? formatCurrency(space.basePrice) + "/mo"
                    : "No base price set"}
                </p>
                {status && (
                  <div className="mt-2">
                    <Badge
                      variant={
                        status === "approved"
                          ? "success"
                          : status === "rejected"
                            ? "warning"
                            : "default"
                      }
                    >
                      Listing: {status}
                    </Badge>
                    {listing?.events?.length ? (
                      <div className="mt-3">
                        <ListingReviewHistory events={listing.events} />
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
                {canEdit ? (
                  <Link
                    href={`/owner/imd/ad-spaces/${space.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#1e3a5f]/20 bg-[#1e3a5f]/5 px-3 py-1.5 text-sm font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/10"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                ) : null}
                {canSubmit ? (
                  <>
                    <Button
                      size="sm"
                      disabled={loading === space.id || needsPrice}
                      onClick={() => submitListing(space.id)}
                    >
                      {loading === space.id ? "Submitting…" : "Submit for review"}
                    </Button>
                    {needsPrice ? (
                      <p className="text-xs text-slate-500">Add a base price to submit.</p>
                    ) : null}
                  </>
                ) : (
                  <Badge variant={status === "approved" ? "success" : "warning"}>
                    {status}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
        {adSpaces.length === 0 && (
          <p className="text-slate-500">
            Create AdSpaces in IMD first, then list them here.
          </p>
        )}
      </div>
    </div>
  );
}
