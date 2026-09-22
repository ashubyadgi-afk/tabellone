"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { Check, MapPin, Search, X } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

const MapCanvas = dynamic(() => import("./MapCanvas"), { ssr: false });

type Place = {
  displayName: string;
  lat: number;
  lng: number;
};

type FindMode = "place" | "coords";

type LocationPickerProps = {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
  onClear?: () => void;
};

function formatCoord(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "";
  return String(value);
}

export function LocationPicker({
  latitude,
  longitude,
  onChange,
  onClear,
}: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<FindMode>("place");
  const [draftLat, setDraftLat] = useState<number | null>(latitude ?? null);
  const [draftLng, setDraftLng] = useState<number | null>(longitude ?? null);
  const [coordLat, setCoordLat] = useState(formatCoord(latitude));
  const [coordLng, setCoordLng] = useState(formatCoord(longitude));
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const skipNextSearch = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  function setPin(lat: number, lng: number) {
    setDraftLat(lat);
    setDraftLng(lng);
    setCoordLat(String(lat));
    setCoordLng(String(lng));
  }

  function openMap() {
    setDraftLat(latitude ?? null);
    setDraftLng(longitude ?? null);
    setCoordLat(formatCoord(latitude));
    setCoordLng(formatCoord(longitude));
    setQuery("");
    setSuggestions([]);
    setSearchError("");
    setMode("place");
    setOpen(true);
  }

  async function searchPlaces(q: string, autoSelectFirst = false) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    setSearchError("");
    try {
      const res = await fetch(`/api/v1/geocode/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      const data = (await res.json()) as { items?: Place[]; error?: { message?: string } };
      if (!res.ok) {
        setSuggestions([]);
        setSearchError(data.error?.message || "Could not search right now. Pan the map and click instead.");
        return [];
      }
      const items = data.items ?? [];
      setSuggestions(items);
      if (!items.length) {
        setSearchError("No place found. Try a more specific address.");
        return items;
      }
      if (autoSelectFirst) {
        applyPlace(items[0]);
      } else {
        setPin(items[0].lat, items[0].lng);
      }
      return items;
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return [];
      setSuggestions([]);
      setSearchError("Could not search right now. Pan the map and click instead.");
      return [];
    } finally {
      if (abortRef.current === controller) setSearching(false);
    }
  }

  useEffect(() => {
    if (!open || mode !== "place") return;
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSearchError("");
      return;
    }
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void searchPlaces(q);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [query, open, mode]);

  function applyPlace(place: Place) {
    skipNextSearch.current = true;
    setQuery(place.displayName);
    setPin(place.lat, place.lng);
    setSuggestions([]);
    setSearchError("");
  }

  function goToTypedPlace() {
    const q = query.trim();
    if (q.length < 2) return;
    void searchPlaces(q, true);
  }

  function goToCoordinates() {
    const lat = Number(coordLat.trim());
    const lng = Number(coordLng.trim());
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setSearchError("Enter a latitude between -90 and 90.");
      return;
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      setSearchError("Enter a longitude between -180 and 180.");
      return;
    }
    setPin(lat, lng);
    setSuggestions([]);
    setSearchError("");
  }

  function save() {
    if (draftLat == null || draftLng == null) return;
    onChange(draftLat, draftLng);
    setOpen(false);
  }

  const saved = latitude != null && longitude != null;

  const dialog =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4">
            <div className="flex h-[min(90vh,680px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="font-semibold text-slate-900">Set property location</p>
                  <p className="text-xs text-slate-500">
                    Search by place name or enter exact latitude and longitude. You can also click the map.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative border-b border-slate-100 px-5 py-3">
                <div className="mb-3 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("place");
                      setSearchError("");
                    }}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold",
                      mode === "place"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    Search by location
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("coords");
                      setSuggestions([]);
                      setSearchError("");
                      abortRef.current?.abort();
                    }}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold",
                      mode === "coords"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    Search by coordinates
                  </button>
                </div>

                {mode === "place" ? (
                  <div className="flex gap-2">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (suggestions[0]) applyPlace(suggestions[0]);
                          else goToTypedPlace();
                        }
                      }}
                      placeholder="e.g. Gokul Road, Hubli"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      disabled={searching || query.trim().length < 2}
                      onClick={() => {
                        if (suggestions[0]) applyPlace(suggestions[0]);
                        else goToTypedPlace();
                      }}
                    >
                      <Search className="h-4 w-4" />
                      {searching ? "…" : "Go"}
                    </Button>
                    {draftLat != null && draftLng != null && (
                      <Button type="button" onClick={save}>
                        <Check className="h-4 w-4" />
                        Select
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[8rem] flex-1">
                      <p className="mb-1 text-xs font-medium text-slate-500">Latitude</p>
                      <Input
                        value={coordLat}
                        onChange={(e) => setCoordLat(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            goToCoordinates();
                          }
                        }}
                        inputMode="decimal"
                        placeholder="15.36470"
                        autoComplete="off"
                      />
                    </div>
                    <div className="min-w-[8rem] flex-1">
                      <p className="mb-1 text-xs font-medium text-slate-500">Longitude</p>
                      <Input
                        value={coordLng}
                        onChange={(e) => setCoordLng(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            goToCoordinates();
                          }
                        }}
                        inputMode="decimal"
                        placeholder="75.12400"
                        autoComplete="off"
                      />
                    </div>
                    <Button
                      type="button"
                      disabled={!coordLat.trim() || !coordLng.trim()}
                      onClick={goToCoordinates}
                    >
                      <Search className="h-4 w-4" />
                      Go
                    </Button>
                    {draftLat != null && draftLng != null && (
                      <Button type="button" onClick={save}>
                        <Check className="h-4 w-4" />
                        Select
                      </Button>
                    )}
                  </div>
                )}

                {mode === "place" && suggestions.length > 0 && (
                  <ul className="absolute left-5 right-5 top-full z-[90] mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    {suggestions.map((place) => (
                      <li key={`${place.displayName}-${place.lat}-${place.lng}`}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => applyPlace(place)}
                        >
                          {place.displayName}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {searchError && (
                <p className="px-5 pt-2 text-xs text-red-600">{searchError}</p>
              )}

              <div className="isolate px-5 py-3">
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <MapCanvas
                    latitude={draftLat}
                    longitude={draftLng}
                    interactive
                    onSelect={(lat, lng) => {
                      setPin(lat, lng);
                      setSearchError("");
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                <p className="text-xs text-slate-500">
                  {draftLat != null && draftLng != null
                    ? `Selected ${draftLat.toFixed(5)}, ${draftLng.toFixed(5)}`
                    : "Enter coordinates, search a place, or click the map"}
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={save}
                    disabled={draftLat == null || draftLng == null}
                  >
                    <Check className="h-4 w-4" />
                    Select
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div>
      <Label>Geolocation</Label>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={openMap}>
          <MapPin className="h-4 w-4" />
          {saved ? "Edit location on map" : "Add geolocation"}
        </Button>
        {saved && (
          <>
            <p className="text-xs text-slate-500">
              {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
            </p>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-medium text-slate-500 hover:text-red-600"
              >
                Remove
              </button>
            )}
          </>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Search by location, or enter latitude and longitude and press Go. Opens OpenStreetMap — no Google fee.
      </p>
      {dialog}
    </div>
  );
}
