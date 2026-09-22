export type PricingBreakdown = {
  basePrice: number;
  commissionRate: number;
  commissionAmount: number;
  gstOnCommission: number;
  tdsAmount: number;
  ownerPayout: number;
  platformGst: number;
  customerPrice: number;
};

export function calculatePricing(
  basePrice: number,
  config: {
    commissionRate: number;
    gstRate: number;
    tdsRate: number;
    platformGstRate: number;
  }
): PricingBreakdown {
  const commissionAmount = basePrice * config.commissionRate;
  const gstOnCommission = commissionAmount * config.gstRate;
  const tdsAmount = basePrice * config.tdsRate;
  const ownerPayout =
    basePrice - commissionAmount - gstOnCommission - tdsAmount;
  const platformGst = basePrice * config.platformGstRate;
  const customerPrice =
    basePrice + commissionAmount + gstOnCommission + platformGst;

  return {
    basePrice,
    commissionRate: config.commissionRate,
    commissionAmount: round(commissionAmount),
    gstOnCommission: round(gstOnCommission),
    tdsAmount: round(tdsAmount),
    ownerPayout: round(ownerPayout),
    platformGst: round(platformGst),
    customerPrice: round(customerPrice),
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
