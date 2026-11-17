"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Button, Input, Label, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";

type Campaign = {
  id: string;
  name: string;
  sector: string | null;
  budget: number | null;
  targetLocation: string | null;
  startDate?: string | null;
  endDate?: string | null;
  bookingRequests?: { status: string }[];
};

const ACCEPTED = new Set(["approved", "payment_pending", "paid", "confirmed"]);
const IN_REVIEW = new Set(["submitted", "under_review", "draft"]);

function outcome(campaign: Campaign): "Accepted" | "Rejected" | "In review" | "Planning" {
  const statuses = campaign.bookingRequests?.map((request) => request.status) ?? [];
  if (statuses.some((status) => ACCEPTED.has(status))) return "Accepted";
  if (statuses.some((status) => status === "rejected")) return "Rejected";
  if (statuses.some((status) => IN_REVIEW.has(status))) return "In review";
  return "Planning";
}

function outcomeVariant(value: ReturnType<typeof outcome>): "success" | "warning" | "muted" | "default" {
  if (value === "Accepted") return "success";
  if (value === "Rejected") return "muted";
  if (value === "In review") return "warning";
  return "default";
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const state = outcome(campaign);
  const dates =
    campaign.startDate || campaign.endDate
      ? `${campaign.startDate ? formatDate(campaign.startDate) : "—"} – ${campaign.endDate ? formatDate(campaign.endDate) : "—"}`
      : "Dates not set";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-900">{campaign.name}</h3>
        <Badge variant={outcomeVariant(state)}>{state}</Badge>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-slate-400">Sector</dt>
          <dd className="text-slate-700">{campaign.sector || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Location</dt>
          <dd className="text-slate-700">{campaign.targetLocation || "Any"}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Budget</dt>
          <dd className="text-slate-700">{campaign.budget ? formatCurrency(campaign.budget) : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Dates</dt>
          <dd className="text-slate-700">{dates}</dd>
        </div>
      </dl>
      <Link href="/marketplace" className="mt-3 inline-block text-sm font-medium text-[#4C4BFF] hover:underline">
        Find AdSpaces
      </Link>
    </article>
  );
}

function CampaignColumn({
  title,
  empty,
  campaigns,
}: {
  title: string;
  empty: string;
  campaigns: Campaign[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <span className="text-sm text-slate-500">{campaigns.length}</span>
      </div>
      {campaigns.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </section>
  );
}

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
      setCampaigns((current) => [{ ...data.data, bookingRequests: [] }, ...current]);
      setName("");
      setSector("");
      setBudget("");
      setLocation("");
    }
  }

  const accepted = campaigns.filter((campaign) => outcome(campaign) === "Accepted");
  const rejected = campaigns.filter((campaign) => outcome(campaign) === "Rejected");

  return (
    <div>
      <PageHeader title="Campaigns" description="Plan campaigns, then see which ones were accepted or rejected" />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-sm text-slate-500">All campaigns</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{campaigns.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-sm text-slate-500">Accepted</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{accepted.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-sm text-slate-500">Rejected</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{rejected.length}</p>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[320px_1fr]">
        <form onSubmit={create} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
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
          <Button type="submit" className="w-full">Create campaign</Button>
        </form>

        <div className="grid gap-4 lg:grid-cols-3">
          <CampaignColumn title="Your campaigns" empty="No campaigns yet." campaigns={campaigns} />
          <CampaignColumn title="Accepted" empty="No accepted campaigns yet." campaigns={accepted} />
          <CampaignColumn title="Rejected" empty="No rejected campaigns yet." campaigns={rejected} />
        </div>
      </div>
    </div>
  );
}
