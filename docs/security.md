# Moha Gaming Lab — Security Documentation

> **Version:** Phase 11 · Production Security Hardening  
> **Last Updated:** 2026-09-08

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication](#authentication)
3. [Role-Based Access Control (RBAC)](#role-based-access-control)
4. [Route Protection](#route-protection)
5. [Database Security (RLS)](#database-security)
6. [Security Headers & CSP](#security-headers)
7. [Rate Limiting](#rate-limiting)
8. [Input Validation](#input-validation)
9. [Open Redirect Prevention](#open-redirect-prevention)
10. [Audit Logging](#audit-logging)
11. [Supabase Dashboard Checklist](#supabase-dashboard-checklist)
12. [Environment Variables](#environment-variables)

---

## Architecture Overview

```
Browser Request
      │
      ▼
┌─────────────────────┐
│  middleware.ts      │  ← Security headers, session cookie check, open-redirect block
│  (Edge Runtime)     │
└────────┬────────────┘
         │ /admin/* routes only
         ▼
┌─────────────────────┐
│  Next.js Page /     │  ← Server Component
│  Route Handler      │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  guards.ts          │  ← requireSession() / requireAdmin() / requirePermission()
│  (Server-side)      │     Second authentication layer
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Server Action      │  ← Business logic with full auth context
│  or API Route       │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Database / Supabase│  ← RLS policies enforced at the DB level
└─────────────────────┘
```

**Defense-in-depth**: Authentication is enforced at three independent layers — middleware, server guards, and Row Level Security. Bypassing any one layer alone cannot grant access.

---

## Authentication

### Session Mechanism

- **Type:** HTTP-only signed cookie (`moha_admin_session`)
- **Signing:** HMAC-SHA256 with `ADMIN_SECRET` environment variable
- **Format:** `base64url(JSON).HMAC_signature`
- **TTL:** 8 hours (configurable in `lib/auth/session.ts`)
- **Flags:** `HttpOnly`, `Secure` (production), `SameSite=Lax`

### Admin Login Flow

1. User submits email + password via `loginAction()`
2. Credentials checked against Prisma `AdminUser` table (bcrypt)
3. On success → signed session cookie set → redirect to `/admin`
4. On failure → audit logged, generic error returned (no email enumeration)

### Supabase OAuth Flow (Google)

1. User clicks "Sign in with Google"
2. Supabase issues OAuth code → redirect to `/auth/callback`
3. Code exchanged for session → user's email checked against `DESIGNATED_ADMIN_EMAILS`
4. If admin email → `AdminSession` cookie created → redirect to `/admin`
5. If regular user → `UserSession` cookie created → redirect to `/` (no CMS access)

### SuperAdmin

- **Only one email** is hardcoded as SuperAdmin: `4mohabashir@gmail.com`
- SuperAdmin **cannot be demoted** via the Users & Roles panel
- SuperAdmin role is enforced in `/auth/callback/route.ts` and `users/actions.ts`

---

## Role-Based Access Control

### Roles

| Role   | Description                          |
|--------|--------------------------------------|
| ADMIN  | Full CMS access, user management     |
| EDITOR | Content creation, publishing, verify |
| AUTHOR | Create & update own content only     |

### Permission Matrix

| Action          | ADMIN | EDITOR | AUTHOR |
|-----------------|:-----:|:------:|:------:|
| create          | ✅    | ✅     | ✅     |
| read            | ✅    | ✅     | ✅     |
| update          | ✅    | ✅     | ❌     |
| updateOwn       | ✅    | ✅     | ✅     |
| delete          | ✅    | ❌     | ❌     |
| publish         | ✅    | ✅     | ❌     |
| archive         | ✅    | ✅     | ❌     |
| verify          | ✅    | ✅     | ❌     |
| submitReview    | ✅    | ✅     | ✅     |
| manageSettings  | ✅    | ❌     | ❌     |
| manageUsers     | ✅    | ❌     | ❌     |

### Server Guard Usage

```typescript
// Require any authenticated admin session
const session = await requireSession();

// Require ADMIN role specifically
const session = await requireAdmin();

// Require specific permission
const session = await requirePermission("publish");
```

All guards throw `AuthorizationError` on failure — **never** expose stack traces to clients.

---

## Route Protection

### Middleware (`middleware.ts`)

The Next.js Edge Middleware runs on every request **before** any page code executes:

- Checks for the `moha_admin_session` cookie on all `/admin/*` routes
- Redirects unauthenticated requests to `/admin/login?next=<safe-path>`
- Blocks all open redirect attacks on the `next` parameter
- Applies security headers (CSP, HSTS, X-Frame-Options, etc.) to every response
- If already authenticated and visiting `/admin/login`, redirects to `/admin`

### Protected Routes

All routes matching `/admin/*` except:
- `/admin/login` — public
- `/admin/logout` — clears session (self-protecting)

### Per-Page Guards (Second Layer)

Every admin Server Component and Server Action calls a guard function, providing defense-in-depth even if middleware is bypassed (e.g., direct function invocation in tests).

---

## Database Security

### Row Level Security (RLS)

> **Note:** RLS policies must be applied directly in the Supabase Dashboard SQL editor. See [Supabase Dashboard Checklist](#supabase-dashboard-checklist).

#### Recommended Policies

```sql
-- Enable RLS on all tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Public: read published content
CREATE POLICY "public_read_published" ON games
  FOR SELECT TO anon, authenticated
  USING (status = 'PUBLISHED');

-- Authenticated admins: full access (service role bypasses RLS)
CREATE POLICY "admin_full_access" ON games
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' IN ('ADMIN', 'EDITOR', 'AUTHOR'));

-- Authors: only own content
CREATE POLICY "author_own_content" ON guides
  FOR SELECT, INSERT, UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());
```

---

## Security Headers

Applied by both `middleware.ts` and `next.config.ts`:

| Header                      | Value                                    | Purpose                          |
|-----------------------------|------------------------------------------|----------------------------------|
| Content-Security-Policy     | (see below)                              | XSS prevention                   |
| X-Content-Type-Options      | nosniff                                  | MIME sniffing prevention          |
| X-Frame-Options             | DENY                                     | Clickjacking prevention           |
| X-XSS-Protection            | 1; mode=block                            | Legacy XSS filter                 |
| Referrer-Policy             | strict-origin-when-cross-origin          | Referrer leakage prevention       |
| Permissions-Policy          | camera=(), microphone=(), geolocation=() | Feature restriction               |
| Strict-Transport-Security   | max-age=63072000; includeSubDomains      | HTTPS enforcement (production)    |

### CSP Policy

```
default-src 'self';
script-src 'self' (+ 'unsafe-eval' 'unsafe-inline' in dev);
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com;
connect-src 'self' https://*.supabase.co wss://*.supabase.co;
frame-ancestors 'none';
form-action 'self';
base-uri 'self';
object-src 'none';
```

---

## Rate Limiting

Rate limiting is implemented in `lib/security/rate-limit.ts` using an in-memory sliding window.

| Endpoint              | Limit | Window   | Identifier   |
|-----------------------|-------|----------|--------------|
| Login attempts        | 5     | 1 min    | email + IP   |
| Password reset        | 3     | 15 min   | email        |
| Admin actions         | 100   | 1 min    | userId       |
| Public search API     | 30    | 1 min    | IP           |

> **Production Note:** Replace the in-memory store with Redis/Upstash for multi-instance deployments. The public API in `rate-limit.ts` is designed to be store-agnostic.

---

## Input Validation

All Server Actions use **Zod schemas** for input validation before any business logic runs:

```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
const parsed = schema.safeParse(input);
if (!parsed.success) return { error: parsed.error.issues[0].message };
```

Key rules:
- Never trust client-supplied role or userId — always read from the server session
- Mass assignment is prevented by explicit field selection in all Prisma queries
- File upload types and sizes are validated server-side before processing

---

## Open Redirect Prevention

All redirect targets are validated through `lib/security/redirect.ts`:

```typescript
import { sanitizeLoginNext } from "@/lib/security/redirect";
const safeNext = sanitizeLoginNext(request.nextUrl.searchParams.get("next"));
```

Blocked patterns:
- `http://` / `https://` absolute URLs
- Protocol-relative URLs (`//evil.com`)
- `javascript:` and `data:` URIs
- Paths with null bytes or control characters
- Paths not starting with an allowed prefix (`/admin`, `/`)

---

## Audit Logging

All security-sensitive events are recorded in the `AuditLog` table via `lib/admin/audit.ts`:

| Event             | Logged When                                     |
|-------------------|-------------------------------------------------|
| LOGIN             | Successful admin login (email or OAuth)         |
| LOGOUT            | Session destruction                             |
| CREATE            | Content item created                            |
| UPDATE            | Content item updated                            |
| DELETE            | Content item deleted                            |
| PUBLISH           | Content published                               |
| ROLE_CHANGE       | User role updated in Users & Roles panel        |

Each log entry contains: `userId`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`.

---

## Supabase Dashboard Checklist

> Complete these steps in your Supabase project dashboard.

### Authentication Settings

- [ ] **Email confirmations:** Enabled (Site URL = your production domain)
- [ ] **Email OTP:** Enabled for password recovery
- [ ] **Google OAuth provider:** Enabled with correct Redirect URI
  - Redirect URI: `https://yourdomain.com/auth/callback`
- [ ] **Session timeout:** Set to 28800 seconds (8 hours)
- [ ] **JWT secret:** Rotated from default

### Database

- [ ] RLS enabled on `games`, `apps`, `tools`, `guides`, `categories`, `tags`, `app_releases`
- [ ] RLS policies created per the [Database Security](#database-security) section
- [ ] `anon` role cannot write to any table
- [ ] `service_role` key **never** exposed to client-side code

### API Settings

- [ ] **Row Level Security:** Confirm "Enforce RLS on API" is checked in Table Editor
- [ ] **Realtime:** Disable for tables that don't need it to reduce attack surface

### Secrets (Environment Variables)

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is only in server environment (never `NEXT_PUBLIC_`)
- [ ] `ADMIN_SECRET` is a random 32+ character string (not a dictionary word)
- [ ] `ADMIN_EMAIL` is set to `4mohabashir@gmail.com`

---

## Environment Variables

| Variable                      | Required | Exposure   | Description                          |
|-------------------------------|:--------:|:----------:|--------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`    | ✅       | Public     | Supabase project URL                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅     | Public     | Supabase anonymous key               |
| `SUPABASE_SERVICE_ROLE_KEY`   | ✅       | **Server** | Service role key — never expose!     |
| `ADMIN_EMAIL`                 | ✅       | Server     | Primary SuperAdmin email             |
| `ADMIN_SECRET`                | ✅       | Server     | Session signing key (32+ chars)      |
| `DATABASE_URL`                | Optional | **Server** | Prisma connection string             |
| `DIRECT_URL`                  | Optional | **Server** | Prisma direct connection for migrations |

> [!CAUTION]
> **Never** prefix `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SECRET`, or `DATABASE_URL` with `NEXT_PUBLIC_`. These would be embedded in the browser bundle and exposed to all users.
