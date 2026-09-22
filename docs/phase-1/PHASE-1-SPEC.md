# Tabellone Phase 1 — Platform Foundation + IMD

> Master specification for Cursor agents. Source: `reference/` blueprints (August 2026).

## 1. Vision & goals

### Phase 1 delivers

An **Owner Operating System**: multi-tenant web platform where AdSpace Owners manage inventory, clients, bookings, availability, and invoices — with Admin oversight and Advertiser account foundations — **without** a public marketplace or payment gateway.

Concrete outcomes:

- Multi-tenant platform foundation and application shell
- Role-based authentication (Admin, Owner, Advertiser) with separate Admin login
- Owner onboarding and verification workflow
- Advertiser onboarding and basic account area
- Organization/profile management
- Document and image upload foundation
- **IMD** — AdSpace inventory, clients, bookings, availability, invoices
- Notifications, bank details, audit, and security foundations

### Success criteria

- [ ] Owner registers → completes onboarding → Admin approves → Owner Dashboard
- [ ] Owner creates/edits/disables AdSpaces in IMD
- [ ] Owner maintains clients and bookings; conflicts detected
- [ ] Owner views calendar/availability and generates invoices (view/download/print)
- [ ] Admin views Owners, Advertisers, AdSpaces, bookings; audit logs work
- [ ] Role-based access enforced; documents stored securely
- [ ] Data model ready for Phase 2 marketplace (separate IMD vs marketplace status)

### Explicitly NOT in Phase 1

See [OUT-OF-SCOPE.md](./OUT-OF-SCOPE.md).

---

## 2. Scope summary

### In scope (Phase 1)

| # | Feature / module | Priority | Doc reference |
|---|------------------|----------|---------------|
| 1 | Auth & roles (Admin/Owner/Advertiser) | P0 | USER-STORIES.md |
| 2 | Organization registration (tenant) | P0 | US-010 |
| 3 | Owner onboarding + verification | P0 | USER-STORIES.md |
| 4 | Advertiser onboarding + account | P1 | USER-STORIES.md |
| 5 | Owner Dashboard | P0 | UI-SCREENS.md |
| 6 | IMD — AdSpaces | P0 | DATA-MODEL.md |
| 7 | IMD — Clients & Bookings | P0 | USER-STORIES.md |
| 8 | Availability calendar + conflicts | P0 | USER-STORIES.md |
| 9 | Invoice generation (PDF) | P0 | USER-STORIES.md |
| 10 | Admin console foundation | P0 | UI-SCREENS.md |
| 11 | Documents/media + notifications foundation | P1 | API-CONTRACT.md |
| 12 | Audit logging & security hardening | P1 | PHASE-1-SPEC §4 |

### Modules map

```
Phase 1
├── platform/     Auth, roles, org, audit, settings
├── identity/     Owner/Advertiser onboarding, verification
├── imd/          AdSpaces, clients, bookings, availability, invoices
├── media/        Upload, storage, access control
├── notifications/ In-app + email foundation
└── admin/        Admin console operations
```

---

## 3. User flows

### Flow A: Owner onboarding

1. Owner registers at `/register/owner` (organization + profile fields)
2. Completes onboarding wizard (documents, GST, live photo, etc.)
3. Submits for verification → status `submitted`
4. Admin reviews at `/admin/owners` → approve/reject
5. Approved owner accesses `/owner/dashboard` and IMD

### Flow B: Add organization (company) — **first build slice**

1. User opens Add Organization form
2. Enters organization name, official email, contact, sector, branch location
3. System validates and creates `organizations` record
4. Success → confirmation with organization ID

### Flow C: IMD booking → invoice

1. Owner creates AdSpace → creates Client → creates Booking (date range)
2. System rejects overlapping bookings on same AdSpace
3. Owner generates invoice from booking → PDF stored → download/print

---

## 4. Non-functional requirements

| Area | Requirement |
|------|-------------|
| Architecture | Modular monolith, API-first, `/api/v1` |
| Multi-tenancy | Organization-scoped rows; `organization_id` on tenant data |
| Security | bcrypt passwords, HTTP-only sessions, RBAC, audit logs |
| Validation | Zod at API + React Hook Form at UI |
| Performance | Suitable for growing inventory and users |
| Locale | India-first (GST fields in spec) |
| Responsive | Web application, dashboard-focused |

---

## 5. Implementation order

1. **Scaffold** — repo, Prisma, Tailwind, CI-ready structure
2. **Organizations** — tenant entity (Add Company) ← **current**
3. Auth & roles (Admin/Owner/Advertiser)
4. Owner onboarding + Admin verification
5. Advertiser onboarding + account area
6. Owner Dashboard + IMD dashboard
7. AdSpaces, Clients, Bookings
8. Availability calendar + conflict detection
9. Invoices (PDF)
10. Documents, notifications, audit, hardening

### Milestones (from blueprint)

| M | Focus | Duration |
|---|-------|----------|
| M1 | Architecture & Foundation | 2 weeks |
| M2 | Identity & Roles | 2 weeks |
| M3 | Owner Onboarding | 2 weeks |
| M4 | IMD Core | 2 weeks |
| M5 | Clients & Bookings | 2 weeks |
| M6 | Availability | 1.5 weeks |
| M7 | Invoices | 1.5 weeks |
| M8 | Hardening | 2 weeks |

---

## 6. Open decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Primary market | India-first |
| 2 | Invoice tax model (M7) | Flat amount; GST line items Phase 3 |
| 3 | Live photo | Webcam with upload fallback |
| 4 | AdSpace numbering | Auto `AS-{ORG}-{SEQ}` |
| 5 | Email provider | Resend |
| 6 | Local dev database | **PostgreSQL** (Docker or Neon) |

---

## 7. Related documents

- [User stories](./USER-STORIES.md)
- [Data model](./DATA-MODEL.md)
- [API contract](./API-CONTRACT.md)
- [UI screens](./UI-SCREENS.md)
- [Out of scope](./OUT-OF-SCOPE.md)
- [Phase 2 overview](../phase-2/PHASE-2-OVERVIEW.md)
- [Phase 3 overview](../phase-3/PHASE-3-OVERVIEW.md)
