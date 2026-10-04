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
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/v1/admin/listings")
      .then((r) => r.json())
      .then((d) => {
        setListings(d.data || []);
        setLoading(false);
      });
  }, []);

  async function review(id: string, action: "approve" | "reject") {
    const reason = (reasons[id] || "").trim();
    if (!reason) {
      setErrors((prev) => ({ ...prev, [id]: "Reason is required." }));
      return;
    }
    setErrors((prev) => ({ ...prev, [id]: "" }));
    setBusyId(id);
    const response = await fetch("/api/v1/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, reviewNotes: reason }),
    });
    setBusyId(null);
    if (response.ok) {
      setListings((prev) => prev.filter((l) => l.id !== id));
      return;
    }
    const data = await response.json().catch(() => null);
    setErrors((prev) => ({
      ...prev,
      [id]: data?.error?.message || "Could not save this review.",
    }));
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
                <div className="w-full shrink-0 sm:w-64">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Reason
                  </label>
                  <textarea
                    value={reasons[listing.id] || ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setReasons((prev) => ({ ...prev, [listing.id]: value }));
                      if (value.trim()) {
                        setErrors((prev) => ({ ...prev, [listing.id]: "" }));
                      }
                    }}
                    rows={3}
                    placeholder="Why are you approving or rejecting this ad?"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/15"
                  />
                  {errors[listing.id] ? (
                    <p className="mt-1 text-sm text-red-600">{errors[listing.id]}</p>
                  ) : null}
                  <div className="mt-3 flex gap-2">
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
