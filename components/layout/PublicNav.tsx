import Link from "next/link";
import { Heart, ShoppingCart, User } from "lucide-react";
import { getRoleHomePath, getSession } from "@/lib/auth/session";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { AdvertiserNav } from "@/components/marketplace/AdvertiserNav";
import { countCartItems } from "@/lib/services/cart.service";
import { countWishlistItems } from "@/lib/services/wishlist.service";

const linkClass =
  "text-sm font-medium text-slate-900/70 transition-colors duration-300 hover:text-slate-900";

const iconClass =
  "rounded-lg p-2 text-slate-900/70 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900";

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
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm"
        suppressHydrationWarning
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center transition-opacity duration-300 hover:opacity-80">
              <span className="tabellone-gradient w-fit text-3xl font-bold">tabellone</span>
            </Link>
            <nav className="hidden items-center gap-8 md:flex">
              <a href="/#billboards" className={linkClass}>
                Browse Billboards
              </a>
              <a href="/#vehicle-ads" className={linkClass}>
                Vehicle Ads
              </a>
              <a href="/#mall-ads" className={linkClass}>
                Mall Ads
              </a>
              <Link href="/map" className={linkClass}>
                Map
              </Link>
              <a href="/#about" className={linkClass}>
                About
              </a>
            </nav>
            <div className="flex items-center gap-3">
              {advertiserOrgId ? (
                <AdvertiserNav
                  initialWishlistCount={wishlistCount}
                  initialCartCount={cartCount}
                />
              ) : (
                <>
                  <div className="hidden items-center gap-1 sm:flex">
                    <Link href="/wishlist" aria-label="Wishlist" className={iconClass}>
                      <Heart className="h-5 w-5" />
                    </Link>
                    <Link href="/cart" aria-label="Cart" className={iconClass}>
                      <ShoppingCart className="h-5 w-5" />
                    </Link>
                    {staffDashboard ? (
                      <AccountMenu dashboardHref={staffDashboard} />
                    ) : (
                      <Link href="/login" aria-label="Account" className={iconClass}>
                        <User className="h-5 w-5" />
                      </Link>
                    )}
                  </div>
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
        </div>
      </header>
      <div className="h-16 shrink-0" aria-hidden="true" />
    </>
  );
}
