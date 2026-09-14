import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Android Gaming",
  description: "Android gaming optimization — device settings, SoC performance, and system-level tuning for better gameplay.",
  path: "/android",
});

export default function AndroidPage() {
  return (
    <div className="container-content section">
      <div className="flex flex-col gap-2 mb-10">
        <span className="label-mono">Android</span>
        <h1 className="text-3xl font-bold text-text-primary">Android Gaming Optimization</h1>
        <p className="text-text-secondary max-w-xl">
          System-level settings, device configuration, and SoC-specific tuning for better gaming performance on Android.
        </p>
      </div>
      <p className="text-text-muted font-mono text-sm">Content coming soon.</p>
    </div>
  );
}
