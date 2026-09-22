# Phase 3 — Transactions + AI + Advanced Platform (High Level)

> **Not implemented in Phase 1 or Phase 2 initial delivery.** Reference for long-term architecture.

## Objective

Transform TABELLONE from a marketplace into a **complete advertising technology platform**.

## In scope (Phase 3)

### Payment system

- Online payment, UPI, credit/debit cards, bank details, Tabellone Wallet
- Payment status, transaction history, refunds, receipts
- Payment only after booking approval

### Booking & availability engine (marketplace-scale)

- Available / Reserved / Pending / Confirmed / Expired
- Prevent double booking across marketplace

### Notifications (multi-channel)

- Listing, booking, approval/rejection, payment, expiry reminders
- Email, SMS, WhatsApp, Push

### Wishlist & alerts

- Save AdSpaces, availability alerts, price notifications

### AI search & recommendations

- Natural language campaign description → suitable AdSpace recommendations
- Budget, location, type, size, footfall, availability

### AI chatbot

- Platform help, find AdSpaces, pricing/booking/listing guidance

### Analytics & reporting

- Owner: occupancy, revenue, trends
- Advertiser: campaigns, spend, locations
- Admin: growth, commission, popular locations/types

### Subscription system

- Free/paid plans, upgrades, renewal, expiry, payment history

### Advanced admin console

- Campaigns, payments, subscriptions, complaints, pricing rules, reports

## Development rules (all phases)

- Complete and stabilize each phase before the next
- Modular domains: Auth, Users, Organizations, AdSpaces, Listings, Bookings, Campaigns, Payments, Notifications, Pricing, AI, Admin
- Configurable business rules (commission, GST, TDS, subscriptions)
- Approval-based workflows for listings and bookings
