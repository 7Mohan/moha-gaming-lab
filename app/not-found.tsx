import Link from "next/link";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Page Not Found",
  description: "The page you are looking for does not exist.",
  noIndex: true,
});

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] px-6 text-center">
      <span className="label-mono mb-4">404</span>
      <h1 className="text-3xl font-bold text-text-primary mb-3">Page not found</h1>
      <p className="text-text-secondary mb-8 max-w-sm">
        This page does not exist or may have been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-bg-elevated border border-border-default
          rounded-md text-sm font-medium text-text-primary
          hover:border-border-strong hover:bg-bg-overlay transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        Return to home
      </Link>
    </div>
  );
}
