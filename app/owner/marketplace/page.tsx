"use client";

import { useEffect, useState } from "react";
import { PageHeader, Button, Badge } from "@/components/ui";
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

  function getListingStatus(adSpaceId: string) {
    return listings.find((l) => l.adSpaceId === adSpaceId)?.status;
  }

  return (
    <div>
      <PageHeader
        title="List on Marketplace"
        description="Submit AdSpaces for admin approval to appear publicly"
      />
      <div className="space-y-4">
        {adSpaces.map((space) => {
          const status = getListingStatus(space.id);
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
                  </div>
                )}
              </div>
              {!status || status === "draft" || status === "rejected" ? (
                <Button
                  size="sm"
                  disabled={loading === space.id || !space.basePrice}
                  onClick={() => submitListing(space.id)}
                >
                  {loading === space.id ? "Submitting…" : "Submit for review"}
                </Button>
              ) : (
                <Badge variant={status === "approved" ? "success" : "warning"}>
                  {status}
                </Badge>
              )}
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
