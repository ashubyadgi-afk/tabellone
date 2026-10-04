"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function AdvertiserSpaceActions({
  adSpaceId,
  signedIn,
}: {
  adSpaceId: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
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
    if (!response.ok) {
      setMessage("Could not save this space.");
      return;
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
        <Button type="button" disabled={busy !== null} onClick={() => save("cart")}>
          {busy === "cart" ? "Adding…" : "Add to cart"}
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
