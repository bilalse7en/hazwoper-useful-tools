'use client';

import { HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * BlogFaqSection — renders the blog's exactly-5 AI-generated FAQs as a
 * zero-JS <details>/<summary> accordion (mirrors the tool-page FAQ pattern).
 * The matching FAQPage JSON-LD is rendered server-side in blog/[slug]/page.js
 * so search engines always see it in the initial HTML.
 */
export function BlogFaqSection({ faq, title }) {
  if (!Array.isArray(faq) || faq.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-3 pt-4">
        <Badge className="bg-primary/10 text-primary border border-primary/20 font-black uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 rounded-full shadow-xs">
          Reader Questions
        </Badge>
        <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground flex items-center gap-3">
          <HelpCircle className="w-7 h-7 text-primary" />
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground font-medium text-sm max-w-xl">
          The {faq.length} most common questions about{' '}
          {title ? `“${title}”` : 'this article'} — answered from the article
          itself.
        </p>
      </div>

      <div className="space-y-3">
        {faq.map((item, i) => (
          <details
            key={i}
            className="group rounded-2xl border border-border bg-card/40 overflow-hidden"
          >
            <summary className="cursor-pointer px-6 py-4 font-bold text-foreground text-sm flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <svg
                className="w-4 h-4 text-muted-foreground shrink-0 ml-4 transition-transform group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div className="px-6 pb-5 text-sm text-muted-foreground font-medium leading-relaxed">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
