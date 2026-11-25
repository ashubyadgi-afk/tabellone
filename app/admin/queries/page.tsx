"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Badge, Label, Select } from "@/components/ui";
import {
  CountPill,
  EmptyState,
  PageBanner,
  Panel,
  TotalCard,
} from "@/components/dashboard/DashboardUI";
import {
  CheckCircle2,
  CircleDot,
  LifeBuoy,
  MessagesSquare,
  Search,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

type ConcernStatus = "open" | "in_review" | "resolved";
type ConcernTopic =
  | "booking"
  | "payment"
  | "campaign"
  | "ad_space"
  | "wallet"
  | "account"
  | "other";

type Concern = {
  id: string;
  topic: ConcernTopic;
  subject: string;
  message: string;
  status: ConcernStatus;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    email: string;
    brandName: string | null;
  };
  repliedBy: { id: string; email: string } | null;
};

const TOPICS: Record<ConcernTopic, string> = {
  booking: "Booking",
  payment: "Payment",
  campaign: "Campaign",
  ad_space: "Ad space",
  wallet: "Wallet",
  account: "Account",
  other: "Other",
};

const STATUS_LABEL: Record<ConcernStatus, string> = {
  open: "Open",
  in_review: "In review",
  resolved: "Resolved",
};

function statusVariant(status: ConcernStatus): "warning" | "default" | "success" {
  if (status === "open") return "warning";
  if (status === "resolved") return "success";
  return "default";
}

type Filter = "all" | ConcernStatus;

export default function AdminQueriesPage() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState<ConcernStatus>("in_review");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/v1/admin/concerns");
    const data = await response.json();
    const rows: Concern[] = data.data || [];
    setConcerns(rows);
    setSelectedId((current) => current ?? rows[0]?.id ?? null);
  }

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(
    () => concerns.find((row) => row.id === selectedId) ?? null,
    [concerns, selectedId]
  );

  useEffect(() => {
    if (!selected) return;
    setReply(selected.reply || "");
    setStatus(selected.status === "open" ? "in_review" : selected.status);
    setError("");
  }, [selected]);

  const filtered = concerns.filter((row) =>
    filter === "all" ? true : row.status === filter
  );

  const open = concerns.filter((row) => row.status === "open").length;
  const inReview = concerns.filter((row) => row.status === "in_review").length;
  const resolved = concerns.filter((row) => row.status === "resolved").length;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError("");
    const response = await fetch(`/api/v1/admin/concerns/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        ...(reply.trim() ? { reply: reply.trim() } : {}),
      }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error?.message || "Could not save this reply");
      return;
    }
    setConcerns((current) =>
      current.map((row) => (row.id === selected.id ? data.data : row))
    );
  }

  return (
    <div className="space-y-6">
      <PageBanner
        title="Queries"
        description="Review advertiser queries, send a reply, and update status"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <TotalCard label="Open" value={open} icon={CircleDot} accent="amber" />
        <TotalCard label="In review" value={inReview} icon={Search} accent="indigo" />
        <TotalCard label="Resolved" value={resolved} icon={CheckCircle2} accent="emerald" />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All", concerns.length],
            ["open", "Open", open],
            ["in_review", "In review", inReview],
            ["resolved", "Resolved", resolved],
          ] as const
        ).map(([id, label, count]) => {
          const active = filter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-slate-200/80 hover:bg-slate-50"
              )}
            >
              {label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
        <Panel
          title="Inbox"
          icon={MessagesSquare}
          aside={<CountPill value={filtered.length} />}
          bodyClassName="p-0"
        >
          {filtered.length === 0 ? (
            <EmptyState icon={LifeBuoy} text="No queries in this filter." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((concern) => {
                const active = concern.id === selectedId;
                return (
                  <li key={concern.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(concern.id)}
                      className={cn(
                        "w-full px-5 py-4 text-left transition",
                        active ? "bg-[#4C4BFF]/5" : "hover:bg-slate-50/80"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold tracking-tight text-slate-900">
                            {concern.subject}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {concern.organization.name}
                            <span className="mx-1.5 text-slate-300">·</span>
                            {TOPICS[concern.topic]}
                            <span className="mx-1.5 text-slate-300">·</span>
                            {formatDate(concern.createdAt)}
                          </p>
                        </div>
                        <Badge variant={statusVariant(concern.status)}>
                          {STATUS_LABEL[concern.status]}
                        </Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{concern.message}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Reply" icon={LifeBuoy}>
          {!selected ? (
            <EmptyState icon={LifeBuoy} text="Select a query to reply." />
          ) : (
            <form onSubmit={save} className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  From
                </p>
                <Link
                  href={`/admin/advertisers/${selected.organization.id}`}
                  className="mt-1 block font-semibold text-slate-900 hover:text-[#4C4BFF]"
                >
                  {selected.organization.name}
                </Link>
                <p className="text-xs text-slate-500">{selected.organization.email}</p>
              </div>

              <div className="rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{selected.subject}</p>
                  <Badge variant={statusVariant(selected.status)}>
                    {STATUS_LABEL[selected.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {TOPICS[selected.topic]} · {formatDate(selected.createdAt)}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{selected.message}</p>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ConcernStatus)}
                >
                  <option value="open">Open</option>
                  <option value="in_review">In review</option>
                  <option value="resolved">Resolved</option>
                </Select>
              </div>

              <div>
                <Label>Reply to advertiser</Label>
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  rows={6}
                  placeholder="Write the answer the advertiser should see…"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[#4C4BFF] focus:outline-none focus:ring-2 focus:ring-[#4C4BFF]/15"
                />
              </div>

              {selected.reply ? (
                <p className="text-xs text-slate-500">
                  Last replied {selected.repliedAt ? formatDate(selected.repliedAt) : "—"}
                  {selected.repliedBy ? ` · ${selected.repliedBy.email}` : ""}
                </p>
              ) : null}

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving…" : "Save reply"}
              </Button>
            </form>
          )}
        </Panel>
      </div>
    </div>
  );
}
