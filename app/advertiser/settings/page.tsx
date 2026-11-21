"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Input, Label } from "@/components/ui";
import { PageBanner, Panel, SURFACE } from "@/components/advertiser/AdvertiserUI";
import { Building2, KeyRound, Mail } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

const VERIFICATION_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
};

type Account = {
  email: string;
  accountStatus: string;
  memberSince: string;
  name: string;
  brandName: string | null;
  sector: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  branchLocation: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  verificationStatus: string | null;
};

export default function AdvertiserSettingsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [form, setForm] = useState({
    name: "",
    brandName: "",
    sector: "",
    contactPerson: "",
    contactPhone: "",
    branchLocation: "",
    gstNumber: "",
    panNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetch("/api/v1/advertiser/account")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load account settings");
        return response.json();
      })
      .then((data: Account) => {
        setAccount(data);
        setForm({
          name: data.name ?? "",
          brandName: data.brandName ?? "",
          sector: data.sector ?? "",
          contactPerson: data.contactPerson ?? "",
          contactPhone: data.contactPhone ?? "",
          branchLocation: data.branchLocation ?? "",
          gstNumber: data.gstNumber ?? "",
          panNumber: data.panNumber ?? "",
        });
        setReady(true);
      })
      .catch((error) => setLoadError(error.message || "Unable to load account settings"));
  }, []);

  async function saveAccount(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveMessage("");
    const response = await fetch("/api/v1/advertiser/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setSaveError(data.error?.message || "Could not save account settings");
      return;
    }
    setAccount(data);
    setSaveMessage("Account settings saved.");
    router.refresh();
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match");
      return;
    }
    setChangingPassword(true);
    const response = await fetch("/api/v1/advertiser/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await response.json();
    setChangingPassword(false);
    if (!response.ok) {
      setPasswordError(data.error?.message || "Could not change password");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("Password updated.");
  }

  const initial = (account?.name || "A").trim().charAt(0).toUpperCase();

  return (
    <div>
      <PageBanner
        title="Settings"
        description="Company details, tax numbers, and the password for this advertiser account"
      />
      {loadError ? (
        <p className="text-sm text-rose-600">{loadError}</p>
      ) : !ready || !account ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-5">
          <section className={cn(SURFACE, "flex flex-wrap items-center gap-4 p-5")}>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4C4BFF] to-[#8C47EE] text-xl font-bold text-white shadow-lg shadow-[#4C4BFF]/30">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{account.name}</h2>
                <Badge variant={account.verificationStatus === "approved" ? "success" : "warning"}>
                  {VERIFICATION_LABEL[account.verificationStatus || ""] || "Not set"}
                </Badge>
              </div>
              <p className="truncate text-sm text-slate-500">{account.email}</p>
            </div>
            <div className="text-sm text-slate-500">
              <p className="text-xs uppercase tracking-wide text-slate-400">Member since</p>
              <p className="font-medium text-slate-800">{formatDate(account.memberSince)}</p>
            </div>
          </section>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.85fr)]">
            <Panel title="Company and contact" description="How this advertiser appears on Tabellone" icon={Building2} bodyClassName="p-6">
            <form onSubmit={saveAccount}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Company name *</Label>
                  <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                </div>
                <div>
                  <Label>Brand name</Label>
                  <Input value={form.brandName} onChange={(event) => setForm({ ...form, brandName: event.target.value })} />
                </div>
                <div>
                  <Label>Sector</Label>
                  <Input value={form.sector} onChange={(event) => setForm({ ...form, sector: event.target.value })} />
                </div>
                <div>
                  <Label>Contact person</Label>
                  <Input value={form.contactPerson} onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Location</Label>
                  <Input value={form.branchLocation} onChange={(event) => setForm({ ...form, branchLocation: event.target.value })} />
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-900">Tax details</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>GST number</Label>
                    <Input value={form.gstNumber} onChange={(event) => setForm({ ...form, gstNumber: event.target.value })} />
                  </div>
                  <div>
                    <Label>PAN</Label>
                    <Input value={form.panNumber} onChange={(event) => setForm({ ...form, panNumber: event.target.value })} maxLength={10} />
                  </div>
                </div>
              </div>

              {saveError ? <p className="mt-4 text-sm text-rose-600">{saveError}</p> : null}
              {saveMessage ? <p className="mt-4 text-sm text-emerald-700">{saveMessage}</p> : null}
              <div className="mt-5 flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save account"}
                </Button>
              </div>
            </form>
            </Panel>

            <div className="space-y-5">
              <Panel title="Sign-in" description="Used to enter this account" icon={Mail}>
                <div>
                  <Label>Email</Label>
                  <Input value={account.email} disabled />
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  The email stays the same. Raise a query if it needs to change.
                </p>
              </Panel>

              <Panel title="Password" description="At least 8 characters" icon={KeyRound}>
              <form onSubmit={changePassword}>
                <div className="space-y-4">
                  <div>
                    <Label>Current password</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <div>
                    <Label>New password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <Label>Confirm new password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                  </div>
                  {passwordError ? <p className="text-sm text-rose-600">{passwordError}</p> : null}
                  {passwordMessage ? <p className="text-sm text-emerald-700">{passwordMessage}</p> : null}
                  <Button type="submit" variant="secondary" disabled={changingPassword} className="w-full">
                    {changingPassword ? "Updating…" : "Update password"}
                  </Button>
                </div>
              </form>
              </Panel>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
