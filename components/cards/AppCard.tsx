import Link from "next/link";
import type { App, VerificationStatus } from "@/types/app";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusIndicator, type StatusType } from "@/components/ui/StatusIndicator";

interface AppCardProps {
  app: App;
}

const statusMap: Record<App["status"], StatusType> = {
  active: "stable",
  stable: "stable",
  beta: "beta",
  "coming-soon": "coming-soon",
  deprecated: "deprecated",
};

const verificationBadgeVariant: Record<VerificationStatus, "success" | "warning" | "default" | "error"> = {
  verified: "success",
  pending: "warning",
  unverified: "default",
  unavailable: "error",
  failed: "error",
};

const verificationLabel: Record<VerificationStatus, string> = {
  verified: "Verified Source",
  pending: "Verification Pending",
  unverified: "Unverified Source",
  unavailable: "Source Unavailable",
  failed: "Integrity Check Failed",
};

export function AppCard({ app }: AppCardProps) {
  const href = `/apps/${app.slug}`;
  const indicatorStatus = statusMap[app.status] || "stable";
  const latestRelease = app.releases[0];
  const verification = latestRelease?.verificationStatus ?? "unverified";

  return (
    <Card as="article" interactive variant="surface" className="h-full flex flex-col justify-between">
      <Link
        href={href}
        className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md p-5 flex flex-col justify-between gap-4"
        aria-label={`${app.name} — ${app.excerpt}`}
      >
        <div className="flex flex-col gap-3.5">
          {/* Top Row: Icon + Names + Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* App Icon Monogram Slot */}
              <div
                className="w-11 h-11 rounded-md bg-bg-elevated border border-border-default flex items-center justify-center flex-shrink-0 text-accent font-mono font-bold text-sm group-hover:border-accent/40 transition-colors"
                aria-hidden="true"
              >
                {app.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold text-text-primary leading-tight truncate">
                    {app.name}
                  </h3>
                  <span className="text-2xs font-mono text-accent font-medium">
                    v{latestRelease?.version ?? "Latest"}
                  </span>
                </div>
                {app.packageName && (
                  <span className="text-2xs font-mono text-text-muted block truncate mt-0.5">
                    {app.packageName}
                  </span>
                )}
              </div>
            </div>

            <StatusIndicator status={indicatorStatus} variant="badge" />
          </div>

          {/* Verification & Category Row */}
          <div className="flex items-center gap-2 flex-wrap text-2xs font-mono">
            <Badge variant={verificationBadgeVariant[verification]} size="sm">
              {verificationLabel[verification]}
            </Badge>
            <span className="text-text-muted">•</span>
            <span className="text-text-secondary">{app.category}</span>
          </div>

          {/* Excerpt */}
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
            {app.excerpt}
          </p>
        </div>

        {/* Bottom Metadata & CTA Row */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="default" size="sm">
              Android {app.minAndroidVersion}+
            </Badge>
            {app.architectures.length > 0 && (
              <Badge variant="outline" size="sm">
                {app.architectures[0]}
              </Badge>
            )}
            {app.requiresRoot ? (
              <Badge variant="warning" size="sm">Root</Badge>
            ) : app.requiresShizuku ? (
              <Badge variant="outline" size="sm">Shizuku</Badge>
            ) : (
              <Badge variant="success" size="sm">No Root</Badge>
            )}
          </div>

          <span className="text-2xs font-mono font-semibold text-accent flex items-center gap-1">
            <span>View App</span>
            <span aria-hidden="true">&rarr;</span>
          </span>
        </div>
      </Link>
    </Card>
  );
}
