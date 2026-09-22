import Link from "next/link";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md" suppressHydrationWarning>
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <Link href="/">
          <span className="tabellone-gradient text-2xl font-bold tracking-tight">
            tabellone
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/marketplace" className="hover:text-[#4C4BFF]">
            Browse
          </Link>
          <a href="/#billboards" className="hover:text-[#4C4BFF]">
            Billboards
          </a>
          <a href="/#vehicle-ads" className="hover:text-[#4C4BFF]">
            Vehicle Ads
          </a>
          <a href="/#mall-ads" className="hover:text-[#4C4BFF]">
            Mall Ads
          </a>
          <a href="/#about" className="hover:text-[#4C4BFF]">
            About
          </a>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="font-medium text-slate-600 hover:text-[#4C4BFF]">
            Sign in
          </Link>
          <Link
            href="/register/advertiser"
            className="rounded-xl bg-[#4C4BFF] px-4 py-2 font-semibold text-white hover:bg-[#3d3ce8]"
          >
            Advertise
          </Link>
          <Link
            href="/register/owner"
            className="hidden rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 sm:inline-block"
          >
            List spaces
          </Link>
        </div>
      </div>
    </header>
  );
}
