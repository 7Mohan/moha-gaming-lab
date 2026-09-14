import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "About",
  description: "About Moha Gaming Lab — an Android gaming performance platform built for serious players.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="container-content section">
      <div className="max-w-2xl">
        <span className="label-mono mb-4 block">About</span>
        <h1 className="text-3xl font-bold text-text-primary mb-6">About Moha Gaming Lab</h1>

        <div className="flex flex-col gap-5 text-text-secondary">
          <p>
            Moha Gaming Lab is a gaming technology platform focused on Android gaming performance,
            optimization, and diagnostics.
          </p>
          <p>
            We build tools, guides, and Android applications designed to help players understand
            and improve their gaming experience — from FPS stability to network latency.
          </p>
          <p>
            Our content is technical and specific. We do not publish performance claims we cannot
            verify, and we do not display fake statistics or reviews.
          </p>
        </div>
      </div>
    </div>
  );
}
