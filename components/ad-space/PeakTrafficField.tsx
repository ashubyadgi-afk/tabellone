"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui";

function formatClock(value: string): string {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "";
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function peakTrafficLabel(from: string, to: string): string {
  const start = formatClock(from);
  const end = formatClock(to);
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

export function PeakTrafficField({
  onChange,
}: {
  onChange: (value: string) => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function update(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    onChange(peakTrafficLabel(nextFrom, nextTo));
  }

  return (
    <div>
      <Label>Peak traffic</Label>
      <p className="mb-2 text-xs text-slate-500">
        Use the clock to choose when traffic is highest
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>From</Label>
          <Input
            type="time"
            value={from}
            onChange={(e) => update(e.target.value, to)}
          />
        </div>
        <div>
          <Label>To</Label>
          <Input
            type="time"
            value={to}
            onChange={(e) => update(from, e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
