"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, UserCircle } from "lucide-react";

const ICON_BUTTON =
  "flex h-9 w-9 items-center justify-center rounded-full text-white/85 ring-1 ring-white/25 transition hover:bg-white/20 hover:text-white";

function profileHrefFor(pathname: string) {
  if (pathname.startsWith("/owner")) return "/owner/profile/edit";
  if (pathname.startsWith("/advertiser")) return "/advertiser/settings";
  return "/admin/dashboard";
}

export function BannerAccountActions({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <div className={`flex items-center gap-1.5 print:hidden ${className ?? ""}`}>
      <Link href={profileHrefFor(pathname)} aria-label="Profile" title="Profile" className={ICON_BUTTON}>
        <UserCircle className="h-[18px] w-[18px]" />
      </Link>
      <form action="/api/v1/auth/logout" method="POST">
        <button type="submit" aria-label="Sign out" title="Sign out" className={ICON_BUTTON}>
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </form>
    </div>
  );
}
