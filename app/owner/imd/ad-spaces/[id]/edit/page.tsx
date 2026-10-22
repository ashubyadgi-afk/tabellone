"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Select, PageHeader, Card } from "@/components/ui";
import { LocationPicker } from "@/components/map/LocationPicker";
import { AdSpacePreview } from "@/components/ad-space/AdSpacePreview";
import { PhotoUploader } from "@/components/ad-space/PhotoUploader";
import { PeakTrafficField } from "@/components/ad-space/PeakTrafficField";
import { StateCityFields } from "@/components/ad-space/StateCityFields";
import { adSpacePhotos, normalizePhotoUrls } from "@/lib/ad-space-photos";
import {
  AD_SPACE_TYPES,
  formatDimensions,
  parseDimensions,
  requiresAdSpaceDimensions,
  type DimensionUnit,
} from "@/lib/marketplace/search";

function dateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export default function EditAdSpacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const afterSave =
    searchParams.get("returnTo") === "/owner/marketplace"
      ? "/owner/marketplace"
      : "/owner/imd/ad-spaces";
  const [loading, setLoading] = useState<"save" | "draft" | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<string[]>(["", "", ""]);
  const [photoError, setPhotoError] = useState("");
  const [peakTrafficInvalid, setPeakTrafficInvalid] = useState(false);
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

  useEffect(() => {
    fetch(`/api/v1/imd/ad-spaces/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Unable to load Ad Space");
        return res.json();
      })
      .then((data) => {
        const parsed = parseDimensions(data.dimensions);
        setForm({
          adSpaceNumber: data.adSpaceNumber ?? "",
          name: data.name ?? "",
          adSpaceType: data.adSpaceType ?? "billboard",
          city: data.city ?? "",
          state: data.state ?? "",
          address: data.address ?? "",
          width: parsed ? String(parsed.width) : "",
          height: parsed ? String(parsed.height) : "",
          unit: parsed?.unit ?? "ft",
          basePrice: data.basePrice != null ? String(data.basePrice) : "",
          footfall: data.footfall != null ? String(data.footfall) : "",
          peakHours: data.peakHours ?? "",
          notes: data.notes ?? "",
          availableFrom: dateInput(data.availableFrom),
          availableTo: dateInput(data.availableTo),
          latitude: data.latitude != null ? String(data.latitude) : "",
          longitude: data.longitude != null ? String(data.longitude) : "",
          imdStatus: data.imdStatus ?? "active",
        });
        const existing = adSpacePhotos(data);
        setPhotos([existing[0] || "", existing[1] || "", existing[2] || ""]);
        setReady(true);
      })
      .catch((err) => {
        setError(err.message || "Unable to load Ad Space");
      });
  }, [id]);

  async function submit(asDraft: boolean) {
    setError("");
    setPhotoError("");
    if (!form.adSpaceNumber.trim() || !form.name.trim()) {
      setError("Ad Space number and Name are required.");
      return;
    }
    const dimensions = formatDimensions(form.width, form.height, form.unit);
    if (!asDraft && !photos[0]) {
      setPhotoError("Upload a cover photo before saving.");
    }
    const dimensionsRequired = requiresAdSpaceDimensions(form.adSpaceType);
    if (dimensionsRequired && !dimensions) {
      setError("Width and height are required.");
    } else if (peakTrafficInvalid) {
      setError("To time must be after From.");
    }
    if (
      (!asDraft && !photos[0]) ||
      (dimensionsRequired && !dimensions) ||
      peakTrafficInvalid
    ) {
      return;
    }
    const photoUrls = normalizePhotoUrls(photos);
    setLoading(asDraft ? "draft" : "save");
    const { width: _w, height: _h, unit: _u, ...rest } = form;
    const res = await fetch(`/api/v1/imd/ad-spaces/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...rest,
        imdStatus: asDraft ? "draft" : form.imdStatus || "active",
        dimensions: dimensions || null,
        photoUrls,
        basePrice: form.basePrice ? Number(form.basePrice) : null,
        footfall: form.footfall ? Number(form.footfall) : null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        availableFrom: form.availableFrom || null,
        availableTo: form.availableTo || null,
      }),
    });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) {
      setError(data.error?.message || "Failed to update");
      return;
    }
    router.push(afterSave);
    router.refresh();
  }

  const dimensions = formatDimensions(form.width, form.height, form.unit);

  return (
    <div>
      <PageHeader title="Edit Ad Space" description="Update inventory details in IMD" />
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {!ready && !error ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : ready ? (
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
                <Input
                  value={form.adSpaceNumber}
                  onChange={(e) => setForm({ ...form, adSpaceNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select
                  value={form.adSpaceType}
                  onChange={(e) => setForm({ ...form, adSpaceType: e.target.value })}
                >
                  {AD_SPACE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.imdStatus}
                  onChange={(e) => setForm({ ...form, imdStatus: e.target.value })}
                >
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
                <Input
                  type="number"
                  value={form.basePrice}
                  onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                />
              </div>
              <div>
                <Label>Daily footfall</Label>
                <Input
                  type="number"
                  value={form.footfall}
                  onChange={(e) => setForm({ ...form, footfall: e.target.value })}
                />
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
              value={form.peakHours}
              onChange={(peakHours) => setForm({ ...form, peakHours })}
              onInvalidChange={setPeakTrafficInvalid}
            />
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={loading !== null}>
                {loading === "save" ? "Saving…" : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={loading !== null}
                onClick={() => void submit(true)}
              >
                {loading === "draft" ? "Saving…" : "Save as Draft"}
              </Button>
              <Link href={afterSave}>
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
      ) : null}
    </div>
  );
}
