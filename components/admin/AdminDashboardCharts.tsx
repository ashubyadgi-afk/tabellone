"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

export type GrowthPoint = { label: string; owners: number; advertisers: number };
export type NamedCount = { label: string; value: number };
export type CommissionSlice = { name: string; value: number; color: string };

const AXIS = { fontSize: 11, fill: "#94a3b8" };
const GRID = "#eef2f7";
const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 24px -12px rgba(15,23,42,0.25)",
  fontSize: 12,
  padding: "8px 12px",
};

const TYPE_COLORS = ["#4C4BFF", "#8C47EE", "#F06B3B", "#10b981", "#E647A7", "#f59e0b"];

function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-400">
      {text}
    </div>
  );
}

function shortMonth(label: string) {
  return label.split(" ")[0] ?? label;
}

export function FirmGrowthChart({ data }: { data: GrowthPoint[] }) {
  if (data.every((row) => row.owners === 0 && row.advertisers === 0)) {
    return <ChartEmpty text="Firm growth will appear as organizations join." />;
  }
  const chartData = data.map((row) => ({
    ...row,
    month: shortMonth(row.label),
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="ownersFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4C4BFF" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#4C4BFF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="advertisersFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F06B3B" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#F06B3B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={28}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Area
          type="monotone"
          dataKey="owners"
          name="Owners"
          stroke="#4C4BFF"
          strokeWidth={2.5}
          fill="url(#ownersFill)"
        />
        <Area
          type="monotone"
          dataKey="advertisers"
          name="Advertisers"
          stroke="#F06B3B"
          strokeWidth={2.5}
          fill="url(#advertisersFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CitiesBarChart({ data }: { data: NamedCount[] }) {
  if (data.length === 0) return <ChartEmpty text="No inventory cities yet." />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 36 + 24)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="cityFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4C4BFF" />
            <stop offset="100%" stopColor="#8C47EE" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          width={88}
          tickFormatter={(name: string) => (name.length > 12 ? `${name.slice(0, 11)}…` : name)}
        />
        <Tooltip
          cursor={{ fill: "rgba(76,75,255,0.06)" }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [Number(value), "Ad spaces"]}
        />
        <Bar dataKey="value" fill="url(#cityFill)" radius={[0, 8, 8, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TypesDonut({ data }: { data: NamedCount[] }) {
  const total = data.reduce((sum, row) => sum + row.value, 0);
  if (total === 0) return <ChartEmpty text="No ad space types yet." />;
  const slices = data.map((row, i) => ({
    name: row.label,
    value: row.value,
    color: TYPE_COLORS[i % TYPE_COLORS.length],
  }));
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-slate-900 tabular-nums">{total}</span>
          <span className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Spaces</span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 capitalize text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
              {slice.name}
            </span>
            <span className="font-semibold text-slate-900 tabular-nums">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CommissionMixChart({ data }: { data: CommissionSlice[] }) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  if (total === 0) return <ChartEmpty text="Commission mix appears once bookings are priced." />;
  const slices = data.filter((slice) => slice.value > 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
          <span className="text-lg font-semibold leading-tight text-slate-900 tabular-nums">
            {formatCurrency(total)}
          </span>
          <span className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Gross</span>
        </div>
      </div>
      <ul className="w-full space-y-2.5 text-sm">
        {data.map((slice) => (
          <li key={slice.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
              {slice.name}
            </span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {formatCurrency(slice.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RevenueBars({
  commission,
  gst,
  ownerPayout,
  collected,
}: {
  commission: number;
  gst: number;
  ownerPayout: number;
  collected: number;
}) {
  const data = [
    { name: "Commission", value: commission, color: "#8C47EE" },
    { name: "GST", value: gst, color: "#f59e0b" },
    { name: "Owner payout", value: ownerPayout, color: "#10b981" },
    { name: "Collected", value: collected, color: "#4C4BFF" },
  ];
  if (data.every((row) => row.value === 0)) {
    return <ChartEmpty text="Revenue figures appear once bookings and payments exist." />;
  }

  function compactRupees(value: number) {
    if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)}Cr`;
    if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
    if (value >= 1_000) return `₹${Math.round(value / 1_000)}K`;
    return `₹${value}`;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={compactRupees} width={52} />
        <Tooltip
          cursor={{ fill: "rgba(76,75,255,0.06)" }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [formatCurrency(Number(value)), "Amount"]}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
          {data.map((row) => (
            <Cell key={row.name} fill={row.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
