"use client";

import * as React from "react";
import type { AppInstallGuide } from "@/types/app";
import { Check, Copy, HelpCircle, Terminal, Trash2 } from "lucide-react";

interface AppInstallGuideProps {
  guide: AppInstallGuide;
  appName: string;
}

export function AppInstallGuideSection({ guide, appName: _appName }: AppInstallGuideProps) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Prerequisites */}
      {guide.prerequisites && guide.prerequisites.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted">
            Prerequisites
          </h3>
          <ul className="flex flex-col gap-1.5 pl-4 list-disc text-sm text-text-secondary">
            {guide.prerequisites.map((req, idx) => (
              <li key={idx} className="leading-relaxed">
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sideload Installation Steps */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted">
          Installation Procedure
        </h3>
        <ol className="flex flex-col gap-2 list-decimal pl-4 text-sm text-text-secondary">
          {guide.installationSteps.map((step, idx) => (
            <li key={idx} className="leading-relaxed pl-1">
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Special ADB or Shizuku Setup */}
      {guide.specialSetup && guide.specialSetup.instructions.length > 0 && (
        <div className="p-4 rounded-md border border-border-default bg-bg-surface flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-text-primary font-semibold">
            <Terminal size={14} className="text-accent" aria-hidden="true" />
            <span>Elevated Setup ({guide.specialSetup.type.toUpperCase()})</span>
          </div>

          <div className="flex flex-col gap-2 text-xs text-text-secondary">
            {guide.specialSetup.instructions.map((inst, idx) => (
              <p key={idx}>{inst}</p>
            ))}
          </div>

          {guide.specialSetup.commands && guide.specialSetup.commands.length > 0 && (
            <div className="flex flex-col gap-2">
              {guide.specialSetup.commands.map((cmd, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded bg-bg-elevated border border-border-subtle font-mono text-xs text-accent overflow-x-auto"
                >
                  <code>{cmd}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy(cmd, idx)}
                    className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-bg-surface hover:bg-bg-overlay text-text-muted hover:text-text-primary border border-border-subtle text-2xs transition-colors"
                    aria-label="Copy terminal command"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check size={12} className="text-accent" />
                        <span className="text-accent">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Troubleshooting */}
      {guide.troubleshooting && guide.troubleshooting.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-text-muted">
            <HelpCircle size={13} className="text-accent" aria-hidden="true" />
            <span>Troubleshooting Common Issues</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {guide.troubleshooting.map((item, idx) => (
              <div key={idx} className="p-3 rounded bg-bg-surface border border-border-subtle text-xs flex flex-col gap-1">
                <span className="font-semibold text-text-primary">
                  Q: {item.issue}
                </span>
                <span className="text-text-secondary leading-relaxed">
                  A: {item.resolution}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uninstallation */}
      {guide.uninstallSteps && guide.uninstallSteps.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
          <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
            <Trash2 size={13} className="text-text-muted" aria-hidden="true" />
            <span>Uninstallation Procedure</span>
          </div>
          <ul className="flex flex-col gap-1 list-disc pl-4 text-xs text-text-secondary">
            {guide.uninstallSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
