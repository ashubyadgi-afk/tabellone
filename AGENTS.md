# Tabellone — Agent Guide

**Tabellone** — multi-phase advertising-space platform. **Current work: Phase 1** (Platform Foundation + IMD).

## Before coding

1. Read `docs/phase-1/PHASE-1-SPEC.md`
2. Check `docs/phase-1/OUT-OF-SCOPE.md` — do not build Phase 2/3 features
3. Implement one milestone or user story at a time

## Documentation map

| Need | File |
|------|------|
| Phase 1 master spec | `docs/phase-1/PHASE-1-SPEC.md` |
| Acceptance criteria | `docs/phase-1/USER-STORIES.md` |
| Database schema | `docs/phase-1/DATA-MODEL.md` |
| REST API | `docs/phase-1/API-CONTRACT.md` |
| UI screens | `docs/phase-1/UI-SCREENS.md` |
| Phase 2 context | `docs/phase-2/PHASE-2-OVERVIEW.md` |
| Phase 3 context | `docs/phase-3/PHASE-3-OVERVIEW.md` |
| Full product | `docs/PRODUCT-OVERVIEW.md` |
| Source extracts | `docs/reference-extracts/` |

## Build commands

```bash
docker compose up -d   # PostgreSQL
npm install
npm run db:push        # sync Prisma schema to DB
npm run db:seed        # demo owner + sample IMD data
npm run dev            # http://localhost:3000
npm run build
npm run lint
npm run db:studio      # Prisma Studio
```

## Conventions

- **Tenant scope:** `organization_id` on all owner/advertiser data
- **IMD vs marketplace:** separate `imd_status` and `marketplace_listing_status`
- **API version:** `/api/v1/*`
- **Stack:** Next.js 15, Prisma, PostgreSQL 16, Tailwind

## Implementation order

1. ~~Scaffold + Organizations (Add Company)~~ ✅
2. Auth & roles (Admin / Owner / Advertiser)
3. Owner onboarding + Admin verification
4. IMD — AdSpaces, Clients, Bookings, Calendar, Invoices

## Key routes (implemented)

| Route | Purpose |
|-------|---------|
| `/` | Home |
| `/organizations/new` | Add Company form |
| `POST /api/v1/organizations` | Create organization |
