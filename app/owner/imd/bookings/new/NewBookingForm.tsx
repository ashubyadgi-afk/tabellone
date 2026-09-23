"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Select, PageHeader, Card } from "@/components/ui";

type Option = { id: string; name: string };

export function NewBookingForm({
  startDate = "",
  endDate = "",
}: {
  startDate?: string;
  endDate?: string;
}) {
  const router = useRouter();
  const [adSpaces, setAdSpaces] = useState<Option[]>([]);
  const [clients, setClients] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    adSpaceId: "",
    clientId: "",
    startDate,
    endDate: endDate || startDate,
    amount: "",
    campaignReference: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/v1/imd/ad-spaces").then((r) => r.json()).then((d) =>
      setAdSpaces(d.items?.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })) || [])
    );
    fetch("/api/v1/imd/clients").then((r) => r.json()).then((d) =>
      setClients(d.items?.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })) || [])
    );
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/v1/imd/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: form.amount ? Number(form.amount) : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error?.message || "Failed");
      return;
    }
    router.push("/owner/imd/bookings");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="New Booking" description="Link a client to an Ad Space for a date range" />
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <Card className="max-w-xl p-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Ad Space *</Label>
            <Select value={form.adSpaceId} onChange={(e) => setForm({ ...form, adSpaceId: e.target.value })} required>
              <option value="">Select…</option>
              {adSpaces.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Client *</Label>
            <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required>
              <option value="">Select…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Start date *</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div>
              <Label>End date *</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>Amount (₹)</Label>
            <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <Label>Campaign reference</Label>
            <Input value={form.campaignReference} onChange={(e) => setForm({ ...form, campaignReference: e.target.value })} />
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Create Booking"}</Button>
            <Link href="/owner/imd/bookings"><Button variant="secondary">Cancel</Button></Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
