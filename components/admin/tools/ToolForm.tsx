"use client";

import * as React from "react";
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
import { ContentRelationPicker } from "@/components/admin/ui/ContentRelationPicker";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/admin/ui/UnsavedChangesDialog";
import {
  createToolAction,
  updateToolAction,
  deleteToolAction,
  type ToolActionResult,
} from "@/app/admin/(dashboard)/tools/actions";
import type { Tool, ToolCategory } from "@/types/tool";

interface ToolFormProps {
  initialData?: Tool;
  isNew?: boolean;
  availableGames?: Array<{ id: string; title: string; slug: string }>;
  availableGuides?: Array<{ id: string; title: string; slug: string }>;
}

export function ToolForm({
  initialData,
  isNew = false,
  availableGames = [],
  availableGuides = [],
}: ToolFormProps) {
  const router = useRouter();

  const [name, setName] = React.useState(initialData?.name || "");
  const [slug, setSlug] = React.useState(initialData?.slug || "");
  const [shortDescription, setShortDescription] = React.useState(
    initialData?.shortDescription || ""
  );
  const [description, setDescription] = React.useState(initialData?.description || "");
  const [category, setCategory] = React.useState(initialData?.category || "performance");
  const [platforms, setPlatforms] = React.useState(
    initialData?.platforms?.join(", ") || "web, android"
  );
  const [status, setStatus] = React.useState(initialData?.status || "available");
  const [whatItDoes, setWhatItDoes] = React.useState(initialData?.whatItDoes || "");
  const [technicalExplanation, setTechnicalExplanation] = React.useState(
    initialData?.technicalExplanation || ""
  );
  const [whatItMeasures, setWhatItMeasures] = React.useState(
    initialData?.whatItMeasures?.join("\n") || ""
  );
  const [capabilities, setCapabilities] = React.useState(
    initialData?.capabilities?.join("\n") || ""
  );
  const [limitations, setLimitations] = React.useState(
    initialData?.limitations?.join("\n") || ""
  );
  const [howToInterpret, setHowToInterpret] = React.useState(
    initialData?.howToInterpret?.join("\n") || ""
  );
  const [difficulty, setDifficulty] = React.useState(initialData?.difficulty || "beginner");
  const [requiresWebGl, setRequiresWebGl] = React.useState(initialData?.requiresWebGl || false);
  const [requiresRoot, setRequiresRoot] = React.useState(initialData?.requiresRoot || false);
  const [featured, setFeatured] = React.useState(initialData?.featured || false);
  const [relatedGameSlugs, setRelatedGameSlugs] = React.useState<string[]>(
    initialData?.relatedGameSlugs || []
  );
  const [relatedGuideSlugs, setRelatedGuideSlugs] = React.useState<string[]>(
    initialData?.relatedGuideSlugs || []
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Unsaved changes tracking (Flow 23)
  const isDirty =
    name !== (initialData?.name || "") ||
    slug !== (initialData?.slug || "") ||
    shortDescription !== (initialData?.shortDescription || "") ||
    description !== (initialData?.description || "") ||
    status !== (initialData?.status || "available") ||
    JSON.stringify(relatedGameSlugs) !== JSON.stringify(initialData?.relatedGameSlugs || []) ||
    JSON.stringify(relatedGuideSlugs) !== JSON.stringify(initialData?.relatedGuideSlugs || []);

  const { showPrompt, confirmLeave, stay } = useUnsavedChanges({
    isDirty: isDirty && !isSubmitting && !success,
  });

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    if (isNew && !slug) {
      setSlug(
        e.target.value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);
    formData.append("shortDescription", shortDescription);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("platforms", platforms);
    formData.append("status", status);
    formData.append("whatItDoes", whatItDoes);
    formData.append("technicalExplanation", technicalExplanation);
    formData.append("whatItMeasures", whatItMeasures);
    formData.append("capabilities", capabilities);
    formData.append("limitations", limitations);
    formData.append("howToInterpret", howToInterpret);
    formData.append("difficulty", difficulty);
    formData.append("requiresWebGl", String(requiresWebGl));
    formData.append("requiresRoot", String(requiresRoot));
    formData.append("featured", String(featured));
    formData.append("relatedGameSlugs", JSON.stringify(relatedGameSlugs));
    formData.append("relatedGuideSlugs", JSON.stringify(relatedGuideSlugs));

    try {
      let result: ToolActionResult;
      if (isNew) {
        result = await createToolAction(null, formData);
      } else {
        result = await updateToolAction(initialData!.id, null, formData);
      }

      if (result.success) {
        setSuccess(`Tool successfully ${isNew ? "created" : "updated"}!`);
        if (isNew) {
          router.push(`/admin/tools/${result.toolId}`);
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

  async function handleDelete() {
    if (!initialData) return;
    setIsDeleting(true);
    try {
      const res = await deleteToolAction(initialData.id);
      if (res.success) {
        router.push("/admin/tools");
      } else {
        setError(res.error || "Failed to delete tool");
        setShowDeleteModal(false);
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <AdminForm
        title={isNew ? "Register Diagnostic Tool" : `Edit: ${name || "Tool"}`}
        subtitle="Manage in-browser benchmark suites, hardware sensors, and diagnostic specifications."
        backHref="/admin/tools"
        breadcrumbs={[
          { label: "Tools", href: "/admin/tools" },
          { label: isNew ? "New Tool" : name || "Edit" },
        ]}
        status={status === "available" ? "PUBLISHED" : status.toUpperCase()}
        isSubmitting={isSubmitting}
        error={error}
        successMessage={success}
        actions={
          <>
            {!isNew && initialData && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowDeleteModal(true)}
                className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono transition-colors"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isNew ? "Register Tool" : "Save Changes"}
            </button>
          </>
        }
        onSubmit={handleSubmit}
      >
        <FormSection title="Tool Identity" description="Core naming and URL definition.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="tool-name" required>
                Tool Name
              </FormLabel>
              <FormInput
                id="tool-name"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="FPS & Frame-Time Monitor"
              />
            </div>

            <div>
              <FormLabel htmlFor="tool-slug" required>
                URL Slug
              </FormLabel>
              <FormInput
                id="tool-slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="fps-meter"
              />
              <FormHelperText>URL: /tools/{slug || "slug"}</FormHelperText>
            </div>
          </div>

          <div>
            <FormLabel htmlFor="tool-short-desc" required>
              Short Summary
            </FormLabel>
            <FormInput
              id="tool-short-desc"
              required
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Real-time frame delivery analysis and micro-stutter detector."
            />
          </div>

          <div>
            <FormLabel htmlFor="tool-desc" required>
              Full Description
            </FormLabel>
            <FormTextarea
              id="tool-desc"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deep technical breakdown of how this tool profiles hardware..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FormLabel htmlFor="tool-category">Category</FormLabel>
              <FormSelect
                id="tool-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ToolCategory)}
              >
                <option value="performance">Performance &amp; FPS</option>
                <option value="diagnostics">Diagnostics</option>
                <option value="display">Display &amp; Refresh Rate</option>
                <option value="network">Network &amp; Latency</option>
                <option value="device">Device &amp; Hardware</option>
                <option value="storage">Storage</option>
                <option value="browser">Browser</option>
                <option value="gaming">Gaming</option>
              </FormSelect>
            </div>

            <div>
              <FormLabel htmlFor="tool-platforms">Platforms (comma-separated)</FormLabel>
              <FormInput
                id="tool-platforms"
                value={platforms}
                onChange={(e) => setPlatforms(e.target.value)}
                placeholder="web, android, windows"
              />
            </div>

            <div>
              <FormLabel htmlFor="tool-difficulty">User Difficulty</FormLabel>
              <FormSelect
                id="tool-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Tool["difficulty"])}
              >
                <option value="beginner">Beginner Friendly</option>
                <option value="intermediate">Intermediate Tech</option>
                <option value="advanced">Advanced Kernel/Driver</option>
              </FormSelect>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Diagnostic Technical Specifications"
          description="Hardware explanations, metrics measured, and interpretation guide."
        >
          <div>
            <FormLabel htmlFor="tool-what-does" required>
              What It Does
            </FormLabel>
            <FormTextarea
              id="tool-what-does"
              required
              rows={3}
              value={whatItDoes}
              onChange={(e) => setWhatItDoes(e.target.value)}
              placeholder="Profiles requestAnimationFrame intervals using high-resolution performance.now() timestamps..."
            />
          </div>

          <div>
            <FormLabel htmlFor="tool-tech-expl" required>
              Technical Explanation
            </FormLabel>
            <FormTextarea
              id="tool-tech-expl"
              required
              rows={3}
              value={technicalExplanation}
              onChange={(e) => setTechnicalExplanation(e.target.value)}
              placeholder="Explains the math behind 1% low calculations, frame variance, and GPU render pipelining..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="tool-measures">What It Measures (one per line)</FormLabel>
              <FormTextarea
                id="tool-measures"
                rows={3}
                value={whatItMeasures}
                onChange={(e) => setWhatItMeasures(e.target.value)}
                placeholder="Instantaneous FPS&#10;Average Frame Time (ms)&#10;1% Low FPS"
              />
            </div>

            <div>
              <FormLabel htmlFor="tool-caps">Capabilities (one per line)</FormLabel>
              <FormTextarea
                id="tool-caps"
                rows={3}
                value={capabilities}
                onChange={(e) => setCapabilities(e.target.value)}
                placeholder="WebGL hardware acceleration&#10;Export CSV benchmark log&#10;Fullscreen gaming overlay"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="tool-limits">Limitations (one per line)</FormLabel>
              <FormTextarea
                id="tool-limits"
                rows={3}
                value={limitations}
                onChange={(e) => setLimitations(e.target.value)}
                placeholder="Browser sandbox limits direct GPU memory inspection&#10;Cannot measure native Vulkan overhead directly"
              />
            </div>

            <div>
              <FormLabel htmlFor="tool-interpret">How to Interpret (one per line)</FormLabel>
              <FormTextarea
                id="tool-interpret"
                rows={3}
                value={howToInterpret}
                onChange={(e) => setHowToInterpret(e.target.value)}
                placeholder="Frame time under 16.6ms indicates solid 60 FPS&#10;Spikes above 33ms produce noticeable hitching"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <FormCheckbox
              id="tool-webgl"
              checked={requiresWebGl}
              onChange={setRequiresWebGl}
              label="Requires WebGL 2.0"
              description="Needs GPU hardware canvas"
            />
            <FormCheckbox
              id="tool-root"
              checked={requiresRoot}
              onChange={setRequiresRoot}
              label="Root Optional / ADB"
              description="For deep hardware telemetry"
            />
            <FormCheckbox
              id="tool-featured"
              checked={featured}
              onChange={setFeatured}
              label="Feature in Tools Hub"
              description="Hero showcase card"
            />
          </div>
        </FormSection>

        {/* Cross-Content Relationships (Flow 04 / 18) */}
        <FormSection
          title="Cross-Content Relationships"
          description="Associate this diagnostic tool with targeted games and technical guides."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ContentRelationPicker
              label="Related Games"
              options={availableGames.map((g) => ({
                slug: g.slug,
                title: g.title,
                subtitle: "Game",
              }))}
              selectedSlugs={relatedGameSlugs}
              onChange={setRelatedGameSlugs}
              placeholder="Search games to relate..."
            />

            <ContentRelationPicker
              label="Related Guides"
              options={availableGuides.map((g) => ({
                slug: g.slug,
                title: g.title,
                subtitle: "Guide",
              }))}
              selectedSlugs={relatedGuideSlugs}
              onChange={setRelatedGuideSlugs}
              placeholder="Search guides to relate..."
            />
          </div>
        </FormSection>

        <FormSection title="Status" description="Control tool availability.">
          <div className="max-w-xs">
            <FormLabel htmlFor="tool-status">Status</FormLabel>
            <FormSelect
              id="tool-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Tool["status"])}
            >
              <option value="available">Available / Live</option>
              <option value="beta">Beta Testing</option>
              <option value="coming-soon">Coming Soon</option>
              <option value="maintenance">Maintenance</option>
            </FormSelect>
          </div>
        </FormSection>
      </AdminForm>

      <ConfirmDialog
        isOpen={showDeleteModal}
        title={`Delete Tool: ${name}?`}
        message="This permanently deletes the diagnostic tool configuration."
        confirmLabel="Delete Permanently"
        variant="danger"
        isSubmitting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <UnsavedChangesDialog
        isOpen={showPrompt}
        onStay={stay}
        onLeave={confirmLeave}
      />
    </>
  );
}
