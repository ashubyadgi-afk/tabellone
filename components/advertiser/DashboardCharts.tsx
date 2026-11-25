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

export type SpendPoint = { month: string; paid: number; booked: number };
export type Slice = { name: string; value: number; color: string };
export type CityPoint = { city: string; footfall: number };
export type CampaignPoint = { name: string; budget: number; booked: number };
export type EfficiencyPoint = { name: string; cost: number };
export type ScheduleRow = {
  id: string;
  name: string;
  start: number;
  end: number;
  status: string;
  color: string;
};

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

function compactNumber(value: number) {
  if (value >= 1_00_000) return `${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return `${value}`;
}

function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-400">
      {text}
    </div>
  );
}

export function SpendTrendChart({ data }: { data: SpendPoint[] }) {
  if (data.every((point) => point.paid === 0 && point.booked === 0)) {
    return <ChartEmpty text="Spend will appear here once you book ad spaces." />;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="paidFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4C4BFF" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#4C4BFF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="bookedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F06B3B" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#F06B3B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={compactRupees} width={56} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value, name) => [formatCurrency(Number(value)), name]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Area
          type="monotone"
          dataKey="booked"
          name="Booked value"
          stroke="#F06B3B"
          strokeWidth={2}
          fill="url(#bookedFill)"
        />
        <Area
          type="monotone"
          dataKey="paid"
          name="Paid"
          stroke="#4C4BFF"
          strokeWidth={2.5}
          fill="url(#paidFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StatusDonut({ data }: { data: Slice[] }) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  if (total === 0) return <ChartEmpty text="No bookings yet." />;
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
          <span className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Bookings</span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {data.map((slice) => (
          <li key={slice.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-600">
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

export function SpendByTypeChart({ data }: { data: Slice[] }) {
  if (data.every((slice) => slice.value === 0)) {
    return <ChartEmpty text="No approved bookings yet." />;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={compactRupees} width={56} />
        <Tooltip
          cursor={{ fill: "rgba(76,75,255,0.06)" }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [formatCurrency(Number(value)), "Booked value"]}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={44}>
          {data.map((slice) => (
            <Cell key={slice.name} fill={slice.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CityReachChart({ data }: { data: CityPoint[] }) {
  if (data.length === 0) return <ChartEmpty text="Reach appears once bookings are approved." />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="reachFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={compactNumber} />
        <YAxis type="category" dataKey="city" tick={AXIS} axisLine={false} tickLine={false} width={84} />
        <Tooltip
          cursor={{ fill: "rgba(16,185,129,0.06)" }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [Number(value).toLocaleString("en-IN"), "Daily footfall"]}
        />
        <Bar dataKey="footfall" fill="url(#reachFill)" radius={[0, 8, 8, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CostEfficiencyChart({ data }: { data: EfficiencyPoint[] }) {
  if (data.length === 0) return <ChartEmpty text="Appears once approved ad spaces have footfall data." />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40 + 30)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="costFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F06B3B" />
            <stop offset="100%" stopColor="#E647A7" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={compactRupees} />
        <YAxis
          type="category"
          dataKey="name"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          width={130}
          tickFormatter={(name: string) => (name.length > 15 ? `${name.slice(0, 14)}…` : name)}
        />
        <Tooltip
          cursor={{ fill: "rgba(240,107,59,0.06)" }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [formatCurrency(Number(value)), "Per 1,000 daily footfall"]}
        />
        <Bar dataKey="cost" fill="url(#costFill)" radius={[0, 8, 8, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BookingTimeline({
  rows,
  windowStart,
  windowEnd,
  today,
  months,
}: {
  rows: ScheduleRow[];
  windowStart: number;
  windowEnd: number;
  today: number;
  months: { label: string; start: number }[];
}) {
  if (rows.length === 0) return <ChartEmpty text="Your booked dates will appear here." />;
  const span = windowEnd - windowStart;
  const pct = (time: number) => Math.min(100, Math.max(0, ((time - windowStart) / span) * 100));
  const todayPct = pct(today);
  const legend = [...new Map(rows.map((row) => [row.status, row.color])).entries()];

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-x-3 text-[11px] text-slate-400">
        <span />
        <div className="relative h-5">
          {months.map((month) => (
            <span key={month.start} className="absolute top-0" style={{ left: `${pct(month.start)}%` }}>
              {month.label}
            </span>
          ))}
        </div>
      </div>
      <div className="relative mt-1 space-y-2">
        {rows.map((row) => {
          const left = pct(row.start);
          const width = Math.max(1.5, pct(row.end) - left);
          return (
            <div key={row.id} className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-x-3">
              <span className="truncate text-xs font-medium text-slate-600" title={row.name}>
                {row.name}
              </span>
              <div className="relative h-6 rounded-md bg-slate-50 ring-1 ring-slate-100">
                {months.map((month) => (
                  <span
                    key={month.start}
                    className="absolute inset-y-0 w-px bg-slate-200/70"
                    style={{ left: `${pct(month.start)}%` }}
                  />
                ))}
                <span
                  className="absolute inset-y-1 rounded shadow-sm"
                  style={{ left: `${left}%`, width: `${width}%`, backgroundColor: row.color }}
                  title={`${row.name} · ${row.status}`}
                />
                {todayPct > 0 && todayPct < 100 ? (
                  <span
                    className="absolute -inset-y-1 w-0.5 rounded bg-[#E647A7]"
                    style={{ left: `${todayPct}%` }}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
        {legend.map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
            {status}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 rounded bg-[#E647A7]" />
          Today
        </span>
      </div>
    </div>
  );
}

export function CampaignBudgetChart({ data }: { data: CampaignPoint[] }) {
  if (data.length === 0) return <ChartEmpty text="Create a campaign to track its budget." />;
  const longestName = data.reduce((max, row) => Math.max(max, row.name.length), 0);
  const labelWidth = Math.min(220, Math.max(120, Math.ceil(longestName * 7)));
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 56 + 48)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis
          type="number"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={compactRupees}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ ...AXIS, width: labelWidth }}
          axisLine={false}
          tickLine={false}
          width={labelWidth}
          interval={0}
        />
        <Tooltip
          cursor={{ fill: "rgba(140,71,238,0.06)" }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(value, name) => [formatCurrency(Number(value)), name]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="budget" name="Budget" fill="#C4B5FD" radius={[0, 6, 6, 0]} maxBarSize={14} />
        <Bar dataKey="booked" name="Booked" fill="#8C47EE" radius={[0, 6, 6, 0]} maxBarSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
