# Phase 1 — UI Screens & Navigation

## App shell (Owner — future)

```
[Tabellone]  Dashboard | IMD | Documents | Settings     [User ▾]
────────────────────────────────────────────────────────────────
                         Main content
```

---

## Screen inventory

| ID | Screen | Route | Roles | Stories | Status |
|----|--------|-------|-------|---------|--------|
| S00 | Home | `/` | public | — | Done (basic) |
| S01 | Login | `/login` | public | US-001 | TODO |
| S02 | Register Owner | `/register/owner` | public | US-020 | TODO |
| S03 | **Add Company / Organization** | `/organizations/new` | public | US-010 | **Done** |
| S04 | Organization success | `/organizations/success` | public | US-010 | Done |
| S05 | Admin login | `/admin/login` | admin | US-001 | TODO |
| S06 | Owner Dashboard | `/owner/dashboard` | owner | — | TODO |
| S07 | IMD Dashboard | `/owner/imd` | owner | US-030 | TODO |

---

## S03 — Add Company (Organization)

**Purpose:** Register a new organization on Tabellone

**Route:** `/organizations/new`

**Fields:**

| Field | Required | Type |
|-------|----------|------|
| Organization name | yes | text |
| Brand name | no | text |
| Official email | yes | email |
| Sector / category | no | text |
| Contact person | no | text |
| Contact phone | no | tel |
| Main branch location | no | text |
| Organization type | yes | select: AdSpace Owner / Advertiser |

**Actions:**

- Submit → `POST /api/v1/organizations` → redirect to S04 with org ID
- Cancel → home

**Validation:** inline + server; duplicate email shows banner

**Design:** Tailwind, clean form layout, Tabellone branding

---

## S04 — Organization registered

Shows success message, organization name, ID, and links to home or future login.

---

## Public routes (blueprint)

| Route | Purpose |
|-------|---------|
| `/` | Home / about |
| `/login` | Owner + Advertiser login only |
| `/register/owner` | Owner registration |
| `/register/advertiser` | Advertiser registration |

## Admin routes (`/admin/*`)

`/admin/login`, `/admin/dashboard`, `/admin/owners`, `/admin/verification`, ...

## Owner routes (`/owner/*`)

`/owner/dashboard`, `/owner/imd`, `/owner/imd/ad-spaces`, ...

## Design notes

| Topic | Decision |
|-------|----------|
| Design system | Tailwind CSS + shadcn/ui (incremental) |
| Responsive | Mobile-friendly forms; dashboards desktop-first |
| Language | English (India-first labels, GST fields later) |
