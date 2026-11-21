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

const SECTION_TONES = {
  indigo: {
    band: "bg-gradient-to-b from-[#E9EBFF] via-[#F3F1FF] to-transparent",
    eyebrow: "bg-[#4C4BFF]/10 text-[#4C4BFF] ring-1 ring-[#4C4BFF]/20",
    link: "bg-[#4C4BFF]/10 text-[#4C4BFF] hover:bg-[#4C4BFF] hover:text-white",
    bar: "from-[#4C4BFF] to-[#8C47EE]",
  },
  orange: {
    band: "bg-gradient-to-b from-[#FFF1E6] via-[#FFF7F0] to-transparent",
    eyebrow: "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
    link: "bg-orange-100 text-orange-700 hover:bg-orange-500 hover:text-white",
    bar: "from-[#FF8C3A] to-[#E647A7]",
  },
  emerald: {
    band: "bg-gradient-to-b from-[#E4F8EF] via-[#F0FBF6] to-transparent",
    eyebrow: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    link: "bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white",
    bar: "from-emerald-500 to-teal-500",
  },
} as const;

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
  tone = "indigo",
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
  tone?: keyof typeof SECTION_TONES;
}) {
  const style = SECTION_TONES[tone];
  return (
    <div className={style.band}>
      <section id={id} className="scroll-mt-24 mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {eyebrow ? (
              <p
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style.eyebrow}`}
              >
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
              {title}
            </h2>
            <span className={`mt-3 block h-1 w-16 rounded-full bg-gradient-to-r ${style.bar}`} />
            <p className="mt-3 max-w-2xl text-slate-500">{description}</p>
          </div>
          <Link
            href={viewMoreHref}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${style.link}`}
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
    </div>
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
    {
      label: "Billboards",
      href: "/#billboards",
      icon: Megaphone,
      color: "from-[#4C4BFF] to-[#8C47EE]",
      tint: "from-[#4C4BFF]/10 via-white to-white hover:border-[#4C4BFF]/40 hover:shadow-[#4C4BFF]/20",
      glow: "shadow-[#4C4BFF]/30",
    },
    {
      label: "Digital Ads",
      href: "/#billboards",
      icon: Monitor,
      color: "from-[#8C47EE] to-[#E647A7]",
      tint: "from-[#8C47EE]/10 via-white to-white hover:border-[#8C47EE]/40 hover:shadow-[#8C47EE]/20",
      glow: "shadow-[#8C47EE]/30",
    },
    {
      label: "Mall Ads",
      href: "/#mall-ads",
      icon: Building2,
      color: "from-emerald-500 to-teal-500",
      tint: "from-emerald-500/10 via-white to-white hover:border-emerald-400/50 hover:shadow-emerald-500/20",
      glow: "shadow-emerald-500/30",
    },
    {
      label: "Vehicle Ads",
      href: "/#vehicle-ads",
      icon: Car,
      color: "from-[#FF8C3A] to-[#E647A7]",
      tint: "from-[#FF8C3A]/10 via-white to-white hover:border-[#FF8C3A]/50 hover:shadow-[#FF8C3A]/20",
      glow: "shadow-[#FF8C3A]/30",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-[#F8F7FF] to-slate-50">
      <PublicNav />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#E9EBFF] via-[#F6EFFF] to-[#FFF1E6]">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#4C4BFF]/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-8 h-96 w-96 rounded-full bg-[#E647A7]/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#FF8C3A]/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(76,75,255,0.10),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold text-[#4C4BFF] shadow-sm ring-1 ring-[#4C4BFF]/20 backdrop-blur">
              <Sparkles className="h-4 w-4 text-[#E647A7]" />
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
            <div className="rounded-2xl bg-gradient-to-r from-[#4C4BFF] via-[#E647A7] to-[#FF8C3A] p-[1.5px] shadow-xl shadow-[#4C4BFF]/15">
              <MarketplaceSearchForm />
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Or describe your campaign in your own words:
            </p>
            <div className="mt-2">
              <AiSearchBar />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#billboards"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4C4BFF] to-[#8C47EE] px-6 py-3 font-semibold text-white shadow-lg shadow-[#4C4BFF]/30 transition hover:-translate-y-0.5 hover:from-[#3d3ce8] hover:to-[#7a3cd9]"
            >
              Browse Billboards
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/register/owner"
              className="inline-flex items-center rounded-xl border border-[#8C47EE]/30 bg-white/90 px-6 py-3 font-semibold text-[#5B3FD0] shadow-sm transition hover:-translate-y-0.5 hover:border-[#8C47EE]/60 hover:bg-white"
            >
              List your AdSpace
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl font-bold text-slate-900">Browse by category</h2>
        <span className="mt-2 block h-1 w-16 rounded-full bg-gradient-to-r from-[#4C4BFF] via-[#E647A7] to-[#FF8C3A]" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <a
              key={cat.label}
              href={cat.href.replace("/#", "#")}
              className={`group flex items-center gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${cat.tint}`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} text-white shadow-lg transition group-hover:scale-110 ${cat.glow}`}
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
        <div className="bg-gradient-to-r from-[#FFEEF7] via-[#F7F0FF] to-[#FFF1E6]">
          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E647A7] to-[#FF8C3A] shadow-lg shadow-[#E647A7]/30">
                  <TrendingUp className="h-5 w-5 text-white" />
                </span>
                <span>
                  Trending <span className="tabellone-gradient">&amp; Featured</span>
                </span>
              </h2>
              <Link
                href="/marketplace"
                className="rounded-full bg-white/80 px-5 py-2.5 text-sm font-semibold text-[#E647A7] shadow-sm ring-1 ring-[#E647A7]/20 transition hover:bg-[#E647A7] hover:text-white"
              >
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
        </div>
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

      <ListingSection
        id="vehicle-ads"
        tone="orange"
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

      <ListingSection
        id="mall-ads"
        tone="emerald"
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

      <section
        id="about"
        className="scroll-mt-24 border-t border-slate-200 bg-gradient-to-b from-white via-[#F6F4FF] to-[#FFF4EC]"
      >
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
                tile: "from-[#4C4BFF] to-[#8C47EE] shadow-[#4C4BFF]/30",
                card: "hover:border-[#4C4BFF]/30 hover:shadow-[#4C4BFF]/15",
              },
              {
                icon: Shield,
                title: "Admin-verified listings",
                desc: "Every public listing is reviewed before it appears on the marketplace.",
                tile: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
                card: "hover:border-emerald-300/60 hover:shadow-emerald-500/15",
              },
              {
                icon: Megaphone,
                title: "End-to-end workflow",
                desc: "Campaign → booking request → approval → payment → confirmed booking.",
                tile: "from-[#FF8C3A] to-[#E647A7] shadow-[#FF8C3A]/30",
                card: "hover:border-[#FF8C3A]/40 hover:shadow-[#FF8C3A]/15",
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${f.card}`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${f.tile}`}
                >
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/register/advertiser"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4C4BFF] to-[#8C47EE] px-6 py-3 font-semibold text-white shadow-lg shadow-[#4C4BFF]/30 transition hover:-translate-y-0.5 hover:from-[#3d3ce8]"
            >
              Start advertising
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register/owner"
              className="inline-flex items-center rounded-xl border border-[#8C47EE]/30 bg-white px-6 py-3 font-semibold text-[#5B3FD0] shadow-sm transition hover:-translate-y-0.5 hover:border-[#8C47EE]/60"
            >
              List your space
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-gradient-to-br from-[#0f172a] via-[#1b1650] to-[#2b1245] text-slate-400">
        <div className="h-1 bg-gradient-to-r from-[#4C4BFF] via-[#E647A7] to-[#FF8C3A]" />
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
