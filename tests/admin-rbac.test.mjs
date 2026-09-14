/**
 * tests/admin-rbac.test.mjs
 * ────────────────────────────────────────────────────────────────
 * Unit tests verifying role-based access control permission matrices.
 */

import test from "node:test";
import assert from "node:assert/strict";

const PERMISSIONS = {
  ADMIN: new Set([
    "create",
    "read",
    "update",
    "updateOwn",
    "delete",
    "publish",
    "archive",
    "verify",
    "submitReview",
    "manageSettings",
    "manageUsers",
  ]),
  EDITOR: new Set([
    "create",
    "read",
    "update",
    "updateOwn",
    "publish",
    "archive",
    "submitReview",
    "verify",
  ]),
  AUTHOR: new Set([
    "create",
    "read",
    "updateOwn",
    "submitReview",
  ]),
};

function can(role, action) {
  return PERMISSIONS[role]?.has(action) ?? false;
}

test("Role-Based Access Control (RBAC) Matrix", async (t) => {
  await t.test("ADMIN role has full supervisory permissions", () => {
    assert.equal(can("ADMIN", "create"), true);
    assert.equal(can("ADMIN", "delete"), true);
    assert.equal(can("ADMIN", "publish"), true);
    assert.equal(can("ADMIN", "archive"), true);
    assert.equal(can("ADMIN", "manageSettings"), true);
  });

  await t.test("EDITOR role can publish and archive but CANNOT delete or manage system settings", () => {
    assert.equal(can("EDITOR", "create"), true);
    assert.equal(can("EDITOR", "update"), true);
    assert.equal(can("EDITOR", "publish"), true);
    assert.equal(can("EDITOR", "archive"), true);
    assert.equal(can("EDITOR", "delete"), false);
    assert.equal(can("EDITOR", "manageSettings"), false);
    assert.equal(can("EDITOR", "manageUsers"), false);
  });

  await t.test("AUTHOR role can draft and submit for review, but CANNOT publish directly or delete", () => {
    assert.equal(can("AUTHOR", "create"), true);
    assert.equal(can("AUTHOR", "submitReview"), true);
    assert.equal(can("AUTHOR", "publish"), false);
    assert.equal(can("AUTHOR", "archive"), false);
    assert.equal(can("AUTHOR", "delete"), false);
    assert.equal(can("AUTHOR", "manageSettings"), false);
  });

  await t.test("unknown roles or actions are denied by default", () => {
    assert.equal(can("GUEST", "read"), false);
    assert.equal(can("USER", "create"), false);
    assert.equal(can("ADMIN", "nonExistentAction"), false);
  });
});
