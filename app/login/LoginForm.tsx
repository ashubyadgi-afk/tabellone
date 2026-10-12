"use client";

import { useState } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error?.message || "Login failed");
      setLoading(false);
      return;
    }
    window.location.assign(data.redirect || "/");
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-2 text-white">
          <Megaphone className="h-8 w-8 text-orange-400" />
          <span className="text-2xl font-bold">Tabellone</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">
            Your advertising ecosystem
          </h2>
          <p className="mt-4 text-slate-400 leading-relaxed">
            Owners manage inventory. Advertisers book campaigns. Admins oversee the marketplace.
          </p>
        </div>
        <div className="space-y-2 text-sm text-slate-500">
          <p>Demo owner: owner@demo.tabellone.com / demo1234</p>
          <p>Demo advertiser: advertiser@demo.tabellone.com / demo1234</p>
          <p>Demo admin: admin@tabellone.com / admin1234</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-slate-500">Sign in to your Tabellone account</p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm text-slate-500">
            <p>
              Owner?{" "}
              <Link href="/register/owner" className="font-medium text-[#1e3a5f] hover:underline">
                Register
              </Link>
            </p>
            <p>
              Advertiser?{" "}
              <Link href="/register/advertiser" className="font-medium text-orange-600 hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
