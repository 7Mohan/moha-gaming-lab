# Moha Gaming Lab — Phase 12: Production Download Infrastructure, Storage & File Verification

## 1. Executive Summary & Philosophy

Phase 12 transforms Moha Gaming Lab's application distribution system from static download links into an enterprise-grade, cryptographically verified distribution infrastructure. 

### Fundamental Security Principles
1. **Uploaded ≠ Verified**: Successful file upload only confirms the artifact was stored safely. Verification requires explicit cryptographic validation.
2. **Verified ≠ Malware-Free**: In this system, `VERIFIED` status strictly certifies that the artifact currently in storage matches the recorded 64-character SHA-256 hash and meets origin requirements. Moha Gaming Lab never publishes false claims such as "100% Virus Free" without third-party sandboxed virus engine scanning (reserved for Phase 15).
3. **Release Immutability**: Once an APK release is published, its underlying artifact (`storagePath`, `checksumSha256`, `fileSizeBytes`) is strictly immutable. Bug fixes or updates require publishing a new version rather than modifying historical releases in place.
4. **Delete Safety**: Published releases cannot be deleted directly; they must first be archived by an authorized Administrator, preventing broken download links and orphan file states.

---

## 2. Storage Architecture

### Provider Abstraction
To avoid tight vendor lock-in, all storage operations interact through the `IStorageProvider` interface (`lib/storage/types.ts`). The default production implementation is `SupabaseStorageProvider` (`lib/storage/supabase-storage.ts`), which can be swapped with AWS S3, Cloudflare R2, or Bunny Storage without touching the CMS, data models, or public routes.

```
                  ┌──────────────────────┐
                  │   IStorageProvider   │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌─────────────────────────┐       ┌──────────────────────┐
│  SupabaseStorageProvider│       │   Future R2 / S3     │
│   (private bucket)      │       │     Provider         │
└─────────────────────────┘       └──────────────────────┘
```

### Storage Bucket Configuration
* **Bucket Name**: `app-releases`
* **Visibility**: **Private (`public = false`)**. Anonymous visitors cannot directly browse, enumerate, or download raw storage objects.
* **Access Paradigm**: Downloads are routed through an authenticated gateway endpoint (`/api/download/release/[releaseId]`), which issues short-lived 15-minute signed URLs (`createSignedUrl(path, 900)`).

### Server-Derived Folder Structure
Clients never supply arbitrary storage paths, folder names, or object keys. Paths are deterministically generated on the server (`generateStoragePath`):

```
app-releases/
  {appIdOrSlug}/
    {version}/
      {safeFilename}
```

*Example*:
```
app-releases/apk-analyzer/1.4.2/apk-analyzer-1.4.2-arm64.apk
```

