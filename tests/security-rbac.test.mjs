/**
 * tests/security-rbac.test.mjs
 * ────────────────────────────────────────────────────────────────
 * Security & RBAC automated tests.
 * Run with: node --test tests/security-rbac.test.mjs
 *
 * Tests cover:
 *  - RBAC permission matrix correctness across all roles
 *  - Open redirect prevention (9+ attack vectors)
 *  - Rate limiter sliding window and identifier isolation
 *  - Session cookie structure validation
 *  - SuperAdmin hardcoded protection against demotion
 *  - PostgreSQL RLS policy logic simulation (SELECT, INSERT, UPDATE, DELETE)
 *  - Mass assignment protection & unauthorized field stripping
 *  - Privilege escalation defense
 *  - Account status (ACTIVE, SUSPENDED, DISABLED) enforcement
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

// ── 1. RBAC Logic (mirrors lib/auth/rbac.ts) ───────────────────────────────────

const PERMISSIONS = {
  ADMIN: new Set([
    "create", "read", "update", "updateOwn", "delete",
    "publish", "archive", "verify", "submitReview",
    "manageSettings", "manageUsers",
  ]),
  EDITOR: new Set([
    "create", "read", "update", "updateOwn",
    "publish", "archive", "submitReview", "verify",
  ]),
  AUTHOR: new Set([
    "create", "read", "updateOwn", "submitReview",
  ]),
};

function can(role, action) {
  return PERMISSIONS[role]?.has(action) ?? false;
}

// ── 2. Rate-limit Logic (mirrors lib/security/rate-limit.ts) ───────────────────

const store = new Map();

function rateLimit(identifier, { limit, windowMs }) {
  const now = Date.now();
  const existing = store.get(identifier);

  if (!existing || existing.resetAt < now) {
    const entry = { count: 1, resetAt: now + windowMs };
    store.set(identifier, entry);
    return { success: true, remaining: limit - 1, resetAt: entry.resetAt };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

// ── 3. Redirect Sanitizer (mirrors lib/security/redirect.ts) ───────────────────

const SAFE_PREFIXES = ["/admin", "/"];

function sanitizeRedirectUrl(target, fallback = "/") {
  if (!target || typeof target !== "string") return fallback;
  const trimmed = target.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return fallback;
  if (/[\x00-\x1f\x7f]/.test(trimmed)) return fallback;
  if (!trimmed.startsWith("/")) return fallback;
  const isSafe = SAFE_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
  if (!isSafe) return fallback;
  return trimmed;
}

// ── 4. Mass Assignment Sanitizer ──────────────────────────────────────────────

function filterAllowedFields(input, allowedFields) {
  const filtered = {};
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      filtered[field] = input[field];
    }
  }
  return filtered;
}

// ── 5. RLS Policy Simulation ──────────────────────────────────────────────────

function simulateGuideSelectPolicy(user, guide) {
  // Anon
  if (!user) {
    return guide.status === "PUBLISHED";
  }
  // Authenticated
  if (user.role === "ADMIN" || user.role === "EDITOR") {
    return true; // Full read for editors & admins
  }
  if (user.role === "AUTHOR") {
    return guide.status === "PUBLISHED" || guide.authorId === user.id;
  }
  return guide.status === "PUBLISHED";
}

function simulateGuidePublishPolicy(user, newStatus) {
  if (newStatus !== "PUBLISHED") return true;
  if (!user) return false;
  return user.role === "ADMIN" || user.role === "EDITOR";
}

function simulateAuditLogAccess(user) {
  if (!user) return false;
  return user.role === "ADMIN" || user.role === "EDITOR";
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("RBAC — ADMIN role", () => {
  test("ADMIN has all permissions", () => {
    const allActions = [
      "create", "read", "update", "updateOwn", "delete",
      "publish", "archive", "verify", "submitReview",
      "manageSettings", "manageUsers",
    ];
    for (const action of allActions) {
      assert.equal(can("ADMIN", action), true, `ADMIN should have: ${action}`);
    }
  });

  test("ADMIN can manageUsers", () => {
    assert.equal(can("ADMIN", "manageUsers"), true);
  });

  test("ADMIN can delete", () => {
    assert.equal(can("ADMIN", "delete"), true);
  });

  test("ADMIN can manageSettings", () => {
    assert.equal(can("ADMIN", "manageSettings"), true);
  });
});

describe("RBAC — EDITOR role", () => {
  test("EDITOR can publish", () => {
    assert.equal(can("EDITOR", "publish"), true);
  });

  test("EDITOR can verify", () => {
    assert.equal(can("EDITOR", "verify"), true);
  });

  test("EDITOR CANNOT delete", () => {
    assert.equal(can("EDITOR", "delete"), false);
  });

  test("EDITOR CANNOT manageUsers", () => {
    assert.equal(can("EDITOR", "manageUsers"), false);
  });

  test("EDITOR CANNOT manageSettings", () => {
    assert.equal(can("EDITOR", "manageSettings"), false);
  });
});

describe("RBAC — AUTHOR role", () => {
  test("AUTHOR can create", () => {
    assert.equal(can("AUTHOR", "create"), true);
  });

  test("AUTHOR can read", () => {
    assert.equal(can("AUTHOR", "read"), true);
  });

  test("AUTHOR can updateOwn", () => {
    assert.equal(can("AUTHOR", "updateOwn"), true);
  });

  test("AUTHOR CANNOT update (others)", () => {
    assert.equal(can("AUTHOR", "update"), false);
  });

  test("AUTHOR CANNOT publish", () => {
    assert.equal(can("AUTHOR", "publish"), false);
  });

  test("AUTHOR CANNOT delete", () => {
    assert.equal(can("AUTHOR", "delete"), false);
  });

  test("AUTHOR CANNOT manageUsers", () => {
    assert.equal(can("AUTHOR", "manageUsers"), false);
  });
});

describe("RBAC — Unknown role (privilege escalation prevention)", () => {
  test("Unknown role has no permissions", () => {
    assert.equal(can("HACKER", "create"), false);
    assert.equal(can("USER", "manageUsers"), false);
    assert.equal(can(undefined, "read"), false);
    assert.equal(can(null, "delete"), false);
  });
});

describe("Rate Limiter — sliding window", () => {
  test("allows requests within limit", () => {
    const id = `test-${Date.now()}-1`;
    const r1 = rateLimit(id, { limit: 3, windowMs: 10_000 });
    assert.equal(r1.success, true);
    assert.equal(r1.remaining, 2);

    const r2 = rateLimit(id, { limit: 3, windowMs: 10_000 });
    assert.equal(r2.success, true);
    assert.equal(r2.remaining, 1);
  });

  test("blocks requests beyond limit", () => {
    const id = `test-${Date.now()}-2`;
    rateLimit(id, { limit: 2, windowMs: 10_000 });
    rateLimit(id, { limit: 2, windowMs: 10_000 });
    const blocked = rateLimit(id, { limit: 2, windowMs: 10_000 });
    assert.equal(blocked.success, false);
    assert.equal(blocked.remaining, 0);
  });

  test("remaining count decrements correctly", () => {
    const id = `test-${Date.now()}-3`;
    const r1 = rateLimit(id, { limit: 5, windowMs: 10_000 });
    assert.equal(r1.remaining, 4);
    const r2 = rateLimit(id, { limit: 5, windowMs: 10_000 });
    assert.equal(r2.remaining, 3);
  });

  test("independent identifiers don't interfere", () => {
    const id1 = `test-${Date.now()}-4a`;
    const id2 = `test-${Date.now()}-4b`;
    rateLimit(id1, { limit: 1, windowMs: 10_000 });
    assert.equal(rateLimit(id1, { limit: 1, windowMs: 10_000 }).success, false);

    const r = rateLimit(id2, { limit: 1, windowMs: 10_000 });
    assert.equal(r.success, true);
  });
});

describe("Open Redirect Prevention", () => {
  test("allows safe relative paths", () => {
    assert.equal(sanitizeRedirectUrl("/admin"), "/admin");
    assert.equal(sanitizeRedirectUrl("/admin/users"), "/admin/users");
    assert.equal(sanitizeRedirectUrl("/admin/games?page=2"), "/admin/games?page=2");
    assert.equal(sanitizeRedirectUrl("/"), "/");
  });

  test("blocks absolute HTTP URLs", () => {
    assert.equal(sanitizeRedirectUrl("http://evil.com"), "/");
    assert.equal(sanitizeRedirectUrl("https://evil.com/steal"), "/");
    assert.equal(sanitizeRedirectUrl("HTTPS://Evil.com"), "/");
  });

  test("blocks protocol-relative URLs", () => {
    assert.equal(sanitizeRedirectUrl("//evil.com"), "/");
    assert.equal(sanitizeRedirectUrl("//evil.com/path"), "/");
  });

  test("blocks javascript: protocol", () => {
    assert.equal(sanitizeRedirectUrl("javascript:alert(1)"), "/");
    assert.equal(sanitizeRedirectUrl("JAVASCRIPT:alert(1)"), "/");
  });

  test("blocks data: protocol", () => {
    assert.equal(sanitizeRedirectUrl("data:text/html,<h1>XSS</h1>"), "/");
  });

  test("blocks null bytes and control characters", () => {
    assert.equal(sanitizeRedirectUrl("/admin\x00evil"), "/");
    assert.equal(sanitizeRedirectUrl("/admin\x01path"), "/");
  });

  test("blocks non-slash-prefixed strings", () => {
    assert.equal(sanitizeRedirectUrl("evil.com"), "/");
    assert.equal(sanitizeRedirectUrl("evil/path"), "/");
  });

  test("returns fallback for null/undefined/empty", () => {
    assert.equal(sanitizeRedirectUrl(null), "/");
    assert.equal(sanitizeRedirectUrl(undefined), "/");
    assert.equal(sanitizeRedirectUrl(""), "/");
    assert.equal(sanitizeRedirectUrl("   "), "/");
  });

  test("uses custom fallback when provided", () => {
    assert.equal(sanitizeRedirectUrl(null, "/admin"), "/admin");
    assert.equal(sanitizeRedirectUrl("http://evil.com", "/admin"), "/admin");
  });
});

describe("Session Cookie Structure", () => {
  test("valid cookie must have two parts separated by dot", () => {
    function hasValidStructure(value) {
      if (!value) return false;
      const parts = value.split(".");
      return parts.length >= 2 && Boolean(parts[0] && parts[0].length > 0);
    }

    assert.equal(hasValidStructure("payload.signature"), true);
    assert.equal(hasValidStructure("abc123.xyz789"), true);
    assert.equal(hasValidStructure("nosignature"), false);
    assert.equal(hasValidStructure(""), false);
    assert.equal(hasValidStructure(null), false);
    assert.equal(hasValidStructure(".signature"), false);
  });
});

describe("SuperAdmin Protection", () => {
  const SUPERADMIN_EMAIL = "4mohabashir@gmail.com";

  test("SuperAdmin email is correctly identified", () => {
    assert.equal("4mohabashir@gmail.com" === SUPERADMIN_EMAIL, true);
    assert.equal("9mohabashir@gmail.com" === SUPERADMIN_EMAIL, false);
    assert.equal("admin@mohalab.com" === SUPERADMIN_EMAIL, false);
    assert.equal("" === SUPERADMIN_EMAIL, false);
  });

  test("SuperAdmin cannot be demoted (simulation)", () => {
    function canChangeSuperAdminRole(targetEmail, newRole) {
      if (targetEmail === SUPERADMIN_EMAIL && newRole !== "ADMIN") {
        return false; // blocked
      }
      return true;
    }

    assert.equal(canChangeSuperAdminRole("4mohabashir@gmail.com", "USER"), false);
    assert.equal(canChangeSuperAdminRole("4mohabashir@gmail.com", "EDITOR"), false);
    assert.equal(canChangeSuperAdminRole("4mohabashir@gmail.com", "AUTHOR"), false);
    assert.equal(canChangeSuperAdminRole("4mohabashir@gmail.com", "ADMIN"), true);
    assert.equal(canChangeSuperAdminRole("other@example.com", "USER"), true);
  });
});

describe("Row Level Security (RLS) Policy Simulation", () => {
  const publishedGuide = { id: "g1", title: "Thermal Guide", status: "PUBLISHED", authorId: "author-1" };
  const draftGuide = { id: "g2", title: "Upcoming GPU Tweaks", status: "DRAFT", authorId: "author-1" };
  const otherDraftGuide = { id: "g3", title: "Secret Guide", status: "DRAFT", authorId: "author-2" };

  test("Anonymous visitor can view PUBLISHED content only", () => {
    assert.equal(simulateGuideSelectPolicy(null, publishedGuide), true);
    assert.equal(simulateGuideSelectPolicy(null, draftGuide), false);
    assert.equal(simulateGuideSelectPolicy(null, otherDraftGuide), false);
  });

  test("Author can view own drafts but NOT other authors' drafts", () => {
    const authorUser = { id: "author-1", role: "AUTHOR" };
    assert.equal(simulateGuideSelectPolicy(authorUser, publishedGuide), true);
    assert.equal(simulateGuideSelectPolicy(authorUser, draftGuide), true);
    assert.equal(simulateGuideSelectPolicy(authorUser, otherDraftGuide), false);
  });

  test("Editor and Admin can view all content including drafts", () => {
    const editorUser = { id: "editor-1", role: "EDITOR" };
    const adminUser = { id: "admin-1", role: "ADMIN" };
    assert.equal(simulateGuideSelectPolicy(editorUser, draftGuide), true);
    assert.equal(simulateGuideSelectPolicy(editorUser, otherDraftGuide), true);
    assert.equal(simulateGuideSelectPolicy(adminUser, draftGuide), true);
  });

  test("Author CANNOT publish directly (RLS check)", () => {
    const authorUser = { id: "author-1", role: "AUTHOR" };
    assert.equal(simulateGuidePublishPolicy(authorUser, "PUBLISHED"), false);
  });

  test("Editor and Admin CAN publish content", () => {
    const editorUser = { id: "editor-1", role: "EDITOR" };
    const adminUser = { id: "admin-1", role: "ADMIN" };
    assert.equal(simulateGuidePublishPolicy(editorUser, "PUBLISHED"), true);
    assert.equal(simulateGuidePublishPolicy(adminUser, "PUBLISHED"), true);
  });

  test("Audit logs are blocked for Anonymous and Authors, readable by Editor and Admin", () => {
    assert.equal(simulateAuditLogAccess(null), false);
    assert.equal(simulateAuditLogAccess({ id: "a1", role: "AUTHOR" }), false);
    assert.equal(simulateAuditLogAccess({ id: "e1", role: "EDITOR" }), true);
    assert.equal(simulateAuditLogAccess({ id: "ad1", role: "ADMIN" }), true);
  });
});

describe("Mass Assignment & Privilege Escalation Protection", () => {
  test("whitelisting editable fields strips forged system fields", () => {
    const untrustedPayload = {
      title: "Updated Title",
      content: "Updated Content",
      role: "ADMIN", // Attacker trying to elevate role
      status: "PUBLISHED", // Attacker trying to bypass review
      authorId: "victim-id", // Attacker spoofing author
      verificationStatus: "VERIFIED", // Attacker spoofing verification
    };

    const allowedGuideFields = ["title", "content", "excerpt"];
    const sanitized = filterAllowedFields(untrustedPayload, allowedGuideFields);

    assert.equal(sanitized.title, "Updated Title");
    assert.equal(sanitized.content, "Updated Content");
    assert.equal(sanitized.role, undefined);
    assert.equal(sanitized.status, undefined);
    assert.equal(sanitized.authorId, undefined);
    assert.equal(sanitized.verificationStatus, undefined);
  });
});

describe("Account Status Enforcement", () => {
  function canAccessProtectedAdmin(account) {
    if (!account) return false;
    if (account.status !== "ACTIVE") return false;
    return ["ADMIN", "EDITOR", "AUTHOR"].includes(account.role);
  }

  test("ACTIVE accounts with valid roles can access admin", () => {
    assert.equal(canAccessProtectedAdmin({ role: "ADMIN", status: "ACTIVE" }), true);
    assert.equal(canAccessProtectedAdmin({ role: "EDITOR", status: "ACTIVE" }), true);
    assert.equal(canAccessProtectedAdmin({ role: "AUTHOR", status: "ACTIVE" }), true);
  });

  test("SUSPENDED or DISABLED accounts are blocked regardless of role", () => {
    assert.equal(canAccessProtectedAdmin({ role: "ADMIN", status: "SUSPENDED" }), false);
    assert.equal(canAccessProtectedAdmin({ role: "ADMIN", status: "DISABLED" }), false);
    assert.equal(canAccessProtectedAdmin({ role: "EDITOR", status: "SUSPENDED" }), false);
    assert.equal(canAccessProtectedAdmin({ role: "AUTHOR", status: "DISABLED" }), false);
  });

  test("Regular USER role is blocked even when ACTIVE", () => {
    assert.equal(canAccessProtectedAdmin({ role: "USER", status: "ACTIVE" }), false);
  });
});
