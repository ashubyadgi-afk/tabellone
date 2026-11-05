"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";

export function AccountMenu({ dashboardHref }: { dashboardHref: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Account"
        aria-expanded={open}
        suppressHydrationWarning
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-lg p-2 text-slate-900/70 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900"
      >
        <User className="h-5 w-5" />
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <Link
            href={dashboardHref}
            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            Dashboard
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
  );
}
