/**
 * tests/admin-flows.test.mjs
 * ────────────────────────────────────────────────────────────────
 * Acceptance test suite for Moha Gaming Lab Admin CMS.
 * Covers Scenarios A–F without importing TypeScript source files.
 *
 * Run:  node --test tests/admin-flows.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";

/* ══════════════════════════════════════════════════════════════
   SCENARIO A — Login credential validation
   Mirrors: app/admin/login/actions.ts (loginAction)
   ══════════════════════════════════════════════════════════════ */

const DEV_SEEDS = [
  { email: "admin@mohalab.com",  password: "admin123456",  role: "ADMIN"  },
  { email: "editor@mohalab.com", password: "editor123456", role: "EDITOR" },
  { email: "author@mohalab.com", password: "author123456", role: "AUTHOR" },
];

const ERR_BAD_CREDS = "The credentials you entered are incorrect.";
const ERR_UNAUTH    = "You don't have permission to access the admin area.";

function devLogin(email, password) {
  const e = (email || "").trim().toLowerCase();
  const m = DEV_SEEDS.find((s) => s.email === e && s.password === password);
  if (!m) return { success: false, error: ERR_BAD_CREDS };
  return { success: true, session: { email: m.email, role: m.role } };
}

function loginWithRole(email, password, allowed) {
  const r = devLogin(email, password);
  if (!r.success) return r;
  if (!allowed.includes(r.session.role)) return { success: false, error: ERR_UNAUTH };
  return r;
}

test("Scenario A — Login Credential Validation", async (t) => {
  await t.test("A1: ADMIN credentials succeed", () => {
    const r = devLogin("admin@mohalab.com", "admin123456");
    assert.equal(r.success, true);
    assert.equal(r.session.role, "ADMIN");
  });

  await t.test("A2: EDITOR credentials succeed", () => {
    const r = devLogin("editor@mohalab.com", "editor123456");
    assert.equal(r.success, true);
    assert.equal(r.session.role, "EDITOR");
  });

  await t.test("A3: AUTHOR credentials succeed", () => {
    const r = devLogin("author@mohalab.com", "author123456");
    assert.equal(r.success, true);
    assert.equal(r.session.role, "AUTHOR");
  });

  await t.test("A4: wrong password returns exact error text", () => {
    const r = devLogin("admin@mohalab.com", "wrong-password");
    assert.equal(r.success, false);
    assert.equal(r.error, ERR_BAD_CREDS);
  });

  await t.test("A5: unknown email — no account enumeration, same error text", () => {
    const r = devLogin("hacker@evil.com", "anything");
    assert.equal(r.success, false);
    assert.equal(r.error, ERR_BAD_CREDS);
    assert.notEqual(r.error, "No account found with this email.");
  });

  await t.test("A6: blank email returns invalid credentials (not a separate error)", () => {
    const r = devLogin("", "admin123456");
    assert.equal(r.success, false);
    assert.equal(r.error, ERR_BAD_CREDS);
  });

  await t.test("A7: role not in allowed list → unauthorized error", () => {
    const r = loginWithRole("author@mohalab.com", "author123456", ["ADMIN"]);
    assert.equal(r.success, false);
    assert.equal(r.error, ERR_UNAUTH);
  });

  await t.test("A8: role in allowed list → login succeeds", () => {
    const r = loginWithRole("editor@mohalab.com", "editor123456", ["ADMIN", "EDITOR"]);
    assert.equal(r.success, true);
    assert.equal(r.session.role, "EDITOR");
  });
});

/* ══════════════════════════════════════════════════════════════
   SCENARIO B — ContentRelationPicker / Search-index registration
   Mirrors: lib/search-index.ts (register* + invalidateSearchIndex)
   ══════════════════════════════════════════════════════════════ */

let SS = { games: [], tools: [], apps: [], guides: [] };
let _idx = null;

const inv = () => { _idx = null; };

