"use client";

import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Label } from "@/components/ui";
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES } from "@/lib/ad-space-photos";

const SLOTS = [
  { label: "Cover photo", required: true },
  { label: "Extra photo", required: false },
  { label: "Extra photo", required: false },
] as const;

type PhotoUploaderProps = {
  urls: string[];
  onChange: (urls: string[]) => void;
  error?: string;
};

function padUrls(urls: string[]) {
  return [urls[0] || "", urls[1] || "", urls[2] || ""];
}

export function PhotoUploader({ urls, onChange, error }: PhotoUploaderProps) {
  const [busy, setBusy] = useState([false, false, false]);
  const [slotErrors, setSlotErrors] = useState(["", "", ""]);
  const padded = padUrls(urls);

  function setBusyAt(index: number, value: boolean) {
    setBusy((prev) => prev.map((item, i) => (i === index ? value : item)));
  }

  function setErrorAt(index: number, value: string) {
    setSlotErrors((prev) => prev.map((item, i) => (i === index ? value : item)));
  }

  async function uploadToSlot(index: number, file: File) {
    if (file.size > MAX_IMAGE_BYTES) {
      setErrorAt(index, "Each image must be 2 MB or smaller.");
      return;
    }

    setBusyAt(index, true);
    setErrorAt(index, "");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/v1/imd/uploads", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: { message?: string } };
      if (!res.ok || !data.url) {
        setErrorAt(index, data.error?.message || "Could not upload that image.");
        return;
      }
      const next = padUrls(urls);
      next[index] = data.url;
      onChange(next);
    } catch {
      setErrorAt(index, "Could not upload that image.");
    } finally {
      setBusyAt(index, false);
    }
  }

  return (
    <div>
      <Label>Photos *</Label>
      <p className="mt-1 text-xs text-slate-400">
        Cover photo is required. You can add up to two extra photos. JPG, PNG, WebP, GIF, or AVIF.
        Max 2 MB each.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {SLOTS.map((slot, index) => (
          <PhotoSlot
            key={index}
            label={slot.label}
            required={slot.required}
            url={padded[index]}
            error={slotErrors[index]}
            busy={busy[index]}
            onFile={(file) => void uploadToSlot(index, file)}
            onClear={() => {
              const next = padUrls(urls);
              next[index] = "";
              onChange(next);
              setErrorAt(index, "");
            }}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function PhotoSlot({
  label,
  required,
  url,
  error,
  busy,
  onFile,
  onClear,
}: {
  label: string;
  required: boolean;
  url: string;
  error?: string;
  busy: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-slate-600">
        {label}
        {required ? " *" : " (optional)"}
      </p>
      <label className="relative flex aspect-[16/10] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-[#1e3a5f]/40 hover:bg-slate-100">
        {url && !busy ? (
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <>
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#1e3a5f]" />
            ) : (
              <ImagePlus className="h-6 w-6" />
            )}
            <span className="mt-2 text-xs">{busy ? "Uploading…" : "Choose image"}</span>
          </>
        )}
        <input
          type="file"
          accept={IMAGE_ACCEPT}
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onFile(file);
          }}
        />
        {url && !busy && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear();
            }}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-slate-600 shadow hover:text-red-600"
            aria-label={`Remove ${label}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
