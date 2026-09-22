"use client";

import { useEffect, useState } from "react";
import { PageHeader, Button, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

type Listing = {
  id: string;
  status: string;
  title: string | null;
  adSpace: {
    name: string;
    basePrice: number | null;
    organization: { name: string };
  };
};

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/listings")
      .then((r) => r.json())
      .then((d) => {
        setListings(d.data || []);
        setLoading(false);
      });
  }, []);

  async function review(id: string, action: "approve" | "reject") {
    await fetch("/api/v1/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div>
      <PageHeader
        title="Listing approvals"
        description="Review owner marketplace listing submissions"
      />
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : listings.length === 0 ? (
        <p className="text-slate-500">No pending listings.</p>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {listing.adSpace.name}
                </p>
                <p className="text-sm text-slate-500">
                  {listing.adSpace.organization.name}
                  {listing.adSpace.basePrice &&
                    ` · ${formatCurrency(listing.adSpace.basePrice)}/mo`}
                </p>
                <Badge variant="warning">{listing.status}</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => review(listing.id, "approve")}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => review(listing.id, "reject")}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
