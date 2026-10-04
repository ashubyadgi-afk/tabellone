"use client";

import { useState } from "react";
import { Label, Select } from "@/components/ui";

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = ["00", "15", "30", "45"];

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
        Choose the hour, minutes in steps of 15, and AM or PM
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
      {invalid ? (
        <p className="mt-2 text-sm text-red-600">To time must be after From.</p>
      ) : null}
    </div>
  );
}
