"use client";

import { useState } from "react";
import Image from "next/image";

export function PhotoGallery({ name, photos }: { name: string; photos: string[] }) {
  const [active, setActive] = useState(0);
  const current = photos[active] ?? photos[0];

  if (!photos.length) {
    return (
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300">
        <span className="text-6xl font-bold uppercase text-slate-400">Ad</span>
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300">
        <Image src={current} alt={name} fill sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" priority />
      </div>
      {photos.length > 1 && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              onClick={() => setActive(index)}
              className={`relative overflow-hidden rounded-xl border ${
                index === active ? "border-orange-500 ring-2 ring-orange-200" : "border-slate-200"
              }`}
            >
              <Image
                src={photo}
                alt={`${name} ${index + 1}`}
                width={320}
                height={200}
                className="aspect-[16/10] w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
