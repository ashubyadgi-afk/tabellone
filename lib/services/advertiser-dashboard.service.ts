import { prisma } from "@/lib/db";
import type { BookingRequestStatus } from "@prisma/client";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";

const PENDING: BookingRequestStatus[] = ["submitted", "under_review"];
const APPROVED: BookingRequestStatus[] = ["approved", "payment_pending", "paid", "confirmed"];
const LIVE: BookingRequestStatus[] = ["paid", "confirmed"];

export async function getAdvertiserDashboard(organizationId: string) {
  const now = new Date();
  const inSevenDays = addDays(now, 7);
  const trendStart = startOfMonth(subMonths(now, 5));

  const [requests, payments, campaigns, wallet, organization] = await Promise.all([
    prisma.bookingRequest.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: {
        adSpace: {
          select: {
            name: true,
            city: true,
            adSpaceType: true,
            footfall: true,
            organization: { select: { name: true } },
          },
        },
        campaign: { select: { id: true, name: true, budget: true, startDate: true, endDate: true } },
        payment: { select: { id: true, status: true, amount: true, paidAt: true, createdAt: true } },
      },
    }),
    prisma.payment.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        status: true,
        method: true,
        paidAt: true,
        createdAt: true,
        bookingRequest: {
          select: {
            id: true,
            status: true,
            adSpace: { select: { name: true } },
          },
        },
      },
    }),
    prisma.campaign.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        budget: true,
        startDate: true,
        endDate: true,
        creativeUrl: true,
        createdAt: true,
      },
    }),
    prisma.wallet.findUnique({
      where: { organizationId },
      select: { balance: true },
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, brandName: true },
    }),
  ]);

  const completedPayments = payments.filter((p) => p.status === "completed");
  const refundedPayments = payments.filter((p) => p.status === "refunded");
  const pendingPayments = payments.filter((p) =>
    ["pending", "processing"].includes(p.status)
  );
  const totalSpend = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  const approvedRequests = requests.filter((r) => APPROVED.includes(r.status));
  const liveRequests = requests.filter(
    (r) => LIVE.includes(r.status) && r.startDate <= now && r.endDate >= now
  );
  const upcomingRequests = requests
    .filter(
      (r) =>
        !["rejected", "cancelled", "expired"].includes(r.status) &&
        (r.startDate >= now || (r.startDate <= now && r.endDate >= now && LIVE.includes(r.status)))
    )
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 8)
    .map((r) => {
      const daysUntil = differenceInCalendarDays(r.startDate, now);
      const countdown =
        daysUntil > 0
          ? `Starts in ${daysUntil}d`
          : r.endDate >= now
            ? `Ends in ${Math.max(0, differenceInCalendarDays(r.endDate, now))}d`
            : "Ended";
      return {
        id: r.id,
        spaceName: r.adSpace.name,
        publisher: r.adSpace.organization.name,
        format: r.adSpace.adSpaceType,
        city: r.adSpace.city,
        startDate: r.startDate,
        endDate: r.endDate,
        amount: r.customerPrice,
        status: r.status,
        countdown,
      };
    });

  const estimatedReach = approvedRequests.reduce(
    (sum, r) => sum + (r.adSpace.footfall ?? 0),
    0
  );

  const cpmValues = approvedRequests
    .filter((r) => (r.adSpace.footfall ?? 0) > 0)
    .map((r) => r.customerPrice / ((r.adSpace.footfall ?? 1) / 1000));
  const avgCpm =
    cpmValues.length > 0
      ? Math.round(cpmValues.reduce((a, b) => a + b, 0) / cpmValues.length)
      : null;

  // Campaign status derived from dates + linked booking requests
  const campaignStatus = {
    live: 0,
    scheduled: 0,
    pendingApproval: 0,
    completed: 0,
    rejected: 0,
    draft: 0,
  };
  for (const campaign of campaigns) {
    const linked = requests.filter((r) => r.campaignId === campaign.id);
    const hasPending = linked.some((r) => PENDING.includes(r.status) || r.status === "draft");
    const hasRejectedOnly =
      linked.length > 0 && linked.every((r) => r.status === "rejected");
    const hasLive = linked.some(
      (r) => LIVE.includes(r.status) && r.startDate <= now && r.endDate >= now
    );
    const start = campaign.startDate;
    const end = campaign.endDate;

    if (hasRejectedOnly) campaignStatus.rejected += 1;
    else if (hasLive) campaignStatus.live += 1;
    else if (hasPending) campaignStatus.pendingApproval += 1;
    else if (end && end < now) campaignStatus.completed += 1;
    else if (start && start > now) campaignStatus.scheduled += 1;
    else if (linked.length === 0 && !start) campaignStatus.draft += 1;
    else if (start && start <= now && (!end || end >= now)) campaignStatus.live += 1;
    else campaignStatus.draft += 1;
  }

  const activeCampaigns = campaignStatus.live + campaignStatus.scheduled;

  const pendingActions: Array<{
    id: string;
    title: string;
    href: string;
    label: string;
    tone: "rose" | "amber" | "orange" | "violet" | "slate";
  }> = [];
  const paymentDue = requests.filter((r) => r.status === "payment_pending");
  if (paymentDue.length > 0) {
    pendingActions.push({
      id: "pay",
      label: "Payment",
      title: `${paymentDue.length} booking${paymentDue.length === 1 ? "" : "s"} awaiting payment`,
      href: "/advertiser/payments",
      tone: "rose",
    });
  }
  const needsCreative = requests.filter(
    (r) =>
      APPROVED.includes(r.status) &&
      !r.creativeUrl &&
      !(r.campaign?.id && campaigns.find((c) => c.id === r.campaignId)?.creativeUrl)
  );
  // Also campaigns without creative that have bookings
  const campaignsNeedingCreative = campaigns.filter(
    (c) => !c.creativeUrl && requests.some((r) => r.campaignId === c.id && APPROVED.includes(r.status))
  );
  const creativeCount = Math.max(needsCreative.length, campaignsNeedingCreative.length);
  if (creativeCount > 0) {
    pendingActions.push({
      id: "creative",
      label: "Creative",
      title: `${creativeCount} item${creativeCount === 1 ? "" : "s"} need creative upload`,
      href: "/advertiser/campaigns",
      tone: "violet",
    });
  }
  const rejected = requests.filter((r) => r.status === "rejected");
  if (rejected.length > 0) {
    pendingActions.push({
      id: "rejected",
      label: "Rejected",
      title: `${rejected.length} booking${rejected.length === 1 ? "" : "s"} rejected`,
      href: "/advertiser/booking-requests",
      tone: "rose",
    });
  }
  const needsApproval = requests.filter((r) => PENDING.includes(r.status));
  if (needsApproval.length > 0) {
    pendingActions.push({
      id: "approval",
      label: "Approval",
      title: `${needsApproval.length} booking${needsApproval.length === 1 ? "" : "s"} pending approval`,
      href: "/advertiser/booking-requests",
      tone: "amber",
    });
  }
  const expiringSoon = requests.filter(
    (r) => LIVE.includes(r.status) && r.endDate >= now && r.endDate <= inSevenDays
  );
  if (expiringSoon.length > 0) {
    pendingActions.push({
      id: "expiring",
      label: "Expiring",
      title: `${expiringSoon.length} live booking${expiringSoon.length === 1 ? "" : "s"} ending within 7 days`,
      href: "/advertiser/booking-requests",
      tone: "orange",
    });
  }

  // Spend by campaign
  const spendByCampaign = new Map<string, { name: string; spend: number; bookings: number; reach: number }>();
  for (const r of approvedRequests) {
    if (!r.campaignId || !r.campaign) continue;
    const row = spendByCampaign.get(r.campaignId) ?? {
      name: r.campaign.name,
      spend: 0,
      bookings: 0,
      reach: 0,
    };
    const paid = r.payment?.status === "completed" ? r.payment.amount : r.customerPrice;
    row.spend += paid;
    row.bookings += 1;
    row.reach += r.adSpace.footfall ?? 0;
    spendByCampaign.set(r.campaignId, row);
  }
  const topCampaigns = [...spendByCampaign.entries()]
    .map(([id, row]) => ({
      id,
      name: row.name,
      spend: row.spend,
      bookings: row.bookings,
      reach: row.reach,
      cpm: row.reach > 0 ? Math.round(row.spend / (row.reach / 1000)) : null,
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 6);

  const spendBySpace = new Map<
    string,
    {
      name: string;
      publisher: string;
      format: string;
      spend: number;
      reach: number;
      bookings: number;
    }
  >();
  for (const r of approvedRequests) {
    const row = spendBySpace.get(r.adSpaceId) ?? {
      name: r.adSpace.name,
      publisher: r.adSpace.organization.name,
      format: r.adSpace.adSpaceType,
      spend: 0,
      reach: 0,
      bookings: 0,
    };
    const paid = r.payment?.status === "completed" ? r.payment.amount : r.customerPrice;
    row.spend += paid;
    row.reach += r.adSpace.footfall ?? 0;
    row.bookings += 1;
    spendBySpace.set(r.adSpaceId, row);
  }
  const topSpaces = [...spendBySpace.values()]
    .map((row) => ({
      ...row,
      cpm: row.reach > 0 ? Math.round(row.spend / (row.reach / 1000)) : null,
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 6);

  // Audience = city reach (footfall)
  const cityMap = new Map<string, number>();
  for (const r of approvedRequests) {
    const city = r.adSpace.city?.trim() || "Unspecified";
    cityMap.set(city, (cityMap.get(city) ?? 0) + (r.adSpace.footfall ?? 0));
  }
  const topLocations = [...cityMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const formatMap = new Map<string, number>();
  for (const r of approvedRequests) {
    const key = r.adSpace.adSpaceType || "other";
    formatMap.set(key, (formatMap.get(key) ?? 0) + r.customerPrice);
  }
  const spendByFormat = [...formatMap.entries()]
    .map(([label, value]) => ({
      label: label.replaceAll("_", " "),
      value,
    }))
    .sort((a, b) => b.value - a.value);

  // Monthly spend trend
  const months = Array.from({ length: 6 }, (_, i) => {
    const start = startOfMonth(addMonths(trendStart, i));
    return {
      key: format(start, "yyyy-MM"),
      label: format(start, "MMM yyyy"),
      short: format(start, "MMM"),
      start,
      end: startOfMonth(addMonths(start, 1)),
    };
  });

  const spendTrend = months.map((month) => {
    const paid = completedPayments
      .filter((p) => {
        const at = p.paidAt ?? p.createdAt;
        return at >= month.start && at < month.end;
      })
      .reduce((sum, p) => sum + p.amount, 0);
    const booked = approvedRequests
      .filter((r) => r.createdAt >= month.start && r.createdAt < month.end)
      .reduce((sum, r) => sum + r.customerPrice, 0);
    const reach = approvedRequests
      .filter((r) => r.createdAt >= month.start && r.createdAt < month.end)
      .reduce((sum, r) => sum + (r.adSpace.footfall ?? 0), 0);
    return {
      month: month.short,
      label: month.label,
      paid,
      booked,
      reach,
    };
  });

  const recommendations: Array<{
    id: string;
    title: string;
    href: string;
    label: string;
    tone: "rose" | "amber" | "emerald" | "violet" | "indigo";
  }> = [];
  if (paymentDue.length > 0) {
    recommendations.push({
      id: "rec-pay",
      label: "Urgent",
      title: `Complete payment on ${paymentDue.length} approved booking${paymentDue.length === 1 ? "" : "s"} to go live sooner`,
      href: "/advertiser/payments",
      tone: "rose",
    });
  }
  if (campaigns.length === 0) {
    recommendations.push({
      id: "rec-camp",
      label: "Get started",
      title: "Create your first campaign to organize bookings and budgets",
      href: "/advertiser/campaigns",
      tone: "indigo",
    });
  }
  if (topSpaces[0] && topSpaces[0].cpm != null && avgCpm != null && topSpaces[0].cpm < avgCpm) {
    recommendations.push({
      id: "rec-space",
      label: "Opportunity",
      title: `${topSpaces[0].name} has a lower cost per 1k footfall — consider booking similar formats`,
      href: "/marketplace",
      tone: "emerald",
    });
  }
  if (spendByFormat[0] && spendByFormat.length > 1) {
    recommendations.push({
      id: "rec-format",
      label: "Tip",
      title: `Most of your spend is on ${spendByFormat[0].label} — try diversifying formats in the marketplace`,
      href: "/marketplace",
      tone: "violet",
    });
  }
  if (wallet && wallet.balance <= 0 && paymentDue.length > 0) {
    recommendations.push({
      id: "rec-wallet",
      label: "Wallet",
      title: "Wallet balance is low while payments are due — add funds or pay outstanding bookings",
      href: "/advertiser/wallet",
      tone: "amber",
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      id: "rec-browse",
      label: "Explore",
      title: "Browse marketplace inventory to plan your next booking",
      href: "/marketplace",
      tone: "indigo",
    });
  }

  const activity: Array<{
    id: string;
    title: string;
    subtitle: string;
    at: Date;
    href: string;
  }> = [];
  for (const p of payments.slice(0, 8)) {
    activity.push({
      id: `pay-${p.id}`,
      title:
        p.status === "completed"
          ? "Payment successful"
          : p.status === "refunded"
            ? "Refund recorded"
            : `Payment ${p.status}`,
      subtitle: `${p.bookingRequest.adSpace.name} · ₹${Math.round(p.amount).toLocaleString("en-IN")}`,
      at: p.paidAt ?? p.createdAt,
      href: "/advertiser/payments",
    });
  }
  for (const r of requests.slice(0, 8)) {
    let title = "Booking updated";
    if (LIVE.includes(r.status)) title = "Booking confirmed / live";
    else if (r.status === "approved") title = "Booking approved";
    else if (r.status === "rejected") title = "Booking rejected";
    else if (PENDING.includes(r.status)) title = "Booking submitted";
    else if (r.status === "payment_pending") title = "Payment due";
    activity.push({
      id: `br-${r.id}`,
      title,
      subtitle: r.adSpace.name,
      at: r.updatedAt,
      href: "/advertiser/booking-requests",
    });
  }
  activity.sort((a, b) => b.at.getTime() - a.at.getTime());
  const recentActivity = activity.slice(0, 10);

  const statusSlices = [
    { name: "In review", value: 0, color: "#f59e0b" },
    { name: "Approved", value: 0, color: "#10b981" },
    { name: "Payment due", value: 0, color: "#f43f5e" },
    { name: "Live", value: 0, color: "#4C4BFF" },
    { name: "Rejected", value: 0, color: "#94a3b8" },
    { name: "Closed", value: 0, color: "#cbd5e1" },
  ];
  for (const request of requests) {
    const status = request.status;
    const index =
      status === "submitted" || status === "under_review" || status === "draft"
        ? 0
        : status === "approved"
          ? 1
          : status === "payment_pending"
            ? 2
            : LIVE.includes(status)
              ? 3
              : status === "rejected"
                ? 4
                : 5;
    statusSlices[index].value += 1;
  }

  return {
    greetingName: organization?.brandName || organization?.name || "Advertiser",
    kpis: {
      activeCampaigns,
      totalCampaigns: campaigns.length,
      totalSpend,
      liveBookings: liveRequests.length,
      estimatedReach,
      avgCpm,
      pendingApproval: needsApproval.length,
      paymentDue: paymentDue.length,
    },
    campaignStatus,
    upcomingBookings: upcomingRequests,
    pendingActions,
    topCampaigns,
    topSpaces,
    audience: { topLocations, spendByFormat },
    wallet: {
      balance: wallet?.balance ?? 0,
      pendingPayments: pendingPayments.length,
      pendingAmount: pendingPayments.reduce((s, p) => s + p.amount, 0),
      refunds: refundedPayments.length,
      refundAmount: refundedPayments.reduce((s, p) => s + p.amount, 0),
      completedCount: completedPayments.length,
    },
    recommendations,
    recentActivity,
    spendTrend,
    statusSlices,
    charts: {
      typeSlices: spendByFormat.map((row, i) => ({
        name: row.label,
        value: row.value,
        color: ["#4C4BFF", "#8C47EE", "#10b981", "#F06B3B", "#E647A7", "#f59e0b"][i % 6],
      })),
      cityReach: topLocations.map((row) => ({ city: row.label, footfall: row.value })),
      campaignBudget: campaigns
        .map((c) => ({
          name: c.name,
          budget: c.budget ?? 0,
          booked: approvedRequests
            .filter((r) => r.campaignId === c.id)
            .reduce((sum, r) => sum + r.customerPrice, 0),
        }))
        .filter((p) => p.budget > 0 || p.booked > 0)
        .slice(0, 6),
      efficiency: topSpaces
        .filter((s) => s.cpm != null)
        .map((s) => ({ name: s.name, cost: s.cpm as number }))
        .slice(0, 6),
    },
    totals: {
      bookings: requests.length,
      approved: approvedRequests.length,
      rejected: rejected.length,
    },
    trendStart,
  };
}
