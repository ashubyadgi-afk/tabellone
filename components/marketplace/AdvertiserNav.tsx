"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, User } from "lucide-react";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-[#E647A7] to-[#FF8C3A] px-1 text-[10px] font-bold text-white shadow">
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

  const iconBase = "relative rounded-xl p-2 transition duration-300 hover:-translate-y-0.5";
  const heartClass = `${iconBase} text-[#E647A7] hover:bg-[#E647A7]/10`;
  const cartClass = `${iconBase} text-[#4C4BFF] hover:bg-[#4C4BFF]/10`;
  const iconClass = `${iconBase} text-[#8C47EE] hover:bg-[#8C47EE]/10`;

  return (
    <div className="flex items-center gap-1">
      <Link href="/wishlist" aria-label="Wishlist" className={heartClass}>
        <Heart className={`h-5 w-5 ${wishlistCount > 0 ? "fill-rose-500 text-rose-500" : ""}`} />
        <CountBadge count={wishlistCount} />
      </Link>
      <Link href="/cart" aria-label="Cart" className={cartClass}>
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
              Overview
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
