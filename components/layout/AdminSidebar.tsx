"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  FileCheck,
  IndianRupee,
  Building2,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/listings", label: "Listing approvals", icon: ClipboardCheck },
  { href: "/admin/booking-requests", label: "Booking requests", icon: FileCheck },
  { href: "/admin/pricing", label: "Pricing rules", icon: IndianRupee },
  { href: "/admin/owners", label: "Owners", icon: Building2 },
  { href: "/admin/advertisers", label: "Advertisers", icon: Users },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#12101f] text-white">
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-6">
        <Link href="/" className="block">
          <span className="tabellone-gradient text-2xl font-bold tracking-tight">
            tabellone
          </span>
          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
            Platform console
          </p>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-[#4C4BFF]/20 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-4">
        <p className="truncate px-3 text-xs text-slate-400">{email}</p>
        <form action="/api/v1/auth/logout" method="POST" className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
