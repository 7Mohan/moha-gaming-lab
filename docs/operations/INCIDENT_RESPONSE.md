# Moha Gaming Lab — Production Incident Response Plan

## 1. Severity Classification Matrix

| Severity | Definition | Target Response Time | Target Resolution Time | Example Scenarios |
|---|---|---|---|---|
| **SEV-1 (Critical)** | Complete platform outage, active data breach, or compromised/malicious APK package in distribution. | < 15 minutes | < 2 hours | 5xx on homepage, malicious binary reported, leaked database credentials. |
| **SEV-2 (Major)** | Core workflow impaired for all users (e.g. all downloads failing, authentication completely down, admin lockout). | < 30 minutes | < 4 hours | Supabase Storage bucket 403, database connection pool exhaustion. |
| **SEV-3 (Moderate)** | Non-critical feature failure, partial degradation, or intermittent tool crashes. | < 2 hours | < 24 hours | Refresh rate tool fails on specific browser, ad container rendering error. |
| **SEV-4 (Minor)** | Cosmetic bug, minor styling defect, documentation typo. | Next business day | Next sprint | Tool icon alignment, minor copy error in guide. |

---

## 2. Incident Response Workflow

```text
[Detection & Alert]
        ↓
    [Triage] ── (Confirm Severity Level & Assign Lead)
        ↓
  [Containment] ── (Activate Killswitches / Maintenance Mode if needed)
        ↓
   [Mitigation] ── (Rollback Deployment, Purge CDN, Revert Migration)
        ↓
    [Recovery] ── (Verify System Health Probes)
        ↓
  [Post-Mortem] ── (Blameless Root Cause Analysis)
```

---

## 3. Emergency Containment Playbook

### Scenario A: Malicious or Compromised APK Package Reported
1. **Immediate Action:** Set `DOWNLOADS_ENABLED="false"` in environment secrets OR unpublish the specific release in `/admin/apps`.
2. **Containment:**
   ```bash
   # Invalidate CDN cache for download routes if cached at edge
   # Purge URL: https://mohagaminglab.com/api/download/*
   ```
3. **Investigation:** Compare the stored binary's SHA-256 hash against the developer's signed original build hash.
4. **Resolution:** Replace the artifact in Supabase Storage with the verified authentic package and recalculate checksum.
5. **Re-enable:** Revert `DOWNLOADS_ENABLED="true"` and test download flow.

### Scenario B: Database Outage or Data Corruption
1. **Immediate Action:** Enable Maintenance Mode:
   ```bash
   MAINTENANCE_MODE="true"
   ```
   Visitors receive a branded 503 Maintenance page, preventing partial writes and confusing errors.
2. **Investigation:** Check Supabase Dashboard → Database → Logs for deadlock, disk full, or connection saturation.
3. **Remediation:** If corrupted by a bad migration or data mutation, initiate Point-in-Time Recovery (PITR) to a known good snapshot.
4. **Resolution:** Verify `/api/health/ready` returns `200 { status: "ready" }`.
5. **Deactivate:** Set `MAINTENANCE_MODE="false"`.

### Scenario C: Compromised Secret or Credential Leak
If a production token (e.g. `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SECRET`, or `DATABASE_URL`) was exposed:
1. **Supabase Service Role Key:** Go to Supabase Project Settings → API → Click "Roll Service Key". Update environment variable immediately in hosting provider.
2. **Admin Secret:** Generate a new 64-char random string:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Update `ADMIN_SECRET` in environment variables. Existing admin sessions are automatically invalidated for security.
3. **Database Password:** Change Postgres password in Supabase → Database Settings. Update `DATABASE_URL` and `DIRECT_URL`.
4. **Brevo API Key:** Rotate API key in Brevo Settings → SMTP & API.

---

## 4. Post-Mortem & Root Cause Analysis (RCA) Template

Every SEV-1 and SEV-2 incident requires a completed blameless post-mortem document within 48 hours of resolution:

```markdown
# Post-Mortem Report: [Incident Title]
**Date:** YYYY-MM-DD  
**Severity:** SEV-1 / SEV-2  
**Incident Commander:** [Name]  
**Downtime Duration:** [X hours Y minutes]  

### 1. Executive Summary
Brief non-technical summary of what happened, customer impact, and how it was resolved.

### 2. Timeline (UTC)
- **HH:MM** - Incident detected via [Alert / User report]
- **HH:MM** - Incident Commander paged, Severity classified as SEV-X
- **HH:MM** - Containment action applied (e.g. Maintenance Mode enabled)
- **HH:MM** - Root cause identified
- **HH:MM** - Fix deployed / Rollback executed
- **HH:MM** - Verification complete, all systems operational

### 3. Root Cause Analysis (5 Whys)
- Why did the issue occur?
- Why was it not caught in staging / CI?
- Why did the alerts trigger when they did?

### 4. Preventive Action Items
| Action Item | Owner | Target Date | Status |
|---|---|---|---|
| Add regression test for X | Engineer A | YYYY-MM-DD | Open |
| Adjust connection pool limit | DevOps | YYYY-MM-DD | Open |
```
