"use client";

import { useState } from "react";
import { Label, Select } from "@/components/ui";

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));

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

function peakTrafficLabel(from: ClockParts, to: ClockParts): string {
  const start = formatParts(from);
  const end = formatParts(to);
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

function ClockSelects({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ClockParts;
  onChange: (next: ClockParts) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        <Select
          aria-label={`${label} hour`}
          value={value.hour}
          onChange={(e) => onChange({ ...value, hour: e.target.value })}
        >
          <option value="">Hour</option>
          {HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </Select>
        <Select
          aria-label={`${label} minutes`}
          value={value.minute}
          onChange={(e) => onChange({ ...value, minute: e.target.value })}
        >
          <option value="">Min</option>
          {MINUTES.map((minute) => (
            <option key={minute} value={minute}>
              {minute}
            </option>
          ))}
        </Select>
        <Select
          aria-label={`${label} AM or PM`}
          value={value.period}
          onChange={(e) => onChange({ ...value, period: e.target.value as Period })}
        >
          <option value="">AM/PM</option>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </Select>
      </div>
    </div>
  );
}

export function PeakTrafficField({
  onChange,
}: {
  onChange: (value: string) => void;
}) {
  const [from, setFrom] = useState<ClockParts>(EMPTY_CLOCK);
  const [to, setTo] = useState<ClockParts>(EMPTY_CLOCK);

  function update(nextFrom: ClockParts, nextTo: ClockParts) {
    setFrom(nextFrom);
    setTo(nextTo);
    onChange(peakTrafficLabel(nextFrom, nextTo));
  }

  return (
    <div>
      <Label>Peak traffic</Label>
      <p className="mb-2 text-xs text-slate-500">
        Choose the hour, minutes in steps of 5, and AM or PM
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ClockSelects
          label="From"
          value={from}
          onChange={(next) => update(next, to)}
        />
        <ClockSelects
          label="To"
          value={to}
          onChange={(next) => update(from, next)}
        />
      </div>
    </div>
  );
}
