# Phase 2 — Marketplace + Listing + Booking (High Level)

> **Not implemented in Phase 1.** Reference for architecture decisions and `OUT-OF-SCOPE.md`.

## Objective

Turn TABELLONE into a **public advertising-space marketplace** where Advertisers discover spaces and submit booking requests.

## In scope (Phase 2)

### Public homepage

- Browse AdSpace, Mall Ads, Vehicle Ads, Digital Ads
- Category-based sections, trending/sponsored highlights
- Search filters: type, city, state, price, size, footfall
- Footer: Product, Support, Company, Legal sections

### AdSpace discovery & cards

- Location/route, daily footfall, booking duration, monthly price, size, peak hours
- Type-specific attributes (vehicle: km/day; static/digital: size)
- View Details, Book AdSpace

### Owner public listing workflow

- "List Your AdSpace" form: registration cert, location, coordinates, geo-tagged photo, size, type, agency, ownership, amenities, base price
- Listing status: Draft → Submitted → Under Review → Approved/Rejected/Suspended
- **Admin approval required** before public visibility

### Pricing engine (centralized service)

Configurable rules — do not hard-code in UI:

- Owner payout: `BP - (BP×COMMISSION) - (BP×COMMISSION×GST) - (BP×TDS)`
- Customer price: `BP + (BP×COMMISSION) + (BP×COMMISSION×GST) + (BP×GST)`

Example: Base ₹50,000 → Owner payout ₹46,800 → Customer price ₹61,950

### Advertiser dashboard (full)

- Branch management, subscription, campaign preferences
- Wishlist, search history, booking requests, active bookings
- PAN/GST/ID verification, payment settings

### Campaign & booking request workflow

1. Advertiser selects AdSpace + dates
2. Uploads creative, campaign details
3. Reviews customer-side pricing
4. Submits **Request to Book**
5. Admin reviews campaign/creative → approve/reject
6. On approval → payment (Phase 3) → confirmed booking

## Phase 2 success criteria

Owner creates listing → Admin approves → Public listing → Advertiser searches → Campaign → Booking request → Admin approves/rejects

## Phase 1 placeholders for Phase 2

- `marketplace_listing_status` on `ad_spaces` (not_listed | listed | delisted)
- `marketplace_listings`, `booking_requests` tables (schema placeholders)
- "List Your AdSpace" UI placeholder on Owner Dashboard
- Reusable availability calendar module
