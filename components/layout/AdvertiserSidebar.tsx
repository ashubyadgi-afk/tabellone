"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  Heart,
  CalendarClock,
  CreditCard,
  Crown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/advertiser/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/advertiser/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/advertiser/wishlist", label: "Wishlist", icon: Heart },
  { href: "/advertiser/booking-requests", label: "Bookings", icon: CalendarClock },
  { href: "/advertiser/subscription", label: "Subscription", icon: Crown },
  { href: "/advertiser/wallet", label: "Wallet", icon: CreditCard },
];

export function AdvertiserSidebar({
  organizationName,
  userEmail,
}: {
  organizationName: string;
  userEmail: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-6">
        <Link href="/" className="text-xl font-bold text-[#1e3a5f]">
          Tabellone
        </Link>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Advertiser
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-[#1e3a5f]/10 text-[#1e3a5f]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/marketplace"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-50"
        >
          Browse marketplace →
        </Link>
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="truncate text-sm font-medium text-slate-900">
            {organizationName}
          </p>
          <p className="truncate text-xs text-slate-500">{userEmail}</p>
        </div>
        <form action="/api/v1/auth/logout" method="POST" className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
