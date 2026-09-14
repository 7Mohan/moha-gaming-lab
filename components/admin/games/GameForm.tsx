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
  FormError,
  FormHelperText,
} from "@/components/admin/ui/FormField";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { UnsavedChangesDialog } from "@/components/admin/ui/UnsavedChangesDialog";
import { ContentRelationPicker, type RelationOption } from "@/components/admin/ui/ContentRelationPicker";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  createGameAction,
  updateGameAction,
  deleteGameAction,
  archiveGameAction,
  publishGameAction,
  type GameActionResult,
} from "@/app/admin/(dashboard)/games/actions";
import type { Game, GameCategory, Platform } from "@/types/game";
import { AlertTriangle, CheckCircle, ExternalLink, Eye } from "lucide-react";

interface GameFormProps {
  initialData?: Game;
  isNew?: boolean;
  userRole?: "ADMIN" | "EDITOR" | "AUTHOR";
  availableTools?: RelationOption[];
  availableApps?: RelationOption[];
  availableGuides?: RelationOption[];
}

export function GameForm({
  initialData,
  isNew = false,
  userRole = "ADMIN",
  availableTools = [],
  availableApps = [],
  availableGuides = [],
}: GameFormProps) {
  const router = useRouter();

  // Step 1: Basic Information
  const [name, setName] = React.useState(initialData?.name || "");
  const [slug, setSlug] = React.useState(initialData?.slug || "");
  const [excerpt, setExcerpt] = React.useState(initialData?.excerpt || "");
  const [description, setDescription] = React.useState(initialData?.description || "");

  // Step 2: Classification
  const [category, setCategory] = React.useState(initialData?.category || "battle-royale");
  const [platform, setPlatform] = React.useState(initialData?.platform || "android");
  const [deviceTier, setDeviceTier] = React.useState(initialData?.deviceTier || "mid");
  const [tags, setTags] = React.useState(initialData?.tags?.join(", ") || "");
  const [performanceAreas, setPerformanceAreas] = React.useState(
    initialData?.performanceAreas?.join(", ") || "fps, thermal"
  );
  const [optimizationRecs, setOptimizationRecs] = React.useState(
    initialData?.optimizationRecs?.map((r) => r.title).join("\n") || ""
  );
  const [commonProblems, setCommonProblems] = React.useState(
    initialData?.commonProblems?.map((p) => p.title).join("\n") || ""
  );

  // Step 3: Media
  const [iconUrl, setIconUrl] = React.useState(initialData?.iconUrl || "");
  const [coverImage, setCoverImage] = React.useState(initialData?.coverImage || initialData?.coverUrl || "");
  const [altText, setAltText] = React.useState(initialData?.name ? `${initialData.name} artwork cover` : "");

  // Step 4: Related Content
  const [relatedToolSlugs, setRelatedToolSlugs] = React.useState<string[]>(
    initialData?.relatedToolSlugs || []
  );
  const [relatedAppSlugs, setRelatedAppSlugs] = React.useState<string[]>(
    initialData?.relatedAppSlugs || []
  );
  const [relatedGuideSlugs, setRelatedGuideSlugs] = React.useState<string[]>(
    initialData?.relatedGuideSlugs || []
  );

  // Step 5: SEO
  const [metaTitle, setMetaTitle] = React.useState(
    initialData?.name ? `${initialData.name} FPS & Optimization Guide | Moha Gaming Lab` : ""
  );
  const [metaDescription, setMetaDescription] = React.useState(
    initialData?.excerpt || ""
  );
  const [canonicalUrl, setCanonicalUrl] = React.useState(
    initialData?.slug ? `https://mohalab.com/games/${initialData.slug}` : ""
  );

  // Step 6: Status & Publication State
  const [status, setStatus] = React.useState<"active" | "draft" | "archived">(
    initialData?.status || "draft"
  );
  const [featured, setFeatured] = React.useState(initialData?.featured || false);

  // Concurrency tracking
  const [loadedAt] = React.useState(initialData?.updatedAt || new Date().toISOString());

  // Form handling state
  const [isDirty, setIsDirty] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [publishedSlug, setPublishedSlug] = React.useState<string | null>(
    initialData?.status === "active" ? initialData.slug : null
  );

  // Modal dialog states
  const [showPublishModal, setShowPublishModal] = React.useState(false);
  const [showArchiveModal, setShowArchiveModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Unsaved changes hook (Flow 23)
  const { showPrompt, confirmLeave, stay } = useUnsavedChanges({ isDirty });

  // Mark dirty on any user input
  function markDirty() {
    if (!isDirty) setIsDirty(true);
  }

  // Auto-slug when name changes in create mode
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    markDirty();
    if (isNew && !slug) {
      const generatedSlug = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generatedSlug);
      if (!metaTitle) {
        setMetaTitle(`${e.target.value} Performance Guide | Moha Gaming Lab`);
      }
    }
  }

  async function handleFormSubmit(e?: React.FormEvent<HTMLFormElement>, overrideStatus?: string) {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);
    formData.append("excerpt", excerpt);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("platform", platform);
    formData.append("deviceTier", deviceTier);
    formData.append("status", overrideStatus || status);
    formData.append("featured", String(featured));
    formData.append("tags", tags);
    formData.append("performanceAreas", performanceAreas);
    formData.append("optimizationRecs", optimizationRecs);
    formData.append("commonProblems", commonProblems);
    if (iconUrl) formData.append("iconUrl", iconUrl);
    if (coverImage) formData.append("coverImage", coverImage);
    if (altText) formData.append("altText", altText);
    formData.append("relatedToolSlugs", relatedToolSlugs.join(","));
    formData.append("relatedAppSlugs", relatedAppSlugs.join(","));
    formData.append("relatedGuideSlugs", relatedGuideSlugs.join(","));
    formData.append("expectedUpdatedAt", loadedAt);

    try {
      let result: GameActionResult;
      if (isNew) {
        result = await createGameAction(null, formData);
      } else {
        result = await updateGameAction(initialData!.id, null, formData);
      }

      if (result.success) {
        setIsDirty(false);
        setPublishedSlug(result.slug);
        const actionLabel = overrideStatus === "active" ? "published" : isNew ? "created" : "updated";
        setSuccess(`Game ${actionLabel} successfully.`);
        if (overrideStatus === "active") {
          setStatus("active");
        }
        if (isNew) {
          router.push(`/admin/games/${result.gameId}`);
        } else {
          router.refresh();
        }
      } else {
        setError(result.error);
        if (result.fields) {
          setFieldErrors(result.fields);
        }
      }
    } catch {
      // Flow 24: Failed Save — never clear form data
      setError("We couldn't save your changes. Your current form data is still here. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublishConfirm() {
    setShowPublishModal(false);
    if (isNew) {
      await handleFormSubmit(undefined, "active");
    } else {
      setIsSubmitting(true);
      try {
        const res = await publishGameAction(initialData!.id);
        if (res.success) {
          setStatus("active");
          setPublishedSlug(slug || initialData!.slug);
          setSuccess("Game published successfully.");
          setIsDirty(false);
          router.refresh();
        } else {
          setError(res.error || "Failed to publish game");
        }
      } catch {
        setError("We couldn't save your changes. Your current form data is still here. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  async function handleArchiveConfirm() {
    setShowArchiveModal(false);
    if (!initialData) return;
    setIsSubmitting(true);
    try {
      const res = await archiveGameAction(initialData.id);
      if (res.success) {
        setStatus("archived");
        setSuccess("Game archived successfully.");
        setIsDirty(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to archive game");
      }
    } catch {
      setError("We couldn't save your changes. Your current form data is still here. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!initialData) return;
    setIsDeleting(true);
    try {
      const res = await deleteGameAction(initialData.id);
      if (res.success) {
        setIsDirty(false);
        router.push("/admin/games");
      } else {
        setError(res.error || "Failed to delete game");
        setShowDeleteModal(false);
      }
    } finally {
      setIsDeleting(false);
    }
  }

  const actions = (
    <div className="flex items-center gap-2 flex-wrap">
      {/* View Public Page (Flow 06, 29) */}
      {status === "active" && publishedSlug && (
        <Link
          href={`/games/${publishedSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-text-primary border border-white/10 text-xs font-mono font-medium inline-flex items-center gap-1.5 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-primary" />
          <span>View Public Page</span>
        </Link>
      )}

      {/* Preview Link (Flow 04 Step 6) */}
      {slug && (
        <Link
          href={`/games/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary border border-white/10 text-xs font-mono font-medium inline-flex items-center gap-1.5 transition-colors"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Preview</span>
        </Link>
      )}

      {/* Archive Button (Flow 07) */}
      {!isNew && status !== "archived" && userRole !== "AUTHOR" && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => setShowArchiveModal(true)}
          className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-medium transition-colors"
        >
          Archive
        </button>
      )}

      {/* Delete Button (Flow 33) */}
      {!isNew && userRole === "ADMIN" && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => setShowDeleteModal(true)}
          className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono font-medium transition-colors"
        >
          Delete
        </button>
      )}

      {/* Save Draft Button */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => handleFormSubmit(undefined, "draft")}
        className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-xs border border-white/10 transition-colors disabled:opacity-50"
      >
        Save Draft
      </button>

      {/* Submit for Review (AUTHOR role) */}
      {userRole === "AUTHOR" && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleFormSubmit(undefined, "review")}
          className="py-2 px-4 rounded-xl bg-amber-500 text-black font-bold text-xs font-mono shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all disabled:opacity-50"
        >
          Submit for Review
        </button>
      )}

      {/* Publish Button (EDITOR / ADMIN) */}
      {userRole !== "AUTHOR" && status !== "active" && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => setShowPublishModal(true)}
          className="py-2 px-4 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-95 text-black font-bold text-xs font-mono shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
        >
          Publish
        </button>
      )}

      {/* Save Changes (if already published) */}
      {status === "active" && (
        <button
          type="submit"
          disabled={isSubmitting}
          className="py-2 px-4 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold text-xs font-mono shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Published Content Warning Banner (Flow 05) */}
      {!isNew && initialData?.status === "active" && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-200 text-xs font-mono">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-300">This game is currently published.</p>
            <p className="text-amber-200/80">
              Saving these changes will update the public page and re-index search immediately.
            </p>
          </div>
        </div>
      )}

      {/* Post-Publish / Success Banner with Public Link (Flow 06) */}
      {success && publishedSlug && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 text-emerald-200 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{success}</span>
          </div>
          <Link
            href={`/games/${publishedSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-3 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 inline-flex items-center gap-1.5 transition-colors"
          >
            <span>View public page</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      <AdminForm
        title={isNew ? "Create Game Profile" : `Edit: ${name || "Game"}`}
        subtitle="Manage hardware tier optimizations, diagnostics, and public game metadata."
        backHref="/admin/games"
        breadcrumbs={[
          { label: "Games", href: "/admin/games" },
          { label: isNew ? "New Game" : name || "Edit" },
        ]}
        status={status === "active" ? "PUBLISHED" : status.toUpperCase()}
        isSubmitting={isSubmitting}
        error={error}
        successMessage={success}
        actions={actions}
        onSubmit={(e) => handleFormSubmit(e)}
      >
        {/* Step 1: Basic Information */}
        <FormSection
          title="Step 1 — Basic Information"
          description="Primary titles, system-suggested slug, and technical description."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="game-name" required>
                Game Name
              </FormLabel>
              <FormInput
                id="game-name"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Call of Duty: Warzone Mobile"
                error={fieldErrors.name?.[0]}
              />
              <FormError message={fieldErrors.name?.[0]} />
            </div>

            <div>
              <FormLabel htmlFor="game-slug" required>
                URL Slug
              </FormLabel>
              <FormInput
                id="game-slug"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase());
                  markDirty();
                }}
                placeholder="e.g. cod-warzone-mobile"
                error={fieldErrors.slug?.[0]}
              />
              <FormError message={fieldErrors.slug?.[0]} />
              <FormHelperText>URL: /games/{slug || "slug"}</FormHelperText>
            </div>
          </div>

          <div>
            <FormLabel htmlFor="game-excerpt" required>
              Short Description / Excerpt
            </FormLabel>
            <FormInput
              id="game-excerpt"
              required
              value={excerpt}
              onChange={(e) => {
                setExcerpt(e.target.value);
                markDirty();
              }}
              placeholder="High-intensity mobile FPS featuring Verdansk battle royale map."
              error={fieldErrors.excerpt?.[0]}
            />
            <FormError message={fieldErrors.excerpt?.[0]} />
          </div>

          <div>
            <FormLabel htmlFor="game-description" required>
              Comprehensive Description & Performance Analysis
            </FormLabel>
            <FormTextarea
              id="game-description"
              required
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                markDirty();
              }}
              placeholder="Provide a detailed technical breakdown of frame time consistency, GPU load, and memory usage..."
              error={fieldErrors.description?.[0]}
            />
            <FormError message={fieldErrors.description?.[0]} />
            <div className="flex justify-between text-[11px] font-mono text-text-tertiary mt-1">
              <span>Detailed architectural review</span>
              <span>{description.length} characters</span>
            </div>
          </div>
        </FormSection>

        {/* Step 2: Classification */}
        <FormSection
          title="Step 2 — Classification"
          description="Platform, genre category, performance focus areas, and tagging."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FormLabel htmlFor="game-platform">Platform</FormLabel>
              <FormSelect
                id="game-platform"
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value as Platform);
                  markDirty();
                }}
              >
                <option value="android">Android Only</option>
                <option value="cross-platform">Cross-Platform</option>
                <option value="pc">PC Companion</option>
                <option value="ios">iOS / Android</option>
              </FormSelect>
            </div>

            <div>
              <FormLabel htmlFor="game-category">Genre / Category</FormLabel>
              <FormSelect
                id="game-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as GameCategory);
                  markDirty();
                }}
              >
                <option value="battle-royale">Battle Royale</option>
                <option value="action">Action</option>
                <option value="shooter">Shooter</option>
                <option value="racing">Racing</option>
                <option value="rpg">RPG</option>
                <option value="sports">Sports</option>
                <option value="moba">MOBA</option>
                <option value="strategy">Strategy</option>
                <option value="other">Other</option>
              </FormSelect>
            </div>

            <div>
              <FormLabel htmlFor="game-deviceTier">Hardware Baseline Tier</FormLabel>
              <FormSelect
                id="game-deviceTier"
                value={deviceTier}
                onChange={(e) => {
                  setDeviceTier(e.target.value as Game["deviceTier"]);
                  markDirty();
                }}
              >
                <option value="low">Budget / Low-End (Snapdragon 6xx)</option>
                <option value="mid">Mid-Range (Snapdragon 7xx / Dimensity 8xxx)</option>
                <option value="high">Flagship / High-End (Snapdragon 8 Gen 2+)</option>
              </FormSelect>
            </div>
          </div>

          <div>
            <FormLabel htmlFor="game-perf-areas">Performance Areas (comma-separated)</FormLabel>
            <FormInput
              id="game-perf-areas"
              value={performanceAreas}
              onChange={(e) => {
                setPerformanceAreas(e.target.value);
                markDirty();
              }}
              placeholder="fps, thermal, touch, battery, ram, network"
            />
            <FormHelperText>Supported: fps, thermal, touch, battery, ram, network</FormHelperText>
          </div>

          <div>
            <FormLabel htmlFor="game-tags">Searchable Tags (comma-separated)</FormLabel>
            <FormInput
              id="game-tags"
              value={tags}
              onChange={(e) => {
                setTags(e.target.value);
                markDirty();
              }}
              placeholder="120fps, vulkan, shader-cache, uncap-fps"
            />
          </div>

          <div>
            <FormLabel htmlFor="game-recs">Optimization Recommendations (one per line)</FormLabel>
            <FormTextarea
              id="game-recs"
              rows={3}
              value={optimizationRecs}
              onChange={(e) => {
                setOptimizationRecs(e.target.value);
                markDirty();
              }}
              placeholder="Lock display refresh rate to 120Hz&#10;Disable dynamic resolution scaling&#10;Apply external thermoelectric peltier cooler"
            />
          </div>

          <div>
            <FormLabel htmlFor="game-problems">Common Problems & Fixes (one per line)</FormLabel>
            <FormTextarea
              id="game-problems"
              rows={3}
              value={commonProblems}
              onChange={(e) => {
                setCommonProblems(e.target.value);
                markDirty();
              }}
              placeholder="Thermal throttling after 15 minutes of continuous combat&#10;Micro-stutters during asset streaming"
            />
          </div>
        </FormSection>

        {/* Step 3: Media */}
        <FormSection
          title="Step 3 — Media"
          description="Application icon, cover artwork, and accessibility alt text."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="game-icon">Square Icon URL</FormLabel>
              <FormInput
                id="game-icon"
                value={iconUrl}
                onChange={(e) => {
                  setIconUrl(e.target.value);
                  markDirty();
                }}
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div>
              <FormLabel htmlFor="game-cover">Wide Cover Image URL</FormLabel>
              <FormInput
                id="game-cover"
                value={coverImage}
                onChange={(e) => {
                  setCoverImage(e.target.value);
                  markDirty();
                }}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          </div>

          <div>
            <FormLabel htmlFor="game-alt">Accessibility Alt Text</FormLabel>
            <FormInput
              id="game-alt"
              value={altText}
              onChange={(e) => {
                setAltText(e.target.value);
                markDirty();
              }}
              placeholder="Descriptive text for visually impaired readers"
            />
          </div>
        </FormSection>

        {/* Step 4: Related Content (Searchable Selectors) */}
        <FormSection
          title="Step 4 — Related Content"
          description="Select existing tools, applications, and technical guides. No arbitrary strings."
        >
          <ContentRelationPicker
            label="Connected Diagnostic Tools"
            placeholder="Search tools (e.g. Refresh Rate Test, Gamepad)..."
            selectedSlugs={relatedToolSlugs}
            onChange={(slugs) => {
              setRelatedToolSlugs(slugs);
              markDirty();
            }}
            options={availableTools}
          />

          <ContentRelationPicker
            label="Recommended Android Apps / APKs"
            placeholder="Search APK packages (e.g. Shizuku, Scene)..."
            selectedSlugs={relatedAppSlugs}
            onChange={(slugs) => {
              setRelatedAppSlugs(slugs);
              markDirty();
            }}
            options={availableApps}
          />

          <ContentRelationPicker
            label="Associated Technical Guides"
            placeholder="Search guides (e.g. Thermal Throttling, Frame Time)..."
            selectedSlugs={relatedGuideSlugs}
            onChange={(slugs) => {
              setRelatedGuideSlugs(slugs);
              markDirty();
            }}
            options={availableGuides}
          />
        </FormSection>

        {/* Step 5: SEO */}
        <FormSection
          title="Step 5 — Search Engine Optimization (SEO)"
          description="Meta title, description, canonical link, and OpenGraph configuration."
        >
          <div>
            <div className="flex justify-between items-center mb-1">
              <FormLabel htmlFor="game-meta-title">Meta Title</FormLabel>
              <span className={`text-[11px] font-mono ${metaTitle.length > 60 ? "text-amber-400" : "text-text-tertiary"}`}>
                {metaTitle.length} / 60 characters
              </span>
            </div>
            <FormInput
              id="game-meta-title"
              value={metaTitle}
              onChange={(e) => {
                setMetaTitle(e.target.value);
                markDirty();
              }}
              placeholder="Game Title — Performance Guide & Benchmarks | Moha Gaming Lab"
            />
            <FormHelperText>Ideal length: 50–60 characters.</FormHelperText>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <FormLabel htmlFor="game-meta-desc">Meta Description</FormLabel>
              <span className={`text-[11px] font-mono ${metaDescription.length > 160 ? "text-amber-400" : "text-text-tertiary"}`}>
                {metaDescription.length} / 160 characters
              </span>
            </div>
            <FormTextarea
              id="game-meta-desc"
              rows={2}
              value={metaDescription}
              onChange={(e) => {
                setMetaDescription(e.target.value);
                markDirty();
              }}
              placeholder="Discover verified FPS benchmarks, thermal profiles, and optimal Android settings for..."
            />
            <FormHelperText>Ideal length: 140–160 characters.</FormHelperText>
          </div>

          <div>
            <FormLabel htmlFor="game-canonical">Canonical URL</FormLabel>
            <FormInput
              id="game-canonical"
              value={canonicalUrl}
              onChange={(e) => {
                setCanonicalUrl(e.target.value);
                markDirty();
              }}
              placeholder="https://mohalab.com/games/..."
            />
          </div>
        </FormSection>

        {/* Step 6: Publication State */}
        <FormSection
          title="Step 6 — Publication & Feature Settings"
          description="Control public catalog visibility and hero carousel placement."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="game-status-field">Current Workflow Status</FormLabel>
              <FormSelect
                id="game-status-field"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as Game["status"]);
                  markDirty();
                }}
              >
                <option value="draft">Draft (Admin Only)</option>
                <option value="review">Review (Pending Editor Approval)</option>
                <option value="active">Published (Public Website & Search)</option>
                <option value="coming-soon">Coming Soon</option>
                <option value="archived">Archived (Unlisted)</option>
              </FormSelect>
            </div>

            <div className="flex items-center pt-6">
              <FormCheckbox
                id="game-featured-check"
                checked={featured}
                onChange={(val) => {
                  setFeatured(val);
                  markDirty();
                }}
                label="Feature in Homepage Showcase"
                description="Highlights this game profile on the main dashboard carousel."
              />
            </div>
          </div>
        </FormSection>
      </AdminForm>

      {/* Confirmation Dialogs */}
      {/* Publish Confirmation Modal (Flow 06) */}
      <ConfirmDialog
        isOpen={showPublishModal}
        title="Publish this game?"
        message="It will become visible on the public website and search immediately. Visitors will be able to read benchmarks and explore linked tools."
        confirmLabel="Publish Now"
        variant="primary"
        isSubmitting={isSubmitting}
        onConfirm={handlePublishConfirm}
        onCancel={() => setShowPublishModal(false)}
      />

      {/* Archive Confirmation Modal (Flow 07) */}
      <ConfirmDialog
        isOpen={showArchiveModal}
        title="Archive this game?"
        message="It will no longer appear in public listings. Existing references will be handled according to the content relationship rules."
        confirmLabel="Archive Game"
        variant="warning"
        isSubmitting={isSubmitting}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setShowArchiveModal(false)}
      />

      {/* Delete Confirmation Modal (Flow 33) */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        title={`Delete Game: ${name}?`}
        message="This action permanently removes the game profile and its associated benchmark metrics. This cannot be undone."
        confirmLabel="Delete Permanently"
        variant="danger"
        isSubmitting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Unsaved Changes Confirmation Dialog (Flow 23) */}
      <UnsavedChangesDialog
        isOpen={showPrompt}
        onStay={stay}
        onLeave={confirmLeave}
      />
    </>
  );
}
