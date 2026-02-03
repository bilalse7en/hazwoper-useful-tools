import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Content Suite',
  description: 'Privacy Policy for Content Suite - Learn how we collect, use, and protect your data in compliance with GDPR and privacy regulations.',
  robots: 'index, follow',
};

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last Updated: February 3, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">Introduction</h2>
            <p>
              Welcome to Content Suite ("we," "our," or "us"). We are committed to protecting your privacy and ensuring transparency about how we collect, use, and share your information. This Privacy Policy explains our data practices for our website and web-based tools.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-2 mt-4">Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>File Uploads:</strong> When you use our document processing tools, you may upload DOCX, PDF, images, or video files. These files are processed locally in your browser and are not stored on our servers.</li>
              <li><strong>Browser Storage:</strong> We use localStorage to save your preferences (theme settings, tool configurations) locally on your device.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Usage Data:</strong> We collect information about your interactions with our website, including pages visited, features used, and time spent on the site.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address, and device identifiers.</li>
              <li><strong>Cookies and Tracking Technologies:</strong> We use cookies and similar technologies for analytics and advertising. See our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link> for details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Provide Services:</strong> To deliver the core functionality of our content generation and media processing tools.</li>
              <li><strong>Improve Our Services:</strong> To analyze usage patterns and enhance user experience.</li>
              <li><strong>Personalization:</strong> To remember your preferences and settings.</li>
              <li><strong>Advertising:</strong> To serve relevant advertisements through Google AdSense and other advertising partners.</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Google AdSense and Third-Party Advertising</h2>
            <p>
              We use Google AdSense to display advertisements on our website. Google and its partners use cookies to serve ads based on your prior visits to our website and other websites on the internet.
            </p>
            
            <h3 className="text-xl font-semibold mb-2 mt-4">Personalized Advertising</h3>
            <p>
              Google uses cookies to serve ads based on your interests. You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ads Settings</a> or by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.aboutads.info</a>.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">Third-Party Ad Networks</h3>
            <p>
              In addition to Google AdSense, we may work with other third-party advertising networks that use cookies and similar technologies. These partners may collect information about your browsing activities across different websites.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Data Sharing and Disclosure</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Advertising Partners:</strong> Google AdSense and other advertising networks for ad delivery and performance measurement.</li>
              <li><strong>Analytics Providers:</strong> To understand how users interact with our website.</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety.</li>
            </ul>
            <p className="mt-3">
              <strong>We do not sell your personal information to third parties.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Your Rights and Choices</h2>
            
            <h3 className="text-xl font-semibold mb-2 mt-4">GDPR Rights (European Users)</h3>
            <p>If you are located in the European Economic Area (EEA), UK, or Switzerland, you have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data.</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data.</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data.</li>
              <li><strong>Restriction:</strong> Limit how we use your data.</li>
              <li><strong>Data Portability:</strong> Receive your data in a structured format.</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests.</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing at any time.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">CCPA/CPRA Rights (California Users)</h3>
            <p>California residents have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Know:</strong> What personal information is collected, used, and shared.</li>
              <li><strong>Delete:</strong> Request deletion of personal information.</li>
              <li><strong>Opt-Out:</strong> Opt out of the sale or sharing of personal information.</li>
              <li><strong>Non-Discrimination:</strong> Not be discriminated against for exercising your rights.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">Cookie Preferences</h3>
            <p>
              You can manage your cookie preferences through our consent banner or by visiting our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link> page. You can also configure your browser to reject cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Data Retention</h2>
            <p>
              Since most of our tools process data locally in your browser, we do not retain your uploaded files or processed content on our servers. Browser storage data (preferences, settings) remains on your device until you clear it.
            </p>
            <p className="mt-3">
              Analytics and advertising data are retained according to the policies of our third-party providers (typically 26 months for Google Analytics).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your information. However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Children's Privacy</h2>
            <p>
              Our services are not directed to children under 16 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers, including Standard Contractual Clauses approved by the European Commission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
            </p>
            <ul className="list-none pl-0 space-y-2 mt-3">
              <li><strong>Website:</strong> <a href="https://hazwoper-useful-tools.vercel.app" className="text-primary hover:underline">hazwoper-useful-tools.vercel.app</a></li>
              <li><strong>Privacy Requests:</strong> Please use the contact form on our website or update your consent preferences through our cookie banner.</li>
            </ul>
          </section>

          <section className="border-t border-border pt-6 mt-8">
            <h2 className="text-2xl font-semibold mb-3">Related Documents</h2>
            <div className="flex flex-wrap gap-4">
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
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
