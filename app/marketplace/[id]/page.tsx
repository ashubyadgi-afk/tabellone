import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { PublicNav } from "@/components/layout/PublicNav";
import { AiChatWidget } from "@/components/marketplace/AiChatWidget";
import { getPublicAdSpace } from "@/lib/services/marketplace.service";
import { calculatePricingFromDb } from "@/lib/services/pricing.service";
import { formatCurrency, formatDateRange } from "@/lib/utils";
import { availabilityLabel } from "@/lib/marketplace/search";
import { SeePropertyOnMap } from "@/components/map/SeePropertyOnMap";
import { PhotoGallery } from "@/components/ad-space/PhotoGallery";
import { BookAdSpaceForm } from "./BookAdSpaceForm";
import { AdvertiserSpaceActions } from "./AdvertiserSpaceActions";
import { adSpacePhotos } from "@/lib/ad-space-photos";
import { isAdSpaceInCart } from "@/lib/services/cart.service";

export default async function AdSpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const space = await getPublicAdSpace(id);
  if (!space) notFound();

  const inCart =
    session?.role === "advertiser" && session.organizationId
      ? await isAdSpaceInCart(session.organizationId, space.id)
      : false;

  const pricing = space.basePrice
    ? await calculatePricingFromDb(space.basePrice)
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link href="/marketplace" className="text-sm text-slate-500 hover:text-[#1e3a5f]">
          ← Back to marketplace
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PhotoGallery name={space.name} photos={adSpacePhotos(space)} />

            <div className="mt-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
                {space.adSpaceType}
              </p>
              <h1 className="mt-1 text-3xl font-bold text-[#1e3a5f]">{space.name}</h1>
              <p className="mt-2 text-slate-500">
                Listed by {space.organization.brandName || space.organization.name}
                {space.city ? ` · ${[space.city, space.state].filter(Boolean).join(", ")}` : ""}
              </p>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-white border border-slate-200 p-4 sm:col-span-2">
                  <dt className="text-xs text-slate-500">Availability</dt>
                  <dd className="font-medium text-[#1e3a5f]">
                    {availabilityLabel(space)}
                  </dd>
                  {formatDateRange(space.availableFrom, space.availableTo) && (
                    <p className="mt-1 text-xs text-slate-500">
                      Inventory window:{" "}
                      {formatDateRange(space.availableFrom, space.availableTo)}
                    </p>
                  )}
                </div>
                {(space.city || space.address || (space.latitude != null && space.longitude != null)) && (
                  <div className="rounded-xl bg-white border border-slate-200 p-4">
                    <dt className="text-xs text-slate-500">Location</dt>
                    <dd className="font-medium">
                      {[space.city, space.state].filter(Boolean).join(", ") ||
                        space.address ||
                        "Mapped location"}
                    </dd>
                    {space.address && space.city && (
                      <p className="mt-1 text-xs text-slate-500">{space.address}</p>
                    )}
                    {space.latitude != null && space.longitude != null && (
                      <SeePropertyOnMap
                        name={space.name}
                        latitude={space.latitude}
                        longitude={space.longitude}
                      />
                    )}
                  </div>
                )}
                {space.dimensions && (
                  <div className="rounded-xl bg-white border border-slate-200 p-4">
                    <dt className="text-xs text-slate-500">Size</dt>
                    <dd className="font-medium">{space.dimensions}</dd>
                  </div>
                )}
                {space.rating != null && (
                  <div className="rounded-xl bg-white border border-slate-200 p-4">
                    <dt className="text-xs text-slate-500">Rating</dt>
                    <dd className="font-medium">{space.rating.toFixed(1)} ★</dd>
                  </div>
                )}
                {space.footfall && (
                  <div className="rounded-xl bg-white border border-slate-200 p-4">
                    <dt className="text-xs text-slate-500">Daily footfall</dt>
                    <dd className="font-medium">{space.footfall.toLocaleString("en-IN")}</dd>
                  </div>
                )}
                {space.peakHours && (
                  <div className="rounded-xl bg-white border border-slate-200 p-4">
                    <dt className="text-xs text-slate-500">Peak hours</dt>
                    <dd className="font-medium">{space.peakHours}</dd>
                  </div>
                )}
              </dl>

              {space.marketplaceListing?.description && (
                <div className="mt-6 rounded-xl bg-white border border-slate-200 p-5">
                  <h2 className="font-semibold text-slate-900">About this space</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {space.marketplaceListing.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {pricing && (
              <div className="mb-6">
                <p className="text-sm text-slate-500">Customer price (monthly)</p>
                <p className="text-3xl font-bold text-[#1e3a5f]">
                  {formatCurrency(pricing.customerPrice)}
                </p>
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p>Base: {formatCurrency(pricing.basePrice)}</p>
                  <p>Commission: {formatCurrency(pricing.commissionAmount)}</p>
                  <p>GST: {formatCurrency(pricing.gstOnCommission + pricing.platformGst)}</p>
                </div>
              </div>
            )}
            <BookAdSpaceForm
              adSpaceId={space.id}
              customerPrice={pricing?.customerPrice}
              signedIn={session?.role === "advertiser"}
            />
            <AdvertiserSpaceActions
              adSpaceId={space.id}
              signedIn={session?.role === "advertiser"}
              inCart={inCart}
            />
          </div>
        </div>
      </main>
      <AiChatWidget />
    </div>
  );
}