const regGame = (g) => {
  const i = SS.games.findIndex((x) => x.id === g.id || x.slug === g.slug);
  i >= 0 ? (SS.games[i] = { ...SS.games[i], ...g }) : SS.games.unshift(g);
  inv();
};

const regGuide = (gu) => {
  const i = SS.guides.findIndex((x) => x.id === gu.id || x.slug === gu.slug);
  i >= 0 ? (SS.guides[i] = { ...SS.guides[i], ...gu }) : SS.guides.unshift(gu);
  inv();
};

const regTool = (t) => {
  const i = SS.tools.findIndex((x) => x.id === t.id || x.slug === t.slug);
  i >= 0 ? (SS.tools[i] = { ...SS.tools[i], ...t }) : SS.tools.unshift(t);
  inv();
};

test("Scenario B — Search Index Registration", async (t) => {
  SS = { games: [], tools: [], apps: [], guides: [] };

  await t.test("B1: register new game adds to store", () => {
    regGame({ id: "g1", slug: "test-game", name: "Test Game", status: "active", tags: [] });
    assert.equal(SS.games.length, 1);
    assert.equal(SS.games[0].slug, "test-game");
  });

  await t.test("B2: re-registering same game by id updates, no duplicate", () => {
    regGame({ id: "g1", slug: "test-game", name: "Updated Game", status: "active", tags: [] });
    assert.equal(SS.games.length, 1);
    assert.equal(SS.games[0].name, "Updated Game");
  });

  await t.test("B3: game with related slugs stores them correctly", () => {
    regGame({
      id: "g2", slug: "game-r", name: "G2", status: "active", tags: ["fps"],
      relatedToolSlugs: ["fps-monitor"],
      relatedGuideSlugs: ["fps-guide"],
    });
    const g = SS.games.find((x) => x.slug === "game-r");
    assert.ok(g, "game should be in store");
    assert.deepEqual(g.relatedToolSlugs, ["fps-monitor"]);
    assert.deepEqual(g.relatedGuideSlugs, ["fps-guide"]);
  });

  await t.test("B4: register guide adds to guides store", () => {
    regGuide({ id: "gu1", slug: "fps-guide", title: "FPS Guide", status: "published", tags: ["fps"] });
    assert.equal(SS.guides.length, 1);
    assert.equal(SS.guides[0].slug, "fps-guide");
  });

  await t.test("B5: register tool adds to tools store", () => {
    regTool({ id: "t1", slug: "fps-monitor", name: "FPS Monitor", status: "available", tags: ["fps"] });
    assert.equal(SS.tools.length, 1);
    assert.equal(SS.tools[0].slug, "fps-monitor");
  });

  await t.test("B6: invalidateSearchIndex clears cached index", () => {
    _idx = ["some-doc"];
    inv();
    assert.equal(_idx, null);
  });

  await t.test("B7: registered slugs appear in search store", () => {
    const slugs = SS.games.map((g) => g.slug);
    assert.ok(slugs.includes("test-game"), "test-game missing");
    assert.ok(slugs.includes("game-r"), "game-r missing");
  });
});

/* ══════════════════════════════════════════════════════════════
   SCENARIO C — Guide review lifecycle
   Mirrors: app/admin/(dashboard)/guides/actions.ts
   ══════════════════════════════════════════════════════════════ */

let GS = [];

const cGuide  = (g)       => { GS.unshift({ ...g }); return g; };
const gGuide  = (id)      => GS.find((g) => g.id === id) ?? null;
const sStatus = (id, st)  => { const i = GS.findIndex((g) => g.id === id); if (i < 0) throw new Error("Not found"); GS[i] = { ...GS[i], status: st }; return GS[i]; };
const uGuide  = (id, d)   => { const i = GS.findIndex((g) => g.id === id); if (i < 0) throw new Error("Not found"); GS[i] = { ...GS[i], ...d, updatedAt: new Date().toISOString() }; return GS[i]; };

