"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

export function BookAdSpaceForm({
  adSpaceId,
  customerPrice,
}: {
  adSpaceId: string;
  customerPrice?: number | null;
}) {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/v1/advertiser/booking-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adSpaceId,
        startDate,
        endDate,
        campaignNotes: notes,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (res.status === 401) {
        router.push(`/login?redirect=/marketplace/${adSpaceId}`);
        return;
      }
      setError(data.error?.message || "Booking request failed");
      return;
    }

    router.push("/advertiser/booking-requests");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="font-semibold text-slate-900">Request to book</h2>
      {customerPrice && (
        <p className="text-sm text-slate-500">
          Estimated total: <strong>{formatCurrency(customerPrice)}</strong>/month
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <div>
        <label className="text-sm font-medium text-slate-700">Start date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">End date</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Campaign notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Product, audience, creative details…"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting…" : "Submit booking request"}
      </Button>
      <p className="text-xs text-slate-500 text-center">
        <Link href="/register/advertiser" className="text-orange-600 hover:underline">
          Create advertiser account
        </Link> to book
      </p>
    </form>
  );
}
