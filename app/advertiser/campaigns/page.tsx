"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Input, Label, Badge } from "@/components/ui";
import {
  CountPill,
  EmptyState,
  PageBanner,
  Panel,
  TotalCard,
} from "@/components/dashboard/DashboardUI";
import { ArrowUpRight, CheckCircle2, Megaphone, Plus, XCircle, type LucideIcon } from "lucide-react";
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
    <article className="rounded-xl bg-white p-4 ring-1 ring-slate-200/70 transition hover:shadow-[0_8px_20px_-12px_rgba(76,75,255,0.35)] hover:ring-[#4C4BFF]/25">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold tracking-tight text-slate-900">{campaign.name}</h3>
        <Badge variant={outcomeVariant(state)}>{state}</Badge>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Sector</dt>
          <dd className="text-slate-700">{campaign.sector || "—"}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Location</dt>
          <dd className="text-slate-700">{campaign.targetLocation || "Any"}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Budget</dt>
          <dd className="font-medium text-slate-800 tabular-nums">
            {campaign.budget ? formatCurrency(campaign.budget) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Dates</dt>
          <dd className="text-slate-700">{dates}</dd>
        </div>
      </dl>
      <Link
        href="/marketplace"
        className="mt-3 inline-flex items-center gap-1 border-t border-slate-100 pt-3 text-sm font-medium text-[#4C4BFF] hover:text-[#3d3ce8]"
      >
        Find AdSpaces
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </article>
  );
}

function CampaignColumn({
  title,
  empty,
  icon,
  campaigns,
}: {
  title: string;
  empty: string;
  icon: LucideIcon;
  campaigns: Campaign[];
}) {
  return (
    <Panel title={title} icon={icon} aside={<CountPill value={campaigns.length} />} bodyClassName="bg-slate-50/50 p-3">
      {campaigns.length === 0 ? (
        <EmptyState icon={icon} text={empty} />
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </Panel>
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
      <PageBanner title="Campaigns" description="Plan campaigns, then see which ones were accepted or rejected" />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <TotalCard label="All campaigns" value={campaigns.length} icon={Megaphone} accent="indigo" />
        <TotalCard label="Accepted" value={accepted.length} icon={CheckCircle2} accent="emerald" />
        <TotalCard label="Rejected" value={rejected.length} icon={XCircle} accent="slate" />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[320px_1fr]">
        <Panel title="New campaign" icon={Plus}>
          <form onSubmit={create} className="space-y-4">
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
        </Panel>

        <div className="grid items-start gap-4 lg:grid-cols-3">
          <CampaignColumn title="Your campaigns" empty="No campaigns yet." icon={Megaphone} campaigns={campaigns} />
          <CampaignColumn title="Accepted" empty="No accepted campaigns yet." icon={CheckCircle2} campaigns={accepted} />
          <CampaignColumn title="Rejected" empty="No rejected campaigns yet." icon={XCircle} campaigns={rejected} />
        </div>
      </div>
    </div>
  );
}
