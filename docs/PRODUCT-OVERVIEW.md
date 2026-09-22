# Tabellone — Product Overview

## What is Tabellone?

TABELLONE is an **advertising-space ecosystem** connecting **AdSpace Owners**, **Advertisers**, and **TABELLONE Admin**. The platform combines AdSpace Owner business management, an advertising marketplace, campaign and booking management, payments, and AI-powered search and recommendations.

**Product vision:** Advertising-Space Management + Marketplace + Transactions + AI

## Three phases (high level)

| Phase | Name | Goal | Status |
|-------|------|------|--------|
| 1 | Platform Foundation + IMD | Owner Operating System — onboard owners, manage inventory, clients, bookings, invoices | **In progress** |
| 2 | Marketplace + Listing + Booking | Public marketplace, listing approval, pricing engine, booking requests | Planned |
| 3 | Transactions + AI + Advanced Platform | Payments, AI search/chatbot, analytics, subscriptions | Planned |

### Phase 1 — Manage my advertising business

Core platform, role-based auth, Admin portal, Owner onboarding, Advertiser account foundation, **Inventory Management Dashboard (IMD)**.

### Phase 2 — Find and book advertising spaces

Public homepage, AdSpace discovery, owner public listing workflow, admin listing approval, pricing engine, advertiser dashboard, campaigns, booking request workflow.

### Phase 3 — Make TABELLONE intelligent and transactional

Online payments (UPI, cards, wallet), booking engine, notifications (email/SMS/WhatsApp), wishlist, AI search & recommendations, AI chatbot, analytics, subscription billing, advanced admin.

## Users & roles

| Role | Description |
|------|-------------|
| **Admin** | Separate restricted login; verify owners, view platform activity, audit |
| **AdSpace Owner** | Register, verify, manage IMD (inventory, clients, bookings, invoices) |
| **Advertiser** | Register, manage organization profile, subscription/payment settings (Phase 2: search & book) |

## Tech stack (Phase 1 — approved blueprint)

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | Next.js 15 (App Router) + TypeScript | SSR + RSC for dashboards |
| UI | Tailwind CSS + shadcn/ui | Accessible admin/owner UI |
| Forms | React Hook Form + Zod | Shared UI + API validation |
| Backend | Next.js Route Handlers + service layer | Modular monolith |
| ORM | Prisma | Migrations, type-safe queries |
| Database | PostgreSQL 16 | Relational model for bookings/invoices |
| Auth | Email/password + sessions | Separate Admin route |
| File storage | S3/R2 (Phase 1 foundation) | Signed URLs |
| Email | Resend | Verification, notifications |
| Hosting | Vercel + Neon/Railway (target) | |

## Glossary

| Term | Definition |
|------|------------|
| **IMD** | Inventory Management Dashboard — owner-facing internal inventory, booking, and invoice tool |
| **AdSpace** | A physical or digital advertising space (billboard, mall ad, vehicle ad, etc.) |
| **Organization** | Tenant entity — owner's business or advertiser's organization (multi-tenant scope) |
| **Marketplace listing** | Public listing of an AdSpace (Phase 2) — separate from IMD internal status |
| **Base price** | Owner-entered price; pricing engine applies commission, GST, TDS (Phase 2) |

## Ecosystem flow (full product)

```
OWNER → IMD → Inventory → Listings → ADMIN APPROVAL → MARKETPLACE
→ ADVERTISER → Search/AI → Campaign → Booking Request → ADMIN APPROVAL
→ PAYMENT → CONFIRMED BOOKING
```

## Source documents

Original specs in `reference/`; text extracts in `docs/reference-extracts/`.
