import Link from "next/link";
import Image from "next/image";
import { MapPin, Users, IndianRupee, Clock, CalendarDays, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { availabilityLabel } from "@/lib/marketplace/search";
import { adSpacePhotos } from "@/lib/ad-space-photos";
import { Card } from "@/components/ui";
import { CardAddToCartButton, CardWishlistButton } from "@/components/marketplace/ListingCardActions";

const TYPE_TONES: Record<
  string,
  {
    bar: string;
    pill: string;
    price: string;
    card: string;
    placeholder: string;
    placeholderText: string;
  }
> = {
  billboard: {
    bar: "from-[#4C4BFF] to-[#8C47EE]",
    pill: "bg-[#4C4BFF]/10 text-[#4C4BFF]",
    price: "bg-[#4C4BFF]/10 text-[#3b3acc]",
    card: "hover:border-[#4C4BFF]/40 hover:shadow-[#4C4BFF]/20",
    placeholder: "from-[#E9EBFF] to-[#DCD9FF]",
    placeholderText: "text-[#4C4BFF]/40",
  },
  digital: {
    bar: "from-[#8C47EE] to-[#E647A7]",
    pill: "bg-[#8C47EE]/10 text-[#7a36d6]",
    price: "bg-[#8C47EE]/10 text-[#7a36d6]",
    card: "hover:border-[#8C47EE]/40 hover:shadow-[#8C47EE]/20",
    placeholder: "from-[#F1E8FF] to-[#FBDDF0]",
    placeholderText: "text-[#8C47EE]/40",
  },
  mall: {
    bar: "from-emerald-500 to-teal-500",
    pill: "bg-emerald-100 text-emerald-700",
    price: "bg-emerald-50 text-emerald-700",
    card: "hover:border-emerald-300 hover:shadow-emerald-500/20",
    placeholder: "from-emerald-50 to-teal-100",
    placeholderText: "text-emerald-500/40",
  },
  vehicle: {
    bar: "from-[#FF8C3A] to-[#E647A7]",
    pill: "bg-orange-100 text-orange-700",
    price: "bg-orange-50 text-orange-700",
    card: "hover:border-orange-300 hover:shadow-orange-500/20",
    placeholder: "from-orange-50 to-pink-100",
    placeholderText: "text-orange-500/40",
  },
};

type AdSpaceCardProps = {
  space: {
    id: string;
    name: string;
    adSpaceType: string;
    city?: string | null;
    state?: string | null;
    address?: string | null;
    basePrice?: number | null;
    footfall?: number | null;
    peakHours?: string | null;
    dimensions?: string | null;
    photoUrl?: string | null;
    photoUrls?: string[] | null;
    rating?: number | null;
    availableFrom?: Date | string | null;
    availableTo?: Date | string | null;
    bookings?: { startDate: Date | string; endDate: Date | string }[];
    organization?: { name: string; brandName?: string | null };
  };
  customerPrice?: number | null;
  inCart?: boolean;
  inWishlist?: boolean;
  signedIn?: boolean;
};

export function AdSpaceCard({
  space,
  customerPrice,
  inCart = false,
  inWishlist = false,
  signedIn = false,
}: AdSpaceCardProps) {
  const price = customerPrice ?? space.basePrice;
  const cover = adSpacePhotos(space)[0];
  const tone = TYPE_TONES[space.adSpaceType] ?? TYPE_TONES.billboard;

  return (
    <Card
      className={`group relative overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${tone.card}`}
    >
      <div className={`h-1 w-full bg-gradient-to-r ${tone.bar}`} />
      <div className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${tone.placeholder}`}>
        <Link href={`/marketplace/${space.id}`} className="absolute inset-0">
          {cover ? (
            <Image
              src={cover}
              alt={space.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className={`text-4xl font-bold uppercase ${tone.placeholderText}`}>
                {space.adSpaceType.slice(0, 2)}
              </span>
            </div>
          )}
        </Link>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
        {inCart ? (
          <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-[#4C4BFF] to-[#8C47EE] px-2.5 py-1 text-xs font-semibold text-white shadow-md">
            Added to cart
          </span>
        ) : null}
        <CardWishlistButton
          adSpaceId={space.id}
          signedIn={signedIn}
          inWishlist={inWishlist}
        />
      </div>
      <div className="p-5">
        <Link href={`/marketplace/${space.id}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p
                className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tone.pill}`}
              >
                {space.adSpaceType}
              </p>
              <h3 className="mt-1.5 font-semibold text-slate-900 group-hover:text-[#4C4BFF]">
                {space.name}
              </h3>
              {space.rating != null ? (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {space.rating.toFixed(1)}
                </p>
              ) : null}
            </div>
            {price ? (
              <p
                className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-bold ${tone.price}`}
              >
                {formatCurrency(price)}
                <span className="text-xs font-normal opacity-70">/mo</span>
              </p>
            ) : null}
          </div>
          <div className="mt-3 space-y-1.5 text-sm text-slate-500">
            <p className="flex items-center gap-1.5 font-medium text-[#3b3acc]">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#4C4BFF]" />
              {availabilityLabel(space)}
            </p>
            {(space.city || space.address) && (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#E647A7]" />
                {[space.city, space.state].filter(Boolean).join(", ") || space.address}
              </p>
            )}
            {space.footfall ? (
              <p className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                {space.footfall.toLocaleString("en-IN")} daily footfall
              </p>
            ) : null}
            {space.dimensions ? (
              <p className="flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5 shrink-0 text-[#FF8C3A]" />
                {space.dimensions}
              </p>
            ) : null}
            {space.peakHours ? (
              <p className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0 text-[#8C47EE]" />
                {space.peakHours}
              </p>
            ) : null}
          </div>
        </Link>
        <div className="mt-4 flex justify-end">
          <CardAddToCartButton
            adSpaceId={space.id}
            signedIn={signedIn}
            inCart={inCart}
          />
        </div>
      </div>
    </Card>
  );
}
