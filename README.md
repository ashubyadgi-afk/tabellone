# Tabellone

Advertising-space ecosystem — **Phase 1: Platform Foundation + IMD**

## Quick start (from GitHub)

```powershell
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
powershell -ExecutionPolicy Bypass -File scripts\setup-local.ps1
npm.cmd run dev
```

Or manual steps — see `docs/LOCAL-SETUP.md`

Open [http://localhost:3000](http://localhost:3000)

**Demo login:** `owner@demo.tabellone.com` / `demo1234`

## Database

| Item | Value |
|------|--------|
| Engine | **PostgreSQL 16** |
| Local URL | `postgresql://tabellone:tabellone@localhost:5432/tabellone` |
| Start DB | `docker compose up -d` |
| Sync schema | `npm run db:push` |
| Seed demo | `npm run db:seed` |
| GUI | `npm run db:studio` |

Production: use Neon, Railway, or AWS RDS with the same `DATABASE_URL` format.

## Key routes

| Route | Purpose |
|-------|---------|
| `/` | Landing |
| `/login` | Owner sign in |
| `/register/owner` | Register |
| `/owner/imd` | IMD dashboard |
| `/owner/imd/ad-spaces` | Inventory |
| `/owner/imd/bookings` | Bookings |
| `/owner/imd/invoices` | Invoices |

## Documentation

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Cursor agent guide |
| `docs/phase-1/` | Phase 1 specifications |
| `reference/` | Original Word documents |

## Current implementation status

- [x] PostgreSQL + Prisma
- [x] Owner auth + full IMD module
- [ ] Admin console
- [ ] Full owner onboarding wizard
