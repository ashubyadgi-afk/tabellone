# Phase 1 — Explicitly Out of Scope

**Agents must NOT implement these in Phase 1.**

## From Phase 1 blueprint (Appendix B)

- Public marketplace search and discovery
- Public AdSpace listing marketplace
- Customer booking request workflow
- Online payment gateway
- Advanced AI search/recommendations and AI chatbot
- Advanced analytics
- Complex subscription billing
- Mobile applications (native)
- Tabellone Wallet (unless explicitly approved)
- Full pricing engine (commission/GST/TDS calculations) — Phase 2

## Phase 2 (see `docs/phase-2/PHASE-2-OVERVIEW.md`)

- Public homepage with Browse AdSpace, Mall Ads, Vehicle Ads
- AdSpace discovery cards, search filters, trending/sponsored
- Owner "List Your AdSpace" **live** listing workflow (Phase 1: placeholder only)
- Admin listing approval → public visibility
- Pricing engine with payout/customer price calculations
- Advertiser full dashboard (campaigns, wishlist, booking requests)
- Campaign management and Request to Book workflow

## Phase 3 (see `docs/phase-3/PHASE-3-OVERVIEW.md`)

- Online payments (UPI, cards, wallet)
- Multi-channel notifications (SMS, WhatsApp, Push)
- AI search, recommendations, chatbot
- Analytics & reporting dashboards
- Subscription billing system
- Advanced admin (payments, subscriptions, pricing rules)

## Phase 1 placeholders allowed

| Feature | Phase 1 behavior |
|---------|------------------|
| "List Your AdSpace" button | Visible on Owner Dashboard → Phase 2 placeholder page |
| Subscription status | Show status field; no billing |
| Bank details | Store securely; no transactions |
| `marketplace_listing_status` | Column exists; always `not_listed` in Phase 1 |

## Deferred nice-to-haves

- Dark mode
- Export reports to PDF/Excel
- Multi-language UI
