# Phase 1 — User Stories & Acceptance Criteria

---

## Organizations (Add Company)

### US-010: Register organization (Add Company)

**As a** platform user (owner or advertiser onboarding)  
**I want** to register my organization (company) on Tabellone  
**So that** my business is the tenant scope for inventory and account data

**Priority:** P0  
**Module:** Organization  
**Status:** In progress

#### Acceptance criteria

- [x] Form captures: organization name, brand name (optional), official email, sector/category, contact person, contact phone, main branch location, organization type (owner/advertiser)
- [x] Required fields validated on client and server
- [x] Duplicate official email returns clear error (409)
- [x] Success shows confirmation with organization ID
- [x] API: `POST /api/v1/organizations`

#### UI notes

- Screen: S03 — `/organizations/new` (Add Company)
- Link from public registration flows (future)

#### Edge cases

- Empty strings trimmed; email normalized to lowercase
- Organization name minimum 2 characters

---

## Auth & users

### US-001: User login

**As a** company user  
**I want** to log in with email and password  
**So that** I can access my organization's data

**Priority:** P0  
**Module:** Auth  
**Status:** TODO

#### Acceptance criteria

- [ ] Public login shows only Owner and Advertiser options (no Admin)
- [ ] Admin login at separate `/admin/login`
- [ ] Valid credentials → role-appropriate dashboard
- [ ] Invalid credentials → generic error
- [ ] Logout clears session

---

## Owner onboarding

### US-020: Owner registration & verification

**As an** AdSpace Owner  
**I want** to complete onboarding with verification documents  
**So that** Admin can approve me for IMD access

**Priority:** P0  
**Module:** Identity  
**Status:** TODO

#### Acceptance criteria

- [ ] Fields: DOB, org name, email, contact, legal cert, GST, live photo, license, agency, office address, total ad spaces, T&C, password
- [ ] Verification statuses: draft, submitted, under_review, approved, rejected
- [ ] Admin can approve/reject with audit log

---

## IMD — AdSpaces

### US-030: Manage AdSpace inventory

**As an** approved Owner  
**I want** to create and manage AdSpaces in IMD  
**So that** I can track my advertising inventory

**Priority:** P0  
**Module:** IMD  
**Status:** TODO

#### Acceptance criteria

- [ ] CRUD AdSpaces with imd_status (draft, active, inactive, under_maintenance, temporarily_unavailable, archived)
- [ ] `marketplace_listing_status` defaults to `not_listed`
- [ ] Fields: number, name, type, location, dimensions, base price, photos, notes

---

## IMD — Clients & Bookings

### US-040: Client and booking management

**As an** Owner  
**I want** to create clients and bookings on AdSpaces  
**So that** I can track who booked which space and when

**Priority:** P0  
**Module:** IMD  
**Status:** TODO

#### Acceptance criteria

- [ ] One AdSpace supports multiple bookings on non-overlapping date ranges
- [ ] Overlapping booking rejected with clear error
- [ ] Booking links client + AdSpace + start/end dates + amount

---

## IMD — Invoices

### US-050: Generate invoice from booking

**As an** Owner  
**I want** to generate an invoice from a booking  
**So that** I can bill clients and download/print PDFs

**Priority:** P0  
**Module:** IMD  
**Status:** TODO

#### Acceptance criteria

- [ ] Invoice pulls client, AdSpace, booking period, amount
- [ ] Invoice number format: `INV-{ORG}-{YYYY}-{SEQ}`
- [ ] View, download PDF, print

---

## Advertiser

### US-060: Advertiser registration

**As an** Advertiser  
**I want** to register my organization  
**So that** I can use Tabellone when marketplace launches

**Priority:** P1  
**Module:** Identity  
**Status:** TODO

#### Acceptance criteria

- [ ] Fields: org name, brand, email, sector, contact person, contact info, branch location, password, T&C, privacy policy
