"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, PageHeader, Card } from "@/components/ui";

export default function EditOwnerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({
    name: "",
    brandName: "",
    sector: "",
    contactPerson: "",
    contactPhone: "",
    branchLocation: "",
    agencyName: "",
    officeAddress: "",
  });

  useEffect(() => {
    fetch("/api/v1/owner/profile")
      .then(async (res) => {
        if (!res.ok) throw new Error("Unable to load profile");
        return res.json();
      })
      .then((data) => {
        setEmail(data.email ?? "");
        setForm({
          name: data.name ?? "",
          brandName: data.brandName ?? "",
          sector: data.sector ?? "",
          contactPerson: data.contactPerson ?? "",
          contactPhone: data.contactPhone ?? "",
          branchLocation: data.branchLocation ?? "",
          agencyName: data.agencyName ?? "",
          officeAddress: data.officeAddress ?? "",
        });
        setReady(true);
      })
      .catch((err) => {
        setError(err.message || "Unable to load profile");
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/v1/owner/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error?.message || "Failed to update profile");
      return;
    }
    router.push("/owner/imd");
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Edit profile"
        description="Update your company and contact details. Login email stays the same."
      />
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {!ready && !error ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : ready ? (
        <Card className="max-w-2xl p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Login email</Label>
              <Input value={email} disabled />
              <p className="mt-1 text-xs text-slate-400">Used to sign in. Contact support to change it.</p>
            </div>
            <div>
              <Label>Organization name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Brand name</Label>
                <Input
                  value={form.brandName}
                  onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                />
              </div>
              <div>
                <Label>Sector</Label>
                <Input
                  value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Contact person</Label>
                <Input
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Branch / location</Label>
              <Input
                value={form.branchLocation}
                onChange={(e) => setForm({ ...form, branchLocation: e.target.value })}
              />
            </div>
            <div>
              <Label>Agency name</Label>
              <Input
                value={form.agencyName}
                onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
              />
            </div>
            <div>
              <Label>Office address</Label>
              <Input
                value={form.officeAddress}
                onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save profile"}
              </Button>
              <Link href="/owner/imd">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
