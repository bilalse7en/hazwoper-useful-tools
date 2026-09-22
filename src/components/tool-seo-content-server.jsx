import Link from 'next/link';
import { toolInfo, toolReferences } from '@/lib/seo';
import { toolEditorialContent } from '@/lib/editorial';
import { getCanonicalUrl } from '@/lib/site-config';
import {
  BookOpen,
  ExternalLink,
  ShieldAlert,
  Cpu,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

function renderParagraphs(text) {
  if (!text) return null;
  if (Array.isArray(text)) {
    return text.map((item, idx) => (
      <p
        key={idx}
        className="text-muted-foreground font-medium leading-relaxed mb-4"
      >
        {typeof item === 'string' ? item : JSON.stringify(item)}
      </p>
    ));
  }
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks.map((block, idx) => {
    if (
      block.startsWith('1.') ||
      block.startsWith('2.') ||
      block.startsWith('- ') ||
      block.startsWith('* ')
    ) {
      const lines = block
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      return (
        <div key={idx} className="space-y-3 my-4">
          {lines.map((line, lIdx) => (
            <div
              key={lIdx}
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-muted/20 border border-border/60"
            >
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                {lIdx + 1}
              </span>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                {line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '')}
              </p>
            </div>
          ))}
        </div>
      );
    }
    return (
      <p
        key={idx}
        className="text-muted-foreground font-medium leading-relaxed mb-4"
      >
        {block}
      </p>
    );
  });
}

