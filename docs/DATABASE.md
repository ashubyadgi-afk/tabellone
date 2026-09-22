# Database — PostgreSQL

Tabellone uses **PostgreSQL 16** via Prisma.

## Local development (Docker)

```powershell
docker compose up -d
npm.cmd run db:push
npm.cmd run db:seed
```

Connection string (in `.env`):

```
DATABASE_URL="postgresql://tabellone:tabellone@localhost:5432/tabellone"
```

## Without Docker — Neon (free cloud Postgres)

1. Create a project at [https://neon.tech](https://neon.tech)
2. Copy the connection string into `.env`:

```
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/tabellone?sslmode=require"
```

3. Run:

```powershell
npm.cmd run db:push
npm.cmd run db:seed
```

## Migrated from SQLite

The project previously used SQLite (`prisma/dev.db`). That file is no longer used.

- `prisma/schema.prisma` → `provider = "postgresql"`
- Old SQLite data is **not** auto-migrated; run `npm run db:seed` for demo data or re-register.

## Production

Use managed PostgreSQL (Neon, Railway, AWS RDS, Azure). Set `DATABASE_URL` in your hosting environment.
