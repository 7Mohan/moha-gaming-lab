# Moha Gaming Lab

A full-stack gaming platform for mobile gamers — game guides, app downloads, developer tools, and optimization resources, built with Next.js 15 and TypeScript.

## Overview

Moha Gaming Lab is a content and download platform serving mobile gaming communities. It provides curated game guides, reviewed Android apps, performance tools, and a managed APK download center — all backed by a production-grade CMS and admin panel.

## Features

- **Game Library** — Detailed pages for mobile games with guides, tips, and compatibility info
- **App Download Center** — Managed APK releases with version history, checksums, and install guides
- **Developer Tools** — Performance and optimization tools for Android gaming
- **Guides System** — Full article system with categories, tags, and SEO metadata
- **Admin CMS** — Authenticated content management panel for games, apps, tools, and releases
- **Search** — Full-text search across games, apps, tools, and guides
- **3D UI** — Hardware-accelerated Three.js scenes with WebGL detection and graceful fallback
- **Authentication** — Supabase-based auth with email/password and role-based access control
- **SEO** — Static sitemap, structured metadata, `robots.txt`, Open Graph tags

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3, Vanilla CSS design tokens |
| 3D | Three.js 0.170, React Three Fiber, React Three Drei |
| Animation | GSAP 3 |
| Database ORM | Prisma 7 |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth + RBAC |
| Storage | Supabase Storage |
| Email | Brevo (Sendinblue) |
| Deployment | Vercel |
| CI/CD | GitHub Actions |
| Container | Docker (multi-stage, Node 20 Alpine) |

## Architecture

```
Browser
  ↓
Next.js App Router (SSR / SSG / ISR)
  ↓
API Routes  ←→  Middleware (Auth, Maintenance, CSP)
  ↓
Service Layer (Download, Storage, Email)
  ↓
Prisma ORM
  ↓
PostgreSQL (Supabase)
```

## Project Structure

```
app/                    Next.js App Router pages and API routes
  admin/                Admin CMS dashboard
  api/                  REST API routes (auth, downloads, health)
components/
  ui/                   Primitive components (Button, Badge, Card)
  layout/               Header, Navigation, Footer
  cards/                Content cards (Game, App, Tool, Guide)
  three/                3D scene components
features/               Feature-specific logic (download, search)
hooks/                  useWebGL, useReducedMotion, useScrollY
lib/                    Utilities, Prisma client, Supabase clients
  config/               Killswitches, environment config
  repositories/         Data access layer
  storage/              File storage abstraction
types/                  TypeScript interfaces
data/                   Static/seed data
prisma/                 Database schema and seed script
supabase/               SQL migrations
tests/                  Node.js test suites (241 tests)
docs/operations/        Runbooks, incident response, deployment guide
```

## Installation

**Requirements:** Node.js 20+, npm 10+

```bash
# Clone the repository
git clone https://github.com/7Mohan/moha-gaming-lab.git
cd moha-gaming-lab

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Copy `.env.example` and fill in your values. **Never commit real values.**

```env
# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database (Supabase Postgres connection pooler)
DATABASE_URL=
DIRECT_URL=

# Admin
ADMIN_SECRET=
ADMIN_EMAIL=

# Email (Brevo)
BREVO_API_KEY=
BREVO_FROM_EMAIL=
BREVO_FROM_NAME=

# Feature flags
NEXT_PUBLIC_DOWNLOADS_ENABLED=true
NEXT_PUBLIC_ADS_ENABLED=false
NEXT_PUBLIC_ANALYTICS_ENABLED=false
```

See [`.env.example`](.env.example) for the full variable list.

## Development

```bash
npm run dev          # Start dev server with Turbopack
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type check
npm run test:all     # Run all test suites
```

## Testing

```bash
# All test suites (241 tests)
npm run test:all

# Individual suites
npm run test:backend    # Validation + services
npm run test:security   # RBAC + security
npm run test:download   # Download infrastructure
```

## Build

```bash
npm run build    # Generate Prisma client + Next.js production build
npm run start    # Start production server
```

## Deployment

The project is configured for deployment on **Vercel**. See [`docs/operations/DEPLOYMENT_GUIDE.md`](docs/operations/DEPLOYMENT_GUIDE.md) for the full Vercel, Docker, and Cloudflare setup guide.

Required environment variables must be set in your hosting platform before deployment.

## Operational Runbooks

| Document | Purpose |
|----------|---------|
| [`RUNBOOK.md`](docs/operations/RUNBOOK.md) | Deploy, rollback, migrations, monitoring |
| [`INCIDENT_RESPONSE.md`](docs/operations/INCIDENT_RESPONSE.md) | Severity classification and response procedures |
| [`DISASTER_RECOVERY.md`](docs/operations/DISASTER_RECOVERY.md) | RPO/RTO targets and backup restoration |
| [`DEPLOYMENT_GUIDE.md`](docs/operations/DEPLOYMENT_GUIDE.md) | End-to-end production setup |

## Health Checks

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Liveness probe |
| `GET /api/health/ready` | Readiness probe (database connectivity) |

## Project Status

**Active Development** — Core platform is production-ready. Database integration, monetization, and additional game content are in progress.

## License

This project is currently **All Rights Reserved**. Contact the repository owner for licensing inquiries.
