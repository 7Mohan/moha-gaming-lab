"use client";

import * as React from "react";
import type { GuideSection, GuideCodeBlock, GuideTable } from "@/types/guide";
import { TechnicalCallout } from "@/components/guides/TechnicalCallout";
import { Check, Copy, Hash, Terminal } from "lucide-react";

interface GuideContentRendererProps {
  sections: GuideSection[];
}

function CodeBlockView({ block }: { block: GuideCodeBlock }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(block.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="my-6 rounded-md border border-border-default overflow-hidden bg-bg-surface flex flex-col font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-bg-elevated border-b border-border-subtle text-2xs text-text-muted">
        <div className="flex items-center gap-2">
          <Terminal size={12} className="text-accent" aria-hidden="true" />
          <span className="uppercase">{block.language}</span>
          {block.caption && <span>• {block.caption}</span>}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-2xs text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
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

      {/* Code Area */}
      <pre className="p-4 overflow-x-auto text-accent text-xs leading-relaxed">
        <code>{block.code}</code>
      </pre>

      {/* Explanation Footer */}
      {block.explanation && (
        <div className="px-4 py-2 bg-bg-elevated/40 border-t border-border-subtle text-2xs text-text-muted font-sans">
          {block.explanation}
        </div>
      )}
    </div>
  );
}

function TableView({ table }: { table: GuideTable }) {
  return (
    <div className="my-6 flex flex-col gap-2">
      {table.caption && (
        <span className="text-2xs font-mono text-text-muted">
          Table: {table.caption}
        </span>
      )}
      <div className="border border-border-default rounded-md overflow-x-auto bg-bg-surface">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border-default bg-bg-elevated">
              {table.headers.map((header, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className="px-4 py-3 font-mono font-semibold text-text-primary whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle font-mono text-text-secondary">
            {table.rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-bg-elevated/40 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-2.5 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionView({ section }: { section: GuideSection }) {
  const HeadingTag = section.level;
  const headingClass =
    section.level === "h2"
      ? "text-xl sm:text-2xl font-bold text-text-primary mt-10 mb-4 pt-4 border-t border-border-subtle flex items-center gap-2 group"
      : "text-lg font-semibold text-text-primary mt-6 mb-3 flex items-center gap-2 group";

  return (
    <section id={section.id} className="scroll-mt-24">
      <HeadingTag className={headingClass}>
        <span>{section.title}</span>
        <a
          href={`#${section.id}`}
          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent transition-opacity focus-visible:opacity-100"
          aria-label={`Link to section: ${section.title}`}
        >
          <Hash size={16} aria-hidden="true" />
        </a>
      </HeadingTag>

      {/* Paragraphs */}
      {section.paragraphs && (
        <div className="flex flex-col gap-3 text-base text-text-secondary leading-relaxed">
          {section.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>
      )}

      {/* Lists */}
      {section.listItems && section.listItems.length > 0 && (
        <div className="my-4 pl-4 text-sm text-text-secondary">
          {section.orderedList ? (
            <ol className="list-decimal flex flex-col gap-2 pl-1 leading-relaxed">
              {section.listItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ol>
          ) : (
            <ul className="list-disc flex flex-col gap-2 pl-1 leading-relaxed">
              {section.listItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Optional Table */}
      {section.table && <TableView table={section.table} />}

      {/* Optional Code Block */}
      {section.codeBlock && <CodeBlockView block={section.codeBlock} />}

      {/* Optional Callout */}
      {section.callout && (
        <TechnicalCallout
          type={section.callout.type}
          title={section.callout.title}
          content={section.callout.content}
        />
      )}

      {/* Nested Subsections */}
      {section.subSections && section.subSections.length > 0 && (
        <div className="flex flex-col gap-4">
          {section.subSections.map((subSec) => (
            <SectionView key={subSec.id} section={subSec} />
          ))}
        </div>
      )}
    </section>
  );
}

export function GuideContentRenderer({ sections }: GuideContentRendererProps) {
  return (
    <div className="flex flex-col gap-2">
      {sections.map((section) => (
        <SectionView key={section.id} section={section} />
      ))}
    </div>
  );
}
