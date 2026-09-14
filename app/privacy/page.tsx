import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/metadata";
import { Shield, Lock, Eye, Cookie, FileText, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy & Monetization Disclosures",
  description:
    "Privacy practices, cookie policy, non-deceptive advertising disclosures, and data protection at Moha Gaming Lab.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="container-content py-12 md:py-20 space-y-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-mono">
          <Shield size={14} />
          <span>Privacy & Transparency Standards</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          Privacy Policy & Disclosures
        </h1>
        <p className="text-sm md:text-base text-text-secondary leading-relaxed">
          Moha Gaming Lab operates on a <span className="text-white font-semibold">Value-First, Privacy-First</span> principle. We provide Android gaming performance diagnostics, verified APK distribution, and technical optimization guides without invasive tracking or deceptive monetization.
        </p>
        <p className="text-xs font-mono text-text-muted">
          Last Updated: September 10, 2026 • Effective Worldwide
        </p>
      </div>

      {/* Quick Summary Card */}
      <div className="p-6 rounded-2xl bg-bg-surface border border-border-default space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Lock size={18} className="text-accent" />
          <span>Summary of Core Privacy Commitments</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-text-secondary">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
            <span><strong className="text-white">Zero PII Storage:</strong> We never permanently store personal IP addresses or browsing histories.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
            <span><strong className="text-white">Non-Deceptive Ads:</strong> Advertisements never disguise themselves as fake &ldquo;Download&rdquo; buttons or virus alerts.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
            <span><strong className="text-white">Independent Diagnostics:</strong> Browser diagnostics (FPS, Touch, Ping) execute 100% locally in your client.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
            <span><strong className="text-white">Isolated Downloads:</strong> Ad blockers or ad failures will never prevent or delay APK downloads.</span>
          </div>
        </div>
      </div>

      {/* Section 1: Information We Process */}
      <section className="space-y-4 text-sm text-text-secondary leading-relaxed">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Eye size={18} className="text-accent" />
          <span>1. Information We Process</span>
        </h2>
        <p>
          Moha Gaming Lab does not require user registration or account creation to access benchmark tools, technical guides, or verified APK downloads.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-xs">
          <li>
            <strong className="text-white">Local Diagnostic Telemetry:</strong> Hardware capabilities (logical CPU cores, approximate RAM, display refresh rates) probed by our gaming tools are processed strictly in-memory inside your web browser and are not uploaded to our servers.
          </li>
          <li>
            <strong className="text-white">Aggregated Download Telemetry:</strong> When you download a release artifact, our gateway records an anonymous counter increment to measure bandwidth demand and release popularity without recording your IP address.
          </li>
          <li>
            <strong className="text-white">Search Analytics:</strong> Global search queries are aggregated in tokenized, anonymized form to discover missing guides and optimize index retrieval.
          </li>
        </ul>
      </section>

      {/* Section 2: Cookies & Local Storage */}
      <section className="space-y-4 text-sm text-text-secondary leading-relaxed">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cookie size={18} className="text-accent" />
          <span>2. Cookies & Storage Technology</span>
        </h2>
        <p>
          We differentiate between two categories of storage:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-bg-surface border border-border-default space-y-1">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Essential Storage</h3>
            <p className="text-xs text-text-muted">
              Strictly necessary for security, CSRF protection, and administrator authentication sessions. These cannot be disabled.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-bg-surface border border-border-default space-y-1">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Consent Choice Storage</h3>
            <p className="text-xs text-text-muted">
              Stored under <code className="text-accent">mgl_consent</code> to remember whether you selected recommended non-invasive contextual ads or essential-only settings.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Advertising & Affiliate Disclosure */}
      <section className="space-y-4 text-sm text-text-secondary leading-relaxed">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText size={18} className="text-accent" />
          <span>3. Advertising & Affiliate Disclosures</span>
        </h2>
        <p>
          To maintain independent testing infrastructure, high-bandwidth APK storage, and research hardware, Moha Gaming Lab displays non-intrusive advertisements and vetted affiliate links.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-xs">
          <li>
            <strong className="text-white">Strict Labeling:</strong> All advertising units are explicitly labeled with an uppercase <span className="font-mono text-accent">ADVERTISEMENT</span> badge.
          </li>
          <li>
            <strong className="text-white">No Deceptive Downloads:</strong> Advertisements will never be disguised as green &ldquo;Download&rdquo;, &ldquo;Install&rdquo;, or &ldquo;Update&rdquo; buttons.
          </li>
          <li>
            <strong className="text-white">Affiliate Links:</strong> When articles recommend controllers, thermal coolers, or display adapters, links may redirect through our gateway (<code className="text-accent">/api/go/[slug]</code>). We may earn a small referral commission at zero additional cost to you.
          </li>
          <li>
            <strong className="text-white">Zero Influence on Verification:</strong> Sponsorships or affiliate partnerships have zero impact on cryptographic APK integrity checks or benchmark scores. A sponsored product is never labeled &ldquo;Verified&rdquo; unless it passes our standard cryptographic audit.
          </li>
        </ul>
      </section>

      {/* Section 4: Contact & Data Inquiries */}
      <section className="p-6 rounded-2xl bg-bg-surface border border-border-default space-y-3">
        <h2 className="text-base font-bold text-white">4. Questions & Privacy Requests</h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          If you have questions about our privacy policies, data protection practices, or wish to submit an inquiry, please contact our administrative desk:
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs font-mono pt-2">
          <span className="text-white">Email: <a href="mailto:4mohabashir@gmail.com" className="text-accent hover:underline">4mohabashir@gmail.com</a></span>
          <Link href="/contact" className="text-accent hover:underline">
            Visit Contact Portal →
          </Link>
        </div>
      </section>
    </div>
  );
}
