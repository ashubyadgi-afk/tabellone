"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Select, PageHeader, Card } from "@/components/ui";
import { LocationPicker } from "@/components/map/LocationPicker";
import { PhotoUploader } from "@/components/ad-space/PhotoUploader";
import { StateCityFields } from "@/components/ad-space/StateCityFields";
import { normalizePhotoUrls } from "@/lib/ad-space-photos";
import {
  AD_SPACE_TYPES,
  formatDimensions,
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

  async function submit(asDraft: boolean) {
    if (!form.adSpaceNumber.trim() || !form.name.trim()) {
      setError("Ad Space number and Name are required.");
      return;
    }
    if (!asDraft && !photos[0]) {
      setPhotoError("Upload a cover photo before saving.");
      return;
    }
    const photoUrls = normalizePhotoUrls(photos);
    const dimensions = formatDimensions(form.width, form.height, form.unit);
    setLoading(asDraft ? "draft" : "save");
    setError("");
    setPhotoError("");
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

  return (
    <div className="w-[min(60vw,100%)] min-w-0">
      <PageHeader title="New Ad Space" description="Add inventory to IMD" />
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Card className="@container w-full p-[clamp(1.25rem,2vw,2.5rem)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(false);
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 @md:grid-cols-2">
            <div>
              <Label>Ad Space number *</Label>
              <Input value={form.adSpaceNumber} onChange={(e) => setForm({ ...form, adSpaceNumber: e.target.value })} required />
            </div>
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>
          <div className="grid gap-4 @md:grid-cols-2">
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
            coverRequired={false}
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
            <Label>Dimensions</Label>
            <p className="mb-2 text-xs text-slate-500">Billboard face size</p>
            <div className="grid gap-4 @lg:grid-cols-3">
              <div>
                <Label>Width</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={form.width}
                  onChange={(e) => setForm({ ...form, width: e.target.value })}
                  placeholder={form.unit === "ft" ? "20" : "6"}
                />
              </div>
              <div>
                <Label>Height</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                  placeholder={form.unit === "ft" ? "10" : "3"}
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
          <div className="grid gap-4 @md:grid-cols-2">
            <div>
              <Label>Base price (₹)</Label>
              <Input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
            </div>
            <div>
              <Label>Daily footfall</Label>
              <Input type="number" value={form.footfall} onChange={(e) => setForm({ ...form, footfall: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 @md:grid-cols-2">
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
          <div>
            <Label>Peak hours</Label>
            <Input value={form.peakHours} onChange={(e) => setForm({ ...form, peakHours: e.target.value })} placeholder="6–9 PM" />
          </div>
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
    </div>
  );
}