export function ToolSEOContentServer({ slug }) {
  const info = toolInfo[slug];
  const editorial = toolEditorialContent?.[slug];
  if (!info) return null;

  const allFaq = [...(info.faq || []), ...(editorial?.additionalFaq || [])];
  const references = toolReferences?.[slug] || [];

  const faqSchema =
    allFaq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: allFaq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }
      : null;

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: info.name,
    url: getCanonicalUrl(`/tools/${slug}`),
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web Browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: info.detailedDescription,
  };

  // Resolve related tools in same category or peer categories
  const otherTools = Object.entries(toolInfo).filter(([s]) => s !== slug);
  const sameCategory = otherTools.filter(
    ([, item]) => item.category === info.category
  );
  const relatedTools =
    sameCategory.length >= 3
      ? sameCategory.slice(0, 3)
      : [
          ...sameCategory,
          ...otherTools
            .filter(([, item]) => item.category !== info.category)
            .slice(0, 3 - sameCategory.length),
        ];

  return (
    <section className="mt-10 sm:mt-12 pt-10 sm:pt-12 border-t border-border space-y-8 sm:space-y-10">
      {faqSchema && (
        <script
          id={`schema-faq-${slug}`}
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        id={`schema-webapp-${slug}`}
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />

      {/* 1. Overview & Purpose */}
      <div className="space-y-4 sm:space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
          Overview &amp; Purpose
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          About the {info.name}
        </h2>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {editorial?.overview ? (
            renderParagraphs(editorial.overview)
          ) : (
            <p className="text-muted-foreground font-medium leading-relaxed text-sm sm:text-base">
              {info.detailedDescription}
            </p>
          )}
        </div>
        {info.benefits?.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3.5 pt-2">
            {info.benefits.map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/30 border border-border shadow-2xs"
              >
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-foreground opacity-90 leading-snug">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Step-by-Step Guide */}
      <div className="space-y-4 sm:space-y-5 bg-card/40 border border-border p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
          Operational Instructions
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight">
          How to Use the {info.name} Effectively
        </h2>
        <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
          {editorial?.stepByStep ? (
            renderParagraphs(editorial.stepByStep)
          ) : (
            <p className="text-muted-foreground font-medium leading-relaxed">
              {info.howToUse ||
                'Upload or input your files into the workspace interface above. Follow on-screen parameters to process your data locally in your browser.'}
            </p>
          )}
        </div>
      </div>

      {/* 3. Formulas & Scientific Methodology */}
      {editorial?.methodology && (
        <div className="space-y-4 sm:space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
            Technical Methodology
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight">
            Scientific Methodology &amp; Engineering Standards
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
            {renderParagraphs(editorial.methodology)}
          </div>
        </div>
      )}

      {/* 4. Real-World Scenarios & Examples */}
      {editorial?.examples && (
        <div className="space-y-4 sm:space-y-5 bg-muted/20 border border-border p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
            Case Studies
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight">
            Real-World Scenarios &amp; Worked Examples
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
            {renderParagraphs(editorial.examples)}
          </div>
        </div>
      )}

      {/* 5. Important Considerations & Technical Limitations */}
      <div className="space-y-3 bg-primary/5 border border-primary/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-xs">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-primary shrink-0" />
          <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
            Important Operational Considerations &amp; Limitations
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
          The {info.name} provides automated client-side processing, formatting,
          and conversion algorithms designed to accelerate your technical
          workflows. All calculations and transformations are executed using
          standardized mathematical heuristics and web platform capabilities.
          Outputs should be reviewed by qualified personnel before deployment in
          safety-critical, legally binding, or regulatory compliance settings.
          Neither this tool nor the website constitutes an official government
          agency application.
        </p>
      </div>

      {/* 6. Industry Applications & Use Cases */}
      {info.useCases?.length > 0 && (
        <div className="space-y-4 sm:space-y-5">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Industry Applications &amp; Use Cases
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {info.useCases.map((useCase, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 rounded-2xl bg-card/40 border border-border space-y-1.5 shadow-2xs"
              >
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  {useCase.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Interactive FAQ Section */}
      {allFaq.length > 0 && (
        <div className="space-y-4 sm:space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
            Knowledge Base
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2.5">
            {allFaq.map((item, i) => (
              <details
                key={i}
                className="group rounded-xl sm:rounded-2xl border border-border bg-card/40 overflow-hidden"
              >
                <summary className="cursor-pointer px-4 sm:px-5 py-3.5 font-bold text-foreground text-xs sm:text-sm flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
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
                <div className="px-4 sm:px-5 pb-3.5 text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* 8. Relevant Regulatory & Technical Standards References */}
      {references.length > 0 && (
        <div className="space-y-4 sm:space-y-5 bg-card/30 border border-border p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
            Authoritative Standards
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Relevant Specifications &amp; Technical References
          </h2>
          <div className="grid gap-2.5">
            {references.map((ref, idx) => (
              <a
                key={idx}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors group"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                    {ref.title}
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  </div>
                  <div className="text-[11px] text-muted-foreground font-medium">
                    {ref.organization}
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary shrink-0 ml-4">
                  Official Standard →
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 9. Related Tools & Workflow Cross-Links */}
      <div className="space-y-4 sm:space-y-5">
        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-primary" />
          Related Productivity &amp; Media Tools
        </h2>
        <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
          {relatedTools.map(([rSlug, rInfo]) => (
            <div
              key={rSlug}
              className="p-4 sm:p-5 rounded-2xl bg-card/40 border border-border hover:border-primary/40 transition-all flex flex-col justify-between group space-y-3 shadow-xs hover:shadow-md"
            >
              <div className="space-y-1.5">
                <span className="text-2xl block">{rInfo.icon || '⚡'}</span>
                <h3 className="font-bold text-foreground text-sm sm:text-base group-hover:text-primary transition-colors">
                  {rInfo.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {rInfo.description}
                </p>
              </div>
              <Link
                href={`/tools/${rSlug}`}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary hover:underline pt-1"
              >
                Launch Tool
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 10. Privacy & Browser Compliance Notice */}
      <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-muted/20 border border-border space-y-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h3 className="font-black text-foreground text-sm sm:text-base">
            Privacy-First Architecture &amp; Local Browser Execution
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          The {info.name} is engineered with a strict client-side first model.
          All media transformation, optical character recognition, document
          parsing, and text sanitization algorithms execute directly inside your
          local browser memory (via WebAssembly, Canvas, and Web Workers). Your
          files and confidential records are never uploaded to third-party
          remote processing servers.
        </p>
      </div>
    </section>
  );
}
