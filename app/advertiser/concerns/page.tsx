"use client";

import { useEffect, useState } from "react";
import { Button, Input, Label, Select, Badge } from "@/components/ui";
import {
  CountPill,
  EmptyState,
  PageBanner,
  Panel,
  TotalCard,
} from "@/components/advertiser/AdvertiserUI";
import { CheckCircle2, CircleDot, MessageSquarePlus, MessagesSquare, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";

type ConcernStatus = "open" | "in_review" | "resolved";
type ConcernTopic = "booking" | "payment" | "campaign" | "ad_space" | "wallet" | "account" | "other";

type Concern = {
  id: string;
  topic: ConcernTopic;
  subject: string;
  message: string;
  status: ConcernStatus;
  createdAt: string;
};

const TOPICS: { value: ConcernTopic; label: string }[] = [
  { value: "booking", label: "Booking" },
  { value: "payment", label: "Payment" },
  { value: "campaign", label: "Campaign" },
  { value: "ad_space", label: "Ad space" },
  { value: "wallet", label: "Wallet" },
  { value: "account", label: "Account" },
  { value: "other", label: "Other" },
];

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

function topicLabel(topic: ConcernTopic) {
  return TOPICS.find((item) => item.value === topic)?.label || topic;
}

export default function AdvertiserConcernsPage() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [topic, setTopic] = useState<ConcernTopic>("booking");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/v1/advertiser/concerns")
      .then((response) => response.json())
      .then((data) => setConcerns(data.data || []));
  }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/v1/advertiser/concerns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, subject, message }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message || "Could not save this query");
      return;
    }
    setConcerns((current) => [data.data, ...current]);
    setSubject("");
    setMessage("");
    setTopic("booking");
  }

  const open = concerns.filter((concern) => concern.status === "open").length;
  const inReview = concerns.filter((concern) => concern.status === "in_review").length;
  const resolved = concerns.filter((concern) => concern.status === "resolved").length;

  return (
    <div>
      <PageBanner
        title="Queries"
        description="Raise a query about a booking, payment, campaign, or anything else, and see every query here"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <TotalCard label="Open" value={open} icon={CircleDot} accent="amber" />
        <TotalCard label="In review" value={inReview} icon={Search} accent="indigo" />
        <TotalCard label="Resolved" value={resolved} icon={CheckCircle2} accent="emerald" />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[340px_1fr]">
        <Panel title="Raise a query" icon={MessageSquarePlus}>
          <form onSubmit={create} className="space-y-4">
            <div>
              <Label>About</Label>
              <Select value={topic} onChange={(event) => setTopic(event.target.value as ConcernTopic)}>
                {TOPICS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Subject *</Label>
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} required />
            </div>
            <div>
              <Label>Message *</Label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
                rows={5}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/15"
              />
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button type="submit" className="w-full">
              Submit query
            </Button>
          </form>
        </Panel>

        <Panel
          title="All queries"
          icon={MessagesSquare}
          aside={<CountPill value={concerns.length} />}
          bodyClassName="p-0"
        >
          {concerns.length === 0 ? (
            <EmptyState icon={MessagesSquare} text="No queries yet." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {concerns.map((concern) => (
                <li key={concern.id} className="px-5 py-4 transition hover:bg-slate-50/80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold tracking-tight text-slate-900">{concern.subject}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="rounded-md bg-[#4C4BFF]/10 px-1.5 py-0.5 font-medium text-[#4C4BFF]">
                          {topicLabel(concern.topic)}
                        </span>
                        {formatDate(concern.createdAt)}
                      </p>
                    </div>
                    <Badge variant={statusVariant(concern.status)}>{STATUS_LABEL[concern.status]}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{concern.message}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
