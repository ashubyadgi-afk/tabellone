"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, User } from "lucide-react";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#4C4BFF] px-1 text-[10px] font-bold text-white">
      {count}
    </span>
  );
}

export function AdvertiserNav({
  initialWishlistCount,
  initialCartCount,
}: {
  initialWishlistCount: number;
  initialCartCount: number;
}) {
  const [wishlistCount, setWishlistCount] = useState(initialWishlistCount);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    setWishlistCount(initialWishlistCount);
  }, [initialWishlistCount]);

  useEffect(() => {
    setCartCount(initialCartCount);
  }, [initialCartCount]);

  useEffect(() => {
    function onWishlist(event: Event) {
      const next = (event as CustomEvent<number>).detail;
      if (typeof next === "number") setWishlistCount(next);
    }
    function onCart(event: Event) {
      const next = (event as CustomEvent<number>).detail;
      if (typeof next === "number") setCartCount(next);
    }
    window.addEventListener("tabellone-wishlist-count", onWishlist);
    window.addEventListener("tabellone-cart-count", onCart);
    return () => {
      window.removeEventListener("tabellone-wishlist-count", onWishlist);
      window.removeEventListener("tabellone-cart-count", onCart);
    };
  }, []);

  const iconClass =
    "relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100";

  return (
    <div className="flex items-center gap-1">
      <Link href="/advertiser/wishlist" aria-label="Wishlist" className={iconClass}>
        <Heart className={`h-5 w-5 ${wishlistCount > 0 ? "fill-rose-500 text-rose-500" : ""}`} />
        <CountBadge count={wishlistCount} />
      </Link>
      <Link href="/advertiser/cart" aria-label="Cart" className={iconClass}>
        <ShoppingCart className="h-5 w-5" />
        <CountBadge count={cartCount} />
      </Link>
      <div className="relative">
        <button
          type="button"
          aria-label="Account"
          aria-expanded={accountOpen}
          suppressHydrationWarning
          onClick={() => setAccountOpen((open) => !open)}
          className={iconClass}
        >
          <User className="h-5 w-5" />
        </button>
        {accountOpen ? (
          <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            <Link
              href="/advertiser/dashboard"
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setAccountOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/advertiser/booking-requests"
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setAccountOpen(false)}
            >
              Bookings
            </Link>
            <form action="/api/v1/auth/logout" method="POST">
              <button
                type="submit"
                className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
