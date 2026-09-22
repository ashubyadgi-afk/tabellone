# Run Tabellone locally from GitHub (Windows)

No manual `.env` editing — defaults work with Docker Postgres.

## Prerequisites (install once)

| Tool | Download |
|------|----------|
| **Git** | [git-scm.com](https://git-scm.com) |
| **Node.js 20+** | [nodejs.org](https://nodejs.org) |
| **Docker Desktop** | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |

After Docker install: restart PC, open Docker Desktop until **Running**.

---

## Option A — One script (easiest)

```powershell
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
powershell -ExecutionPolicy Bypass -File scripts\setup-local.ps1
npm.cmd run dev
```

Open **http://localhost:3000**  
Login: `owner@demo.tabellone.com` / `demo1234`

---

## Option B — Manual steps (same result)

```powershell
# 1. Clone from GitHub (replace with your repo URL)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# 2. Environment file (defaults — no editing needed)
copy .env.example .env

# 3. Install packages
npm.cmd install

# 4. Start database
docker compose up -d

# 5. Create tables + demo data
npm.cmd run db:push
npm.cmd run db:seed

# 6. Run app
npm.cmd run dev
```

---

## Daily use (after first setup)

```powershell
cd YOUR_REPO
docker compose up -d
npm.cmd run dev
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `docker` not recognized | Start Docker Desktop, restart PC |
| `npm` blocked in PowerShell | Use `npm.cmd` instead of `npm` |
| Database connection error | `docker compose up -d` then wait 10 sec |
| Port 3000 in use | Stop other apps or use `npm run dev -- -p 3001` |

---

## What you do NOT need for local run

- Vercel / Neon (only for cloud hosting)
- Change `prisma/schema.prisma`
- Edit `DATABASE_URL` (`.env.example` matches `docker-compose.yml`)
