import { listPublicAdSpaces, type MarketplaceFilters } from "./marketplace.service";

export type AiSearchResult = {
  query: string;
  parsedFilters: MarketplaceFilters;
  explanation: string;
  results: Awaited<ReturnType<typeof listPublicAdSpaces>>;
};

const CITY_KEYWORDS = [
  "mumbai", "delhi", "bangalore", "bengaluru", "chennai", "hyderabad",
  "pune", "kolkata", "ahmedabad", "jaipur", "surat",
];

const TYPE_KEYWORDS: Record<string, string> = {
  billboard: "billboard",
  digital: "digital",
  mall: "mall",
  vehicle: "vehicle",
  bus: "vehicle",
  cab: "vehicle",
};

export function parseNaturalLanguageQuery(query: string): MarketplaceFilters {
  const lower = query.toLowerCase();
  const filters: MarketplaceFilters = { search: query };

  for (const city of CITY_KEYWORDS) {
    if (lower.includes(city)) {
      filters.city = city.charAt(0).toUpperCase() + city.slice(1);
      if (city === "bengaluru") filters.city = "Bangalore";
      break;
    }
  }

  for (const [keyword, type] of Object.entries(TYPE_KEYWORDS)) {
    if (lower.includes(keyword)) {
      filters.type = type;
      break;
    }
  }

  const budgetMatch = lower.match(
    /(?:budget|under|below|max|upto|up to)\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(k|lakh|lac|cr|crore)?/i
  );
  if (budgetMatch) {
    let amount = parseFloat(budgetMatch[1].replace(/,/g, ""));
    const unit = budgetMatch[2]?.toLowerCase();
    if (unit === "k") amount *= 1000;
    if (unit === "lakh" || unit === "lac") amount *= 100000;
    if (unit === "cr" || unit === "crore") amount *= 10000000;
    filters.maxPrice = amount;
  }

  const footfallMatch = lower.match(/([\d,]+)\s*(?:\+)?\s*(?:footfall|people|visitors)/i);
  if (footfallMatch) {
    filters.minFootfall = parseInt(footfallMatch[1].replace(/,/g, ""), 10);
  }

  return filters;
}

export async function aiSearchAdSpaces(query: string): Promise<AiSearchResult> {
  const parsedFilters = parseNaturalLanguageQuery(query);
  const results = await listPublicAdSpaces(parsedFilters);

  const parts: string[] = [];
  if (parsedFilters.city) parts.push(`city: ${parsedFilters.city}`);
  if (parsedFilters.type) parts.push(`type: ${parsedFilters.type}`);
  if (parsedFilters.maxPrice)
    parts.push(`budget up to ₹${parsedFilters.maxPrice.toLocaleString("en-IN")}`);
  if (parsedFilters.minFootfall)
    parts.push(`min footfall: ${parsedFilters.minFootfall.toLocaleString("en-IN")}`);

  const explanation =
    parts.length > 0
      ? `Matched filters — ${parts.join(", ")}. Found ${results.length} AdSpace(s).`
      : `Searched all listed AdSpaces. Found ${results.length} result(s).`;

  return { query, parsedFilters, explanation, results };
}

export const CHATBOT_RESPONSES: Record<string, string> = {
  hello: "Hello! I'm Tabellone Assistant. I can help you find AdSpaces, explain pricing, bookings, and listings.",
  pricing:
    "Tabellone uses a configurable pricing engine. Customer price = Base Price + Commission + GST on Commission + Platform GST. Owner payout deducts commission, GST, and TDS from the base price.",
  booking:
    "To book: browse marketplace → select AdSpace → choose dates → submit campaign → admin reviews → pay after approval → booking confirmed.",
  listing:
    "Owners create AdSpaces in IMD, then submit for marketplace listing. Admin approves before the space appears publicly.",
  payment:
    "Payments are processed after admin approves your booking request. We support UPI, cards, wallet, and bank transfer.",
  help: "Try: 'billboard in Mumbai under 1 lakh' or ask about pricing, booking, or listing.",
};

export function getChatbotResponse(message: string): string {
  const lower = message.toLowerCase();
  if (/hello|hi|hey/.test(lower)) return CHATBOT_RESPONSES.hello;
  if (/price|pricing|cost|commission|gst/.test(lower)) return CHATBOT_RESPONSES.pricing;
  if (/book|booking|request/.test(lower)) return CHATBOT_RESPONSES.booking;
  if (/list|listing|owner/.test(lower)) return CHATBOT_RESPONSES.listing;
  if (/pay|payment|upi|wallet/.test(lower)) return CHATBOT_RESPONSES.payment;
  return CHATBOT_RESPONSES.help;
}
