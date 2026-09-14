import * as React from "react";
import { Info } from "lucide-react";

interface AffiliateDisclosureProps {
  className?: string;
}

export function AffiliateDisclosure({ className }: AffiliateDisclosureProps) {
  return (
    <div
      className={`p-3 rounded-xl bg-bg-surface border border-border-subtle text-text-muted text-[11px] font-mono flex items-start gap-2 ${className || ""}`}
      role="note"
    >
      <Info size={14} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
      <p className="leading-relaxed">
        <span className="text-text-secondary font-semibold">Affiliate Disclosure:</span> Some links on this page may be affiliate links. If you make a purchase through them, Moha Gaming Lab may receive a commission at no additional cost to you. We only recommend hardware and tools we independently verify.
      </p>
    </div>
  );
}
