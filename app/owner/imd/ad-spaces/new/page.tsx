"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Select, PageHeader, Card } from "@/components/ui";
import { LocationPicker } from "@/components/map/LocationPicker";
import { AdSpacePreview } from "@/components/ad-space/AdSpacePreview";
import { PeakTrafficField } from "@/components/ad-space/PeakTrafficField";
import { PhotoUploader } from "@/components/ad-space/PhotoUploader";
import { StateCityFields } from "@/components/ad-space/StateCityFields";
import { normalizePhotoUrls } from "@/lib/ad-space-photos";
import {
  AD_SPACE_TYPES,
  formatDimensions,
  requiresAdSpaceDimensions,
  type DimensionUnit,
} from "@/lib/marketplace/search";

export default function NewAdSpacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<"save" | "draft" | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    adSpaceNumber: "",
    name: "",
    adSpaceType: "billboard",
    city: "",
    state: "",
    address: "",
    width: "",
    height: "",
    unit: "ft" as DimensionUnit,
    basePrice: "",
    footfall: "",
    peakHours: "",
    notes: "",
    availableFrom: "",
    availableTo: "",
    latitude: "",
    longitude: "",
    imdStatus: "active",
  });
  const [photos, setPhotos] = useState<string[]>(["", "", ""]);
  const [photoError, setPhotoError] = useState("");
  const [peakTrafficInvalid, setPeakTrafficInvalid] = useState(false);

  async function submit(asDraft: boolean) {
    setError("");
    setPhotoError("");
    if (!form.adSpaceNumber.trim() || !form.name.trim()) {
      setError("Ad Space number and Name are required.");
      return;
    }
    const dimensionsRequired = requiresAdSpaceDimensions(form.adSpaceType);
    const dimensions = formatDimensions(form.width, form.height, form.unit);
    if (!photos[0]) {
      setPhotoError("Cover photo is required.");
    }
    if (dimensionsRequired && !dimensions) {
      setError("Width and height are required.");
    }
    if (peakTrafficInvalid && !(dimensionsRequired && !dimensions)) {
      setError("To time must be after From.");
    }
    if (!photos[0] || (dimensionsRequired && !dimensions) || peakTrafficInvalid) {
      return;
    }
    const photoUrls = normalizePhotoUrls(photos);
    setLoading(asDraft ? "draft" : "save");
    const { width: _w, height: _h, unit: _u, ...rest } = form;
    const res = await fetch("/api/v1/imd/ad-spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...rest,
        imdStatus: asDraft ? "draft" : form.imdStatus || "active",
        dimensions: dimensions || undefined,
        photoUrls,
        basePrice: form.basePrice ? Number(form.basePrice) : undefined,
        footfall: form.footfall ? Number(form.footfall) : undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
      }),
    });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) {
      setError(data.error?.message || "Failed to create");
      return;
    }
    router.push("/owner/imd/ad-spaces");
    router.refresh();
  }

  const dimensions = formatDimensions(form.width, form.height, form.unit);

  return (
    <div>
      <PageHeader title="New Ad Space" description="Add inventory to IMD" />
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,42rem)_minmax(16rem,1fr)]">
      <Card className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(false);
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Ad Space number *</Label>
              <Input value={form.adSpaceNumber} onChange={(e) => setForm({ ...form, adSpaceNumber: e.target.value })} required />
            </div>
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select value={form.adSpaceType} onChange={(e) => setForm({ ...form, adSpaceType: e.target.value })}>
                {AD_SPACE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.imdStatus} onChange={(e) => setForm({ ...form, imdStatus: e.target.value })}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
                <option value="under_maintenance">Under Maintenance</option>
              </Select>
            </div>
          </div>
          <StateCityFields
            state={form.state}
            city={form.city}
            onChange={({ state, city }) => setForm({ ...form, state, city })}
          />
          <div>
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <PhotoUploader
            urls={photos}
            error={photoError}
            onChange={(next) => {
              setPhotos(next);
              if (next[0]) setPhotoError("");
            }}
          />
          <LocationPicker
            latitude={form.latitude ? Number(form.latitude) : null}
            longitude={form.longitude ? Number(form.longitude) : null}
            onChange={(lat, lng) =>
              setForm({ ...form, latitude: String(lat), longitude: String(lng) })
            }
            onClear={() => setForm({ ...form, latitude: "", longitude: "" })}
          />
          <div>
            <Label>Dimensions{requiresAdSpaceDimensions(form.adSpaceType) ? " *" : ""}</Label>
            <p className="mb-2 text-xs text-slate-500">
              {requiresAdSpaceDimensions(form.adSpaceType)
                ? "Width and height are required for this category."
                : "Optional for vehicle ads."}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Width{requiresAdSpaceDimensions(form.adSpaceType) ? " *" : ""}</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={form.width}
                  onChange={(e) => setForm({ ...form, width: e.target.value })}
                  placeholder={form.unit === "ft" ? "20" : "6"}
                  required={requiresAdSpaceDimensions(form.adSpaceType)}
                />
              </div>
              <div>
                <Label>Height{requiresAdSpaceDimensions(form.adSpaceType) ? " *" : ""}</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                  placeholder={form.unit === "ft" ? "10" : "3"}
                  required={requiresAdSpaceDimensions(form.adSpaceType)}
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Select
                  value={form.unit}
                  onChange={(e) =>
                    setForm({ ...form, unit: e.target.value as DimensionUnit })
                  }
                >
                  <option value="ft">Feet</option>
                  <option value="m">Meters</option>
                </Select>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Base price (₹)</Label>
              <Input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
            </div>
            <div>
              <Label>Daily footfall</Label>
              <Input type="number" value={form.footfall} onChange={(e) => setForm({ ...form, footfall: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Available from</Label>
              <Input
                type="date"
                value={form.availableFrom}
                onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
              />
            </div>
            <div>
              <Label>Available to</Label>
              <Input
                type="date"
                value={form.availableTo}
                onChange={(e) => setForm({ ...form, availableTo: e.target.value })}
              />
            </div>
          </div>
          <PeakTrafficField
            onChange={(peakHours) => setForm({ ...form, peakHours })}
            onInvalidChange={setPeakTrafficInvalid}
          />
          <div>
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={loading !== null}>
              {loading === "save" ? "Saving…" : "Save Ad Space"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading !== null}
              onClick={() => void submit(true)}
            >
              {loading === "draft" ? "Saving…" : "Save as Draft"}
            </Button>
            <Link href="/owner/imd/ad-spaces">
              <Button type="button" variant="ghost" disabled={loading !== null}>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
      <aside className="lg:sticky lg:top-24">
        <AdSpacePreview
          values={{
            ...form,
            dimensions: dimensions ?? "",
            photos,
          }}
        />
      </aside>
      </div>
    </div>
  );
}
