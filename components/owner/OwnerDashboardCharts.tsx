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

export type NamedSlice = { name: string; value: number; color: string };
export type NamedCount = { label: string; value: number; color?: string };
export type TrendPoint = { month: string; label: string; amount: number; count?: number; bookings?: number };
export type TopSpace = { name: string; bookings: number; city: string };

const AXIS = { fontSize: 11, fill: "#94a3b8" };
const GRID = "#eef2f7";
const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 24px -12px rgba(15,23,42,0.25)",
  fontSize: 12,
  padding: "8px 12px",
};

function compactRupees(value: number) {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)}Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${Math.round(value / 1_000)}K`;
  return `₹${value}`;
}

function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-400">
      {text}
    </div>
  );
}

function Donut({
  data,
  centerLabel,
  emptyText,
}: {
  data: NamedSlice[];
  centerLabel: string;
  emptyText: string;
}) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  if (total === 0) return <ChartEmpty text={emptyText} />;
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
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-slate-900 tabular-nums">{total}</span>
          <span className="text-[11px] uppercase tracking-[0.08em] text-slate-400">{centerLabel}</span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {data.map((slice) => (
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

export function InventoryMixChart({ data }: { data: NamedSlice[] }) {
  return <Donut data={data} centerLabel="Spaces" emptyText="Add Ad Spaces to see inventory mix." />;
}

export function OccupancyChart({ data }: { data: NamedSlice[] }) {
  return <Donut data={data} centerLabel="Active" emptyText="No active spaces to show occupancy." />;
}

export function SpacesByTypeChart({ data }: { data: NamedCount[] }) {
  if (data.length === 0) return <ChartEmpty text="No Ad Space types yet." />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(name: string) => (name.length > 10 ? `${name.slice(0, 9)}…` : name)}
        />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
        <Tooltip
          cursor={{ fill: "rgba(76,75,255,0.06)" }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [Number(value), "Spaces"]}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={44}>
          {data.map((row) => (
            <Cell key={row.label} fill={row.color ?? "#4C4BFF"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function InvoiceTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.every((row) => row.amount === 0)) {
    return <ChartEmpty text="Invoice revenue will appear here once you issue invoices." />;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
        <defs>
          <linearGradient id="invoiceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={compactRupees} width={52} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
          formatter={(value, name) =>
            name === "amount" ? [formatCurrency(Number(value)), "Invoiced"] : [value, "Invoices"]
          }
        />
        <Area
          type="monotone"
          dataKey="amount"
          name="amount"
          stroke="#10b981"
          strokeWidth={2.5}
          fill="url(#invoiceFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BookingTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.every((row) => (row.bookings ?? 0) === 0)) {
    return <ChartEmpty text="Bookings created over time will appear here." />;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
        <Tooltip
          cursor={{ fill: "rgba(140,71,238,0.06)" }}
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
          formatter={(value) => [Number(value), "Bookings"]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="bookings" name="Bookings" fill="#8C47EE" radius={[8, 8, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopSpacesChart({ data }: { data: TopSpace[] }) {
  if (data.length === 0) return <ChartEmpty text="Booking leaders appear once spaces have bookings." />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 40 + 24)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="topSpaceFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4C4BFF" />
            <stop offset="100%" stopColor="#8C47EE" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          width={130}
          tickFormatter={(name: string) => (name.length > 16 ? `${name.slice(0, 15)}…` : name)}
        />
        <Tooltip
          cursor={{ fill: "rgba(76,75,255,0.06)" }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(value, _name, item) => [
            Number(value),
            `Bookings · ${item?.payload?.city ?? ""}`,
          ]}
        />
        <Bar dataKey="bookings" fill="url(#topSpaceFill)" radius={[0, 8, 8, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
