"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminForm, FormSection } from "@/components/admin/ui/AdminForm";
import {
  FormLabel,
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormHelperText,
} from "@/components/admin/ui/FormField";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import {
  createGuideAction,
  updateGuideAction,
  deleteGuideAction,
  publishGuideAction,
  submitForReviewAction,
  type GuideActionResult,
} from "@/app/admin/(dashboard)/guides/actions";
import type {
  Guide,
  GuideCategory,
  GuideContentType,
  GuideDifficulty,
  GuideSection,
  GuideFaq,
} from "@/types/guide";

/** Internal editor type — maps GuideSection.paragraphs to a single `content` string for editing */
interface EditorSection {
  id: string;
  title: string;
  level: "h2" | "h3";
  content: string;
}

interface GuideFormProps {
  initialData?: Guide;
  isNew?: boolean;
}

export function GuideForm({ initialData, isNew = false }: GuideFormProps) {
  const router = useRouter();

  const [title, setTitle] = React.useState(initialData?.title || "");
  const [slug, setSlug] = React.useState(initialData?.slug || "");
  const [excerpt, setExcerpt] = React.useState(initialData?.excerpt || "");
  const [description, setDescription] = React.useState(initialData?.description || "");
  const [category, setCategory] = React.useState(initialData?.category || "Android Gaming");
  const [contentType, setContentType] = React.useState(initialData?.contentType || "Guide");
  const [difficulty, setDifficulty] = React.useState(initialData?.difficulty || "Beginner");
  const [readingTime, setReadingTime] = React.useState(
    String(initialData?.readingTimeMinutes || 5)
  );
  const [authorName, setAuthorName] = React.useState(
    initialData?.author?.name || "Moha Gaming Lab Specialist"
  );
  const [authorRole, setAuthorRole] = React.useState(
    initialData?.author?.role || "Performance Engineer"
  );
  const [status, setStatus] = React.useState<Guide["status"]>(initialData?.status || "draft");
  const [featured, setFeatured] = React.useState(initialData?.featured || false);
  const [tags, setTags] = React.useState(initialData?.tags?.join(", ") || "");

  // Dynamic sections state — use internal EditorSection (content as string)
  const [sections, setSections] = React.useState<EditorSection[]>(
    initialData?.sections
      ? initialData.sections.map((s) => ({
          id: s.id,
          title: s.title,
          level: s.level,
          content: s.paragraphs?.join("\n\n") ?? "",
        }))
      : [
          {
            id: "sec-1",
            title: "Introduction & Architecture",
            level: "h2" as const,
            content: "Explain the core mechanics and what performance metrics are targeted.",
          },
        ]
  );

  // Dynamic FAQs state
  const [faqs, setFaqs] = React.useState<GuideFaq[]>(
    initialData?.faqs || [
      {
        question: "Does this optimization require root?",
        answer: "No, this method works on completely stock Android installations.",
      },
    ]
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    if (isNew && !slug) {
      setSlug(
        e.target.value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }

  function addSection() {
    const nextId = `sec-${sections.length + 1}`;
    setSections([
      ...sections,
      {
        id: nextId,
        title: `Section ${sections.length + 1}`,
        level: "h2" as const,
        content: "",
      },
    ]);
  }

  function updateSection(index: number, field: "title" | "content", val: string) {
    const next = [...sections];
    next[index] = { ...next[index]!, [field]: val };
    setSections(next);
  }

  function removeSection(index: number) {
    setSections(sections.filter((_, i) => i !== index));
  }

  function addFaq() {
    setFaqs([...faqs, { question: "", answer: "" }]);
  }

  function updateFaq(index: number, field: "question" | "answer", val: string) {
    const next = [...faqs];
    next[index] = { ...next[index]!, [field]: val };
    setFaqs(next);
  }

  function removeFaq(index: number) {
    setFaqs(faqs.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("slug", slug);
    formData.append("excerpt", excerpt);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("contentType", contentType);
    formData.append("difficulty", difficulty);
    formData.append("readingTimeMinutes", readingTime);
    formData.append("authorName", authorName);
    formData.append("authorRole", authorRole);
    formData.append("status", status);
    formData.append("featured", String(featured));
    formData.append("tags", tags);
    formData.append("sectionsJson", JSON.stringify(
      sections.map((s): GuideSection => ({
        id: s.id,
        title: s.title,
        level: s.level,
        paragraphs: s.content ? s.content.split("\n\n").filter(Boolean) : [],
      }))
    ));
    formData.append("faqsJson", JSON.stringify(faqs));

    try {
      let result: GuideActionResult;
      if (isNew) {
        result = await createGuideAction(null, formData);
      } else {
        result = await updateGuideAction(initialData!.id, null, formData);
      }

      if (result.success) {
        setSuccess(`Guide article successfully ${isNew ? "created" : "updated"}!`);
        if (isNew) {
          router.push(`/admin/guides/${result.guideId}`);
        } else {
          router.refresh();
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublish() {
    if (!initialData) return;
    setIsSubmitting(true);
    try {
      const res = await publishGuideAction(initialData.id);
      if (res.success) {
        setStatus("published");
        setSuccess("Guide is now PUBLISHED and live on the public site!");
        router.refresh();
      } else {
        setError(res.error || "Failed to publish guide");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitReview() {
    if (!initialData) return;
    setIsSubmitting(true);
    try {
      const res = await submitForReviewAction(initialData.id);
      if (res.success) {
        setStatus("draft"); // stays as draft until editor publishes
        setSuccess("Guide submitted to the editorial review queue!");
        router.refresh();
      } else {
        setError(res.error || "Failed to submit for review");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initialData) return;
    setIsDeleting(true);
    try {
      const res = await deleteGuideAction(initialData.id);
      if (res.success) {
        router.push("/admin/guides");
      } else {
        setError(res.error || "Failed to delete guide");
        setShowDeleteModal(false);
      }
    } finally {
      setIsDeleting(false);
    }
  }

  const actions = (
    <>
      {!isNew && initialData && (
        <>
          <Link
            href={`/admin/guides/${initialData.id}/preview`}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white transition-colors"
          >
            Live Preview
          </Link>

          {status === "draft" && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitReview}
              className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono transition-colors"
            >
              Submit for Review
            </button>
          )}

          {status !== "published" && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handlePublish}
              className="py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold transition-colors"
            >
              Publish Guide
            </button>
          )}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setShowDeleteModal(true)}
            className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono transition-colors"
          >
            Delete
          </button>
        </>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="py-2 px-4 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold text-xs font-mono shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : isNew ? "Create Draft" : "Save Changes"}
      </button>
    </>
  );

  return (
    <>
      <AdminForm
        title={isNew ? "Author New Guide" : `Edit: ${title || "Guide"}`}
        subtitle="Manage technical documentation, tutorials, troubleshooting guides, and FAQs."
        backHref="/admin/guides"
        breadcrumbs={[
          { label: "Guides", href: "/admin/guides" },
          { label: isNew ? "New Guide" : title || "Edit" },
        ]}
        status={status.toUpperCase()}
        isSubmitting={isSubmitting}
        error={error}
        successMessage={success}
        actions={actions}
        onSubmit={handleSubmit}
      >
        {initialData?.reviewNote && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <strong className="font-bold uppercase tracking-wider text-[10px] block mb-1">
                Editorial Review Note (Changes Requested):
              </strong>
              <p className="leading-relaxed">{initialData.reviewNote}</p>
            </div>
          </div>
        )}

        {/* Section 1: Core Metadata */}
        <FormSection
          title="Guide Identity & Categorization"
          description="SEO title, URL slug, summary, and difficulty rating."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="guide-title" required>
                Article Title
              </FormLabel>
              <FormInput
                id="guide-title"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="How to Diagnose Android Thermal Throttling"
              />
            </div>

            <div>
              <FormLabel htmlFor="guide-slug" required>
                URL Slug
              </FormLabel>
              <FormInput
                id="guide-slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="diagnose-android-thermal-throttling"
              />
              <FormHelperText>URL: /guides/{slug || "slug"}</FormHelperText>
            </div>
          </div>

          <div>
            <FormLabel htmlFor="guide-excerpt" required>
              Excerpt / Social Meta Teaser
            </FormLabel>
            <FormInput
              id="guide-excerpt"
              required
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Detect SoC temperature throttling, GPU frequency drops, and battery heat..."
            />
          </div>

          <div>
            <FormLabel htmlFor="guide-description" required>
              Introduction Summary
            </FormLabel>
            <FormTextarea
              id="guide-description"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="High-level overview introducing the problem and explaining what the user will achieve..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <FormLabel htmlFor="guide-category">Category</FormLabel>
              <FormSelect
                id="guide-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as GuideCategory)}
              >
                <option value="Android Gaming">Android Gaming</option>
                <option value="Thermal & Throttling">Thermal & Throttling</option>
                <option value="Optimization">Optimization</option>
                <option value="Root & Kernel">Root & Kernel</option>
                <option value="Hardware Diagnostics">Hardware Diagnostics</option>
              </FormSelect>
            </div>

            <div>
              <FormLabel htmlFor="guide-type">Content Type</FormLabel>
              <FormSelect
                id="guide-type"
                value={contentType}
                onChange={(e) => setContentType(e.target.value as GuideContentType)}
              >
                <option value="Guide">Step-by-Step Guide</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Deep Dive">Deep Dive</option>
                <option value="Troubleshooting">Troubleshooting</option>
              </FormSelect>
            </div>

            <div>
              <FormLabel htmlFor="guide-difficulty">Difficulty</FormLabel>
              <FormSelect
                id="guide-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as GuideDifficulty)}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </FormSelect>
            </div>

            <div>
              <FormLabel htmlFor="guide-reading-time">Reading Time (min)</FormLabel>
              <FormInput
                id="guide-reading-time"
                type="number"
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
                placeholder="5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="guide-author">Author Name</FormLabel>
              <FormInput
                id="guide-author"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Moha Gaming Lab Specialist"
              />
            </div>

            <div>
              <FormLabel htmlFor="guide-author-role">Author Title / Role</FormLabel>
              <FormInput
                id="guide-author-role"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                placeholder="Performance Architect"
              />
            </div>

            <div>
              <FormLabel htmlFor="guide-tags">Tags (comma-separated)</FormLabel>
              <FormInput
                id="guide-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="android, fps, kernel, gaming"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 2: Structured Content Sections */}
        <FormSection
          title="Guide Content Sections"
          description="Build structured sections with headers and body content."
        >
          <div className="space-y-4">
            {sections.map((sec, idx) => (
              <div
                key={sec.id || idx}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-primary">
                    Section {idx + 1}
                  </span>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(idx)}
                      className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Remove Section
                    </button>
                  )}
                </div>
                <div>
                  <FormLabel>Section Heading</FormLabel>
                  <FormInput
                    value={sec.title}
                    onChange={(e) => updateSection(idx, "title", e.target.value)}
                    placeholder="e.g. Understanding CPU Frequency Scaling"
                  />
                </div>
                <div>
                  <FormLabel>Body Text (Paragraphs or Markdown)</FormLabel>
                  <FormTextarea
                    rows={4}
                    value={sec.content}
                    onChange={(e) => updateSection(idx, "content", e.target.value)}
                    placeholder="Write section explanation, benchmarks, or actionable instructions..."
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addSection}
              className="w-full py-2.5 rounded-xl border border-dashed border-white/20 hover:border-primary/50 text-text-secondary hover:text-primary text-xs font-mono transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Add Content Section</span>
            </button>
          </div>
        </FormSection>

        {/* Section 3: Frequently Asked Questions */}
        <FormSection
          title="Frequently Asked Questions (FAQs)"
          description="Add structured FAQs for search engines and user clarity."
        >
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-tertiary">
                    FAQ #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFaq(idx)}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Remove
                  </button>
                </div>
                <div>
                  <FormLabel>Question</FormLabel>
                  <FormInput
                    value={faq.question}
                    onChange={(e) => updateFaq(idx, "question", e.target.value)}
                    placeholder="e.g. Can this damage my device battery?"
                  />
                </div>
                <div>
                  <FormLabel>Answer</FormLabel>
                  <FormTextarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => updateFaq(idx, "answer", e.target.value)}
                    placeholder="Provide a clear, reassuring, and technically accurate answer..."
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addFaq}
              className="w-full py-2.5 rounded-xl border border-dashed border-white/20 hover:border-accent/50 text-text-secondary hover:text-accent text-xs font-mono transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Add FAQ Item</span>
            </button>
          </div>
        </FormSection>

        {/* Section 4: Status & Featured */}
        <FormSection title="Publication Status" description="Control editorial workflow.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="guide-status">Publication State</FormLabel>
              <FormSelect
                id="guide-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Guide["status"])}
              >
                <option value="draft">Draft</option>
                <option value="review">In Review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </FormSelect>
            </div>

            <div className="flex items-center pt-6">
              <FormCheckbox
                id="guide-featured"
                checked={featured}
                onChange={setFeatured}
                label="Feature on Guides Hub Top Picks"
                description="Showcase prominently in guides hero section."
              />
            </div>
          </div>
        </FormSection>
      </AdminForm>

      <ConfirmDialog
        isOpen={showDeleteModal}
        title={`Delete Guide: ${title}?`}
        message="This will permanently remove the guide article and all its structured sections. This cannot be undone."
        confirmLabel="Delete Permanently"
        variant="danger"
        isSubmitting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
}
