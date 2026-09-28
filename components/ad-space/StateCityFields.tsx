"use client";

import { Label, Select } from "@/components/ui";
import {
  cityOptionsForSelect,
  stateOptionsForSelect,
} from "@/lib/india-locations";

type StateCityFieldsProps = {
  state: string;
  city: string;
  onChange: (next: { state: string; city: string }) => void;
};

export function StateCityFields({ state, city, onChange }: StateCityFieldsProps) {
  const states = stateOptionsForSelect(state);
  const cities = cityOptionsForSelect(state, city);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label>State</Label>
        <Select
          value={state}
          onChange={(e) => {
            const nextState = e.target.value;
            onChange({ state: nextState, city: "" });
          }}
        >
          <option value="">Select state…</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>City</Label>
        <Select
          value={city}
          disabled={!state}
          onChange={(e) => onChange({ state, city: e.target.value })}
        >
          <option value="">{state ? "Select city…" : "Select state first…"}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
