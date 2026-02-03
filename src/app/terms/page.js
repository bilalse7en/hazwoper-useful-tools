import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Content Suite',
  description: 'Terms of Service for Content Suite - Read the terms and conditions for using our content generation and media processing tools.',
  robots: 'index, follow',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="text-primary hover:text-primary/80 transition-colors mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last Updated: February 3, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              Welcome to Content Suite. By accessing or using our website and services, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Description of Services</h2>
            <p>
              Content Suite provides web-based tools for content generation and media processing, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Web content and course material extraction from documents</li>
              <li>Blog post generation and formatting</li>
              <li>Glossary and resource list creation</li>
              <li>HTML cleaning and code formatting</li>
              <li>Image format conversion and optimization</li>
              <li>Video compression and processing</li>
              <li>OCR (Optical Character Recognition) text extraction</li>
              <li>AI-powered content assistance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Use License and Restrictions</h2>
            
            <h3 className="text-xl font-semibold mb-2 mt-4">Permitted Use</h3>
            <p>
              You are granted a limited, non-exclusive, non-transferable license to access and use our services for personal or commercial purposes, subject to these Terms.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">Prohibited Activities</h3>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the services for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to our systems or networks</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Violate intellectual property rights of others</li>
              <li>Use automated systems (bots, scrapers) to access the services excessively</li>
              <li>Interfere with or disrupt the services or servers</li>
              <li>Reverse engineer, decompile, or disassemble any part of the services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. User Content and Data</h2>
            
            <h3 className="text-xl font-semibold mb-2 mt-4">Your Responsibility</h3>
            <p>
              You are solely responsible for any content, documents, images, or files you upload or process using our services. You represent and warrant that you have all necessary rights to use such content.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">Client-Side Processing</h3>
            <p>
              Most of our tools process your files locally in your browser. We do not store uploaded files on our servers. However, you should not upload sensitive, confidential, or personal information unless you understand and accept the risks.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">Intellectual Property</h3>
            <p>
              You retain all ownership rights to your content. By using our services, you grant us a limited license to process and display your content solely for the purpose of providing the services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Intellectual Property Rights</h2>
            <p>
              All content, features, and functionality of Content Suite (including but not limited to software, design, text, graphics, logos) are owned by us or our licensors and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mt-3">
              The output generated by our tools (processed content, converted files, etc.) belongs to you, provided the input content was legally yours to use.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Privacy and Data Protection</h2>
            <p>
              Your use of our services is also governed by our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. Please review it to understand our data practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Third-Party Services and Advertising</h2>
            
            <h3 className="text-xl font-semibold mb-2 mt-4">Google AdSense</h3>
            <p>
              Our website displays advertisements served by Google AdSense. These ads are subject to Google's terms and privacy policies. We do not control the content of these advertisements.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">External Links</h3>
            <p>
              Our services may contain links to third-party websites. We are not responsible for the content, privacy policies, or practices of these external sites.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Disclaimer of Warranties</h2>
            <p>
              <strong>OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</strong>
            </p>
            <p className="mt-3">
              We do not warrant that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The services will be uninterrupted, secure, or error-free</li>
              <li>The results or output will be accurate, reliable, or complete</li>
              <li>Any errors or defects will be corrected</li>
              <li>The services will meet your specific requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Limitation of Liability</h2>
            <p>
              <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.</strong>
            </p>
            <p className="mt-3">
              Our total liability for any claims arising from your use of the services shall not exceed the amount you paid to us (if any) in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Content Suite, its affiliates, and their respective officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use of the services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Content you upload or process</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Service Availability and Modifications</h2>
            <p>
              We reserve the right to modify, suspend, or discontinue any part of our services at any time without notice or liability. We may also update these Terms from time to time.
            </p>
            <p className="mt-3">
              Continued use of the services after any changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Termination</h2>
            <p>
              We reserve the right to terminate or suspend your access to the services immediately, without prior notice, for any reason, including but not limited to breach of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which we operate, without regard to conflict of law provisions.
            </p>
            <p className="mt-3">
              Any disputes arising from these Terms or your use of the services shall be resolved through binding arbitration, except where prohibited by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">14. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">15. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us:
            </p>
            <ul className="list-none pl-0 space-y-2 mt-3">
              <li><strong>Name:</strong> Bilal</li>
              <li><strong>Email:</strong> <a href="mailto:bilalghaffar46@gmail.com" className="text-primary hover:underline">bilalghaffar46@gmail.com</a></li>
              <li><strong>Website:</strong> <a href="https://hazwoper-useful-tools.vercel.app" className="text-primary hover:underline">hazwoper-useful-tools.vercel.app</a></li>
            </ul>
          </section>

          <section className="border-t border-border pt-6 mt-8">
            <h2 className="text-2xl font-semibold mb-3">Related Documents</h2>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/privacy" 
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Privacy Policy →
              </Link>
              <Link 
                href="/cookies" 
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Cookie Policy →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
