"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart } from "lucide-react";

function goToLogin(router: ReturnType<typeof useRouter>) {
  router.push("/login");
}

export function CardWishlistButton({
  adSpaceId,
  signedIn,
  inWishlist = false,
}: {
  adSpaceId: string;
  signedIn: boolean;
  inWishlist?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(inWishlist);
  const [busy, setBusy] = useState(false);

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!signedIn) {
      goToLogin(router);
      return;
    }
    setBusy(true);
    const response = await fetch("/api/v1/advertiser/wishlist", {
      method: saved ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adSpaceId }),
    });
    const data = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) return;
    setSaved(!saved);
    if (typeof data?.count === "number") {
      window.dispatchEvent(
        new CustomEvent("tabellone-wishlist-count", { detail: data.count })
      );
    }
  }

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      disabled={busy}
      suppressHydrationWarning
      onClick={toggle}
      className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm hover:bg-white disabled:opacity-70"
    >
      <Heart
        className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`}
      />
    </button>
  );
}

export function CardAddToCartButton({
  adSpaceId,
  signedIn,
  inCart = false,
}: {
  adSpaceId: string;
  signedIn: boolean;
  inCart?: boolean;
}) {
  const router = useRouter();
  const [added, setAdded] = useState(inCart);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!signedIn) {
      goToLogin(router);
      return;
    }
    if (added) return;
    setBusy(true);
    const response = await fetch("/api/v1/advertiser/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adSpaceId }),
    });
    const data = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) return;
    setAdded(true);
    if (typeof data?.count === "number") {
      window.dispatchEvent(new CustomEvent("tabellone-cart-count", { detail: data.count }));
    }
  }

  return (
    <button
      type="button"
      disabled={busy || added}
      suppressHydrationWarning
      onClick={add}
      className="inline-flex items-center gap-1.5 rounded-lg bg-[#4C4BFF] px-3 py-2 text-sm font-semibold text-white hover:bg-[#3d3ce8] disabled:cursor-default disabled:opacity-80"
    >
      <ShoppingCart className="h-4 w-4" />
      {busy ? "Adding…" : added ? "Added" : "Add to Cart"}
    </button>
  );
}
