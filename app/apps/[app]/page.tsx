import { notFound } from "next/navigation";
import Link from "next/link";
import { getAppBySlug, getAllAppSlugs } from "@/lib/services/app-service";
import { buildMetadata } from "@/lib/metadata";
import { buildAppOgTitle, buildAppOgDescription } from "@/types/app";
import { DownloadButton } from "@/features/download/DownloadButton";
import { compareReleasesDesc } from "@/lib/download/versions";
import { StatusIndicator, type StatusType } from "@/components/ui/StatusIndicator";
import { Badge } from "@/components/ui/Badge";
import { AppPermissionsList } from "@/components/apps/AppPermissionsList";
import { AppReleaseHistory } from "@/components/apps/AppReleaseHistory";
import { AppInstallGuideSection } from "@/components/apps/AppInstallGuide";
import { AdSlot } from "@/components/monetization/AdSlot";
import {
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  Wrench,
  Gamepad2,
  BookOpen,
  Info,
} from "lucide-react";

interface Props {
  params: Promise<{ app: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllAppSlugs();
  return slugs.map((slug) => ({
    app: slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { app: slug } = await params;
  const app = await getAppBySlug(slug);
  if (!app) return buildMetadata({ title: "App Not Found", noIndex: true });

  return buildMetadata({
    title: buildAppOgTitle(app),
    description: buildAppOgDescription(app),
    path: `/apps/${app.slug}`,
  });
}

const statusMap: Record<string, StatusType> = {
  active: "stable",
  beta: "beta",
  "coming-soon": "coming-soon",
  deprecated: "deprecated",
};

export default async function AppDetailPage({ params }: Props) {
  const { app: slug } = await params;
  const app = await getAppBySlug(slug);
  if (!app) notFound();

  const publishedReleases = (app.releases || [])
    .filter((r) => !r.status || r.status.toLowerCase() === "published")
    .sort(compareReleasesDesc);
  const latestRelease = publishedReleases[0] ?? null;
  const indicatorStatus = statusMap[app.status] || "stable";

  const resolvedDownloadUrl = latestRelease
    ? latestRelease.storagePath
      ? `https://mohagaminglab.com/api/download/release/${encodeURIComponent(latestRelease.id || latestRelease.version)}?app=${encodeURIComponent(app.slug)}`
      : latestRelease.downloadUrl
    : undefined;

  const actualSizeBytes = latestRelease?.fileSizeBytes ?? latestRelease?.fileSize;
  const formattedFileSize = actualSizeBytes
    ? `${(Number(actualSizeBytes) / (1024 * 1024)).toFixed(1)}MB`
    : undefined;

  // JSON-LD Structured Data for SoftwareApplication & Breadcrumbs
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: app.name,
        operatingSystem: "Android",
        applicationCategory: app.category,
        description: app.description,
        softwareVersion: latestRelease?.version ?? "1.0.0",
        downloadUrl: resolvedDownloadUrl,
        fileSize: formattedFileSize,
        author: {
          "@type": "Organization",
          name: app.developer,
          url: app.developerUrl ?? undefined,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://mohagaminglab.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Apps",
            item: "https://mohagaminglab.com/apps",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: app.name,
            item: `https://mohagaminglab.com/apps/${app.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-content section flex flex-col gap-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
          <Link href="/" className="hover:text-text-primary transition-colors">
            Home
          </Link>
          <ChevronRight size={12} aria-hidden="true" />
          <Link href="/apps" className="hover:text-text-primary transition-colors">
            Apps
          </Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="text-accent truncate max-w-xs" aria-current="page">
            {app.name}
          </span>
        </nav>

        {/* App Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-border-default pb-8">
          <div className="flex items-start gap-4">
            {/* App Icon Monogram */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-bg-elevated border border-border-default flex items-center justify-center flex-shrink-0 text-accent font-mono font-bold text-xl sm:text-2xl shadow-sm"
              aria-hidden="true"
            >
              {app.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" size="sm">{app.category}</Badge>
                <StatusIndicator status={indicatorStatus} variant="badge" />
                {latestRelease?.verificationStatus === "verified" && (
                  <Badge variant="success" size="sm" className="flex items-center gap-1">
                    <ShieldCheck size={11} />
                    <span>Verified Signature</span>
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-text-primary">
                {app.name}
              </h1>

              <div className="flex items-center gap-3 text-xs font-mono text-text-muted flex-wrap">
                <span>By {app.developer}</span>
                {app.packageName && (
                  <>
                    <span>•</span>
                    <code>{app.packageName}</code>
                  </>
                )}
                <span>•</span>
                <span className="text-accent font-semibold">
                  v{latestRelease?.version ?? "Latest"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Info Column (col-span-2) */}
          <div className="lg:col-span-2 flex flex-col gap-10">
            {/* Overview Section */}
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted">
                Application Overview
              </h2>
              <p className="text-base text-text-secondary leading-relaxed">
                {app.description}
              </p>
            </div>

            {/* Key Features */}
            {app.features.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted">
                  Key Capabilities
                </h2>
                <div className="border border-border-default rounded-md p-5 bg-bg-surface">
                  <ul className="flex flex-col gap-2.5" role="list">
                    {app.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-text-secondary">
                        <span className="text-accent font-mono font-bold mt-0.5" aria-hidden="true">
                          ›
                        </span>
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Technical Specifications & Compatibility Matrix */}
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted">
                Compatibility & System Specifications
              </h2>
              <div className="border border-border-default rounded-md overflow-hidden bg-bg-surface">
                <dl className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle text-xs font-mono">
                  <div className="p-4 flex flex-col gap-1">
                    <dt className="text-text-muted">Minimum Android Version</dt>
                    <dd className="text-text-primary text-sm font-semibold">
                      Android {app.minAndroidVersion} (API {app.minApiLevel})
                    </dd>
                  </div>
                  <div className="p-4 flex flex-col gap-1">
                    <dt className="text-text-muted">Target SDK Level</dt>
                    <dd className="text-text-primary text-sm font-semibold">
                      API {app.targetSdkVersion ?? 34}
                    </dd>
                  </div>
                  <div className="p-4 flex flex-col gap-1 border-t border-border-subtle">
                    <dt className="text-text-muted">Supported CPU Architectures</dt>
                    <dd className="text-text-primary text-sm font-semibold">
                      {app.architectures.join(", ")}
                    </dd>
                  </div>
                  <div className="p-4 flex flex-col gap-1 border-t border-border-subtle">
                    <dt className="text-text-muted">Privilege Requirement</dt>
                    <dd className="text-text-primary text-sm font-semibold flex items-center gap-1.5">
                      {app.requiresRoot ? (
                        <Badge variant="warning" size="sm">Root Superuser Required</Badge>
                      ) : app.requiresShizuku ? (
                        <Badge variant="outline" size="sm">Shizuku / ADB Required</Badge>
                      ) : (
                        <Badge variant="success" size="sm">No Root Access Needed</Badge>
                      )}
                    </dd>
                  </div>
                  <div className="p-4 flex flex-col gap-1 border-t border-border-subtle">
                    <dt className="text-text-muted">Package Identifier</dt>
                    <dd className="text-text-secondary truncate">
                      {app.packageName ?? "Not available"}
                    </dd>
                  </div>
                  <div className="p-4 flex flex-col gap-1 border-t border-border-subtle">
                    <dt className="text-text-muted">Software License</dt>
                    <dd className="text-text-secondary truncate">
                      {app.license}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Ad Slot — Below App Overview (respects MAX_ADS_PER_PAGE=2 for APP) */}
            <AdSlot placement="app_after_overview" />

            {/* Android Permissions Audit */}
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted">
                Required Android Permissions
              </h2>
              <AppPermissionsList permissions={app.permissions} />
            </div>

            {/* Releases & Download History */}
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted">
                Releases & Checksums
              </h2>
              <AppReleaseHistory app={app} />
            </div>

            {/* Installation, Setup & Troubleshooting */}
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted">
                Installation & Operation Guide
              </h2>
              <div className="border border-border-default rounded-md p-6 bg-bg-surface">
                <AppInstallGuideSection guide={app.installGuide} appName={app.name} />
              </div>
            </div>

            {/* Verified Hardware & Safety Disclaimer */}
            <div className="p-5 rounded-lg border border-border-subtle bg-bg-elevated/30 flex items-start gap-3 text-xs text-text-muted">
              <Info size={16} className="text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex flex-col gap-1 leading-relaxed">
                <span className="font-semibold text-text-secondary">
                  Integrity & Safety Guarantee
                </span>
                <span>
                  All APK binaries referenced on Moha Gaming Lab are sourced directly from upstream developer repositories or official release channels. SHA-256 digests are verified against developer release tags. Always verify the downloaded file hash against the published digest before installation.
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar Column (col-span-1) */}
          <div className="flex flex-col gap-6">
            {/* Primary Download Card */}
            <div className="p-5 rounded-lg border border-border-default bg-bg-surface flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                  Direct Download
                </span>
                <span className="text-xs font-mono font-semibold text-accent">
                  v{latestRelease?.version ?? "1.0.0"}
                </span>
              </div>

              <DownloadButton app={app} />

              <div className="pt-3 border-t border-border-subtle flex flex-col gap-2 text-2xs font-mono text-text-muted">
                <div className="flex justify-between">
                  <span>Android:</span>
                  <span className="text-text-secondary">{app.minAndroidVersion}+</span>
                </div>
                <div className="flex justify-between">
                  <span>Architecture:</span>
                  <span className="text-text-secondary">{app.architectures[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Developer:</span>
                  <span className="text-text-secondary truncate max-w-[140px]">{app.developer}</span>
                </div>
                {app.developerUrl && (
                  <div className="pt-2 border-t border-border-subtle">
                    <a
                      href={app.developerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline flex items-center gap-1"
                    >
                      <span>Visit Developer Site</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Ad Slot — Sidebar Contextual (2nd of 2 allowed on APP pages) */}
            <AdSlot placement="app_after_overview" format="RECTANGLE_MEDIUM" />

            {/* Related Games */}
            {app.relatedGames && app.relatedGames.length > 0 && (
              <div className="p-5 rounded-lg border border-border-default bg-bg-surface flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-text-primary font-semibold">
                  <Gamepad2 size={14} className="text-accent" />
                  <span>Compatible Games</span>
                </div>
                <div className="flex flex-col gap-2">
                  {app.relatedGames.map((gameSlug) => (
                    <Link
                      key={gameSlug}
                      href={`/games/${gameSlug}`}
                      className="p-2.5 rounded bg-bg-elevated hover:bg-bg-overlay border border-border-subtle text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center justify-between"
                    >
                      <span className="capitalize">{gameSlug.replace(/-/g, " ")}</span>
                      <ChevronRight size={12} className="text-accent" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Diagnostic Tools */}
            {app.relatedTools && app.relatedTools.length > 0 && (
              <div className="p-5 rounded-lg border border-border-default bg-bg-surface flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-text-primary font-semibold">
                  <Wrench size={14} className="text-accent" />
                  <span>Related Diagnostic Tools</span>
                </div>
                <div className="flex flex-col gap-2">
                  {app.relatedTools.map((toolSlug) => (
                    <Link
                      key={toolSlug}
                      href={`/tools/${toolSlug}`}
                      className="p-2.5 rounded bg-bg-elevated hover:bg-bg-overlay border border-border-subtle text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center justify-between"
                    >
                      <span className="capitalize">{toolSlug.replace(/-/g, " ")}</span>
                      <ChevronRight size={12} className="text-accent" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Technical Guides */}
            {app.relatedGuides && app.relatedGuides.length > 0 && (
              <div className="p-5 rounded-lg border border-border-default bg-bg-surface flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-text-primary font-semibold">
                  <BookOpen size={14} className="text-accent" />
                  <span>Technical Guides</span>
                </div>
                <div className="flex flex-col gap-2">
                  {app.relatedGuides.map((guideSlug) => (
                    <Link
                      key={guideSlug}
                      href="/guides"
                      className="p-2.5 rounded bg-bg-elevated hover:bg-bg-overlay border border-border-subtle text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center justify-between"
                    >
                      <span className="capitalize">{guideSlug.replace(/-/g, " ")}</span>
                      <ChevronRight size={12} className="text-accent" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
