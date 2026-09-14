# Moha Gaming Lab — Production Operations Runbook

This document defines standard operating procedures (SOPs) for maintaining, deploying, and troubleshooting the Moha Gaming Lab platform in production.

---

## 1. Production Deployment

### Automated GitHub Actions Deployment (Standard)
1. Ensure all features have been tested on a development branch.
2. Submit and merge a Pull Request into `main`.
3. The `.github/workflows/ci.yml` pipeline automatically triggers:
   - Linting (`npm run lint`)
   - Typechecking (`npx tsc --noEmit`)
   - Test suites execution (`node --test tests/*.test.mjs`)
   - Production bundle build (`npm run build`)
4. Upon successful CI completion, `.github/workflows/deploy.yml` applies pending database migrations (`npx prisma migrate deploy`) and releases to production.

### Manual Vercel Deployment (CLI)
```bash
# Verify typecheck and tests pass locally first
npx tsc --noEmit
node --test tests/*.test.mjs

# Deploy to production via Vercel CLI
vercel --prod
```

### Self-Hosted / Docker Deployment
```bash
# Build and launch standalone container stack
docker compose -f docker-compose.yml up --build -d

# Verify container health status
docker ps --filter "name=moha-gaming-lab"
docker logs moha-gaming-lab --tail 50
```

---

## 2. Instant Rollback Procedures

### Vercel Instant Rollback (Zero Downtime)
1. Navigate to **Vercel Dashboard → Moha Gaming Lab → Deployments**.
2. Identify the last known healthy deployment prior to the incident.
3. Click the three dots `...` next to the deployment → select **Promote to Production**.
4. Traffic shifts instantly (within < 5 seconds) to the previous immutable build artifact.

### Docker Rollback
```bash
# Revert to previous tagged container image
docker stop moha-gaming-lab
docker run -d --name moha-gaming-lab-rollback --env-file .env.production -p 3000:3000 moha-gaming-lab:<PREVIOUS_TAG>
```

### Database Migration Rollback
If a Prisma migration caused a schema issue:
1. Identify the problematic migration in `prisma/migrations/`.
2. Generate a corrective migration rather than dropping columns:
   ```bash
   npx prisma migrate dev --name revert_feature_x
   ```
3. In emergency, restore table state using Supabase Point-in-Time Recovery (PITR).

---

## 3. Database Operations & Migrations

### Running Migrations in Production
* **Crucial Rule:** Always use `npx prisma migrate deploy` in production pipelines, never `prisma migrate dev` or `prisma db push`.
* Ensure `DIRECT_URL` (direct port 5432) is supplied when executing DDL migrations to avoid PgBouncer transaction pooler statement limitations.

```bash
# Apply pending migrations
DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy

# Check migration status
DATABASE_URL="$DIRECT_URL" npx prisma migrate status
```

### Connection Pool Monitoring
- Moha Gaming Lab uses Supabase Transaction Pooler (port 6543) via PgBouncer for Next.js serverless functions.
- Default pool size: 15–20 connections.
- If observing `FATAL: remaining connection slots are reserved for non-replication superuser connections`:
  1. Verify all routes use the singleton client from `@/lib/db/prisma.ts`.
  2. Increase pool size in Supabase Project Settings → Database → Connection Pooler.

---

## 4. Storage & Download Release Management

### Releasing a New APK / Binary
1. Log in to `/admin/login` as SuperAdmin.
2. Navigate to **Apps → [Target App] → New Release**.
3. Fill in Version (e.g. `1.4.2`), Version Code, Min Android API (e.g. `26` for Android 8.0).
4. Upload APK file to private bucket (`app-releases`).
5. Verify SHA-256 checksum and file size are automatically computed and recorded in database.
6. Set Release Status to **Published**.

### Emergency Download Takedown (Corrupted/Compromised APK)
If a security report or corrupted file is detected:
1. Navigate to **Admin Dashboard → Apps → [Target App] → Releases**.
2. Immediately switch Release Status from `Published` to **`Archived`** or **`Draft`**.
3. Public gateway `/api/download/release/[releaseId]` will instantly reject download attempts with `403 Forbidden`.
4. If a systemic issue occurs, set `DOWNLOADS_ENABLED="false"` in environment secrets to halt all download endpoints site-wide.

---

## 5. Monitoring, Health Checks & Observability

### Endpoints
- **Liveness Probe:** `GET https://mohagaminglab.com/api/health`
  - Returns `200 { status: "ok" }` with `Cache-Control: no-store`.
  - Target latency: < 50ms.
- **Readiness Probe:** `GET https://mohagaminglab.com/api/health/ready`
  - Verifies database connectivity and backing services.
  - Returns `200 { status: "ready", checks: { ... } }` or `503 { status: "unready" }`.

### Uptime Monitoring Configuration (e.g. UptimeRobot / BetterStack)
- Target URL: `https://mohagaminglab.com/api/health`
- Check Interval: Every 60 seconds.
- Expected HTTP Status: `200 OK`.
- Alert Threshold: 2 consecutive failures triggering SMS / Telegram / Slack alert.

---

## 6. Authentication & Session Troubleshooting

### Investigating Auth Failures
1. Check Supabase Auth dashboard: **Authentication → Users & Logs**.
2. Verify if client rate limits have been triggered (Supabase enforces limits on OTP/Password reset emails).
3. If an admin session cookie is invalid, instruct the user to clear cookies for `moha_admin_session` and re-authenticate at `/admin/login`.

---

## 7. SEO & Sitemap Verification

```bash
# Verify robots.txt returns 200 and points to sitemap
curl -I https://mohagaminglab.com/robots.txt

# Verify sitemap.xml returns 200 and valid XML structure
curl -s https://mohagaminglab.com/sitemap.xml | head -n 20
```

---

## 8. Ads & Monetization Emergency Controls

If ad network scripts cause unexpected layout shifts, security warnings, or slowdowns:
1. In hosting dashboard, toggle `NEXT_PUBLIC_ADS_ENABLED="false"`.
2. Redeploy or restart worker.
3. All ad containers and scripts will immediately cease rendering for public visitors.