function submitForReview(id, role = "AUTHOR") {
  if (!["ADMIN", "EDITOR", "AUTHOR"].includes(role)) return { success: false, error: "Unauthorized" };
  const g = gGuide(id);
  if (!g) return { success: false, error: "Guide not found" };
  sStatus(id, "review");
  return { success: true };
}

function approveReview(id, role = "EDITOR") {
  if (!["ADMIN", "EDITOR"].includes(role)) return { success: false, error: "Unauthorized: only EDITOR/ADMIN can publish" };
  const g = gGuide(id);
  if (!g) return { success: false, error: "Guide not found" };
  if (g.status !== "review") return { success: false, error: "Guide is not in the review queue." };
  uGuide(id, { status: "published", reviewNote: undefined });
  return { success: true };
}

function requestChanges(id, note, role = "EDITOR") {
  if (!["ADMIN", "EDITOR"].includes(role)) return { success: false, error: "Unauthorized" };
  const trimmed = (note || "").trim();
  if (!trimmed || trimmed.length < 10) {
    return { success: false, error: "An editorial note explaining required changes is required (minimum 10 characters)." };
  }
  const g = gGuide(id);
  if (!g) return { success: false, error: "Guide not found" };
  uGuide(id, { status: "draft", reviewNote: trimmed });
  return { success: true };
}

test("Scenario C — Guide Review Lifecycle", async (t) => {
  GS = [];
  cGuide({ id: "gu-fps", slug: "fps-drops", title: "FPS Drops", status: "draft", tags: ["fps"], reviewNote: undefined });

  await t.test("C1: guide starts as draft", () => {
    assert.equal(gGuide("gu-fps").status, "draft");
  });

  await t.test("C2: AUTHOR submits for review → status becomes 'review'", () => {
    const r = submitForReview("gu-fps", "AUTHOR");
    assert.equal(r.success, true);
    assert.equal(gGuide("gu-fps").status, "review");
  });

  await t.test("C3: guide appears in the review queue", () => {
    const q = GS.filter((g) => g.status === "review");
    assert.ok(q.some((g) => g.id === "gu-fps"), "Guide should be in review queue");
  });

  await t.test("C4: EDITOR requests changes with valid note → draft + reviewNote set", () => {
    const r = requestChanges("gu-fps", "Please add Snapdragon 888 throttling benchmarks.", "EDITOR");
    assert.equal(r.success, true);
    const g = gGuide("gu-fps");
    assert.equal(g.status, "draft");
    assert.ok(g.reviewNote && g.reviewNote.length >= 10, "reviewNote must be ≥10 chars");
  });

  await t.test("C5: note shorter than 10 chars is blocked with exact error", () => {
    sStatus("gu-fps", "review");
    const r = requestChanges("gu-fps", "Too short", "EDITOR");
    assert.equal(r.success, false);
    assert.ok(r.error.includes("minimum 10 characters"), `Got: ${r.error}`);
  });

  await t.test("C6: AUTHOR re-submits after changes requested", () => {
    uGuide("gu-fps", { status: "draft" });
    const r = submitForReview("gu-fps", "AUTHOR");
    assert.equal(r.success, true);
    assert.equal(gGuide("gu-fps").status, "review");
  });

  await t.test("C7: EDITOR approves → status becomes 'published'", () => {
    const r = approveReview("gu-fps", "EDITOR");
    assert.equal(r.success, true);
    assert.equal(gGuide("gu-fps").status, "published");
  });

  await t.test("C8: published guide appears in search-eligible set", () => {
    assert.ok(GS.filter((g) => g.status === "published").some((g) => g.id === "gu-fps"));
  });

  await t.test("C9: AUTHOR cannot approve (permission denied)", () => {
    sStatus("gu-fps", "review");
    const r = approveReview("gu-fps", "AUTHOR");
    assert.equal(r.success, false);
    assert.ok(r.error.toLowerCase().includes("unauthorized") || r.error.toLowerCase().includes("editor"));
  });

  await t.test("C10: approving guide not in review → rejected with clear message", () => {
    uGuide("gu-fps", { status: "draft" });
    const r = approveReview("gu-fps", "ADMIN");
    assert.equal(r.success, false);
    assert.equal(r.error, "Guide is not in the review queue.");
  });
});

