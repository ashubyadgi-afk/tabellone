"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Select, PageHeader, Card } from "@/components/ui";
import { LocationPicker } from "@/components/map/LocationPicker";
import { PhotoUploader } from "@/components/ad-space/PhotoUploader";
import { adSpacePhotos, normalizePhotoUrls } from "@/lib/ad-space-photos";

function dateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export default function EditAdSpacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<string[]>(["", "", ""]);
  const [photoError, setPhotoError] = useState("");
  const [form, setForm] = useState({
    adSpaceNumber: "",
    name: "",
    adSpaceType: "billboard",
    city: "",
    state: "",
    address: "",
    dimensions: "",
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
        setForm({
          adSpaceNumber: data.adSpaceNumber ?? "",
          name: data.name ?? "",
          adSpaceType: data.adSpaceType ?? "billboard",
          city: data.city ?? "",
          state: data.state ?? "",
          address: data.address ?? "",
          dimensions: data.dimensions ?? "",
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!photos[0]) {
      setPhotoError("Upload a cover photo before saving.");
      return;
    }
    const photoUrls = normalizePhotoUrls(photos);
    setLoading(true);
    setError("");
    setPhotoError("");
    const res = await fetch(`/api/v1/imd/ad-spaces/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
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
    setLoading(false);
    if (!res.ok) {
      setError(data.error?.message || "Failed to update");
      return;
    }
    router.push("/owner/imd/ad-spaces");
    router.refresh();
  }

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
        <Card className="max-w-2xl p-6">
          <form onSubmit={submit} className="space-y-4">
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
                <Label>Type</Label>
                <Select
                  value={form.adSpaceType}
                  onChange={(e) => setForm({ ...form, adSpaceType: e.target.value })}
                >
                  <option value="billboard">Billboard</option>
                  <option value="digital">Digital</option>
                  <option value="mall">Mall</option>
                  <option value="vehicle">Vehicle</option>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label>State</Label>
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
            </div>
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
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Dimensions</Label>
                <Input
                  value={form.dimensions}
                  onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                  placeholder="20x10 ft"
                />
              </div>
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
            <div>
              <Label>Peak hours</Label>
              <Input
                value={form.peakHours}
                onChange={(e) => setForm({ ...form, peakHours: e.target.value })}
                placeholder="6–9 PM"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save changes"}
              </Button>
              <Link href="/owner/imd/ad-spaces">
                <Button variant="secondary">Cancel</Button>
              </Link>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
