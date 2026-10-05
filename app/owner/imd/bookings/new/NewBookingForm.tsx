"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Select, PageHeader, Card } from "@/components/ui";

type Option = { id: string; name: string; basePrice?: number | null };

const emptyClientForm = {
  name: "",
  businessName: "",
  email: "",
  contactPhone: "",
};

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
  const [showAddClient, setShowAddClient] = useState(false);
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [clientSaving, setClientSaving] = useState(false);
  const [clientError, setClientError] = useState("");

  useEffect(() => {
    fetch("/api/v1/imd/ad-spaces").then((r) => r.json()).then((d) =>
      setAdSpaces(
        d.items?.map((a: { id: string; name: string; basePrice?: number | null }) => ({
          id: a.id,
          name: a.name,
          basePrice: a.basePrice ?? null,
        })) || []
      )
    );
    fetch("/api/v1/imd/clients").then((r) => r.json()).then((d) =>
      setClients(d.items?.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })) || [])
    );
  }, []);

  function openAddClient() {
    setClientForm(emptyClientForm);
    setClientError("");
    setShowAddClient(true);
  }

  function closeAddClient() {
    if (clientSaving) return;
    setShowAddClient(false);
    setClientError("");
  }

  async function saveClient(e: React.FormEvent) {
    e.preventDefault();
    if (!clientForm.name.trim()) {
      setClientError("Client name is required.");
      return;
    }
    setClientSaving(true);
    setClientError("");
    const res = await fetch("/api/v1/imd/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: clientForm.name.trim(),
        businessName: clientForm.businessName.trim() || undefined,
        email: clientForm.email.trim() || undefined,
        contactPhone: clientForm.contactPhone.trim() || undefined,
      }),
    });
    const data = await res.json();
    setClientSaving(false);
    if (!res.ok) {
      setClientError(data.error?.message || "Failed to create client");
      return;
    }
    const option = { id: data.id as string, name: data.name as string };
    setClients((prev) => [option, ...prev.filter((c) => c.id !== option.id)]);
    setForm((prev) => ({ ...prev, clientId: option.id }));
    setShowAddClient(false);
  }

  function selectAdSpace(adSpaceId: string) {
    const space = adSpaces.find((item) => item.id === adSpaceId);
    setForm((prev) => ({
      ...prev,
      adSpaceId,
      amount: space?.basePrice != null && space.basePrice > 0 ? String(space.basePrice) : "",
    }));
  }

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
            <Select value={form.adSpaceId} onChange={(e) => selectAdSpace(e.target.value)} required>
              <option value="">Select…</option>
              {adSpaces.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <Label>Client *</Label>
              <button
                type="button"
                onClick={openAddClient}
                className="text-sm font-medium text-[#1e3a5f] hover:underline"
              >
                + Add client
              </button>
            </div>
            <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required>
              <option value="">Select…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            {clients.length === 0 && (
              <p className="mt-1.5 text-xs text-slate-500">
                No clients yet — add one to continue.
              </p>
            )}
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
            <Input
              type="number"
              min="0"
              step="any"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="Select an ad space"
            />
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

      {showAddClient && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4"
          onClick={closeAddClient}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900">Add client</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create a client and continue this booking.
            </p>
            {clientError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {clientError}
              </div>
            )}
            <form onSubmit={saveClient} className="mt-4 space-y-3">
              <div>
                <Label>Client name *</Label>
                <Input
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div>
                <Label>Business name</Label>
                <Input
                  value={clientForm.businessName}
                  onChange={(e) => setClientForm({ ...clientForm, businessName: e.target.value })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={clientForm.contactPhone}
                    onChange={(e) => setClientForm({ ...clientForm, contactPhone: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={clientSaving}>
                  {clientSaving ? "Saving…" : "Save client"}
                </Button>
                <Button type="button" variant="secondary" disabled={clientSaving} onClick={closeAddClient}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
