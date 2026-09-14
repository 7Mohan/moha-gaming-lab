import Link from "next/link";
import { buildMetadata } from "@/lib/metadata";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata = buildMetadata({
  title: "Contact",
  description: "Contact Moha Gaming Lab for game optimization queries, partnerships, and technical feedback.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="container-content section py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <span className="label-mono mb-2 block text-accent">Communications</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-3">
            Get in Touch
          </h1>
          <p className="text-base text-text-secondary leading-relaxed max-w-xl">
            Have questions about optimizing a specific game, need hardware recommendations, or want to suggest new testing tools? Send us a message directly.
          </p>
        </div>

        {/* Contact Form powered by Brevo */}
        <ContactForm />

        {/* Alternative Channels */}
        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-bg-surface border border-border-default">
            <h2 className="text-sm font-bold text-text-primary mb-1">Direct Administrator Email</h2>
            <p className="text-xs text-text-muted mb-2">For urgent business, technical inquiries, or security disclosures.</p>
            <a
              href="mailto:4mohabashir@gmail.com"
              className="text-xs font-mono text-accent hover:underline"
            >
              4mohabashir@gmail.com
            </a>
          </div>

          <div className="p-5 rounded-xl bg-bg-surface border border-border-default">
            <h2 className="text-sm font-bold text-text-primary mb-1">Community & Guides</h2>
            <p className="text-xs text-text-muted mb-2">Check our latest FPS guides and device benchmarks before asking.</p>
            <Link
              href="/guides"
              className="text-xs font-mono text-accent hover:underline inline-flex items-center gap-1"
            >
              Browse technical guides <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
