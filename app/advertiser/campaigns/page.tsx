"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Button, Input, Label } from "@/components/ui";

type Campaign = {
  id: string;
  name: string;
  sector: string | null;
  budget: number | null;
  targetLocation: string | null;
};

export default function AdvertiserCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    fetch("/api/v1/advertiser/campaigns")
      .then((r) => r.json())
      .then((d) => setCampaigns(d.data || []));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/advertiser/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        sector,
        budget: budget ? Number(budget) : undefined,
        targetLocation: location,
      }),
    });
    const data = await res.json();
    if (data.data) {
      setCampaigns((c) => [data.data, ...c]);
      setName("");
      setSector("");
      setBudget("");
      setLocation("");
    }
  }

  return (
    <div>
      <PageHeader title="Campaigns" description="Plan and manage advertising campaigns" />
      <form onSubmit={create} className="mb-8 max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">New campaign</h2>
        <div>
          <Label>Campaign name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label>Sector</Label>
          <Input value={sector} onChange={(e) => setSector(e.target.value)} />
        </div>
        <div>
          <Label>Budget (₹)</Label>
          <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
        </div>
        <div>
          <Label>Target location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <Button type="submit">Create campaign</Button>
      </form>

      <div className="space-y-3">
        {campaigns.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div>
              <p className="font-semibold text-slate-900">{c.name}</p>
              <p className="text-sm text-slate-500">
                {c.sector || "—"} · {c.targetLocation || "Any location"}
                {c.budget && ` · ₹${c.budget.toLocaleString("en-IN")}`}
              </p>
            </div>
            <Link href="/marketplace" className="text-sm font-medium text-orange-600 hover:underline">
              Find AdSpaces →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
