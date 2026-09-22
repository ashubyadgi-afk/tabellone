"use client";

import { useEffect, useState } from "react";
import { PageHeader, Button, Input, Label } from "@/components/ui";

type PricingConfig = {
  commissionRate: number;
  gstRate: number;
  tdsRate: number;
  platformGstRate: number;
};

export default function AdminPricingPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/v1/admin/pricing")
      .then((r) => r.json())
      .then((d) => setConfig(d.data));
  }, []);

  async function save() {
    if (!config) return;
    await fetch("/api/v1/admin/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!config) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="Pricing rules"
        description="Configure commission, GST, and TDS rates (decimals, e.g. 0.10 = 10%)"
      />
      <div className="max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <Label>Commission rate</Label>
          <Input
            type="number"
            step="0.01"
            value={config.commissionRate}
            onChange={(e) =>
              setConfig({ ...config, commissionRate: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <Label>GST on commission</Label>
          <Input
            type="number"
            step="0.01"
            value={config.gstRate}
            onChange={(e) =>
              setConfig({ ...config, gstRate: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <Label>TDS rate</Label>
          <Input
            type="number"
            step="0.01"
            value={config.tdsRate}
            onChange={(e) =>
              setConfig({ ...config, tdsRate: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <Label>Platform GST rate</Label>
          <Input
            type="number"
            step="0.01"
            value={config.platformGstRate}
            onChange={(e) =>
              setConfig({ ...config, platformGstRate: Number(e.target.value) })
            }
          />
        </div>
        <Button onClick={save}>{saved ? "Saved!" : "Save rules"}</Button>
      </div>
    </div>
  );
}
