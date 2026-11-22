import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { calculatePricing, type PricingBreakdown } from "@/lib/pricing/calculate";

export type { PricingBreakdown };

async function loadPricingConfig() {
  const config = await prisma.pricingConfig.findUnique({
    where: { id: "default" },
  });
  if (config) return config;

  return prisma.pricingConfig.create({
    data: { id: "default" },
  });
}

export async function getPricingConfig() {
  return unstable_cache(loadPricingConfig, ["pricing-config-default"], {
    revalidate: 300,
  })();
}

export async function calculatePricingFromDb(basePrice: number) {
  const config = await getPricingConfig();
  return calculatePricing(basePrice, config);
}

export async function pricePublicListings<T extends { basePrice?: number | null }>(
  spaces: T[]
) {
  if (!spaces.length) return [] as { space: T; customerPrice: number | null }[];
  const config = await getPricingConfig();
  return spaces.map((space) => ({
    space,
    customerPrice:
      space.basePrice != null
        ? calculatePricing(space.basePrice, config).customerPrice
        : null,
  }));
}
