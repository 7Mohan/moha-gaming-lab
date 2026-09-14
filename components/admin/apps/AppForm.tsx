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
  FormError,
  FormHelperText,
} from "@/components/admin/ui/FormField";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { ContentRelationPicker } from "@/components/admin/ui/ContentRelationPicker";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/admin/ui/UnsavedChangesDialog";
import {
  createAppAction,
  updateAppAction,
  deleteAppAction,
  type AppActionResult,
} from "@/app/admin/(dashboard)/apps/actions";
import type { App } from "@/types/app";

interface AppFormProps {
  initialData?: App;
  isNew?: boolean;
  availableGames?: Array<{ id: string; title: string; slug: string }>;
  availableGuides?: Array<{ id: string; title: string; slug: string }>;
}

export function AppForm({
  initialData,
  isNew = false,
  availableGames = [],
  availableGuides = [],
}: AppFormProps) {
  const router = useRouter();

  const [name, setName] = React.useState(initialData?.name || "");
  const [slug, setSlug] = React.useState(initialData?.slug || "");
  const [packageName, setPackageName] = React.useState(initialData?.packageName || "");
  const [excerpt, setExcerpt] = React.useState(initialData?.excerpt || "");
  const [description, setDescription] = React.useState(initialData?.description || "");
  const [developer, setDeveloper] = React.useState(initialData?.developer || "");
  const [developerUrl, setDeveloperUrl] = React.useState(initialData?.developerUrl || "");
  const [license, setLicense] = React.useState(initialData?.license || "Open Source");
  const [category, setCategory] = React.useState(initialData?.category || "Performance Optimization");
  const [requiresRoot, setRequiresRoot] = React.useState(initialData?.requiresRoot || false);
  const [targetSdkVersion, setTargetSdkVersion] = React.useState(
    initialData?.targetSdkVersion ? String(initialData.targetSdkVersion) : "34"
  );
  const [status, setStatus] = React.useState(initialData?.status || "active");
  const [features, setFeatures] = React.useState(initialData?.features?.join("\n") || "");
  const [permissions, setPermissions] = React.useState(initialData?.permissions?.map(p => p.name).join(", ") || "");

  const [relatedGames, setRelatedGames] = React.useState<string[]>(initialData?.relatedGames || []);
  const [relatedGuides, setRelatedGuides] = React.useState<string[]>(initialData?.relatedGuides || []);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Unsaved changes tracking (Flow 23)
  const isDirty =
    name !== (initialData?.name || "") ||
    slug !== (initialData?.slug || "") ||
    packageName !== (initialData?.packageName || "") ||
    excerpt !== (initialData?.excerpt || "") ||
    description !== (initialData?.description || "") ||
    developer !== (initialData?.developer || "") ||
    status !== (initialData?.status || "active") ||
    JSON.stringify(relatedGames) !== JSON.stringify(initialData?.relatedGames || []) ||
    JSON.stringify(relatedGuides) !== JSON.stringify(initialData?.relatedGuides || []);

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
    setFieldErrors({});

    // Client package name format check
    if (packageName && !/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(packageName)) {
      setError("Package name must follow reverse domain notation, e.g. com.example.app");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);
    if (packageName) formData.append("packageName", packageName);
    formData.append("excerpt", excerpt);
    formData.append("description", description);
    formData.append("developer", developer);
    if (developerUrl) formData.append("developerUrl", developerUrl);
    formData.append("license", license);
    formData.append("category", category);
    formData.append("requiresRoot", String(requiresRoot));
    if (targetSdkVersion) formData.append("targetSdkVersion", targetSdkVersion);
    formData.append("status", status);
    formData.append("features", features);
    formData.append("permissions", permissions);
    formData.append("relatedGames", relatedGames.join(","));
    formData.append("relatedGuides", relatedGuides.join(","));

    try {
      let result: AppActionResult;
      if (isNew) {
        result = await createAppAction(null, formData);
      } else {
        result = await updateAppAction(initialData!.id, null, formData);
      }

      if (result.success) {
        setSuccess(`App profile successfully ${isNew ? "registered" : "updated"}!`);
        if (isNew) {
          router.push(`/admin/apps/${result.appId}`);
        } else {
          router.refresh();
        }
      } else {
        // Never clear form fields on failed submission (Flow 24)
        setError(result.error);
        if (result.fields) {
          setFieldErrors(result.fields);
        }
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
      const res = await deleteAppAction(initialData.id);
      if (res.success) {
        router.push("/admin/apps");
      } else {
        setError(res.error || "Failed to delete app");
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
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => router.push(`/admin/apps/${initialData.id}/releases`)}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white transition-colors cursor-pointer"
          >
            Manage Releases ({initialData.releases?.length || 0})
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setShowDeleteModal(true)}
            className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono transition-colors cursor-pointer"
          >
            Delete
          </button>
        </>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="py-2 px-4 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold text-xs font-mono shadow-lg shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5 text-black" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Saving...</span>
          </>
        ) : (
          <span>{isNew ? "Register App" : "Save Changes"}</span>
        )}
      </button>
    </>
  );

  return (
    <>
      <AdminForm
        title={isNew ? "Register Android App" : `Edit: ${name || "App"}`}
        subtitle="Manage package identifiers, permissions, release artifacts, and verification audits."
        backHref="/admin/apps"
        breadcrumbs={[
          { label: "Apps", href: "/admin/apps" },
          { label: isNew ? "New App" : name || "Edit" },
        ]}
        status={status === "active" ? "PUBLISHED" : status.toUpperCase()}
        isSubmitting={isSubmitting}
        error={error}
        successMessage={success}
        actions={actions}
        onSubmit={handleSubmit}
      >
        {/* Section 1: Package Identity */}
        <FormSection
          title="App Identity & Developer Info"
          description="Name, Android package name, developer attribution, and licensing."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="app-name" required>
                App Name
              </FormLabel>
              <FormInput
                id="app-name"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Scene Android Performance Toolkit"
                error={fieldErrors.name?.[0]}
              />
              <FormError message={fieldErrors.name?.[0]} />
            </div>

            <div>
              <FormLabel htmlFor="app-slug" required>
                URL Slug
              </FormLabel>
              <FormInput
                id="app-slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="e.g. scene-android"
                error={fieldErrors.slug?.[0]}
              />
              <FormError message={fieldErrors.slug?.[0]} />
              <FormHelperText>URL: /apps/{slug || "slug"}</FormHelperText>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="app-package">
                Android Package Name
              </FormLabel>
              <FormInput
                id="app-package"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="com.omarea.vboot"
              />
              <FormHelperText>Format: com.developer.app (used for APK validation)</FormHelperText>
            </div>

            <div>
              <FormLabel htmlFor="app-category" required>
                Category
              </FormLabel>
              <FormSelect
                id="app-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Performance Optimization">Performance Optimization</option>
                <option value="Hardware Monitoring">Hardware Monitoring</option>
                <option value="Game Boosters">Game Boosters</option>
                <option value="Display & Refresh Rate">Display & Refresh Rate</option>
                <option value="Thermal Management">Thermal Management</option>
                <option value="Network Gaming">Network Gaming</option>
              </FormSelect>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FormLabel htmlFor="app-developer" required>
                Developer / Studio
              </FormLabel>
              <FormInput
                id="app-developer"
                required
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                placeholder="e.g. Omarea"
              />
            </div>

            <div>
              <FormLabel htmlFor="app-dev-url">Developer URL / GitHub</FormLabel>
              <FormInput
                id="app-dev-url"
                type="url"
                value={developerUrl}
                onChange={(e) => setDeveloperUrl(e.target.value)}
                placeholder="https://github.com/..."
              />
            </div>

            <div>
              <FormLabel htmlFor="app-license">License</FormLabel>
              <FormSelect
                id="app-license"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
              >
                <option value="Open Source (GPL v3)">Open Source (GPL v3)</option>
                <option value="Open Source (MIT)">Open Source (MIT)</option>
                <option value="Open Source (Apache 2.0)">Open Source (Apache 2.0)</option>
                <option value="Freeware">Freeware</option>
                <option value="Freemium">Freemium</option>
              </FormSelect>
            </div>
          </div>

          <div>
            <FormLabel htmlFor="app-excerpt" required>
              Short Excerpt
            </FormLabel>
            <FormInput
              id="app-excerpt"
              required
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Advanced Linux kernel tuning and frame timing monitor..."
            />
          </div>

          <div>
            <FormLabel htmlFor="app-description" required>
              Full Description & Technical Breakdown
            </FormLabel>
            <FormTextarea
              id="app-description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Comprehensive architectural overview of capabilities, architecture support, and tuning modes..."
            />
          </div>
        </FormSection>

        {/* Section 2: Compatibility & Permissions */}
        <FormSection
          title="Android Requirements & Root Access"
          description="Security, root necessity, target SDK, and required OS permissions."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="app-target-sdk">Target Android SDK Level</FormLabel>
              <FormInput
                id="app-target-sdk"
                type="number"
                value={targetSdkVersion}
                onChange={(e) => setTargetSdkVersion(e.target.value)}
                placeholder="34"
              />
              <FormHelperText>Level 34 = Android 14, Level 33 = Android 13</FormHelperText>
            </div>

            <div className="flex items-center pt-6">
              <FormCheckbox
                id="app-requires-root"
                checked={requiresRoot}
                onChange={setRequiresRoot}
                label="Requires SuperUser / Magisk / KernelSU (Root)"
                description="Root access required for kernel sysfs writes & governor tuning."
              />
            </div>
          </div>

          <div>
            <FormLabel htmlFor="app-features">Key Feature Bullet Points (one per line)</FormLabel>
            <FormTextarea
              id="app-features"
              rows={4}
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="Kernel CPU governor tuning profiles&#10;Real-time floating FPS and frame-time graph&#10;Per-app refresh rate forcing"
            />
          </div>

          <div>
            <FormLabel htmlFor="app-permissions">Android Permissions (comma-separated)</FormLabel>
            <FormInput
              id="app-permissions"
              value={permissions}
              onChange={(e) => setPermissions(e.target.value)}
              placeholder="PACKAGE_USAGE_STATS, SYSTEM_ALERT_WINDOW, WRITE_SECURE_SETTINGS"
            />
          </div>
        </FormSection>

        {/* Section 3: Related Content (Flow 04 / 08 Relationship Picker) */}
        <FormSection
          title="Cross-Content Relationships"
          description="Associate this app with related games and optimization guides."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ContentRelationPicker
              label="Related Games"
              options={availableGames.map((g) => ({
                slug: g.slug,
                title: g.title,
                subtitle: "Game",
              }))}
              selectedSlugs={relatedGames}
              onChange={setRelatedGames}
              placeholder="Search games to relate..."
            />

            <ContentRelationPicker
              label="Related Guides"
              options={availableGuides.map((g) => ({
                slug: g.slug,
                title: g.title,
                subtitle: "Guide",
              }))}
              selectedSlugs={relatedGuides}
              onChange={setRelatedGuides}
              placeholder="Search guides to relate..."
            />
          </div>
        </FormSection>

        {/* Section 4: Status */}
        <FormSection
          title="Publishing Status"
          description="Visibility of the app profile on the public hub."
        >
          <div className="max-w-xs">
            <FormLabel htmlFor="app-status">Publication State</FormLabel>
            <FormSelect
              id="app-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as App["status"])}
            >
              <option value="active">Active / Published</option>
              <option value="coming-soon">Coming Soon</option>
              <option value="deprecated">Deprecated</option>
              <option value="archived">Archived</option>
            </FormSelect>
          </div>
        </FormSection>
      </AdminForm>

      {/* Unsaved Changes Navigation Guard (Flow 23) */}
      <UnsavedChangesDialog
        isOpen={showPrompt}
        onStay={stay}
        onLeave={confirmLeave}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        title={`Delete App: ${name}?`}
        message="This permanently deletes the app and all associated version releases and download mirror links. This cannot be undone."
        confirmLabel="Delete Permanently"
        variant="danger"
        isSubmitting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
}
