"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { AdSpaceCard } from "@/components/marketplace/AdSpaceCard";
import { calculatePricing } from "@/lib/pricing/calculate";

const pricingConfig = {
  commissionRate: 0.1,
  gstRate: 0.18,
  tdsRate: 0.02,
  platformGstRate: 0.18,
};

export function WishlistContents() {
  const [items, setItems] = useState<
    Array<{ adSpace: Parameters<typeof AdSpaceCard>[0]["space"] }>
  >([]);

  useEffect(() => {
    fetch("/api/v1/advertiser/wishlist")
      .then((r) => r.json())
      .then((d) => setItems(d.data || []));
  }, []);

  return (
    <>
      <PageHeader title="Wishlist" description="Saved AdSpaces for future campaigns" />
      {items.length === 0 ? (
        <p className="text-slate-500">
          No saved spaces.{" "}
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
              <AdSpaceCard
                key={item.adSpace.id}
                space={item.adSpace}
                customerPrice={customerPrice}
                signedIn
                inWishlist
              />
            );
          })}
        </div>
      )}
    </>
  );
}
