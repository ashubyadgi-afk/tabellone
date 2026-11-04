import Link from "next/link";
import { getRoleHomePath, getSession } from "@/lib/auth/session";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { AdvertiserNav } from "@/components/marketplace/AdvertiserNav";
import { countCartItems } from "@/lib/services/cart.service";
import { countWishlistItems } from "@/lib/services/wishlist.service";

export async function PublicNav() {
  const session = await getSession();
  const advertiserOrgId =
    session?.role === "advertiser" && session.organizationId ? session.organizationId : null;
  const staffDashboard =
    session && (session.role === "owner" || session.role === "admin")
      ? getRoleHomePath(session.role)
      : null;
  const [wishlistCount, cartCount] = advertiserOrgId
    ? await Promise.all([
        countWishlistItems(advertiserOrgId),
        countCartItems(advertiserOrgId),
      ])
    : [0, 0];

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
          {advertiserOrgId ? (
            <AdvertiserNav
              initialWishlistCount={wishlistCount}
              initialCartCount={cartCount}
            />
          ) : staffDashboard ? (
            <>
              <AccountMenu dashboardHref={staffDashboard} />
              <Link
                href="/register/advertiser"
                className="rounded-xl bg-[#4C4BFF] px-4 py-2 font-semibold text-white hover:bg-[#3d3ce8]"
              >
                I am Advertiser
              </Link>
              <Link
                href="/register/owner"
                className="hidden rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 sm:inline-block"
              >
                I am Owner
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="font-medium text-slate-600 hover:text-[#4C4BFF]">
                Sign in
              </Link>
              <Link
                href="/register/advertiser"
                className="rounded-xl bg-[#4C4BFF] px-4 py-2 font-semibold text-white hover:bg-[#3d3ce8]"
              >
                I am Advertiser
              </Link>
              <Link
                href="/register/owner"
                className="hidden rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 sm:inline-block"
              >
                I am Owner
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
