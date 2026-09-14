"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminForm, FormSection } from "@/components/admin/ui/AdminForm";
import {
  FormLabel,
  FormInput,
  FormTextarea,
  FormSelect,
  FormHelperText,
} from "@/components/admin/ui/FormField";
import {
  createReleaseAction,
  uploadReleaseFileAction,
} from "@/app/admin/(dashboard)/apps/actions";

export default function NewReleasePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  // Release metadata
  const [version, setVersion] = React.useState("1.0.0");
  const [versionCode, setVersionCode] = React.useState("100");
  const [releaseDate, setReleaseDate] = React.useState(
    new Date().toISOString().split("T")[0]!
  );
  const [status, setStatus] = React.useState<"draft" | "published" | "archived">("draft");
  const [androidMinVersion, setAndroidMinVersion] = React.useState("8.0");
  const [targetSdkVersion, setTargetSdkVersion] = React.useState("34");
  const [architectures, setArchitectures] = React.useState("arm64-v8a");
  const [changelog, setChangelog] = React.useState("");

  // Source & Hosting Mode
  const [distributionMode, setDistributionMode] = React.useState<"hosted" | "external">("hosted");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = React.useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = React.useState(false);

  // Storage & Artifact state
  const [storagePath, setStoragePath] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [fileSize, setFileSize] = React.useState("");

  // External / Mirror state
  const [downloadUrl, setDownloadUrl] = React.useState("");
  const [sourceUrl, setSourceUrl] = React.useState("");
  const [sourceName, setSourceName] = React.useState("Hosted Supabase Storage");
  const [sourceType, setSourceType] = React.useState("hosted");

  // Integrity & Verification
  const [checksumSha256, setChecksumSha256] = React.useState("");
  const [checksumMd5, setChecksumMd5] = React.useState("");
  const [verificationStatus, setVerificationStatus] = React.useState("pending");
  const [verificationEvidence, setVerificationEvidence] = React.useState(
    "Automated SHA-256 generated during upload. Integrity verification pending review."
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Handle local APK selection
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".apk")) {
      setError("Selected file must have a .apk extension.");
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setFileName(file.name);
    setFileSize(String(file.size));
    setUploadSuccess(false);
  }

  // Handle uploading APK to Supabase Storage
  async function handleUploadApk() {
    if (!selectedFile) {
      setError("Please select an APK file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgressMsg("Validating APK file and calculating SHA-256...");

    try {
      const uploadData = new FormData();
      uploadData.append("file", selectedFile);

      setUploadProgressMsg("Uploading to Supabase Storage (app-releases)...");
      const res = await uploadReleaseFileAction(id, version, uploadData);

      if (!res.success) {
        setError(res.error || "APK upload failed.");
        setIsUploading(false);
        setUploadProgressMsg(null);
        return;
      }

      setStoragePath(res.storagePath || "");
      setFileName(res.fileName || selectedFile.name);
      if (res.fileSizeBytes) setFileSize(String(res.fileSizeBytes));
      if (res.checksumSha256) setChecksumSha256(res.checksumSha256);

      setSourceType("hosted");
      setSourceName("Hosted APK Storage");
      setVerificationStatus("pending");
      setVerificationEvidence(
        `Automated SHA-256 (${res.checksumSha256?.substring(0, 16)}...) calculated on upload to ${res.storagePath}.`
      );
      setUploadSuccess(true);
      setUploadProgressMsg(null);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
      setUploadProgressMsg(null);
    } finally {
      setIsUploading(false);
    }
  }

  // Handle switching distribution mode
  function handleModeChange(mode: "hosted" | "external") {
    setDistributionMode(mode);
    if (mode === "hosted") {
      setSourceType("hosted");
      setSourceName("Hosted APK Storage");
      setDownloadUrl("");
    } else {
      setSourceType("github_release");
      setSourceName("Official GitHub Release");
      setStoragePath("");
      setFileName("");
      setUploadSuccess(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validation checks
    if (distributionMode === "hosted") {
      if (!storagePath && !selectedFile) {
        setError("Please upload an APK file before publishing a hosted release.");
        setIsSubmitting(false);
        return;
      }
      if (!storagePath && selectedFile) {
        setError("You selected an APK file but haven't clicked 'Upload APK' yet.");
        setIsSubmitting(false);
        return;
      }
    } else {
      if (!downloadUrl) {
        setError("External download URL is required for external mirrors.");
        setIsSubmitting(false);
        return;
      }
    }

    if (!checksumSha256) {
      setError("SHA-256 checksum is required to ensure artifact integrity.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("version", version);
    if (versionCode) formData.append("versionCode", versionCode);
    formData.append("releaseDate", releaseDate);
    formData.append("status", status);
    formData.append("androidMinVersion", androidMinVersion);
    if (targetSdkVersion) formData.append("targetSdkVersion", targetSdkVersion);
    formData.append("architectures", architectures);
    if (fileSize) formData.append("fileSize", fileSize);
    if (storagePath) formData.append("storagePath", storagePath);
    if (fileName) formData.append("fileName", fileName);
    if (downloadUrl) formData.append("downloadUrl", downloadUrl);
    if (sourceUrl) formData.append("sourceUrl", sourceUrl);
    formData.append("sourceName", sourceName);
    formData.append("sourceType", sourceType);
    if (checksumSha256) formData.append("checksumSha256", checksumSha256);
    if (checksumMd5) formData.append("checksumMd5", checksumMd5);
    formData.append("verificationStatus", verificationStatus);
    if (verificationEvidence) formData.append("verificationEvidence", verificationEvidence);
    formData.append("changelog", changelog);

    try {
      const res = await createReleaseAction(id, null, formData);
      if (res.success) {
        router.push(`/admin/apps/${id}/releases`);
      } else {
        setError(res.error || "Failed to create release");
      }
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminForm
      title="Publish New Version Release"
      subtitle="Publish an APK release with Supabase Storage, validated SHA-256 checksums, and strict integrity verification."
      backHref={`/admin/apps/${id}/releases`}
      breadcrumbs={[
        { label: "Apps", href: "/admin/apps" },
        { label: "App", href: `/admin/apps/${id}` },
        { label: "Releases", href: `/admin/apps/${id}/releases` },
        { label: "New Release" },
      ]}
      isSubmitting={isSubmitting}
      error={error}
      actions={
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="py-2 px-5 rounded-xl bg-accent hover:bg-accent/90 text-black font-bold text-xs font-mono shadow-lg shadow-accent/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Creating Release...</span>
            </>
          ) : (
            <span>Save & Register Release</span>
          )}
        </button>
      }
      onSubmit={handleSubmit}
    >
      {/* Integrity & Honesty Notice */}
      <div className="p-4 rounded-xl bg-surface-raised border border-white/10 text-xs text-text-secondary flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-accent/10 text-accent shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-white">Release Integrity & Anti-Slop Policy</p>
          <p>
            Uploading an APK does not imply automated malware immunity. Status{" "}
            <span className="font-mono text-accent">VERIFIED</span> strictly indicates cryptographic SHA-256 match between
            the stored artifact and recorded hash. All published releases are immutable once deployed.
          </p>
        </div>
      </div>

      {/* Section 1: Version Details */}
      <FormSection title="Version & Publication State" description="Semantic version, numerical Android versionCode, and initial release status.">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <FormLabel htmlFor="rel-version" required>
              Version Tag (semver)
            </FormLabel>
            <FormInput
              id="rel-version"
              required
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. 1.4.2"
            />
            <FormHelperText>e.g. 1.0.0, 2.4.1</FormHelperText>
          </div>

          <div>
            <FormLabel htmlFor="rel-version-code" required>
              Version Code (Integer)
            </FormLabel>
            <FormInput
              id="rel-version-code"
              type="number"
              required
              min={1}
              value={versionCode}
              onChange={(e) => setVersionCode(e.target.value)}
              placeholder="100"
            />
            <FormHelperText>Numerical sort order for Android</FormHelperText>
          </div>

          <div>
            <FormLabel htmlFor="rel-status" required>
              Release Status
            </FormLabel>
            <FormSelect
              id="rel-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published" | "archived")}
            >
              <option value="draft">Draft (Private, not downloadable)</option>
              <option value="published">Published (Live public release)</option>
              <option value="archived">Archived (Deprecated)</option>
            </FormSelect>
            <FormHelperText>Only Published releases are publicly accessible</FormHelperText>
          </div>

          <div>
            <FormLabel htmlFor="rel-date" required>
              Release Date
            </FormLabel>
            <FormInput
              id="rel-date"
              type="date"
              required
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FormLabel htmlFor="rel-min-os">Min Android Version</FormLabel>
            <FormInput
              id="rel-min-os"
              value={androidMinVersion}
              onChange={(e) => setAndroidMinVersion(e.target.value)}
              placeholder="8.0"
            />
          </div>

          <div>
            <FormLabel htmlFor="rel-target-sdk">Target SDK API Level</FormLabel>
            <FormInput
              id="rel-target-sdk"
              type="number"
              value={targetSdkVersion}
              onChange={(e) => setTargetSdkVersion(e.target.value)}
              placeholder="34"
            />
          </div>

          <div>
            <FormLabel htmlFor="rel-arch">Architectures (comma-separated)</FormLabel>
            <FormInput
              id="rel-arch"
              value={architectures}
              onChange={(e) => setArchitectures(e.target.value)}
              placeholder="arm64-v8a, armeabi-v7a"
            />
          </div>
        </div>
      </FormSection>

      {/* Section 2: Distribution Architecture & Upload */}
      <FormSection
        title="Artifact Distribution Source"
        description="Choose between self-hosted Supabase Storage (private bucket) or external upstream releases."
      >
        <div className="flex gap-4 p-1.5 rounded-xl bg-white/5 border border-white/10 w-fit">
          <button
            type="button"
            onClick={() => handleModeChange("hosted")}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              distributionMode === "hosted"
                ? "bg-accent text-black shadow-md shadow-accent/20"
                : "text-text-secondary hover:text-white"
            }`}
          >
            Hosted APK (Supabase Storage)
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("external")}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              distributionMode === "external"
                ? "bg-accent text-black shadow-md shadow-accent/20"
                : "text-text-secondary hover:text-white"
            }`}
          >
            External Upstream Mirror
          </button>
        </div>

        {distributionMode === "hosted" ? (
          <div className="space-y-4 p-5 rounded-2xl bg-surface-raised border border-white/10">
            <div>
              <FormLabel htmlFor="rel-file-input">Select APK Package (.apk)</FormLabel>
              <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  id="rel-file-input"
                  type="file"
                  accept=".apk,application/vnd.android.package-archive"
                  onChange={handleFileSelect}
                  className="block w-full text-xs text-text-secondary file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/15 file:cursor-pointer cursor-pointer"
                />

                <button
                  type="button"
                  onClick={handleUploadApk}
                  disabled={!selectedFile || isUploading || uploadSuccess}
                  className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-black font-bold text-xs font-mono transition-all shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : uploadSuccess ? (
                    <>
                      <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Uploaded & Verified</span>
                    </>
                  ) : (
                    <span>Upload APK & Hash</span>
                  )}
                </button>
              </div>
              <FormHelperText>
                File is checked for ZIP/APK magic bytes (0x504B0304) and encrypted SHA-256 hash is computed.
              </FormHelperText>
            </div>

            {uploadProgressMsg && (
              <div className="text-xs font-mono text-accent animate-pulse flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{uploadProgressMsg}</span>
              </div>
            )}

            {storagePath && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Artifact Stored in Private Bucket: app-releases</span>
                </div>
                <div className="text-[11px] text-text-secondary break-all">
                  Path: <span className="text-white">{storagePath}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="rel-dl-url" required>
                Direct External Download URL
              </FormLabel>
              <FormInput
                id="rel-dl-url"
                type="url"
                required
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="https://github.com/example/releases/download/v1.0/app.apk"
              />
              <FormHelperText>Must be an official HTTPS URL.</FormHelperText>
            </div>

            <div>
              <FormLabel htmlFor="rel-source-url">Source / Repository Link</FormLabel>
              <FormInput
                id="rel-source-url"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://github.com/example/repo"
              />
            </div>

            <div>
              <FormLabel htmlFor="rel-source-name">Mirror Provider Name</FormLabel>
              <FormInput
                id="rel-source-name"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="Official GitHub Release"
              />
            </div>

            <div>
              <FormLabel htmlFor="rel-source-type">Source Channel</FormLabel>
              <FormSelect
                id="rel-source-type"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
              >
                <option value="github_release">GitHub Release</option>
                <option value="official_site">Official Developer Website</option>
                <option value="f_droid">F-Droid Repository</option>
                <option value="trusted_external">Trusted External Mirror</option>
              </FormSelect>
            </div>
          </div>
        )}
      </FormSection>

      {/* Section 3: Integrity & Cryptographic Checksums */}
      <FormSection
        title="Artifact Integrity & Checksums"
        description="Cryptographic hash values ensure visitors receive exact bit-for-bit authentic artifacts."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormLabel htmlFor="rel-sha256" required>
              SHA-256 Checksum (Hexadecimal)
            </FormLabel>
            <FormInput
              id="rel-sha256"
              required
              readOnly={distributionMode === "hosted" && !!storagePath}
              value={checksumSha256}
              onChange={(e) => setChecksumSha256(e.target.value.toLowerCase().trim())}
              placeholder="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
              className={storagePath ? "bg-white/5 cursor-not-allowed font-mono text-xs" : "font-mono text-xs"}
            />
            <FormHelperText>
              {storagePath
                ? "Calculated automatically from the uploaded file."
                : "Provide the 64-character SHA-256 hash provided by the upstream developer."}
            </FormHelperText>
          </div>

          <div>
            <FormLabel htmlFor="rel-file-size">File Size (Bytes)</FormLabel>
            <FormInput
              id="rel-file-size"
              type="number"
              value={fileSize}
              onChange={(e) => setFileSize(e.target.value)}
              placeholder="15000000"
            />
            <FormHelperText>
              {fileSize
                ? `${(Number(fileSize) / (1024 * 1024)).toFixed(2)} MB`
                : "Real size in bytes"}
            </FormHelperText>
          </div>

          <div>
            <FormLabel htmlFor="rel-md5">MD5 Checksum (Optional)</FormLabel>
            <FormInput
              id="rel-md5"
              value={checksumMd5}
              onChange={(e) => setChecksumMd5(e.target.value.toLowerCase().trim())}
              placeholder="d41d8cd98f00b204e9800998ecf8427e"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FormLabel htmlFor="rel-v-status">Initial Verification Status</FormLabel>
            <FormSelect
              id="rel-v-status"
              value={verificationStatus}
              onChange={(e) => setVerificationStatus(e.target.value)}
            >
              <option value="pending">Pending (Awaiting Checksum Integrity Verification)</option>
              <option value="verified">Verified (Cryptographic Hash Match Confirmed)</option>
              <option value="unverified">Unverified (External Mirror / Untracked)</option>
              <option value="failed">Failed (Integrity Mismatch / Unsafe)</option>
            </FormSelect>
          </div>

          <div>
            <FormLabel htmlFor="rel-evidence">Audit Evidence Notes</FormLabel>
            <FormInput
              id="rel-evidence"
              value={verificationEvidence}
              onChange={(e) => setVerificationEvidence(e.target.value)}
              placeholder="Official developer release signature verified against upstream commit."
            />
          </div>
        </div>

        <div>
          <FormLabel htmlFor="rel-changelog">Version Changelog (one note per line)</FormLabel>
          <FormTextarea
            id="rel-changelog"
            rows={4}
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            placeholder="Optimized Adreno 740 Vulkan driver hooks&#10;Added Android 14 per-app frame rate governor&#10;Fixed touch latency micro-stutter"
          />
        </div>
      </FormSection>
    </AdminForm>
  );
}
