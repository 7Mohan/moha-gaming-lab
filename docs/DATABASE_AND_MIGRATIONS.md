# Database Architecture, Migrations & Operations Guide

**Moha Gaming Lab** uses PostgreSQL with Prisma ORM as its database and data-access foundation.

---

## 1. Architectural Principles

1. **Normalized Schema**: Eliminates redundant string columns across entities; models relations between Games, Tools, Apps, Guides, Categories, and Tags cleanly.
2. **Explicit Verification States**:
   - `VERIFIED`: Passed manual technical inspection, checksum verified, authentic source URL.
   - `UNVERIFIED`: Community-submitted or mirrors not yet verified by the team.
   - `PENDING`: Awaiting verification review.
   - `UNAVAILABLE`: Delisted or broken download.
   *No dishonest marketing badges like "100% Virus Free" are permitted.*
3. **Controlled Content Publishing**:
   - `DRAFT`: In-progress authoring.
   - `REVIEW`: Editorial review.
   - `PUBLISHED`: Publicly accessible on website and search.
   - `ARCHIVED`: Deprecated or delisted.
   *Draft content is never exposed through public REST APIs or search results.*
4. **Decoupled Data Access**:
   - UI pages consume Application Services (`gameService`, `appService`, etc.).
   - Services consume Repositories (`gameRepository`, `appRepository`, etc.).
   - Repositories abstract Prisma from application logic and provide offline fallback during CI/static builds.

---

## 2. Environment Setup

Create `.env` (or set environment variables in your deployment target):

```bash
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/moha_gaming_lab?schema=public"

# Optional admin secret for internal operations
ADMIN_SECRET="your-secure-random-admin-secret"

# Public site URL
NEXT_PUBLIC_SITE_URL="https://mohagaminglab.com"
```

---

## 3. Database Migration Workflow

The migration lifecycle follows a strict pipeline:

```text
Development
  ↓ (prisma migrate dev --name <migration_name>)
Git / Pull Request
  ↓ (automated build & linting)
Staging / Production
  ↓ (prisma migrate deploy)
```

### A. Creating a New Migration in Development
When modifying `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name add_feature_field
```

This generates a timestamped SQL migration file in `prisma/migrations/` and updates the local development database.

### B. Applying Migrations in Staging & Production
In CI/CD or production containers (never run `migrate dev` in production):

```bash
npx prisma migrate deploy
```

### C. Resetting Development Database
To wipe and re-run all migrations from scratch in local development:

```bash
npx prisma migrate reset
```

---

## 4. Seeding Development Data

A comprehensive seed script (`prisma/seed.ts`) populates the normalized database from the platform's initial content corpus (6 games, 8 apps, 13 tools, 6 guides, categories, and tags).

```bash
npx prisma db seed
```

Or via npm:

```bash
npm run db:seed
```

All seed data is grounded in authentic gaming benchmarks and documentation — no fake download counts, fake ratings, or fake benchmark charts.

---

## 5. Prisma Studio (Visual Data Browser)

To inspect and manage records visually in the browser during development:

```bash
npx prisma studio
```

Opens a web interface at `http://localhost:5555`.