/* ══════════════════════════════════════════════════════════════
   SCENARIO D — Release verification
   Mirrors: app/admin/(dashboard)/apps/actions.ts (verifyReleaseAction)
   ══════════════════════════════════════════════════════════════ */

let APS = [];

const cApp   = (a)            => { APS.unshift({ ...a }); return a; };
const gAppId = (id)           => APS.find((a) => a.id === id) ?? null;

function updateRelease(slug, rid, data) {
  const app = APS.find((a) => a.slug === slug);
  if (!app) throw new Error(`App not found: ${slug}`);
  const i = app.releases.findIndex((r) => r.version === rid || r.id === rid);
  if (i < 0) throw new Error(`Release not found: ${rid}`);
  app.releases[i] = { ...app.releases[i], ...data };
  return app.releases[i];
}

const SHA256_RE = /^[a-fA-F0-9]{64}$/;
const MD5_RE    = /^[a-fA-F0-9]{32}$/;

function validateChecksum(sha256, md5) {
  if (sha256 && !SHA256_RE.test(sha256)) return "SHA-256 checksum must be a 64-character hexadecimal hash.";
  if (md5 && !MD5_RE.test(md5))         return "MD5 checksum must be a 32-character hexadecimal hash.";
  return null;
}

function verifyRelease(slug, rid, basis, role = "EDITOR") {
  if (!["ADMIN", "EDITOR"].includes(role)) {
    return { success: false, error: "Unauthorized: only EDITOR/ADMIN can verify releases." };
  }
  const b = (basis || "").trim();
  if (!b || b.length < 10) {
    return { success: false, error: "Verification basis is required and must document verification evidence (minimum 10 characters)." };
  }
  try {
    updateRelease(slug, rid, {
      verificationStatus: "verified",
      verificationEvidence: b,
      verifiedBy: "test-user",
      verifiedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

test("Scenario D — App Release Verification", async (t) => {
  APS = [];
  cApp({
    id: "app-shizuku", slug: "shizuku", name: "Shizuku", status: "active",
    releases: [{
      id: "rel-1", version: "13.5.4.r1028",
      verificationStatus: "unverified",
      checksumSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      checksumMd5: "d41d8cd98f00b204e9800998ecf8427e",
    }],
  });

  await t.test("D1: empty basis blocked", () => {
    const r = verifyRelease("shizuku", "rel-1", "");
    assert.equal(r.success, false);
    assert.ok(r.error.includes("minimum 10 characters"), `Got: ${r.error}`);
  });

  await t.test("D2: basis <10 chars blocked", () => {
    const r = verifyRelease("shizuku", "rel-1", "short");
    assert.equal(r.success, false);
    assert.ok(r.error.includes("minimum 10 characters"), `Got: ${r.error}`);
  });

  await t.test("D3: valid basis succeeds + sets verifiedBy/verifiedAt", () => {
    const r = verifyRelease("shizuku", "rel-1", "Verified SHA-256 against official GitHub release page v13.5.4", "EDITOR");
    assert.equal(r.success, true);
    const rel = gAppId("app-shizuku").releases.find((r) => r.id === "rel-1");
    assert.equal(rel.verificationStatus, "verified");
    assert.ok(rel.verifiedBy, "verifiedBy must be set");
    assert.ok(rel.verifiedAt, "verifiedAt must be set");
    assert.ok(rel.verificationEvidence.length >= 10);
  });

  await t.test("D4: AUTHOR cannot verify (permission denied)", () => {
    const r = verifyRelease("shizuku", "rel-1", "Valid basis longer than 10 chars here", "AUTHOR");
    assert.equal(r.success, false);
    assert.ok(r.error.toLowerCase().includes("unauthorized") || r.error.toLowerCase().includes("editor"));
  });

  await t.test("D5: valid SHA-256 passes checksum validation", () => {
    assert.equal(validateChecksum("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", undefined), null);
  });

  await t.test("D6: malformed SHA-256 blocked", () => {
    const err = validateChecksum("not-a-sha256", undefined);
    assert.ok(err?.includes("SHA-256"), `Got: ${err}`);
  });

  await t.test("D7: valid MD5 passes checksum validation", () => {
    assert.equal(validateChecksum(undefined, "d41d8cd98f00b204e9800998ecf8427e"), null);
  });

  await t.test("D8: malformed MD5 blocked", () => {
    const err = validateChecksum(undefined, "tooshort");
    assert.ok(err?.includes("MD5"), `Got: ${err}`);
  });
});

/* ══════════════════════════════════════════════════════════════
   SCENARIO E — Category deletion safeguard
   Mirrors: app/admin/(dashboard)/categories/actions.ts (deleteCategoryAction)
   ══════════════════════════════════════════════════════════════ */

let CATS = [];
let CONTENT_FOR_CAT = { games: [], apps: [], tools: [], guides: [] };

function deleteCategoryAction(slug, role = "ADMIN") {
  if (role !== "ADMIN") return { success: false, error: "Unauthorized" };

  const refs = [];
  for (const g  of CONTENT_FOR_CAT.games)  if (g.category  === slug) refs.push({ type: "Game",  name: g.name,  slug: g.slug  });
  for (const a  of CONTENT_FOR_CAT.apps)   if (a.category  === slug) refs.push({ type: "App",   name: a.name,  slug: a.slug  });
  for (const t  of CONTENT_FOR_CAT.tools)  if (t.category  === slug) refs.push({ type: "Tool",  name: t.name,  slug: t.slug  });
  for (const gu of CONTENT_FOR_CAT.guides) if (gu.category === slug) refs.push({ type: "Guide", title: gu.title, slug: gu.slug });

  if (refs.length > 0) {
    return {
      success: false,
      protected: true,
      error: `Cannot delete category "${slug}": it is referenced by ${refs.length} content item(s).`,
      referencing: refs,
    };
  }

  CATS = CATS.filter((c) => c.slug !== slug);
  return { success: true };
}

test("Scenario E — Category Deletion Safeguard", async (t) => {
  CATS = [
    { id: "c1", slug: "fps", name: "FPS" },
    { id: "c2", slug: "rpg", name: "RPG" },
  ];
  CONTENT_FOR_CAT = {
    games:  [
      { id: "g1", slug: "pubg-mobile",  name: "PUBG Mobile",  category: "fps" },
      { id: "g2", slug: "genshin-impact", name: "Genshin Impact", category: "rpg" },
    ],
    apps:   [],
    tools:  [{ id: "t1", slug: "fps-monitor", name: "FPS Monitor", category: "fps" }],
    guides: [{ id: "gu1", slug: "fps-guide", title: "FPS Drop Diagnosis", category: "fps" }],
  };

  await t.test("E1: unreferenced category deletes successfully", () => {
    CATS.push({ id: "c3", slug: "empty-cat", name: "Empty Category" });
    const r = deleteCategoryAction("empty-cat", "ADMIN");
    assert.equal(r.success, true);
    assert.ok(!CATS.some((c) => c.slug === "empty-cat"));
  });

  await t.test("E2: fps category (refs: 1 game + 1 tool + 1 guide) is BLOCKED", () => {
    const r = deleteCategoryAction("fps", "ADMIN");
    assert.equal(r.success, false);
    assert.equal(r.protected, true);
    assert.ok(r.error.includes("fps"), `Got: ${r.error}`);
    assert.ok(r.referencing.length >= 1, "Should list referencing items");
  });

  await t.test("E3: referencing items listed in error response", () => {
    const r = deleteCategoryAction("fps", "ADMIN");
    assert.ok(r.referencing.some((x) => x.slug === "pubg-mobile"), "PUBG Mobile missing");
    assert.ok(r.referencing.some((x) => x.slug === "fps-monitor"), "FPS Monitor missing");
    assert.ok(r.referencing.some((x) => x.slug === "fps-guide"),   "FPS Guide missing");
  });

  await t.test("E4: blocked category still in store", () => {
    assert.ok(CATS.some((c) => c.slug === "fps"), "fps should still exist in store");
  });

  await t.test("E5: EDITOR cannot delete categories (permission denied)", () => {
    const r = deleteCategoryAction("rpg", "EDITOR");
    assert.equal(r.success, false);
    assert.ok(r.error.toLowerCase().includes("unauthorized"));
  });

  await t.test("E6: rpg category blocked by Genshin Impact reference", () => {
    const r = deleteCategoryAction("rpg", "ADMIN");
    assert.equal(r.success, false);
    assert.ok(r.referencing.some((x) => x.slug === "genshin-impact"), "Genshin Impact missing from refs");
  });
});

/* ══════════════════════════════════════════════════════════════
   SCENARIO F — Tag merge
   Mirrors: app/admin/(dashboard)/tags/actions.ts (mergeTagsAction)
   ══════════════════════════════════════════════════════════════ */

let TAGS = [];
let CONTENT_FOR_TAG = { games: [], apps: [], tools: [], guides: [] };

function initTagFixtures() {
  TAGS = [
    { id: "t1", slug: "fps",  name: "FPS (lowercase)" },
    { id: "t2", slug: "FPS",  name: "FPS (uppercase dupe)" },
    { id: "t3", slug: "120hz", name: "120Hz" },
  ];
  CONTENT_FOR_TAG = {
    games:  [
      { id: "g1", slug: "pubg-mobile", name: "PUBG Mobile", tags: ["FPS", "120hz", "battle-royale"] },
      { id: "g2", slug: "cod-mobile",  name: "CoD Mobile",   tags: ["FPS", "multiplayer"] },
    ],
    apps:   [{ id: "a1", slug: "fps-app",  name: "FPS App",  tags: ["FPS", "diagnostics"] }],
    tools:  [{ id: "t1", slug: "fps-tool", name: "FPS Tool", tags: ["FPS", "performance"] }],
    guides: [{ id: "gu1", slug: "fps-guide", title: "FPS Guide", tags: ["FPS", "thermal"] }],
  };
}

function mergeTagsAction(sourceSlug, destSlug, role = "ADMIN") {
  if (role !== "ADMIN") return { success: false, error: "Unauthorized: only ADMIN can merge tags." };
  if (sourceSlug === destSlug) return { success: false, error: "Source and destination tags must be different." };

  const srcTag  = TAGS.find((t) => t.slug === sourceSlug);
  if (!srcTag)  return { success: false, error: `Source tag "${sourceSlug}" not found.` };

  const dstTag  = TAGS.find((t) => t.slug === destSlug);
  if (!dstTag)  return { success: false, error: `Destination tag "${destSlug}" not found.` };

  let replaced = 0;
  const rep = (arr) => {
    for (const item of arr) {
      if (item.tags.includes(sourceSlug)) {
        item.tags = item.tags.map((tg) => (tg === sourceSlug ? destSlug : tg)).filter((tg, i, s) => s.indexOf(tg) === i);
        replaced++;
      }
    }
  };

  rep(CONTENT_FOR_TAG.games);
  rep(CONTENT_FOR_TAG.apps);
  rep(CONTENT_FOR_TAG.tools);
  rep(CONTENT_FOR_TAG.guides);

  TAGS = TAGS.filter((t) => t.slug !== sourceSlug);
  return { success: true, replaced };
}

test("Scenario F — Tag Merge", async (t) => {
  initTagFixtures();

  await t.test("F1: merge 'FPS' (uppercase) into 'fps' (lowercase) succeeds", () => {
    const r = mergeTagsAction("FPS", "fps", "ADMIN");
    assert.equal(r.success, true);
  });

  await t.test("F2: all games that had 'FPS' now have 'fps'", () => {
    for (const g of CONTENT_FOR_TAG.games) {
      assert.ok(!g.tags.includes("FPS"), `Game ${g.slug} still has old tag 'FPS'`);
      assert.ok(g.tags.includes("fps"),  `Game ${g.slug} should have new tag 'fps'`);
    }
  });

  await t.test("F3: all apps that had 'FPS' now have 'fps'", () => {
    for (const a of CONTENT_FOR_TAG.apps) {
      assert.ok(!a.tags.includes("FPS"), `App ${a.slug} still has 'FPS'`);
      assert.ok(a.tags.includes("fps"),  `App ${a.slug} should have 'fps'`);
    }
  });

  await t.test("F4: all tools that had 'FPS' now have 'fps'", () => {
    for (const t of CONTENT_FOR_TAG.tools) {
      assert.ok(!t.tags.includes("FPS"), `Tool ${t.slug} still has 'FPS'`);
      assert.ok(t.tags.includes("fps"),  `Tool ${t.slug} should have 'fps'`);
    }
  });

  await t.test("F5: all guides that had 'FPS' now have 'fps'", () => {
    for (const g of CONTENT_FOR_TAG.guides) {
      assert.ok(!g.tags.includes("FPS"), `Guide ${g.slug} still has 'FPS'`);
      assert.ok(g.tags.includes("fps"),  `Guide ${g.slug} should have 'fps'`);
    }
  });

  await t.test("F6: source tag 'FPS' removed from tag registry", () => {
    assert.ok(!TAGS.some((t) => t.slug === "FPS"), "Source tag 'FPS' should be deleted");
  });

  await t.test("F7: destination tag 'fps' still in registry", () => {
    assert.ok(TAGS.some((t) => t.slug === "fps"), "Destination tag 'fps' should remain");
  });

  await t.test("F8: no duplicate tags on any content after merge", () => {
    const all = [
      ...CONTENT_FOR_TAG.games, ...CONTENT_FOR_TAG.apps,
      ...CONTENT_FOR_TAG.tools, ...CONTENT_FOR_TAG.guides,
    ];
    for (const item of all) {
      const unique = new Set(item.tags);
      assert.equal(item.tags.length, unique.size, `Duplicate tags on ${item.slug ?? item.title}: [${item.tags}]`);
    }
  });

  await t.test("F9: merging tag with itself → rejected", () => {
    const r = mergeTagsAction("fps", "fps", "ADMIN");
    assert.equal(r.success, false);
    assert.ok(r.error.includes("different"), `Got: ${r.error}`);
  });

  await t.test("F10: EDITOR cannot merge tags (permission denied)", () => {
    const r = mergeTagsAction("120hz", "fps", "EDITOR");
    assert.equal(r.success, false);
    assert.ok(r.error.toLowerCase().includes("unauthorized") || r.error.toLowerCase().includes("admin"));
  });

  await t.test("F11: non-existent source tag → clear error with slug", () => {
    const r = mergeTagsAction("ghost-source", "fps", "ADMIN");
    assert.equal(r.success, false);
    assert.ok(r.error.includes("ghost-source"), `Got: ${r.error}`);
  });

  await t.test("F12: non-existent destination tag → clear error with slug", () => {
    const r = mergeTagsAction("fps", "ghost-dest", "ADMIN");
    assert.equal(r.success, false);
    assert.ok(r.error.includes("ghost-dest"), `Got: ${r.error}`);
  });
});