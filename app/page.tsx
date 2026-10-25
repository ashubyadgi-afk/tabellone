import Link from "next/link";
import {
  ArrowRight,
  Megaphone,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Building2,
  Car,
  Monitor,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { listCartAdSpaceIds } from "@/lib/services/cart.service";
import { listWishlistAdSpaceIds } from "@/lib/services/wishlist.service";
import { PublicNav } from "@/components/layout/PublicNav";
import { AiSearchBar } from "@/components/marketplace/AiSearchBar";
import { AiChatWidget } from "@/components/marketplace/AiChatWidget";
import { MarketplaceSearchForm } from "@/components/marketplace/MarketplaceSearchForm";
import { listPublicAdSpaces } from "@/lib/services/marketplace.service";
import { pricePublicListings } from "@/lib/services/pricing.service";
import { AdSpaceCard } from "@/components/marketplace/AdSpaceCard";

export const dynamic = "force-dynamic";

type ListedSpace = Awaited<ReturnType<typeof listPublicAdSpaces>>[number];

function ListingSection({
  id,
  eyebrow,
  title,
  description,
  viewMoreHref,
  viewMoreLabel,
  items,
  signedIn = false,
  cartIds,
  wishlistIds,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  description: string;
  viewMoreHref: string;
  viewMoreLabel: string;
  items: { space: ListedSpace; customerPrice: number | null }[];
  signedIn?: boolean;
  cartIds?: Set<string>;
  wishlistIds?: Set<string>;
}) {
  return (
    <section id={id} className="scroll-mt-24 mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wide text-[#4C4BFF]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-slate-500">{description}</p>
        </div>
        <Link
          href={viewMoreHref}
          className="shrink-0 text-sm font-semibold text-[#4C4BFF] hover:underline"
        >
          {viewMoreLabel} →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-500">
          No listings yet.{" "}
          <Link href={viewMoreHref} className="font-medium text-[#4C4BFF] hover:underline">
            Browse the marketplace
          </Link>
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ space, customerPrice }) => (
            <AdSpaceCard
              key={space.id}
              space={space}
              customerPrice={customerPrice}
              signedIn={signedIn}
              inCart={cartIds?.has(space.id)}
              inWishlist={wishlistIds?.has(space.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function HomePage() {
  const session = await getSession();
  const advertiserId =
    session?.role === "advertiser" && session.organizationId
      ? session.organizationId
      : null;
  const [cartIds, wishlistIds] = advertiserId
    ? await Promise.all([
        listCartAdSpaceIds(advertiserId).then((ids) => new Set(ids)),
        listWishlistAdSpaceIds(advertiserId).then((ids) => new Set(ids)),
      ])
    : [new Set<string>(), new Set<string>()];
  const signedIn = Boolean(advertiserId);

  const [trending, billboardItems, vehicleItems, mallItems] = await Promise.all([
    listPublicAdSpaces({ take: 3 }).then(pricePublicListings),
    listPublicAdSpaces({ types: ["billboard", "digital"], take: 6 }).then(
      pricePublicListings
    ),
    listPublicAdSpaces({ type: "vehicle", take: 6 }).then(pricePublicListings),
    listPublicAdSpaces({ type: "mall", take: 6 }).then(pricePublicListings),
  ]);

  const categories = [
    { label: "Billboards", href: "/#billboards", icon: Megaphone, color: "from-[#4C4BFF] to-[#8C47EE]" },
    { label: "Digital Ads", href: "/#billboards", icon: Monitor, color: "from-[#8C47EE] to-[#E647A7]" },
    { label: "Mall Ads", href: "/#mall-ads", icon: Building2, color: "from-emerald-500 to-teal-500" },
    { label: "Vehicle Ads", href: "/#vehicle-ads", icon: Car, color: "from-[#FF8C3A] to-[#E647A7]" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />

      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(76,75,255,0.08),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              <Sparkles className="h-4 w-4" />
              India&apos;s advertising marketplace
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 lg:text-6xl">
              Smarter Way to Book{" "}
              <span className="tabellone-gradient">Advertising</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-500">
              Connect with premium billboard owners, vehicle advertisers, and mall
              spaces across India. Book verified advertising spaces with transparent
              pricing.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-5xl">
            <MarketplaceSearchForm />
            <p className="mt-4 text-sm text-slate-500">
              Or describe your campaign in your own words:
            </p>
            <div className="mt-2">
              <AiSearchBar />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#billboards"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4C4BFF] to-[#8C47EE] px-6 py-3 font-semibold text-white shadow-lg shadow-[#4C4BFF]/20 hover:from-[#3d3ce8] hover:to-[#7a3cd9]"
            >
              Browse Billboards
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/register/owner"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              List your AdSpace
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl font-bold text-slate-900">Browse by category</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <a
              key={cat.label}
              href={cat.href.replace("/#", "#")}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#4C4BFF]/30 hover:shadow-md"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} text-white`}
              >
                <cat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-[#4C4BFF]">
                  {cat.label}
                </p>
                <p className="text-sm text-slate-500">Jump to section</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {trending.length > 0 ? (
        <section className="mx-auto max-w-7xl px-6 pb-8">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <TrendingUp className="h-6 w-6 text-[#E647A7]" />
              <span>
                Trending <span className="tabellone-gradient">&amp; Featured</span>
              </span>
            </h2>
            <Link href="/marketplace" className="text-sm font-semibold text-[#4C4BFF] hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map(({ space, customerPrice }) => (
              <AdSpaceCard
                key={space.id}
                space={space}
                customerPrice={customerPrice}
                signedIn={signedIn}
                inCart={cartIds.has(space.id)}
                inWishlist={wishlistIds.has(space.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <ListingSection
        id="billboards"
        eyebrow="Featured Billboards"
        title="Premium advertising spaces"
        description="Billboards and digital screens across major Indian cities."
        viewMoreHref="/marketplace?type=billboard"
        viewMoreLabel="View more billboards"
        items={billboardItems}
        signedIn={signedIn}
        cartIds={cartIds}
        wishlistIds={wishlistIds}
      />

      <div className="bg-white">
        <ListingSection
          id="vehicle-ads"
          eyebrow="Vehicle Advertising"
          title="Mobile advertising solutions"
          description="Reach audiences on the move with buses, autos, and other vehicle ads."
          viewMoreHref="/marketplace?type=vehicle"
          viewMoreLabel="View more vehicle ads"
          items={vehicleItems}
          signedIn={signedIn}
          cartIds={cartIds}
          wishlistIds={wishlistIds}
        />
      </div>

      <ListingSection
        id="mall-ads"
        eyebrow="Mall Advertising"
        title="Premium mall spaces"
        description="High-footfall screens and displays in shopping destinations."
        viewMoreHref="/marketplace?type=mall"
        viewMoreLabel="View more mall ads"
        items={mallItems}
        signedIn={signedIn}
        cartIds={cartIds}
        wishlistIds={wishlistIds}
      />

      <section id="about" className="scroll-mt-24 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
            About <span className="tabellone-gradient">tabellone</span>
          </h2>
          <p className="mt-4 max-w-3xl text-slate-500">
            Tabellone connects advertisers with verified billboard, vehicle, and mall
            inventory. Owners manage spaces in IMD; listings appear here after admin
            approval.
          </p>
          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Smart discovery",
                desc: "Filter by city, type, price, and footfall — or use AI natural language search.",
              },
              {
                icon: Shield,
                title: "Admin-verified listings",
                desc: "Every public listing is reviewed before it appears on the marketplace.",
              },
              {
                icon: Megaphone,
                title: "End-to-end workflow",
                desc: "Campaign → booking request → approval → payment → confirmed booking.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-100 p-6">
                <f.icon className="h-8 w-8 text-[#4C4BFF]" />
                <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/register/advertiser"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4C4BFF] to-[#8C47EE] px-6 py-3 font-semibold text-white hover:from-[#3d3ce8]"
            >
              Start advertising
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register/owner"
              className="inline-flex items-center rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              List your space
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-[#0f172a] text-slate-400">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-3 text-sm">
            <div>
              <p className="font-bold text-white">Product</p>
              <div className="mt-3 space-y-2">
                <Link href="/marketplace" className="block hover:text-white">
                  Browse
                </Link>
                <Link href="/register/owner" className="block hover:text-white">
                  List Space
                </Link>
                <Link href="/register/advertiser" className="block hover:text-white">
                  For Advertisers
                </Link>
              </div>
            </div>
            <div>
              <p className="font-bold text-white">Company</p>
              <div className="mt-3 space-y-2">
                <a href="/#about" className="block hover:text-white">
                  About
                </a>
              </div>
            </div>
            <div>
              <p className="font-bold text-white">Legal</p>
              <div className="mt-3 space-y-2">
                <p>Terms of Service</p>
                <p>Privacy Policy</p>
              </div>
            </div>
          </div>
          <p className="mt-8 text-xs">© 2026 Tabellone. Advertising-space ecosystem.</p>
        </div>
      </footer>

      <AiChatWidget />
    </div>
  );
}
