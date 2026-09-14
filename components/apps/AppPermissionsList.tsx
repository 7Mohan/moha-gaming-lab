import * as React from "react";
import type { AppPermission, PermissionProtectionLevel } from "@/types/app";
import { Badge } from "@/components/ui/Badge";
import { Shield, Info } from "lucide-react";

interface AppPermissionsListProps {
  permissions: AppPermission[];
}

const protectionBadgeVariant: Record<PermissionProtectionLevel, "default" | "warning" | "error" | "outline"> = {
  normal: "default",
  dangerous: "warning",
  special: "warning",
  signature: "error",
};

export function AppPermissionsList({ permissions }: AppPermissionsListProps) {
  if (permissions.length === 0) {
    return (
      <div className="p-4 rounded border border-border-default bg-bg-surface text-sm text-text-muted">
        No special Android permissions requested by this application.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
        <Shield size={14} className="text-accent" aria-hidden="true" />
        <span>Android Security & Permission Audit</span>
      </div>

      <div className="border border-border-default rounded-md overflow-hidden bg-bg-surface divide-y divide-border-subtle">
        {permissions.map((perm) => (
          <div key={perm.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-text-primary">
                  {perm.name}
                </span>
                <Badge variant={protectionBadgeVariant[perm.protectionLevel]} size="sm">
                  {perm.protectionLevel.toUpperCase()}
                </Badge>
              </div>

              <code className="text-2xs font-mono text-text-muted truncate block">
                {perm.id}
              </code>

              <p className="text-xs text-text-secondary leading-relaxed mt-1">
                {perm.reason}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 p-3 rounded bg-bg-elevated border border-border-subtle text-xs text-text-muted">
        <Info size={14} className="text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          Permissions are audited against published Android manifest declarations. Only grant permissions that match your intended use case.
        </span>
      </div>
    </div>
  );
}
