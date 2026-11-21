import Link from "next/link";
import { Heart, ShoppingCart, User } from "lucide-react";
import { getRoleHomePath, getSession } from "@/lib/auth/session";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { AdvertiserNav } from "@/components/marketplace/AdvertiserNav";
import { countCartItems } from "@/lib/services/cart.service";
import { countWishlistItems } from "@/lib/services/wishlist.service";

const linkClass =
  "relative text-sm font-semibold text-slate-700 transition-colors duration-300 hover:text-[#4C4BFF] after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-gradient-to-r after:from-[#4C4BFF] after:to-[#E647A7] after:transition-all after:duration-300 hover:after:w-full";

const iconBase = "rounded-xl p-2 transition duration-300 hover:-translate-y-0.5";
const heartClass = `${iconBase} text-[#E647A7] hover:bg-[#E647A7]/10`;
const cartClass = `${iconBase} text-[#4C4BFF] hover:bg-[#4C4BFF]/10`;
const userClass = `${iconBase} text-[#8C47EE] hover:bg-[#8C47EE]/10`;

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
        className="fixed inset-x-0 top-0 z-50 w-full bg-gradient-to-r from-[#E9EBFF] via-white to-[#FFF1E6] shadow-md shadow-[#4C4BFF]/10 backdrop-blur"
        suppressHydrationWarning
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-[#4C4BFF] via-[#E647A7] to-[#FF8C3A]" />
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
                    <Link href="/wishlist" aria-label="Wishlist" className={heartClass}>
                      <Heart className="h-5 w-5" />
                    </Link>
                    <Link href="/cart" aria-label="Cart" className={cartClass}>
                      <ShoppingCart className="h-5 w-5" />
                    </Link>
                    {staffDashboard ? (
                      <AccountMenu dashboardHref={staffDashboard} />
                    ) : (
                      <Link href="/login" aria-label="Account" className={userClass}>
                        <User className="h-5 w-5" />
                      </Link>
                    )}
                  </div>
                  <Link
                    href="/register/advertiser"
                    className="rounded-xl bg-gradient-to-r from-[#4C4BFF] to-[#8C47EE] px-4 py-2 font-semibold text-white shadow-md shadow-[#4C4BFF]/30 transition hover:-translate-y-0.5 hover:from-[#3d3ce8] hover:to-[#7a3cd9]"
                  >
                    I am Advertiser
                  </Link>
                  <Link
                    href="/register/owner"
                    className="hidden rounded-xl border border-[#FF8C3A]/50 bg-white/80 px-4 py-2 font-semibold text-orange-600 shadow-sm transition hover:-translate-y-0.5 hover:border-[#FF8C3A] hover:bg-orange-50 sm:inline-block"
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
