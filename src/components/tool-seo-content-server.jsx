import { toolInfo } from '@/lib/seo';
import { toolEditorialContent } from '@/lib/editorial';

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
    url: `https://hazwoper-useful-tools.vercel.app/tools/${slug}`,
    applicationCategory: 'Utility',
    operatingSystem: 'Web Browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: info.detailedDescription,
  };

  return (
    <section className="mt-16 pt-16 border-t border-border space-y-16">
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />

      {/* 1. Overview & Purpose */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
          Overview &amp; Purpose
        </div>
        <h2 className="text-3xl font-black text-foreground tracking-tight">
          About the {info.name}
        </h2>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {editorial?.overview ? (
            renderParagraphs(editorial.overview)
          ) : (
            <p className="text-muted-foreground font-medium leading-relaxed text-lg">
              {info.detailedDescription}
            </p>
          )}
        </div>
        {info.benefits?.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
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
                <span className="text-sm font-bold text-foreground opacity-90 leading-snug">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Step-by-Step Guide */}
      <div className="space-y-6 bg-card/40 border border-border p-8 md:p-12 rounded-[36px]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
          Operational Instructions
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
          How to Use the {info.name} Effectively
        </h2>
        <div className="prose prose-slate dark:prose-invert max-w-none">
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
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
            Technical Methodology
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            Scientific Methodology &amp; Engineering Standards
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {renderParagraphs(editorial.methodology)}
          </div>
        </div>
      )}

      {/* 4. Real-World Scenarios & Examples */}
      {editorial?.examples && (
        <div className="space-y-6 bg-muted/20 border border-border p-8 md:p-12 rounded-[36px]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
            Case Studies
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            Real-World Scenarios &amp; Worked Examples
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {renderParagraphs(editorial.examples)}
          </div>
        </div>
      )}

      {/* Use Cases Grid if available */}
      {info.useCases?.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-foreground tracking-tight">
            Industry Applications &amp; Use Cases
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

      {/* 5. Interactive FAQ Section */}
      {allFaq.length > 0 && (
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
            Knowledge Base
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {allFaq.map((item, i) => (
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

      {/* Privacy & Browser Compliance Notice */}
      <div className="p-8 rounded-3xl bg-muted/20 border border-border space-y-3">
        <h3 className="font-black text-foreground text-lg">
          Privacy-First Architecture &amp; Data Integrity
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The {info.name} is engineered with a strict client-side first model.
          All media transformation, optical character recognition, document
          parsing, and text sanitization algorithms execute directly inside your
          local browser memory (via WebAssembly and Web Workers). Your files and
          confidential records are never uploaded to third-party remote
          processing servers.
        </p>
      </div>
    </section>
  );
}
