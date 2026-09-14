import { notFound } from "next/navigation";
import Link from "next/link";
import { getGuideBySlug, getAllGuideSlugs } from "@/lib/services/guide-service";
import { buildMetadata } from "@/lib/metadata";
import { buildGuideOgTitle, buildGuideOgDescription } from "@/types/guide";
import { extractTableOfContents } from "@/lib/guides";
import { TableOfContents } from "@/components/guides/TableOfContents";
import { GuideContentRenderer } from "@/components/guides/GuideContentRenderer";
import { GuideFaqSection } from "@/components/guides/GuideFaqSection";
import { Badge } from "@/components/ui/Badge";
import { AdSlot } from "@/components/monetization/AdSlot";
import {
  ChevronRight,
  Clock,
  Calendar,
  Wrench,
  Gamepad2,
  Smartphone,
  BookOpen,
  Info,
  CheckCircle2,
} from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllGuideSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) return buildMetadata({ title: "Guide Not Found", noIndex: true });

  return buildMetadata({
    title: buildGuideOgTitle(guide),
    description: buildGuideOgDescription(guide),
    path: `/guides/${guide.slug}`,
  });
}

const difficultyBadgeVariant: Record<string, "success" | "warning" | "error" | "default"> = {
  Beginner: "success",
  Intermediate: "warning",
  Advanced: "error",
};

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) notFound();

  const tocItems = extractTableOfContents(guide.sections);

  const publishedFormatted = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(guide.publishedAt));

  const updatedFormatted = guide.updatedAt
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(guide.updatedAt))
    : null;

  // JSON-LD Structured Data for Article, BreadcrumbList, and FAQPage
  const jsonLdGraph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      datePublished: guide.publishedAt,
      dateModified: guide.updatedAt ?? guide.publishedAt,
      author: {
        "@type": "Organization",
        name: guide.author.name,
      },
      publisher: {
        "@type": "Organization",
        name: "Moha Gaming Lab",
        url: "https://mohagaminglab.com",
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://mohagaminglab.com/guides/${guide.slug}`,
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
          name: "Guides",
          item: "https://mohagaminglab.com/guides",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: guide.title,
          item: `https://mohagaminglab.com/guides/${guide.slug}`,
        },
      ],
    },
  ];

  if (guide.faqs && guide.faqs.length > 0) {
    jsonLdGraph.push({
      "@type": "FAQPage",
      mainEntity: guide.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": jsonLdGraph,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-content section flex flex-col gap-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-mono text-text-muted flex-wrap">
          <Link href="/" className="hover:text-text-primary transition-colors">
            Home
          </Link>
          <ChevronRight size={12} aria-hidden="true" />
          <Link href="/guides" className="hover:text-text-primary transition-colors">
            Guides
          </Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="text-text-secondary">{guide.category}</span>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="text-accent truncate max-w-xs" aria-current="page">
            {guide.title}
          </span>
        </nav>

        {/* Article Header */}
        <header className="flex flex-col gap-4 border-b border-border-default pb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" size="sm">{guide.category}</Badge>
            <Badge variant="default" size="sm">{guide.contentType}</Badge>
            <Badge variant={difficultyBadgeVariant[guide.difficulty]} size="sm">
              {guide.difficulty}
            </Badge>
            <span className="text-2xs font-mono text-text-muted">v{guide.version}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-text-primary leading-tight">
            {guide.title}
          </h1>

          <p className="text-lg text-text-secondary leading-relaxed max-w-3xl">
            {guide.excerpt}
          </p>

          <div className="flex items-center gap-4 text-xs font-mono text-text-muted flex-wrap pt-2">
            <span className="text-text-primary font-semibold">
              By {guide.author.name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar size={13} aria-hidden="true" />
              Published {publishedFormatted}
            </span>
            {updatedFormatted && (
              <>
                <span>•</span>
                <span>Updated {updatedFormatted}</span>
              </>
            )}
            <span>•</span>
            <span className="flex items-center gap-1 text-accent">
              <Clock size={13} aria-hidden="true" />
              {guide.readingTimeMinutes} min read
            </span>
          </div>
        </header>

        {/* Executive Summary Takeaways Box */}
        {guide.summary && guide.summary.length > 0 && (
          <div className="p-5 sm:p-6 rounded-lg border border-accent/30 bg-accent/5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent font-semibold">
              <CheckCircle2 size={16} />
              <span>Core Takeaways & Quick Summary</span>
            </div>
            <ul className="flex flex-col gap-2 pl-4 list-disc text-sm text-text-secondary leading-relaxed">
              {guide.summary.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Main 2-Column Content Layout: Article + TOC/Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Article Body (col-span-8) */}
          <article className="lg:col-span-8 flex flex-col min-w-0">
            {/* Structured Content Sections */}
            <GuideContentRenderer sections={guide.sections} />

            {/* Optional FAQ Section */}
            {guide.faqs && guide.faqs.length > 0 && (
              <GuideFaqSection faqs={guide.faqs} />
            )}

            {/* Hardware & Engineering Safety Disclaimer */}
            <div className="mt-12 p-5 rounded-lg border border-border-subtle bg-bg-elevated/30 flex items-start gap-3 text-xs text-text-muted">
              <Info size={16} className="text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex flex-col gap-1 leading-relaxed">
                <span className="font-semibold text-text-secondary">
                  Engineering Safety Advisory
                </span>
                <span>
                  Performance values described in this guide reflect physical architecture principles and hardware benchmarks. Real-world frame stability varies based on your specific device SoC, ambient room temperature, and battery charge level. Always test one setting at a time.
                </span>
              </div>
            </div>

            {/* Ad Slot — After guide article body (guide_after_content, 1 of 2) */}
            <AdSlot placement="guide_after_content" />
          </article>

          {/* Sticky Sidebar Column (col-span-4) */}
          <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-20">
            {/* Table of Contents */}
            <TableOfContents items={tocItems} />

            {/* Ad Slot — Mid-article sidebar rectangle (guide_mid_content, 2 of 2) */}
            <AdSlot placement="guide_mid_content" />

            {/* Related Diagnostic Tools */}
            {guide.toolIds && guide.toolIds.length > 0 && (
              <div className="p-5 rounded-lg border border-border-default bg-bg-surface flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-text-primary font-semibold">
                  <Wrench size={14} className="text-accent" />
                  <span>Verify with Live Tools</span>
                </div>
                <div className="flex flex-col gap-2">
                  {guide.toolIds.map((toolSlug) => (
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

            {/* Compatible Games */}
            {guide.gameIds && guide.gameIds.length > 0 && (
              <div className="p-5 rounded-lg border border-border-default bg-bg-surface flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-text-primary font-semibold">
                  <Gamepad2 size={14} className="text-accent" />
                  <span>Game Performance Profiles</span>
                </div>
                <div className="flex flex-col gap-2">
                  {guide.gameIds.map((gameSlug) => (
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

            {/* Related Android Apps */}
            {guide.appIds && guide.appIds.length > 0 && (
              <div className="p-5 rounded-lg border border-border-default bg-bg-surface flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-text-primary font-semibold">
                  <Smartphone size={14} className="text-accent" />
                  <span>Recommended Android Utilities</span>
                </div>
                <div className="flex flex-col gap-2">
                  {guide.appIds.map((appSlug) => (
                    <Link
                      key={appSlug}
                      href={`/apps/${appSlug}`}
                      className="p-2.5 rounded bg-bg-elevated hover:bg-bg-overlay border border-border-subtle text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center justify-between"
                    >
                      <span className="capitalize">{appSlug.replace(/-/g, " ")}</span>
                      <ChevronRight size={12} className="text-accent" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Guides */}
            {guide.relatedGuideSlugs && guide.relatedGuideSlugs.length > 0 && (
              <div className="p-5 rounded-lg border border-border-default bg-bg-surface flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-text-primary font-semibold">
                  <BookOpen size={14} className="text-accent" />
                  <span>Related Knowledge Base</span>
                </div>
                <div className="flex flex-col gap-2">
                  {guide.relatedGuideSlugs.map((slug) => (
                    <Link
                      key={slug}
                      href={`/guides/${slug}`}
                      className="p-2.5 rounded bg-bg-elevated hover:bg-bg-overlay border border-border-subtle text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center justify-between"
                    >
                      <span className="capitalize">{slug.replace(/-/g, " ")}</span>
                      <ChevronRight size={12} className="text-accent" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
