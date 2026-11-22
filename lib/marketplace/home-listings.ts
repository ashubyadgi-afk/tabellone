import { unstable_cache } from "next/cache";
import { listPublicAdSpaces } from "@/lib/services/marketplace.service";
import { pricePublicListings } from "@/lib/services/pricing.service";

/** One cached marketplace fetch for the landing page sections. */
export const getHomePricedListings = unstable_cache(
  async () => {
    const spaces = await listPublicAdSpaces({ take: 48 });
    return pricePublicListings(spaces);
  },
  ["home-priced-listings"],
  { revalidate: 60 }
);
