"use client";

import { useEffect, useState } from "react";
import { PageHeader, Button, Input, Label, Select, Badge } from "@/components/ui";
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
      <PageHeader
        title="Queries"
        description="Raise a query about a booking, payment, campaign, or anything else, and see every query here"
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-sm text-slate-500">Open</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{open}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-sm text-slate-500">In review</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{inReview}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-sm text-slate-500">Resolved</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{resolved}</p>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[320px_1fr]">
        <form onSubmit={create} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Raise a query</h2>
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

        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">All queries</h2>
            <span className="text-sm text-slate-500">{concerns.length}</span>
          </div>
          {concerns.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">No queries yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {concerns.map((concern) => (
                <li key={concern.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{concern.subject}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {topicLabel(concern.topic)} · {formatDate(concern.createdAt)}
                      </p>
                    </div>
                    <Badge variant={statusVariant(concern.status)}>{STATUS_LABEL[concern.status]}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{concern.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
