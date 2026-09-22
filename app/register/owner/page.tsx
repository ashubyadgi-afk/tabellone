"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";

export default function RegisterOwnerPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    organizationName: "",
    email: "",
    password: "",
    contactPerson: "",
    contactPhone: "",
    branchLocation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/v1/auth/register/owner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error?.message || "Registration failed");
      return;
    }
    router.push("/owner/imd");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="text-sm font-semibold text-[#1e3a5f] hover:underline">
          ← Tabellone
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Register as AdSpace Owner</h1>
        <p className="mt-2 text-slate-500">Create your organization and access IMD</p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <Label>Organization name *</Label>
            <Input
              value={form.organizationName}
              onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Password * (min 8 characters)</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
          </div>
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
          <div>
            <Label>Branch location</Label>
            <Input
              value={form.branchLocation}
              onChange={(e) => setForm({ ...form, branchLocation: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account & open IMD"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#1e3a5f] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
