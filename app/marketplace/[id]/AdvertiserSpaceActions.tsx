"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function AdvertiserSpaceActions({
  adSpaceId,
  signedIn,
  inCart: alreadyInCart = false,
}: {
  adSpaceId: string;
  signedIn: boolean;
  inCart?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(alreadyInCart ? "Added to cart." : "");
  const [inCart, setInCart] = useState(alreadyInCart);
  const [busy, setBusy] = useState<"wishlist" | "cart" | null>(null);

  async function save(kind: "wishlist" | "cart") {
    if (!signedIn) {
      router.push(`/login`);
      return;
    }
    setBusy(kind);
    setMessage("");
    const response = await fetch(`/api/v1/advertiser/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adSpaceId }),
    });
    setBusy(null);
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const apiMessage =
        data?.error?.message && typeof data.error.message === "string"
          ? data.error.message
          : null;
      setMessage(apiMessage ?? "Could not save this space.");
      return;
    }
    if (kind === "cart" && typeof data?.count === "number") {
      setInCart(true);
      window.dispatchEvent(new CustomEvent("tabellone-cart-count", { detail: data.count }));
    }
    setMessage(kind === "cart" ? "Added to cart." : "Saved to wishlist.");
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null}
          onClick={() => save("wishlist")}
        >
          {busy === "wishlist" ? "Saving…" : "Wishlist"}
        </Button>
        <Button
          type="button"
          variant={inCart ? "secondary" : "primary"}
          disabled={busy !== null || inCart}
          onClick={() => save("cart")}
        >
          {busy === "cart" ? "Adding…" : inCart ? "Added to cart" : "Add to cart"}
        </Button>
      </div>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      <p className="text-center text-xs text-slate-500">
        <Link href="/advertiser/wishlist" className="hover:underline">
          Wishlist
        </Link>
        {" · "}
        <Link href="/advertiser/cart" className="hover:underline">
          Cart
        </Link>
      </p>
    </div>
  );
}
