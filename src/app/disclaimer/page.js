import Link from 'next/link';

export const metadata = {
  title: 'Disclaimer | Content Suite',
  description:
    'Disclaimer for Content Suite tools — all results, conversions, and calculations are provided for educational and informational purposes only and should be independently verified for mission-critical tasks.',
  alternates: {
    canonical: 'https://hazwoper-useful-tools.vercel.app/disclaimer',
  },
  robots: 'index, follow',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-primary hover:text-primary/80 transition-colors mb-4 inline-block font-medium"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4 tracking-tight text-foreground">
            Disclaimer
          </h1>
          <p className="text-muted-foreground">
            Last Updated: August 17, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">
              1. General Informational and Educational Purpose
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The information, software utilities, generators, calculations, media converters,
              and document processing tools provided on <strong>Content Suite</strong> (accessible at{' '}
              <a
                href="https://hazwoper-useful-tools.vercel.app"
                className="text-primary hover:underline"
              >
                hazwoper-useful-tools.vercel.app
              </a>
              ) are designed and published strictly for educational, informational, and technical
              productivity purposes. While our engineering team strives to maintain state-of-the-art
              precision across all algorithmic modules, content generation engines, and WebAssembly
              pipelines, we make no representations or warranties of any kind, express or implied,
              about the completeness, accuracy, reliability, suitability, or availability of the
              tools or the information contained on the website for any purpose.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">
              2. No Professional Safety, Legal, or Medical Advice
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Nothing on this website constitutes legal, occupational safety, industrial hygiene,
              engineering, or medical advice. The content and tool outputs—including automated course
              syllabi, extracted terminology glossaries, lesson quizzes, and document conversions—are
              not a substitute for direct consultations with qualified, certified professionals such as
              Certified Safety Professionals (CSP), Certified Industrial Hygienists (CIH), licensed
              professional engineers (PE), or occupational safety compliance legal counsel.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              If your organization is engaged in hazardous materials management, emergency response,
              industrial remediation, or any work governed by OSHA, EPA, DOT, or NIOSH regulations,
              you must independently verify all procedures, calculations, and safety assessments
              with authorized and credentialed safety experts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">
              3. Independent Verification for Mission-Critical Applications
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Any reliance you place on the outputs of our web applications (such as OCR-extracted
              diagram texts, media compressions, HTML sanitizations, or automated quiz answer keys)
              is strictly at your own risk. In mission-critical environments—including but not limited
              to active HAZWOPER sites, chemical processing plants, confined space entries, and high-voltage
              installations—computational outputs must be subjected to rigorous human verification and
              secondary review before deployment into standard operating procedures (SOPs).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">
              4. Client-Side Execution and Data Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Content Suite utilizes modern client-side architectures, including WebAssembly (WASM)
              and HTML5 Canvas APIs, allowing file processing (such as image conversions, video compressions,
              and PDF annotations) to occur directly within your device&apos;s browser memory. While this
              architecture minimizes data transmission to external servers, we cannot guarantee the
              absolute security or stability of your local operating environment, browser extensions,
              or device hardware. Users remain solely responsible for maintaining appropriate local
              data backups and ensuring that their browser environments are free from malicious software.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">
              5. HAZWOPER and Regulatory Compliance Notice
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Reference to specific industry standards—such as OSHA 29 CFR 1910.120 (Hazardous Waste
              Operations and Emergency Response), 29 CFR 1926, NIOSH Pocket Guides, or EPA guidelines—is
              made solely for contextual educational convenience. Content Suite is an independent technical
              software platform and is not affiliated with, endorsed by, or officially certified by the
              Occupational Safety and Health Administration (OSHA), the National Institute for Occupational
              Safety and Health (NIOSH), or any governmental entity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">
              6. Third-Party Links, Services, and Advertisements
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our website may contain links to external third-party websites, technical repositories,
              or regulatory documentation that are not provided or maintained by Content Suite. We do
              not guarantee the accuracy, relevance, timeliness, or completeness of any information on
              these external websites.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Additionally, Content Suite may display third-party advertisements served via Google AdSense.
              The inclusion of any advertisement does not imply recommendation, endorsement, or approval
              by Content Suite of the advertised goods, services, or claims. Please consult our{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/cookies" className="text-primary hover:underline">
                Cookie Policy
              </Link>{' '}
              for comprehensive details regarding advertising cookies and third-party data practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">
              7. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              To the fullest extent permitted by applicable law, in no event shall Content Suite, its
              developers, affiliates, or contributors be liable for any direct, indirect, incidental,
              consequential, special, or exemplary damages arising out of or in connection with your
              use of or inability to use this website, its utilities, or any content obtained herein.
              This includes, without limitation, damages for loss of profits, business interruption,
              loss of digital assets, operational downtime, regulatory non-compliance fines, or personal
              injury resulting from reliance on computational outputs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">
              8. Modifications and Policy Updates
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify, amend, or replace this Disclaimer at any time without
              prior notice. By continuing to access or use our services after any revisions become
              effective, you agree to be bound by the updated terms. We encourage visitors to review
              this page periodically to stay informed of our current operational disclaimers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">
              9. Contact Information
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions, legal inquiries, or concerns regarding this Disclaimer or our
              platform&apos;s computational utilities, please contact us:
            </p>
            <ul className="list-none pl-0 space-y-2 mt-3 text-muted-foreground">
              <li>
                <strong className="text-foreground">Lead Architect:</strong> Bilal
              </li>
              <li>
                <strong className="text-foreground">Direct Email:</strong>{' '}
                <a
                  href="mailto:bilalghaffar46@gmail.com"
                  className="text-primary hover:underline"
                >
                  bilalghaffar46@gmail.com
                </a>
              </li>
              <li>
                <strong className="text-foreground">Website:</strong>{' '}
                <a
                  href="https://hazwoper-useful-tools.vercel.app"
                  className="text-primary hover:underline"
                >
                  hazwoper-useful-tools.vercel.app
                </a>
              </li>
            </ul>
          </section>

          <section className="border-t border-border pt-6 mt-8">
            <h2 className="text-2xl font-semibold mb-3 text-foreground">
              Related Compliance Documents
            </h2>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/privacy"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Privacy Policy →
              </Link>
              <Link
                href="/terms"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Terms of Service →
              </Link>
              <Link
                href="/cookies"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Cookie Policy →
              </Link>
              <Link
                href="/about"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                About Us →
              </Link>
              <Link
                href="/contact"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Contact Support →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
