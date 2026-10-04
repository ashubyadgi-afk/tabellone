import { CalendarDays, Clock, ImageIcon, MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui";
import { availabilityLabel, adSpaceTypeLabel } from "@/lib/marketplace/search";
import { formatCurrency } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  inactive: "Inactive",
  under_maintenance: "Under Maintenance",
  temporarily_unavailable: "Temporarily Unavailable",
  archived: "Archived",
};

export type AdSpacePreviewValues = {
  adSpaceNumber: string;
  name: string;
  adSpaceType: string;
  city: string;
  state: string;
  address: string;
  dimensions: string;
  basePrice: string;
  footfall: string;
  peakHours: string;
  notes: string;
  availableFrom: string;
  availableTo: string;
  latitude: string;
  longitude: string;
  imdStatus: string;
  photos: string[];
};

export function AdSpacePreview({ values }: { values: AdSpacePreviewValues }) {
  const cover = values.photos.find(Boolean) || "";
  const extras = values.photos.slice(1).filter(Boolean);
  const price = Number(values.basePrice);
  const footfall = Number(values.footfall);
  const place = [values.city, values.state].filter(Boolean).join(", ");
  const availability = availabilityLabel({
    availableFrom: values.availableFrom || null,
    availableTo: values.availableTo || null,
  });

  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">Preview</p>
      <p className="mt-1 text-xs text-slate-500">
        Updates as you fill in the ad space
      </p>
      <Card className="mt-3 overflow-hidden">
        <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-200">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
              <ImageIcon className="h-8 w-8" />
              <span className="text-xs font-medium">Cover photo required</span>
            </div>
          )}
        </div>
        {extras.length > 0 && (
          <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1">
            {extras.map((url) => (
              <img key={url} src={url} alt="" className="aspect-[16/10] w-full rounded-md object-cover" />
            ))}
          </div>
        )}
        <div className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                {adSpaceTypeLabel(values.adSpaceType) || "Category"}
              </p>
              <h3 className="mt-1 truncate font-semibold text-slate-900">
                {values.name.trim() || "Ad space name"}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {values.adSpaceNumber.trim() || "Ad space number"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-[#1e3a5f]">
                {Number.isFinite(price) && price > 0 ? (
                  <>
                    {formatCurrency(price)}
                    <span className="text-xs font-normal text-slate-500">/mo</span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-slate-400">Price</span>
                )}
              </p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {STATUS_LABELS[values.imdStatus] || values.imdStatus}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 text-sm text-slate-500">
            <p className="flex items-center gap-1.5 font-medium text-[#1e3a5f]">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {availability}
            </p>
            <p className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{place || values.address.trim() || "Location"}</span>
            </p>
            {values.address.trim() && place ? (
              <p className="pl-5 text-xs text-slate-400">{values.address.trim()}</p>
            ) : null}
            <p className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" />
              {Number.isFinite(footfall) && footfall > 0
                ? `${footfall.toLocaleString("en-IN")} daily footfall`
                : "Daily footfall"}
            </p>
            <p className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {values.peakHours.trim() || "Peak hours"}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-3 text-sm text-slate-600">
            <p>{values.dimensions.trim() || "Dimensions"}</p>
            {values.notes.trim() ? (
              <p className="mt-1 text-xs text-slate-500">{values.notes.trim()}</p>
            ) : null}
            {values.latitude && values.longitude ? (
              <p className="mt-1 text-xs text-slate-400">
                {values.latitude}, {values.longitude}
              </p>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