All filenames are strictly sanitized:
* Replaces path traversal sequences (`../`, `..\`, `/`, `\`)
* Strips control characters, non-alphanumeric special characters, and null bytes
* Preserves standard dot notation and enforces lowercase `.apk` extensions.

---

## 3. Artifact Validation & Upload Pipeline

Before any file is committed to Supabase Storage, the upload handler (`uploadReleaseFileAction`) executes a multi-stage validation:

```
[ Incoming File ]
       │
       ▼
1. Extension Check (.apk)
       │
       ▼
2. Magic Bytes Inspection (0x50 0x4B 0x03 0x04) ───[ Non-ZIP/APK ]──► REJECT
       │
       ▼
3. File Size Validation (<= MAX_APP_RELEASE_SIZE) ───[ Exceeds Limit ]─► REJECT
       │
       ▼
4. Server-Side Path Generation
       │
       ▼
5. Stream to Supabase Storage (app-releases)
       │
       ▼
6. SHA-256 Cryptographic Hash Calculation (Hex 64 chars)
       │
       ▼
7. Release Record Created (verificationStatus = 'PENDING')
```

### Magic Bytes Verification
Android Application Packages (`.apk`) are structurally standard ZIP archives. The validator inspects the first 4 bytes of the binary buffer for the signature:
* `0x50 0x4B 0x03 0x04` (`PK\x03\x04`)

Files with falsified extensions (e.g., an executable renamed to `.apk`) are rejected before reaching storage.

### Maximum File Size
Configured via `MAX_APP_RELEASE_SIZE` in `.env.local` (defaults to 104,857,600 bytes = 100MB). Files exceeding this threshold are immediately rejected with human-readable error feedback.

---

## 4. Download Resolution & Gateway Endpoint

### Gateway Route: `/api/download/release/[releaseId]`
All public downloads pass through this centralized handler. It enforces security, access control, and privacy-preserving metrics:

1. **Release Resolution**: Looks up release by ID, version string, or slug hint.
2. **Access Control**: Rejects any release in `draft`, `review`, or `archived` status with `403 Forbidden`. Only `published` releases are downloadable by the public.
3. **Source Dispatch**:
   * **Hosted Release**: Verifies the file actually exists in storage (`storage.exists()`). If missing, safely returns `503 Service Unavailable` with logging instead of broken redirects. Generates a 15-minute signed URL.
   * **External Release**: Validates domain against trusted developer distribution list (`isTrustedDomain`) and ensures strict `https://` protocol.
4. **Anti-Abuse Rate Limiting**: Employs an in-memory / sliding window rate limiter (max 10 downloads per minute per IP per artifact) to record privacy-conscious download events without persistent IP logging.
5. **307 Temporary Redirect**: Directs client to the signed URL with headers `Cache-Control: private, no-cache, no-store` and `X-Content-Type-Options: nosniff`.

---

## 5. Versioning & Numerical Ordering

Android APK releases must be ordered by numerical `versionCode` first, falling back to semantic versioning (`semver`). Lexical sorting is strictly forbidden because it erroneously places `10.0` before `2.0`.

`lib/download/versions.ts` provides:
* `compareVersionStrings("10.0.1", "2.0.0") > 0`
* `compareReleasesDesc(releaseA, releaseB)`
  * Prioritizes `versionCode` when available (`200 > 100`).
  * Evaluates semantic version components (`major.minor.patch`).
  * Falls back to ISO release dates when versions are identical.
* `getLatestPublishedRelease(releases)` selects the highest versioned release with `status === 'published'`.

---

## 6. Database Schema & RLS Policies

### Prisma Schema (`prisma/schema.prisma`)
The `AppRelease` model is extended with:
* `versionCode`: Int?
* `storagePath`: String?
* `fileName`: String?
* `mimeType`: String? (defaults to `application/vnd.android.package-archive`)
* `fileSizeBytes`: BigInt?
* `checksumAlgorithm`: String (defaults to `sha256`)
* `status`: ReleaseStatus (`DRAFT`, `REVIEW`, `PUBLISHED`, `ARCHIVED`)
* `sourceType`: DownloadSourceType (`HOSTED`, `OFFICIAL_DEVELOPER`, `GITHUB_RELEASE`, `F_DROID`, `TRUSTED_EXTERNAL`)
* `verificationStatus`: VerificationStatus (`PENDING`, `VERIFIED`, `UNVERIFIED`, `FAILED`)

### Supabase Storage Security Policies
Implemented in `supabase/migrations/20260910_phase12_download_storage.sql`:
* `app-releases` bucket set to `public = false`.
* **SELECT**: Authenticated users or users with verified signed tokens.
* **INSERT**: Authenticated users possessing role `ADMIN` or `EDITOR`. Anonymous users receive zero write access.
* **UPDATE / DELETE**: Strictly restricted to users with `ADMIN` privileges.

---

## 7. Audit Logging & Administrative Safeguards

All sensitive release mutations emit structured audit events via `recordAudit`:
* `RELEASE_CREATED`
* `FILE_UPLOADED`
* `VERIFICATION_PASSED`
* `VERIFICATION_FAILED`
* `RELEASE_PUBLISHED`
* `RELEASE_ARCHIVED`
* `RELEASE_DELETED`

### Delete Safety Protection
In `app/admin/(dashboard)/apps/actions.ts`:
```ts
if (release.status === "published") {
  return {
    success: false,
    error: "Cannot delete an active published release. Archive the release first to protect download integrity.",
  };
}
```

---

## 8. Testing & Quality Assurance

Automated end-to-end and unit test suites are registered in `tests/download-infrastructure.test.mjs`:
1. **Semantic & Numerical Version Ordering**: Validates `10.0 > 2.0`, `1.0.10 > 1.0.2`, and `versionCode: 200 > 100`.
2. **Magic Bytes Validation**: Accepts valid ZIP headers (`0x504B0304`), rejects arbitrary text files and executables.
3. **Storage Path Sanitization**: Blocks directory traversal attempts (`../../../etc/passwd`).
4. **SHA-256 Checksum Calculation**: Matches exact cryptographic hashes for known buffers.
5. **Download Gateway Authorization**: Verifies published releases return redirects while drafts and archived releases return 403.
6. **Integrity Mismatch Detection**: Re-checking storage against mismatched hash transitions release to `FAILED`.
