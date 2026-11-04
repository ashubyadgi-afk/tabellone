"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  Users,
  CalendarDays,
  Calendar,
  FileText,
  LogOut,
  Megaphone,
  ChevronRight,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/owner/imd", label: "IMD Overview", icon: Megaphone },
  { href: "/owner/marketplace", label: "List on Marketplace", icon: Store },
  { href: "/owner/imd/ad-spaces", label: "Ad Spaces", icon: Layers },
  { href: "/owner/imd/clients", label: "Clients", icon: Users },
  { href: "/owner/imd/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/owner/imd/calendar", label: "Calendar", icon: Calendar },
  { href: "/owner/imd/invoices", label: "Invoices", icon: FileText },
];

export function OwnerSidebar({
  organizationName,
  userEmail,
}: {
  organizationName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const profileActive = pathname.startsWith("/owner/profile");

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-white/10 tabellone-pane text-white">
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-6">
        <Link href="/" className="block">
          <span className="tabellone-gradient text-2xl font-bold tracking-tight">
            tabellone
          </span>
          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
            Owner OS
          </p>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Inventory Management
        </p>
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/owner/imd" && pathname.startsWith(item.href));
          const imdActive =
            item.href === "/owner/imd" && pathname === "/owner/imd";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active || imdActive
                  ? "bg-[#4C4BFF]/20 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
              {(active || imdActive) && (
                <ChevronRight className="ml-auto h-4 w-4 text-orange-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-4">
        <Link
          href="/owner/profile/edit"
          className={cn(
            "block rounded-xl p-3 transition hover:bg-white/10",
            profileActive ? "bg-[#4C4BFF]/20" : "bg-white/5"
          )}
        >
          <p className="truncate text-sm font-medium text-white">
            {organizationName}
          </p>
          <p className="truncate text-xs text-slate-400">{userEmail}</p>
        </Link>
        <form action="/api/v1/auth/logout" method="POST" className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
