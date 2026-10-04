"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";

export default function RegisterAdvertiserPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    organizationName: "",
    brandName: "",
    email: "",
    password: "",
    sector: "",
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
    const res = await fetch("/api/v1/auth/register/advertiser", {
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
    router.push("/marketplace");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-orange-500 to-orange-600 lg:flex lg:flex-col lg:justify-between lg:p-12 text-white">
        <div className="flex items-center gap-2">
          <Megaphone className="h-8 w-8" />
          <span className="text-2xl font-bold">Tabellone</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold">Advertise on premium AdSpaces</h2>
          <p className="mt-4 text-orange-100 leading-relaxed">
            Search, wishlist, campaign planning, booking requests, and secure payments.
          </p>
        </div>
        <p className="text-sm text-orange-200">Free plan included</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-slate-900">Create advertiser account</h1>
          <p className="mt-2 text-slate-500">Start booking AdSpaces today</p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <Label>Organization name *</Label>
              <Input
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Brand name</Label>
              <Input
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
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
              <Label>Password *</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
              />
            </div>
            <div>
              <Label>Sector</Label>
              <Input
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#1e3a5f] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
