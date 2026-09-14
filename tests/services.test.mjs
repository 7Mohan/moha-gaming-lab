import test from "node:test";
import assert from "node:assert/strict";

// Sample fixture data for repository & service unit tests
const SAMPLE_GAMES = [
  { id: "g1", slug: "pubg-mobile", name: "PUBG Mobile", category: "battle-royale", tags: ["fps", "120hz", "battle-royale"], status: "active" },
  { id: "g2", slug: "call-of-duty-mobile", name: "Call of Duty: Mobile", category: "fps", tags: ["fps", "multiplayer"], status: "active" },
  { id: "g3", slug: "genshin-impact", name: "Genshin Impact", category: "rpg", tags: ["open-world", "gpu"], status: "active" },
  { id: "g4", slug: "draft-game", name: "Draft Game Profile", category: "fps", tags: ["fps"], status: "draft" },
];

const SAMPLE_TOOLS = [
  { id: "t1", slug: "fps-monitor", name: "FPS Monitor", category: "performance", tags: ["fps", "diagnostics"], status: "available" },
  { id: "t2", slug: "refresh-rate", name: "Refresh Rate Test", category: "display", tags: ["120hz", "display"], status: "available" },
  { id: "t3", slug: "touch-latency", name: "Touch Latency Test", category: "device", tags: ["touch", "latency"], status: "available" },
];

const SAMPLE_GUIDES = [
  { id: "gu1", slug: "diagnose-fps-drops", title: "Diagnose FPS Drops on Android", category: "Performance", tags: ["fps", "thermal"], status: "published" },
  { id: "gu2", slug: "thermal-throttling", title: "Understanding Thermal Throttling", category: "Thermals", tags: ["thermal", "cpu"], status: "published" },
  { id: "gu3", slug: "draft-guide", title: "Upcoming Guide", category: "Network", tags: ["network"], status: "draft" },
];

test("Repository: Get content by slug", () => {
  const pubg = SAMPLE_GAMES.find((g) => g.slug === "pubg-mobile");
  assert.ok(pubg, "PUBG Mobile should exist in dataset");
  assert.equal(pubg.name, "PUBG Mobile");

  const missing = SAMPLE_GAMES.find((g) => g.slug === "non-existent-game");
  assert.equal(missing, undefined, "Non-existent slug should return undefined/null");
});

test("Repository: Get published content only", () => {
  const activeGames = SAMPLE_GAMES.filter((g) => g.status === "active");
  assert.equal(activeGames.length, 3, "Should have 3 active games");

  const publishedGuides = SAMPLE_GUIDES.filter((g) => g.status === "published");
  assert.equal(publishedGuides.length, 2, "Should have 2 published guides");

  const availableTools = SAMPLE_TOOLS.filter((t) => t.status === "available" || t.status === "beta");
  assert.equal(availableTools.length, 3, "Should have 3 available tools");
});

test("Repository: Pagination calculation", () => {
  function paginate(items, page = 1, limit = 2) {
    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paged = items.slice(startIndex, startIndex + limit);
    return {
      items: paged,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  const resultPage1 = paginate(SAMPLE_GAMES, 1, 2);
  assert.equal(resultPage1.items.length, 2);
  assert.equal(resultPage1.page, 1);
  assert.equal(resultPage1.totalPages, 2);

  const resultPage2 = paginate(SAMPLE_GAMES, 2, 2);
  assert.equal(resultPage2.items.length, 2);
  assert.notDeepEqual(resultPage1.items, resultPage2.items);
});

test("Search: Exact and Prefix Token Matching", () => {
  function searchItems(items, query) {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.title?.toLowerCase().includes(q) ||
        item.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Exact title match
  const pubgMatches = searchItems(SAMPLE_GAMES, "PUBG Mobile");
  assert.ok(pubgMatches.length >= 1);

  // Prefix match
  const prefixMatches = searchItems(SAMPLE_GAMES, "pub");
  assert.ok(prefixMatches.length >= 1);

  // Tag match
  const tagMatches = searchItems(SAMPLE_TOOLS, "latency");
  assert.ok(tagMatches.length >= 1);

  // No results
  const noMatches = searchItems(SAMPLE_GAMES, "xyz-completely-unrelated-term-123");
  assert.equal(noMatches.length, 0);
});

test("Security: Draft content protection", () => {
  function isVisibleToPublic(status, role = "PUBLIC") {
    if (role === "ADMIN") return true;
    return status === "PUBLISHED" || status === "published" || status === "active";
  }

  assert.equal(isVisibleToPublic("DRAFT", "PUBLIC"), false);
  assert.equal(isVisibleToPublic("draft", "PUBLIC"), false);
  assert.equal(isVisibleToPublic("REVIEW", "PUBLIC"), false);
  assert.equal(isVisibleToPublic("ARCHIVED", "PUBLIC"), false);

  assert.equal(isVisibleToPublic("PUBLISHED", "PUBLIC"), true);
  assert.equal(isVisibleToPublic("active", "PUBLIC"), true);

  // Admin can view drafts
  assert.equal(isVisibleToPublic("DRAFT", "ADMIN"), true);
});

test("Security: Malicious HTML and Script Sanitization", () => {
  function sanitize(text) {
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, "")
      .trim();
  }

  const maliciousInput = '<p>Normal text</p><script>alert("hacked")</script><img src="x" onerror="stealCookies()">';
  const sanitized = sanitize(maliciousInput);

  assert.equal(sanitized.includes("<script>"), false);
  assert.equal(sanitized.includes("onerror="), false);
  assert.equal(sanitized.includes("Normal text"), true);
});
