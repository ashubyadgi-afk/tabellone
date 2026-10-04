"use client";

import { useState } from "react";
import { Label } from "@/components/ui";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = [
  { value: "00", slot: 0 },
  { value: "15", slot: 3 },
  { value: "30", slot: 6 },
  { value: "45", slot: 9 },
] as const;

type Period = "" | "AM" | "PM";

type ClockParts = {
  hour: string;
  minute: string;
  period: Period;
};

const EMPTY_CLOCK: ClockParts = { hour: "", minute: "", period: "" };

function formatParts(parts: ClockParts): string {
  if (!parts.hour || !parts.minute || !parts.period) return "";
  return `${parts.hour}:${parts.minute} ${parts.period}`;
}

function minutesSinceMidnight(parts: ClockParts): number | null {
  if (!parts.hour || !parts.minute || !parts.period) return null;
  const hour12 = Number(parts.hour) % 12;
  const hour = parts.period === "PM" ? hour12 + 12 : hour12;
  return hour * 60 + Number(parts.minute);
}

function peakTrafficLabel(from: ClockParts, to: ClockParts): string {
  const start = formatParts(from);
  const end = formatParts(to);
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

function rangeIsInvalid(from: ClockParts, to: ClockParts): boolean {
  const start = minutesSinceMidnight(from);
  const end = minutesSinceMidnight(to);
  if (start == null || end == null) return false;
  return end <= start;
}

function dialPosition(slot: number, radius: number) {
  const angle = (slot / 12) * Math.PI * 2 - Math.PI / 2;
  return {
    left: `calc(50% + ${Math.cos(angle) * radius}px)`,
    top: `calc(50% + ${Math.sin(angle) * radius}px)`,
  };
}

function ClockPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ClockParts;
  onChange: (next: ClockParts) => void;
}) {
  const selected = formatParts(value);

  return (
    <div>
      <Label>{label}</Label>
      <div
        className="relative mx-auto mt-2 h-52 w-52 rounded-full border border-slate-200 bg-slate-50 shadow-inner"
        role="group"
        aria-label={`${label} clock`}
      >
        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1e3a5f]" />
        {HOURS.map((hour) => (
          <button
            key={hour}
            type="button"
            aria-label={`${label} hour ${hour}`}
            aria-pressed={value.hour === hour}
            onClick={() => onChange({ ...value, hour })}
            className={cn(
              "absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-sm font-semibold transition",
              value.hour === hour
                ? "bg-[#1e3a5f] text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-[#1e3a5f]"
            )}
            style={dialPosition(Number(hour) % 12, 84)}
          >
            {hour}
          </button>
        ))}
        {MINUTES.map((minute) => (
          <button
            key={minute.value}
            type="button"
            aria-label={`${label} minutes ${minute.value}`}
            aria-pressed={value.minute === minute.value}
            onClick={() => onChange({ ...value, minute: minute.value })}
            className={cn(
              "absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-semibold transition",
              value.minute === minute.value
                ? "bg-orange-500 text-white"
                : "bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-orange-400"
            )}
            style={dialPosition(minute.slot, 40)}
          >
            {minute.value}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-sm font-medium text-slate-800">
        {selected || "Select a time"}
      </p>
      <div className="mt-2 flex justify-center gap-2">
        {(["AM", "PM"] as const).map((period) => (
          <button
            key={period}
            type="button"
            aria-label={`${label} ${period}`}
            aria-pressed={value.period === period}
            onClick={() => onChange({ ...value, period })}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition",
              value.period === period
                ? "bg-[#1e3a5f] text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-[#1e3a5f]"
            )}
          >
            {period}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PeakTrafficField({
  onChange,
  onInvalidChange,
}: {
  onChange: (value: string) => void;
  onInvalidChange?: (invalid: boolean) => void;
}) {
  const [from, setFrom] = useState<ClockParts>(EMPTY_CLOCK);
  const [to, setTo] = useState<ClockParts>(EMPTY_CLOCK);
  const [invalid, setInvalid] = useState(false);

  function update(nextFrom: ClockParts, nextTo: ClockParts) {
    const nextInvalid = rangeIsInvalid(nextFrom, nextTo);
    setFrom(nextFrom);
    setTo(nextTo);
    setInvalid(nextInvalid);
    onInvalidChange?.(nextInvalid);
    onChange(nextInvalid ? "" : peakTrafficLabel(nextFrom, nextTo));
  }

  return (
    <div>
      <Label>Peak traffic</Label>
      <p className="mb-2 text-xs text-slate-500">
        Tap an hour on the clock, a quarter-hour mark, and AM or PM
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        <ClockPicker label="From" value={from} onChange={(next) => update(next, to)} />
        <ClockPicker label="To" value={to} onChange={(next) => update(from, next)} />
      </div>
      {invalid ? (
        <p className="mt-2 text-sm text-red-600">To time must be after From.</p>
      ) : null}
    </div>
  );
}
