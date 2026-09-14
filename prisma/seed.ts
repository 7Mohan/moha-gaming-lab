/**
 * prisma/seed.ts
 * ────────────────────────────────────────────────────────────────
 * Development database seeder for Moha Gaming Lab.
 * Populates PostgreSQL from the platform's core content corpus.
 *
 * Usage:
 *   npx prisma db seed
 *   or: node --loader ts-node/esm prisma/seed.ts
 */

import { prisma } from "../lib/db/prisma";
import { games } from "../data/games";
import { apps } from "../data/apps";
import { tools } from "../data/tools";
import { guides } from "../data/guides";

async function main() {
  console.log("🌱 Starting Moha Gaming Lab database seed...");

  // 1. Seed Tags
  console.log("Seeding Tags...");
  const tagSet = new Set<string>();
  games.forEach((g) => g.tags.forEach((t) => tagSet.add(t)));
  apps.forEach((a) => a.tags.forEach((t) => tagSet.add(t)));
  tools.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
  guides.forEach((g) => g.tags.forEach((t) => tagSet.add(t)));

  for (const tagSlug of tagSet) {
    const tagName = tagSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    await prisma.tag.upsert({
      where: { slug: tagSlug },
      update: { name: tagName },
      create: {
        slug: tagSlug,
        name: tagName,
      },
    });
  }

  // 2. Seed Categories
  console.log("Seeding Categories...");
  const gameCategories = Array.from(new Set(games.map((g) => g.category)));
  for (const cat of gameCategories) {
    await prisma.category.upsert({
      where: { slug: cat },
      update: {},
      create: {
        slug: cat,
        name: cat.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        sectionType: "GAME",
      },
    });
  }

  const appCategories = Array.from(new Set(apps.map((a) => a.category)));
  for (const cat of appCategories) {
    const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: cat,
        sectionType: "APP",
      },
    });
  }

  const toolCategories = Array.from(new Set(tools.map((t) => t.category)));
  for (const cat of toolCategories) {
    await prisma.category.upsert({
      where: { slug: `tool-${cat}` },
      update: {},
      create: {
        slug: `tool-${cat}`,
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        sectionType: "TOOL",
      },
    });
  }

  const guideCategories = Array.from(new Set(guides.map((g) => g.category)));
  for (const cat of guideCategories) {
    const slug = `guide-${cat.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: cat,
        sectionType: "GUIDE",
      },
    });
  }

  // 3. Seed Games
  console.log("Seeding Games...");
  for (const g of games) {
    await prisma.game.upsert({
      where: { slug: g.slug },
      update: {
        name: g.name,
        altNames: [],
        excerpt: g.excerpt,
        description: g.description,
        genres: [g.category],
        performanceAreas: g.performanceAreas,
        deviceTier: g.deviceTier,
        fpsCap: null,
        touchSamplingRate: null,
        thermalProfile: null,
        recommendations: g.optimizationRecs ? JSON.parse(JSON.stringify(g.optimizationRecs)) : undefined,
        commonProblems: g.commonProblems ? JSON.parse(JSON.stringify(g.commonProblems)) : undefined,
        status: "PUBLISHED",
      },
      create: {
        slug: g.slug,
        name: g.name,
        altNames: [],
        excerpt: g.excerpt,
        description: g.description,
        genres: [g.category],
        performanceAreas: g.performanceAreas,
        deviceTier: g.deviceTier,
        fpsCap: null,
        touchSamplingRate: null,
        thermalProfile: null,
        recommendations: g.optimizationRecs ? JSON.parse(JSON.stringify(g.optimizationRecs)) : undefined,
        commonProblems: g.commonProblems ? JSON.parse(JSON.stringify(g.commonProblems)) : undefined,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }

  // 4. Seed Apps & Releases
  console.log("Seeding Apps & Releases...");
  for (const a of apps) {
    const createdApp = await prisma.app.upsert({
      where: { slug: a.slug },
      update: {
        name: a.name,
        packageName: a.packageName,
        excerpt: a.excerpt,
        description: a.description,
        developer: a.developer,
        website: a.developerUrl,
        license: a.license,
        requiresRoot: a.requiresRoot,
        targetSdkVersion: a.targetSdkVersion,
        features: a.features,
        status: "PUBLISHED",
        verificationStatus: "VERIFIED",
        permissions: a.permissions ? JSON.parse(JSON.stringify(a.permissions)) : undefined,
        installGuide: a.installGuide ? JSON.parse(JSON.stringify(a.installGuide)) : undefined,
      },
      create: {
        slug: a.slug,
        name: a.name,
        packageName: a.packageName,
        excerpt: a.excerpt,
        description: a.description,
        developer: a.developer,
        website: a.developerUrl,
        license: a.license,
        requiresRoot: a.requiresRoot,
        targetSdkVersion: a.targetSdkVersion,
        features: a.features,
        status: "PUBLISHED",
        verificationStatus: "VERIFIED",
        permissions: a.permissions ? JSON.parse(JSON.stringify(a.permissions)) : undefined,
        installGuide: a.installGuide ? JSON.parse(JSON.stringify(a.installGuide)) : undefined,
        publishedAt: new Date(),
      },
    });

    // Seed Releases
    for (let i = 0; i < a.releases.length; i++) {
      const rel = a.releases[i];
      if (!rel) continue;

      const releaseDate = rel.releaseDate ? new Date(rel.releaseDate) : new Date();

      const createdRelease = await prisma.appRelease.create({
        data: {
          appId: createdApp.id,
          version: rel.version,
          targetSdkVersion: rel.targetSdkVersion,
          releaseDate,
          androidMinVersion: rel.androidMinVersion || "8.0",
          architectures: rel.architectures || ["arm64-v8a"],
          fileSize: rel.fileSize ? BigInt(rel.fileSize) : null,
          downloadUrl: rel.downloadUrl,
          sourceUrl: rel.sourceUrl,
          sourceName: rel.sourceName,
          checksumSha256: rel.checksumSha256,
          checksumMd5: rel.checksumMd5,
          verificationStatus: rel.verificationStatus === "verified" ? "VERIFIED" : "UNVERIFIED",
          verificationEvidence: rel.verificationEvidence,
          changelog: rel.changelog || [],
          isLatest: i === 0,
        },
      });

      // Seed Download Source
      if (rel.downloadUrl) {
        await prisma.downloadSource.create({
          data: {
            releaseId: createdRelease.id,
            name: rel.sourceName,
            url: rel.downloadUrl,
            isOfficial: true,
            isDirect: false,
            verificationStatus: rel.verificationStatus === "verified" ? "VERIFIED" : "UNVERIFIED",
            fileSize: rel.fileSize ? BigInt(rel.fileSize) : null,
            checksum: rel.checksumSha256,
            checksumAlgorithm: "sha256",
          },
        });
      }
    }
  }

  // 5. Seed Tools
  console.log("Seeding Tools...");
  for (const t of tools) {
    await prisma.tool.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        shortDescription: t.shortDescription,
        description: t.description,
        platforms: t.platforms,
        status: "PUBLISHED",
        whatItDoes: t.whatItDoes,
        whatItMeasures: t.whatItMeasures,
        capabilities: t.capabilities,
        limitations: t.limitations,
        technicalExplanation: t.technicalExplanation,
        howToInterpret: t.howToInterpret,
        featured: t.featured ?? false,
        difficulty: t.difficulty === "advanced" ? "ADVANCED" : t.difficulty === "intermediate" ? "INTERMEDIATE" : "BEGINNER",
        requiresWebGl: t.requiresWebGl ?? false,
        requiresRoot: t.requiresRoot ?? false,
      },
      create: {
        slug: t.slug,
        name: t.name,
        shortDescription: t.shortDescription,
        description: t.description,
        platforms: t.platforms,
        status: "PUBLISHED",
        whatItDoes: t.whatItDoes,
        whatItMeasures: t.whatItMeasures,
        capabilities: t.capabilities,
        limitations: t.limitations,
        technicalExplanation: t.technicalExplanation,
        howToInterpret: t.howToInterpret,
        featured: t.featured ?? false,
        difficulty: t.difficulty === "advanced" ? "ADVANCED" : t.difficulty === "intermediate" ? "INTERMEDIATE" : "BEGINNER",
        requiresWebGl: t.requiresWebGl ?? false,
        requiresRoot: t.requiresRoot ?? false,
        publishedAt: new Date(),
      },
    });
  }

  // 6. Seed Guides
  console.log("Seeding Guides...");
  for (const g of guides) {
    await prisma.guide.upsert({
      where: { slug: g.slug },
      update: {
        title: g.title,
        excerpt: g.excerpt,
        description: g.description,
        contentType: g.contentType,
        difficulty: g.difficulty === "Advanced" ? "ADVANCED" : g.difficulty === "Intermediate" ? "INTERMEDIATE" : "BEGINNER",
        readingTimeMinutes: g.readingTimeMinutes,
        authorName: g.author?.name || "Moha Gaming Lab",
        authorRole: g.author?.role || "Performance Engineering Team",
        sections: JSON.parse(JSON.stringify(g.sections)),
        faqs: g.faqs ? JSON.parse(JSON.stringify(g.faqs)) : undefined,
        status: "PUBLISHED",
      },
      create: {
        slug: g.slug,
        title: g.title,
        excerpt: g.excerpt,
        description: g.description,
        contentType: g.contentType,
        difficulty: g.difficulty === "Advanced" ? "ADVANCED" : g.difficulty === "Intermediate" ? "INTERMEDIATE" : "BEGINNER",
        readingTimeMinutes: g.readingTimeMinutes,
        authorName: g.author?.name || "Moha Gaming Lab",
        authorRole: g.author?.role || "Performance Engineering Team",
        sections: JSON.parse(JSON.stringify(g.sections)),
        faqs: g.faqs ? JSON.parse(JSON.stringify(g.faqs)) : undefined,
        status: "PUBLISHED",
        publishedAt: new Date(g.publishedAt || Date.now()),
      },
    });
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
