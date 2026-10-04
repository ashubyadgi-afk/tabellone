"use client";

import { useEffect, useState } from "react";
import { PageHeader, Button, Badge } from "@/components/ui";
import { adSpaceTypeLabel } from "@/lib/marketplace/search";
import { formatCurrency } from "@/lib/utils";

type Listing = {
  id: string;
  status: string;
  title: string | null;
  adSpace: {
    name: string;
    adSpaceNumber: string;
    adSpaceType: string;
    city: string | null;
    state: string | null;
    address: string | null;
    dimensions: string | null;
    basePrice: number | null;
    peakHours: string | null;
    photoUrl: string | null;
    organization: { name: string };
  };
};

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/admin/listings")
      .then((r) => r.json())
      .then((d) => {
        setListings(d.data || []);
        setLoading(false);
      });
  }, []);

  async function review(id: string, action: "approve" | "reject") {
    setBusyId(id);
    const response = await fetch("/api/v1/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setBusyId(null);
    if (response.ok) {
      setListings((prev) => prev.filter((l) => l.id !== id));
    }
  }

  return (
    <div>
      <PageHeader
        title="Listing approvals"
        description="New ad spaces from owners appear here. Approve to list them, or reject to keep them off the marketplace."
      />
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : listings.length === 0 ? (
        <p className="text-slate-500">No pending listings.</p>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const space = listing.adSpace;
            const place = [space.city, space.state].filter(Boolean).join(", ");
            return (
              <div
                key={listing.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
              >
                <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-36">
                  {space.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={space.photoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{space.name}</p>
                  <p className="text-sm text-slate-500">
                    {space.organization.name}
                    {space.adSpaceNumber ? ` · ${space.adSpaceNumber}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {[
                      adSpaceTypeLabel(space.adSpaceType),
                      place,
                      space.dimensions,
                      space.basePrice ? `${formatCurrency(space.basePrice)}/mo` : null,
                      space.peakHours ? `Peak traffic ${space.peakHours}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {space.address ? (
                    <p className="mt-1 text-sm text-slate-500">{space.address}</p>
                  ) : null}
                  <div className="mt-2">
                    <Badge variant="warning">{listing.status.replaceAll("_", " ")}</Badge>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col">
                  <Button
                    size="sm"
                    disabled={busyId === listing.id}
                    onClick={() => review(listing.id, "approve")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={busyId === listing.id}
                    onClick={() => review(listing.id, "reject")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
