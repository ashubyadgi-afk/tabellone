# Deploy Tabellone to Vercel (Hobby) from GitHub

Free stack: **GitHub** (code) + **Vercel Hobby** (app) + **Neon** (PostgreSQL).

Vercel cannot use `localhost:5432` — you need a cloud database (Neon free tier).

---

## Part 1 — Neon database (5 min)

1. Go to [https://neon.tech](https://neon.tech) → Sign up (GitHub login works).
2. **New Project** → name e.g. `tabellone` → region close to you → Create.
3. On the dashboard, copy the connection string:
   - Use **Pooled connection** (recommended for serverless/Vercel).
   - It looks like:
     ```
     postgresql://user:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require
     ```
4. Keep this secret — you’ll paste it into Vercel and local `.env` once.

### Create tables (from your PC)

Temporarily set Neon URL in `.env`:

```powershell
cd c:\Tabellone_Project
```

Edit `.env`:

```
DATABASE_URL="your-neon-pooled-connection-string"
SESSION_SECRET="pick-a-long-random-string-for-production"
```

Then:

```powershell
npm.cmd run db:push
npm.cmd run db:seed
```

Optional: seed adds demo user `owner@demo.tabellone.com` / `demo1234`.

---

## Part 2 — Vercel Hobby (10 min)

1. Go to [https://vercel.com](https://vercel.com) → **Sign up** → **Continue with GitHub**.
2. Authorize Vercel to access your GitHub account.
3. Click **Add New…** → **Project**.
4. **Import** your Tabellone repository from the list.
5. **Configure Project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output: default

6. **Environment Variables** — add before first deploy:

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | Your Neon **pooled** connection string |
   | `SESSION_SECRET` | Long random string (32+ chars), not the dev default |
   | `BLOB_READ_WRITE_TOKEN` | From Vercel → Project → Storage → Blob (see below) |

   Apply to: **Production**, **Preview**, and **Development**.

7. Click **Deploy**.
8. Wait 2–3 minutes. Status should be **Ready**.

Your URL: `https://your-project-name.vercel.app`

### Owner photo uploads (Vercel Blob)

Vercel cannot save files into `public/` the way localhost does. Create a Blob store so cover photos work in production:

1. Vercel → your project → **Storage** → **Create Database** → **Blob**.
2. Connect it to this project (Production + Preview).
3. Confirm `BLOB_READ_WRITE_TOKEN` appears under **Settings → Environment Variables**.
4. **Redeploy** after the token is added, or uploads will keep failing.

Local Docker does not need this token; uploads still go to `public/uploads/ad-spaces/`.

---

## Part 3 — Verify

1. Open your Vercel URL.
2. **Register** a new owner at `/register/owner`, or use demo login if you ran seed:
   - Email: `owner@demo.tabellone.com`
   - Password: `demo1234`
3. Open **IMD** → Ad Spaces, Bookings, etc.

If login fails, check Vercel **Deployments** → **Functions** logs for errors.

---

## Auto deploy from GitHub

After the first deploy, every **push to `main`** triggers a new Vercel build automatically.

```powershell
git add .
git commit -m "Update feature"
git push
```

---

## Local vs production `.env`

| Environment | `DATABASE_URL` |
|-------------|----------------|
| Local + Docker | `postgresql://tabellone:tabellone@localhost:5432/tabellone` |
| Vercel + Neon | Neon pooled URL |

You can keep both: local `.env` for Docker, Vercel dashboard for production.

---

## Hobby plan notes

- Free for personal / non-commercial hobby use (read [Vercel Hobby terms](https://vercel.com/docs/plans/hobby)).
- Bandwidth and build minutes have limits — fine for demos and early pilots.
- Neon free tier may **sleep** when idle — first request after sleep can be slow.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails on Prisma | Ensure `DATABASE_URL` is set in Vercel env vars |
| `Can't reach database` | Use Neon **pooled** URL; check `?sslmode=require` |
| Login works locally but not Vercel | `SESSION_SECRET` must be set on Vercel |
| Empty IMD | Run `db:push` + `db:seed` against Neon URL from your PC |
| 500 on owner pages | Vercel → Project → Logs → check Function errors |
| Ad Space photo upload fails on Vercel | Create a **Blob** store and set `BLOB_READ_WRITE_TOKEN`, then redeploy |

---

## What is NOT on Vercel

- Docker / local Postgres — only Neon (or another cloud Postgres) for production.
- GitHub Pages — not used; Vercel hosts the app.

---

## Quick checklist

- [ ] Neon project created
- [ ] `db:push` + optional `db:seed` against Neon URL
- [ ] Vercel project imported from GitHub
- [ ] `DATABASE_URL` + `SESSION_SECRET` in Vercel env
- [ ] Vercel Blob store connected (`BLOB_READ_WRITE_TOKEN`)
- [ ] Deploy succeeded
- [ ] Login and IMD tested on live URL
