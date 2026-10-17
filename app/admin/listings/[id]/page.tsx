"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader, Button, Badge } from "@/components/ui";
import {
  ListingReviewHistory,
  type ListingReviewEventView,
} from "@/components/ad-space/ListingReviewHistory";
import { adSpaceTypeLabel } from "@/lib/marketplace/search";
import { formatCurrency } from "@/lib/utils";

type Listing = {
  id: string;
  status: string;
  title: string | null;
  description: string | null;
  events: ListingReviewEventView[];
  adSpace: {
    name: string;
    adSpaceNumber: string;
    adSpaceType: string;
    city: string | null;
    state: string | null;
    address: string | null;
    dimensions: string | null;
    basePrice: number | null;
    footfall: number | null;
    peakHours: string | null;
    notes: string | null;
    photoUrl: string | null;
    organization: { name: string };
  };
};

export default function AdminListingDetailPage() {
  const params = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/v1/admin/listings/${params.id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          setMissing(true);
          return;
        }
        setListing(data.data);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  async function review(action: "approve" | "reject") {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Reason is required.");
      return;
    }
    setError("");
    setBusy(true);
    const response = await fetch(`/api/v1/admin/listings/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewNotes: trimmed }),
    });
    const data = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      setError(data?.error?.message || "Could not save this review.");
      return;
    }
    setListing(data.data);
    setReason("");
  }

  if (loading) {
    return <p className="text-slate-500">Loading…</p>;
  }

  if (missing || !listing) {
    return (
      <div>
        <Link href="/admin/listings" className="text-sm font-medium text-[#1e3a5f]">
          Back to listing approvals
        </Link>
        <p className="mt-4 text-slate-500">This listing could not be found.</p>
      </div>
    );
  }

  const space = listing.adSpace;
  const place = [space.city, space.state].filter(Boolean).join(", ");
  const pending = listing.status === "submitted" || listing.status === "under_review";

  return (
    <div>
      <Link href="/admin/listings" className="text-sm font-medium text-[#1e3a5f]">
        Back to listing approvals
      </Link>
      <PageHeader
        title={space.name}
        description={`${space.organization.name}${space.adSpaceNumber ? ` · ${space.adSpaceNumber}` : ""}`}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="overflow-hidden rounded-xl bg-slate-100">
            {space.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={space.photoUrl} alt="" className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center text-sm text-slate-400">
                No photo
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge
              variant={
                listing.status === "approved"
                  ? "success"
                  : listing.status === "rejected"
                    ? "warning"
                    : "default"
              }
            >
              {listing.status.replaceAll("_", " ")}
            </Badge>
          </div>
          <dl className="mt-4 space-y-2 text-sm text-slate-600">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Type</dt>
              <dd>{adSpaceTypeLabel(space.adSpaceType)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Location</dt>
              <dd>{place || "Not set"}</dd>
              {space.address ? <dd className="text-slate-500">{space.address}</dd> : null}
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Price</dt>
              <dd>{space.basePrice ? `${formatCurrency(space.basePrice)}/mo` : "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Dimensions</dt>
              <dd>{space.dimensions || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Peak traffic</dt>
              <dd>{space.peakHours || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Daily footfall</dt>
              <dd>{space.footfall ? space.footfall.toLocaleString("en-IN") : "Not set"}</dd>
            </div>
            {space.notes ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Notes</dt>
                <dd>{space.notes}</dd>
              </div>
            ) : null}
            {listing.description ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Listing description
                </dt>
                <dd>{listing.description}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Review history</h2>
            <p className="mt-1 text-xs text-slate-500">
              Earlier submissions and decisions stay here, including the reason and time.
            </p>
            <div className="mt-4">
              <ListingReviewHistory events={listing.events} />
            </div>
          </section>

          {pending ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Decision</h2>
              <label className="mb-1.5 mt-3 block text-sm font-medium text-slate-700">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  if (event.target.value.trim()) setError("");
                }}
                rows={4}
                placeholder="Why are you approving or rejecting this ad?"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/15"
              />
              {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
              <div className="mt-3 flex gap-2">
                <Button size="sm" disabled={busy} onClick={() => review("approve")}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={busy}
                  onClick={() => review("reject")}
                >
                  Reject
                </Button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
