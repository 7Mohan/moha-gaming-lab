import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuideById, getGuideBySlug } from "@/lib/services/guide-service";
import { Breadcrumb } from "@/components/admin/ui/Breadcrumb";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { publishGuideAction } from "@/app/admin/(dashboard)/guides/actions";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

interface GuidePreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function GuidePreviewPage({ params }: GuidePreviewPageProps) {
  const { id } = await params;

  let guide = await getGuideById(id);
  if (!guide) {
    guide = await getGuideBySlug(id);
  }

  if (!guide) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-20">
      <Breadcrumb
        items={[
          { label: "Guides", href: "/admin/guides" },
          { label: guide.title, href: `/admin/guides/${guide.id}` },
          { label: "Live Preview" },
        ]}
      />

      {/* Admin Floating Control Bar */}
      <div className="p-4 rounded-2xl bg-[#0E131F] border border-primary/30 shadow-xl shadow-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <div>
            <span className="text-xs font-mono font-bold text-white block">
              Editorial Preview Mode
            </span>
            <span className="text-[11px] text-text-tertiary">
              Viewing exact public layout and structured section rendering.
            </span>
          </div>
          <StatusBadge status={guide.status.toUpperCase()} size="sm" />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/guides/${guide.id}`}
            className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white transition-colors"
          >
            ← Back to Editor
          </Link>
          {guide.status !== "published" && (
            <form
              action={async () => {
                "use server";
                await publishGuideAction(guide.id);
                revalidatePath(`/admin/guides/${guide.id}/preview`);
              }}
            >
              <button
                type="submit"
                className="py-1.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono transition-colors shadow-lg shadow-emerald-500/20"
              >
                Publish Now
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Article Mockup View */}
      <article className="bg-[#0E131F] rounded-3xl border border-white/10 p-6 sm:p-10 lg:p-12 space-y-8 max-w-4xl mx-auto shadow-2xl shadow-black/50">
        {/* Header */}
        <header className="space-y-4 border-b border-white/10 pb-8">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
              {guide.category}
            </span>
            <span className="text-xs font-mono text-text-tertiary">
              {guide.readingTimeMinutes} min read
            </span>
            <span className="text-xs font-mono text-text-tertiary">•</span>
            <span className="text-xs font-mono text-text-tertiary">
              {guide.difficulty}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            {guide.title}
          </h1>

          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            {guide.description || guide.excerpt}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/30 to-accent/30 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-white">
              {guide.author?.name?.charAt(0) || "M"}
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {guide.author?.name || "Moha Specialist"}
              </span>
              <span className="text-[11px] font-mono text-text-tertiary">
                {guide.author?.role || "Staff Engineer"}
              </span>
            </div>
          </div>
        </header>

        {/* Content Sections */}
        <div className="space-y-8">
          {guide.sections.map((sec, idx) => (
            <section key={sec.id || idx} className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span className="font-mono text-xs text-primary font-normal">
                  0{idx + 1}.
                </span>
                <span>{sec.title}</span>
              </h2>
              <div className="text-sm text-text-secondary leading-relaxed font-sans space-y-2">
                {(sec.paragraphs && sec.paragraphs.length > 0)
                  ? sec.paragraphs.map((p, pi) => <p key={pi}>{p}</p>)
                  : <p className="text-text-tertiary italic">No content yet.</p>
                }
              </div>
            </section>
          ))}
        </div>

        {/* FAQs */}
        {guide.faqs && guide.faqs.length > 0 && (
          <section className="border-t border-white/10 pt-8 space-y-4">
            <h3 className="text-base font-bold text-white tracking-wide">
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {guide.faqs.map((faq, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5"
                >
                  <h4 className="text-xs font-bold text-white">{faq.question}</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
