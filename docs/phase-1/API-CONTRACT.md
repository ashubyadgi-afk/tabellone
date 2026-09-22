# Phase 1 — API Contract

Base URL: `/api/v1`  
Errors: RFC 7807-style JSON problem details  
Pagination: `?page=1&limit=20`

---

## Organizations (Add Company)

### POST `/organizations`

Create a new organization (company/tenant).

**Auth:** None (registration flow) — add auth in M2

**Request**
```json
{
  "name": "Mumbai Billboards Pvt Ltd",
  "brandName": "Mumbai Billboards",
  "email": "contact@mumbaibillboards.com",
  "sector": "Outdoor Advertising",
  "contactPerson": "Rajesh Kumar",
  "contactPhone": "+919876543210",
  "branchLocation": "Andheri, Mumbai",
  "type": "owner"
}
```

**Response 201**
```json
{
  "id": "uuid",
  "name": "Mumbai Billboards Pvt Ltd",
  "brandName": "Mumbai Billboards",
  "email": "contact@mumbaibillboards.com",
  "sector": "Outdoor Advertising",
  "contactPerson": "Rajesh Kumar",
  "contactPhone": "+919876543210",
  "branchLocation": "Andheri, Mumbai",
  "type": "owner",
  "status": "active",
  "createdAt": "2026-08-22T00:00:00.000Z"
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | VALIDATION_ERROR | Invalid/missing fields |
| 409 | DUPLICATE_EMAIL | Email already registered |

---

### GET `/organizations`

List organizations (Admin only — future).

---

### GET `/organizations/:id`

Get organization by ID.

---

## Auth (planned M2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register/owner` | Owner registration |
| POST | `/auth/register/advertiser` | Advertiser registration |
| POST | `/auth/login` | User login |
| POST | `/auth/admin/login` | Admin login |
| POST | `/auth/logout` | End session |
| GET | `/auth/session` | Current user + roles |

---

## IMD (planned M4–M7)

| Resource | Endpoints |
|----------|-----------|
| AdSpaces | `GET/POST /imd/ad-spaces`, `GET/PATCH /imd/ad-spaces/:id` |
| Clients | `GET/POST /imd/clients`, `GET/PATCH/DELETE /imd/clients/:id` |
| Bookings | `GET/POST /imd/bookings`, `POST /imd/bookings/check-conflicts` |
| Invoices | `POST /imd/invoices/from-booking/:bookingId`, `GET /imd/invoices/:id/pdf` |

---

## Common error shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [{ "field": "email", "message": "Invalid format" }]
  }
}
```
