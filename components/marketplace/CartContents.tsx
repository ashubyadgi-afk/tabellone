"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, ShoppingCart, Trash2 } from "lucide-react";
import { adSpacePhotos } from "@/lib/ad-space-photos";
import {
  inclusiveBookingDays,
  MIN_BOOKING_DAYS,
  minimumBookingEnd,
  prorateMonthlyAmount,
} from "@/lib/booking-span";
import { calculatePricing } from "@/lib/pricing/calculate";
import { formatCurrency } from "@/lib/utils";

type CartSpace = {
  id: string;
  name: string;
  adSpaceType: string;
  city?: string | null;
  state?: string | null;
  basePrice?: number | null;
  photoUrl?: string | null;
  photoUrls?: string[] | null;
};

type CartRow = {
  id: string;
  adSpace: CartSpace;
};

type ItemDates = { startDate: string; endDate: string };

const pricingConfig = {
  commissionRate: 0.1,
  gstRate: 0.18,
  tdsRate: 0.02,
  platformGstRate: 0.18,
};

function monthlyCustomerPrice(basePrice?: number | null) {
  if (basePrice == null) return null;
  return calculatePricing(basePrice, pricingConfig).customerPrice;
}

export function CartContents() {
  const router = useRouter();
  const [items, setItems] = useState<CartRow[]>([]);
  const [dates, setDates] = useState<Record<string, ItemDates>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"checkout" | "clear" | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/v1/advertiser/cart")
      .then((r) => r.json())
      .then((d) => setItems(d.data || []))
      .finally(() => setLoaded(true));
  }, []);

  function updateCount(count: number) {
    window.dispatchEvent(new CustomEvent("tabellone-cart-count", { detail: count }));
  }

  async function remove(adSpaceId: string) {
    const response = await fetch("/api/v1/advertiser/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adSpaceId }),
    });
    const data = await response.json().catch(() => null);
    if (typeof data?.count === "number") updateCount(data.count);
    setItems((prev) => prev.filter((item) => item.adSpace.id !== adSpaceId));
  }

  function onStartDate(adSpaceId: string, startDate: string) {
    setDates((prev) => ({
      ...prev,
      [adSpaceId]: {
        startDate,
        endDate: startDate ? minimumBookingEnd(startDate) : "",
      },
    }));
  }

  function onEndDate(adSpaceId: string, endDate: string) {
    setDates((prev) => {
      const startDate = prev[adSpaceId]?.startDate ?? "";
      const minimum = startDate ? minimumBookingEnd(startDate) : "";
      return {
        ...prev,
        [adSpaceId]: {
          startDate,
          endDate: minimum && endDate && endDate < minimum ? minimum : endDate,
        },
      };
    });
  }

  function lineAmount(item: CartRow) {
    const monthly = monthlyCustomerPrice(item.adSpace.basePrice);
    const chosen = dates[item.adSpace.id];
    const days =
      chosen?.startDate && chosen.endDate
        ? inclusiveBookingDays(chosen.startDate, chosen.endDate)
        : null;
    if (monthly == null || !days || days < MIN_BOOKING_DAYS) return null;
    return prorateMonthlyAmount(monthly, days);
  }

  const pricedLines = items
    .map((item) => lineAmount(item))
    .filter((amount): amount is number => amount != null);
  const total = pricedLines.reduce((sum, amount) => sum + amount, 0);

  async function clearCart() {
    setBusy("clear");
    setError("");
    await Promise.all(
      items.map((item) =>
        fetch("/api/v1/advertiser/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adSpaceId: item.adSpace.id }),
        })
      )
    );
    updateCount(0);
    setItems([]);
    setDates({});
    setBusy(null);
  }

  async function checkout() {
    setError("");
    const missing = items.filter((item) => lineAmount(item) == null);
    if (missing.length) {
      setError(`Each space needs at least ${MIN_BOOKING_DAYS} days. Choose a start date, then adjust the end date.`);
      return;
    }
    setBusy("checkout");
    for (const item of items) {
      const chosen = dates[item.adSpace.id];
      const response = await fetch("/api/v1/advertiser/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adSpaceId: item.adSpace.id,
          startDate: chosen.startDate,
          endDate: chosen.endDate,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setBusy(null);
        setError(data?.error?.message || `Could not book ${item.adSpace.name}.`);
        return;
      }
    }
    await clearCart();
    router.push("/advertiser/booking-requests");
  }

  if (!loaded) {
    return (
      <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
        <ShoppingCart className="h-7 w-7" />
        Shopping Cart
      </h1>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
          <ShoppingCart className="h-7 w-7" />
          Shopping Cart
        </h1>
        <p className="mt-2 text-slate-500">
          Your cart is empty.{" "}
          <Link href="/" className="font-medium text-[#4C4BFF] hover:underline">
            Browse listings
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
        <ShoppingCart className="h-7 w-7" />
        Shopping Cart
      </h1>
      <p className="mt-2 text-slate-500">
        You have {items.length} {items.length === 1 ? "item" : "items"} in your cart.
      </p>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {items.map((item) => {
            const space = item.adSpace;
            const photo = adSpacePhotos(space)[0];
            const monthly = monthlyCustomerPrice(space.basePrice);
            const chosen = dates[space.id] ?? { startDate: "", endDate: "" };
            const days =
              chosen.startDate && chosen.endDate
                ? inclusiveBookingDays(chosen.startDate, chosen.endDate)
                : null;
            const amount = lineAmount(item);
            return (
              <article
                key={item.id}
                className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <Link
                  href={`/marketplace/${space.id}`}
                  className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100"
                >
                  {photo ? (
                    <Image src={photo} alt={space.name} fill className="object-cover" sizes="128px" />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/marketplace/${space.id}`} className="font-semibold text-slate-900 hover:underline">
                        {space.name}
                      </Link>
                      <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {[space.city, space.state].filter(Boolean).join(", ") || "Location not set"}
                      </p>
                      <p className="mt-1 text-sm capitalize text-slate-500">
                        {space.adSpaceType}
                        {monthly != null ? ` · ${formatCurrency(monthly)}/month` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${space.name}`}
                      onClick={() => remove(space.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-medium text-slate-600">
                      Start date
                      <input
                        type="date"
                        value={chosen.startDate}
                        onChange={(event) => onStartDate(space.id, event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-600">
                      End date
                      <input
                        type="date"
                        value={chosen.endDate}
                        min={chosen.startDate ? minimumBookingEnd(chosen.startDate) : undefined}
                        onChange={(event) => onEndDate(space.id, event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Minimum {MIN_BOOKING_DAYS} days. The end date fills in for one week, then you can extend it.
                  </p>
                </div>
                <p className="hidden shrink-0 self-center text-lg font-bold text-slate-900 sm:block">
                  {amount != null ? formatCurrency(amount) : days ? "—" : "Select dates"}
                </p>
              </article>
            );
          })}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Items ({items.length})</dt>
              <dd>{pricedLines.length ? formatCurrency(total) : "—"}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Processing fee</dt>
              <dd>{formatCurrency(0)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
              <dt>Total</dt>
              <dd className="text-[#4C4BFF]">{pricedLines.length ? formatCurrency(total) : "—"}</dd>
            </div>
          </dl>
          <button
            type="button"
            disabled={busy !== null}
            onClick={checkout}
            className="mt-5 w-full rounded-xl bg-[#4C4BFF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3d3ce8] disabled:opacity-60"
          >
            {busy === "checkout" ? "Submitting…" : "Proceed to Checkout"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={clearCart}
            className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {busy === "clear" ? "Clearing…" : "Clear Cart"}
          </button>
        </aside>
      </div>
    </>
  );
}
