"use client";

import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui";

export function SeePropertyOnMap({
  name,
  latitude,
  longitude,
}: {
  name: string;
  latitude: number;
  longitude: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:underline"
      >
        <MapPin className="h-4 w-4" />
        See property on map
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="flex h-[min(90vh,560px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="font-semibold text-slate-900">{name}</p>
                <p className="text-xs text-slate-500">
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
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
            <div className="p-4">
              <iframe
                title={`${name} on map`}
                className="h-[380px] w-full rounded-xl border border-slate-200"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.02}%2C${latitude - 0.02}%2C${longitude + 0.02}%2C${latitude + 0.02}&layer=mapnik&marker=${latitude}%2C${longitude}`}
              />
              <a
                href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs font-medium text-orange-600 hover:underline"
              >
                Open in OpenStreetMap
              </a>
            </div>
            <div className="flex justify-end border-t border-slate-100 px-5 py-3">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
