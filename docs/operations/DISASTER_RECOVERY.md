# Moha Gaming Lab — Disaster Recovery Plan (DRP)

## 1. Service Level Objectives (SLOs)

* **RPO (Recovery Point Objective): < 1 Hour**
  - Maximum tolerable data loss in a catastrophic disaster scenario.
  - Achieved via Supabase WAL (Write-Ahead Logging) continuous archiving and Point-in-Time Recovery (PITR).
* **RTO (Recovery Time Objective): < 4 Hours**
  - Maximum tolerable system outage duration to restore full operational capability.
  - Achieved via immutable deployment builds on Vercel/Docker, automated Prisma migrations, and rapid database snapshot restore.

---

## 2. Database Backup & Recovery Strategy

### Automated Backups
- **Continuous Archiving (PITR):** Supabase enterprise Postgres maintains 7-day or 30-day continuous write-ahead log retention, allowing restoration to any exact second.
- **Daily Full Snapshots:** Automated daily snapshots taken at 02:00 UTC.

### Manual Logical Backup (Pre-Deployment or Major Maintenance)
Before executing high-risk schema alterations, generate a standalone snapshot:
```bash
# Export schema + data to compressed dump
pg_dump "$DIRECT_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="moha_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### Database Restore Procedure
1. If data corruption or catastrophic failure occurs, access **Supabase Dashboard → Database → Backups**.
2. Select **Point in Time** or the latest daily snapshot prior to corruption.
3. Click **Restore Backup to New Project** (recommended to verify integrity before cutting DNS) or restore in-place.
4. Verify database connectivity:
   ```bash
   npx prisma migrate status
   ```
5. Update `DATABASE_URL` and `DIRECT_URL` in production environment secrets if a new instance was provisioned.
6. Verify `/api/health/ready` returns `200 { status: "ready", database: "connected" }`.

---

## 3. Storage & Artifact Disaster Recovery

### File Asset Redundancy
- APK binaries and application releases are stored in the private Supabase Storage bucket (`app-releases`).
- Storage objects are backed by AWS S3 multi-AZ durable storage (99.999999999% durability).

### Checksum Integrity Verification
All releases in Moha Gaming Lab have their SHA-256 cryptographic checksums stored in the database record:
```sql
SELECT id, "appName", version, "fileHashSha256", "fileSizeBytes" 
FROM "AppRelease" 
WHERE status = 'published';
```
When restoring storage objects from an offline mirror:
1. Re-upload binaries to the `app-releases` bucket.
2. Run integrity verification script to compare re-uploaded file hashes against recorded `fileHashSha256`.
3. If hashes match, mark releases as published.

---

## 4. Disaster Recovery Drill & Testing

A DR drill should be conducted semi-annually:
1. Create a staging Supabase project.
2. Restore the latest backup dump into the staging project.
3. Run `npm run test` and `node --test tests/production-smoke.test.mjs` against the restored staging database.
4. Verify all apps, games, tools, and guides load accurately without data loss.
5. Record drill duration and confirm RTO < 4 hours.
