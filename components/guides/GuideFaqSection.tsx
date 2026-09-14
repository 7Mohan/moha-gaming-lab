"use client";

import * as React from "react";
import type { GuideFaq } from "@/types/guide";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

interface GuideFaqSectionProps {
  faqs: GuideFaq[];
}

export function GuideFaqSection({ faqs }: GuideFaqSectionProps) {
  const [openIndexes, setOpenIndexes] = React.useState<number[]>([0]);

  if (!faqs || faqs.length === 0) return null;

  const toggleFaq = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <section aria-labelledby="faq-heading" className="mt-12 pt-8 border-t border-border-default flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <HelpCircle size={18} className="text-accent" aria-hidden="true" />
        <h2 id="faq-heading" className="text-xl font-bold text-text-primary">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="border border-border-default rounded-md overflow-hidden bg-bg-surface divide-y divide-border-subtle">
        {faqs.map((faq, idx) => {
          const isOpen = openIndexes.includes(idx);
          const answerId = `faq-answer-${idx}`;
          const buttonId = `faq-button-${idx}`;

          return (
            <div key={idx} className="flex flex-col">
              <button
                id={buttonId}
                type="button"
                onClick={() => toggleFaq(idx)}
                aria-expanded={isOpen}
                aria-controls={answerId}
                className="p-4 sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-bg-elevated/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <span className="text-sm font-semibold text-text-primary">
                  {faq.question}
                </span>
                <span className="text-text-muted flex-shrink-0">
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              {isOpen && (
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm text-text-secondary leading-relaxed bg-bg-elevated/20"
                >
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
