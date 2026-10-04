"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Button } from "@/components/ui";
import { AdSpaceCard } from "@/components/marketplace/AdSpaceCard";
import { calculatePricing } from "@/lib/pricing/calculate";

type CartRow = {
  id: string;
  adSpace: Parameters<typeof AdSpaceCard>[0]["space"];
};

export default function AdvertiserCartPage() {
  const [items, setItems] = useState<CartRow[]>([]);

  function load() {
    fetch("/api/v1/advertiser/cart")
      .then((r) => r.json())
      .then((d) => setItems(d.data || []));
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(adSpaceId: string) {
    await fetch("/api/v1/advertiser/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adSpaceId }),
    });
    setItems((prev) => prev.filter((item) => item.adSpace.id !== adSpaceId));
  }

  const pricingConfig = {
    commissionRate: 0.1,
    gstRate: 0.18,
    tdsRate: 0.02,
    platformGstRate: 0.18,
  };

  return (
    <div>
      <PageHeader title="Cart" description="Ad spaces you want to book" />
      {items.length === 0 ? (
        <p className="text-slate-500">
          Your cart is empty.{" "}
          <Link href="/marketplace" className="text-orange-600 hover:underline">
            Browse marketplace
          </Link>
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const customerPrice = item.adSpace.basePrice
              ? calculatePricing(item.adSpace.basePrice, pricingConfig).customerPrice
              : null;
            return (
              <div key={item.id} className="space-y-3">
                <AdSpaceCard space={item.adSpace} customerPrice={customerPrice} />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => remove(item.adSpace.id)}
                >
                  Remove
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
