"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export function HoverInfo({
  label,
  title,
  rows,
}: {
  label: string;
  title: string;
  rows: { label: string; value: string }[];
}) {
  const [card, setCard] = useState<{ top: number; left: number } | null>(null);

  function show(target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    const width = 288;
    const height = 36 + rows.length * 24;
    const right = rect.right + 8;
    const left = right + width < window.innerWidth - 8 ? right : Math.max(8, rect.left - width - 8);
    const top = Math.min(Math.max(8, rect.top), window.innerHeight - height - 8);
    setCard({ top, left });
  }

  return (
    <>
      <span
        tabIndex={0}
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={() => setCard(null)}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={() => setCard(null)}
        className="cursor-help border-b border-dotted border-slate-400"
      >
        {label}
      </span>
      {card &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 w-72 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lg"
            style={{ top: card.top, left: card.left }}
          >
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <dl className="mt-2 space-y-1.5">
              {rows.map((row) => (
                <div key={row.label} className="grid grid-cols-[4.75rem_1fr] gap-2 text-xs">
                  <dt className="text-slate-500">{row.label}</dt>
                  <dd className="break-words font-medium text-slate-800">{row.value || "—"}</dd>
                </div>
              ))}
            </dl>
          </div>,
          document.body
        )}
    </>
  );
}
