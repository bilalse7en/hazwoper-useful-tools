'use client';

import { toolInfo, generateFAQSchema } from '@/lib/seo';
import { JsonLd } from '@/components/json-ld';

/**
 * ToolSEOContent - Renders rich, crawlable text content on each tool page.
 *
 * This component surfaces the educational content from toolInfo (benefits,
 * how-to-use, use cases, FAQ) directly on the tool execution page so that
 * search engines see substantial text alongside the interactive widget.
 *
 * Uses native HTML <details>/<summary> for FAQ accordion (no JS required).
 * Includes FAQPage JSON-LD structured data for rich search results.
 */
export function ToolSEOContent({ slug }) {
  const info = toolInfo[slug];
  if (!info) return null;

  const faqSchema = generateFAQSchema(slug);

  return (
    <section className="mt-12 pt-12 border-t border-border space-y-12">
      {/* FAQ JSON-LD Structured Data */}
      {faqSchema && <JsonLd data={faqSchema} />}

      {/* How to Use */}
      {info.howToUse && (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-foreground tracking-tight">
            How to Use the {info.name}
          </h2>
          <p className="text-muted-foreground font-medium leading-relaxed max-w-3xl">
            {info.howToUse}
          </p>
        </div>
      )}

      {/* Key Benefits */}
      {info.benefits?.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-foreground tracking-tight">
            Key Benefits
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {info.benefits.map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-2xl bg-muted/30 border border-border"
              >
                <svg
                  className="w-5 h-5 text-primary mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-bold text-foreground opacity-80 leading-snug">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Use Cases */}
      {info.useCases?.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-foreground tracking-tight">
            Use Cases
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {info.useCases.map((useCase, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl bg-card/40 border border-border space-y-2"
              >
                <h3 className="font-black text-foreground">{useCase.title}</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ Section - uses native HTML details/summary for zero-JS accordion */}
      {info.faq?.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-foreground tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {info.faq.map((item, i) => (
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
                <div className="px-6 pb-4 text-sm text-muted-foreground font-medium leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Additional SEO text block */}
      <div className="p-8 rounded-3xl bg-muted/20 border border-border space-y-3">
        <h3 className="font-black text-foreground text-lg">
          About the {info.name}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {info.detailedDescription}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The {info.name} is part of Content Suite&apos;s professional{' '}
          {info.category?.toLowerCase()} toolkit. All processing happens
          directly in your browser using advanced WebAssembly and Web Worker
          technologies, ensuring your files never leave your device. This
          privacy-first approach makes it ideal for sensitive industrial
          documentation and safety training materials that require strict data
          handling protocols.
        </p>
      </div>
    </section>
  );
}
