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

const pricingConfig = {
  commissionRate: 0.1,
  gstRate: 0.18,
  tdsRate: 0.02,
  platformGstRate: 0.18,
};

export function CartContents() {
  const [items, setItems] = useState<CartRow[]>([]);

  useEffect(() => {
    fetch("/api/v1/advertiser/cart")
      .then((r) => r.json())
      .then((d) => setItems(d.data || []));
  }, []);

  async function remove(adSpaceId: string) {
    const response = await fetch("/api/v1/advertiser/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adSpaceId }),
    });
    const data = await response.json().catch(() => null);
    if (typeof data?.count === "number") {
      window.dispatchEvent(new CustomEvent("tabellone-cart-count", { detail: data.count }));
    }
    setItems((prev) => prev.filter((item) => item.adSpace.id !== adSpaceId));
  }

  return (
    <>
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
                <AdSpaceCard
                  space={item.adSpace}
                  customerPrice={customerPrice}
                  signedIn
                  inCart
                />
                <Button size="sm" variant="secondary" onClick={() => remove(item.adSpace.id)}>
                  Remove
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
