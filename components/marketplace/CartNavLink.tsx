"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function CartNavLink({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    function onCount(event: Event) {
      const next = (event as CustomEvent<number>).detail;
      if (typeof next === "number") setCount(next);
    }
    window.addEventListener("tabellone-cart-count", onCount);
    return () => window.removeEventListener("tabellone-cart-count", onCount);
  }, []);

  return (
    <Link
      href="/advertiser/cart"
      className="rounded-xl bg-[#4C4BFF] px-4 py-2 font-semibold text-white hover:bg-[#3d3ce8]"
    >
      {count > 0 ? `Cart(${count})` : "Cart"}
    </Link>
  );
}
