import Link from "next/link";
import Image from "next/image";
import { MapPin, Users, IndianRupee, Clock, CalendarDays, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { availabilityLabel } from "@/lib/marketplace/search";
import { adSpacePhotos } from "@/lib/ad-space-photos";
import { Card } from "@/components/ui";

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
};

export function AdSpaceCard({ space, customerPrice }: AdSpaceCardProps) {
  const price = customerPrice ?? space.basePrice;
  const cover = adSpacePhotos(space)[0];

  return (
    <Link href={`/marketplace/${space.id}`}>
      <Card className="group overflow-hidden transition hover:shadow-lg hover:border-orange-200">
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
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
              <span className="text-4xl font-bold text-slate-300 uppercase">
                {space.adSpaceType.slice(0, 2)}
              </span>
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                {space.adSpaceType}
              </p>
              <h3 className="mt-1 font-semibold text-slate-900 group-hover:text-[#1e3a5f]">
                {space.name}
              </h3>
              {space.rating != null ? (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {space.rating.toFixed(1)}
                </p>
              ) : null}
            </div>
            {price && (
              <p className="shrink-0 text-sm font-bold text-[#1e3a5f]">
                {formatCurrency(price)}
                <span className="text-xs font-normal text-slate-500">/mo</span>
              </p>
            )}
          </div>
          <div className="mt-3 space-y-1.5 text-sm text-slate-500">
            <p className="flex items-center gap-1.5 font-medium text-[#1e3a5f]">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {availabilityLabel(space)}
            </p>
            {(space.city || space.address) && (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {[space.city, space.state].filter(Boolean).join(", ") || space.address}
              </p>
            )}
            {space.footfall && (
              <p className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 shrink-0" />
                {space.footfall.toLocaleString("en-IN")} daily footfall
              </p>
            )}
            {space.dimensions && (
              <p className="flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                {space.dimensions}
              </p>
            )}
            {space.peakHours && (
              <p className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {space.peakHours}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
