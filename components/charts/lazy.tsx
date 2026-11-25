"use client";

import dynamic from "next/dynamic";

function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-xl bg-slate-100"
      style={{ height }}
      aria-hidden
    />
  );
}

function loadNamed<T>(
  loader: () => Promise<Record<string, T>>,
  name: string
) {
  return loader().then((mod) => {
    const Component = mod[name];
    if (!Component) throw new Error(`Chart export missing: ${name}`);
    return { default: Component as React.ComponentType<any> };
  });
}

export const LazyInventoryMixChart = dynamic(
  () => loadNamed(() => import("@/components/owner/OwnerDashboardCharts"), "InventoryMixChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
export const LazyOccupancyChart = dynamic(
  () => loadNamed(() => import("@/components/owner/OwnerDashboardCharts"), "OccupancyChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
export const LazySpacesByTypeChart = dynamic(
  () => loadNamed(() => import("@/components/owner/OwnerDashboardCharts"), "SpacesByTypeChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
export const LazyTopSpacesChart = dynamic(
  () => loadNamed(() => import("@/components/owner/OwnerDashboardCharts"), "TopSpacesChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
export const LazyInvoiceTrendChart = dynamic(
  () => loadNamed(() => import("@/components/owner/OwnerDashboardCharts"), "InvoiceTrendChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
export const LazyBookingTrendChart = dynamic(
  () => loadNamed(() => import("@/components/owner/OwnerDashboardCharts"), "BookingTrendChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
export const LazyRevenueBreakdownChart = dynamic(
  () => loadNamed(() => import("@/components/owner/OwnerDashboardCharts"), "RevenueBreakdownChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export const LazyFirmGrowthChart = dynamic(
  () => loadNamed(() => import("@/components/admin/AdminDashboardCharts"), "FirmGrowthChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
export const LazyRevenueBars = dynamic(
  () => loadNamed(() => import("@/components/admin/AdminDashboardCharts"), "RevenueBars"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
export const LazyCitiesBarChart = dynamic(
  () => loadNamed(() => import("@/components/admin/AdminDashboardCharts"), "CitiesBarChart"),
  { ssr: false, loading: () => <ChartSkeleton height={220} /> }
);
export const LazyTypesDonut = dynamic(
  () => loadNamed(() => import("@/components/admin/AdminDashboardCharts"), "TypesDonut"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
export const LazyCommissionMixChart = dynamic(
  () => loadNamed(() => import("@/components/admin/AdminDashboardCharts"), "CommissionMixChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
export const LazyAdminRevenueTrendChart = dynamic(
  () => loadNamed(() => import("@/components/admin/AdminDashboardCharts"), "AdminRevenueTrendChart"),
  { ssr: false, loading: () => <ChartSkeleton height={280} /> }
);
export const LazyGeographicRevenueChart = dynamic(
  () => loadNamed(() => import("@/components/admin/AdminDashboardCharts"), "GeographicRevenueChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export const LazySpendTrendChart = dynamic(
  () => loadNamed(() => import("@/components/advertiser/DashboardCharts"), "SpendTrendChart"),
  { ssr: false, loading: () => <ChartSkeleton height={260} /> }
);
export const LazyStatusDonut = dynamic(
  () => loadNamed(() => import("@/components/advertiser/DashboardCharts"), "StatusDonut"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
export const LazySpendByTypeChart = dynamic(
  () => loadNamed(() => import("@/components/advertiser/DashboardCharts"), "SpendByTypeChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
export const LazyCityReachChart = dynamic(
  () => loadNamed(() => import("@/components/advertiser/DashboardCharts"), "CityReachChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
export const LazyCampaignBudgetChart = dynamic(
  () => loadNamed(() => import("@/components/advertiser/DashboardCharts"), "CampaignBudgetChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
export const LazyCostEfficiencyChart = dynamic(
  () => loadNamed(() => import("@/components/advertiser/DashboardCharts"), "CostEfficiencyChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
export const LazyBookingTimeline = dynamic(
  () => loadNamed(() => import("@/components/advertiser/DashboardCharts"), "BookingTimeline"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
