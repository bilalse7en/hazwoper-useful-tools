import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy | Content Suite',
  description: 'Cookie Policy for Content Suite - Learn about the cookies we use and how to manage your cookie preferences.',
  robots: 'index, follow',
};

export default function CookiePolicy() {
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
          <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground">
            Last Updated: February 3, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a website. They help websites remember your preferences, improve your experience, and provide analytics to website owners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">How We Use Cookies</h2>
            <p>
              Content Suite uses cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and serve relevant advertisements. Below are the categories of cookies we use:
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Types of Cookies We Use</h2>

            <div className="bg-card border border-border rounded-lg p-4 my-4">
              <h3 className="text-xl font-semibold mb-2">1. Strictly Necessary Cookies</h3>
              <p className="mb-2">
                <strong>Purpose:</strong> Essential for the website to function properly.
              </p>
              <p className="mb-2">
                <strong>Examples:</strong> Security cookies, consent preference cookies
              </p>
              <p className="mb-2">
                <strong>Duration:</strong> Session or persistent (up to 1 year)
              </p>
              <p>
                <strong>Can be disabled:</strong> No - these are required for basic functionality
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 my-4">
              <h3 className="text-xl font-semibold mb-2">2. Functional Cookies</h3>
              <p className="mb-2">
                <strong>Purpose:</strong> Remember your preferences and settings.
              </p>
              <p className="mb-2">
                <strong>Examples:</strong> Theme selection (dark/light mode), language preferences, tool configurations
              </p>
              <p className="mb-2">
                <strong>Storage:</strong> Primarily uses browser localStorage, not traditional cookies
              </p>
              <p>
                <strong>Can be disabled:</strong> Yes - but you'll need to reset preferences each visit
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 my-4">
              <h3 className="text-xl font-semibold mb-2">3. Analytics and Performance Cookies</h3>
              <p className="mb-2">
                <strong>Purpose:</strong> Help us understand how visitors use our website.
              </p>
              <p className="mb-2">
                <strong>Examples:</strong> Google Analytics cookies (_ga, _gid, _gat)
              </p>
              <p className="mb-2">
                <strong>Information collected:</strong> Pages visited, time spent, browser type, device information
              </p>
              <p className="mb-2">
                <strong>Duration:</strong> Up to 2 years
              </p>
              <p>
                <strong>Can be disabled:</strong> Yes - through cookie preferences or browser settings
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 my-4">
              <h3 className="text-xl font-semibold mb-2">4. Advertising Cookies (Google AdSense)</h3>
              <p className="mb-2">
                <strong>Purpose:</strong> Serve personalized advertisements based on your interests.
              </p>
              <p className="mb-2">
                <strong>Provider:</strong> Google AdSense and third-party advertising partners
              </p>
              <p className="mb-2">
                <strong>Examples:</strong> __gads, __gac, IDE, NID, DSID
              </p>
              <p className="mb-2">
                <strong>Information collected:</strong> Browsing behavior across websites, ad interactions, interests
              </p>
              <p className="mb-2">
                <strong>Duration:</strong> Up to 2 years
              </p>
              <p>
                <strong>Can be disabled:</strong> Yes - see "Managing Your Cookie Preferences" below
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Third-Party Cookies</h2>
            <p>
              We use third-party services that may set their own cookies:
            </p>
            
            <h3 className="text-xl font-semibold mb-2 mt-4">Google AdSense</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Serves personalized advertisements</li>
              <li>Tracks ad performance and user engagement</li>
              <li>Uses DoubleClick cookies for cross-site tracking</li>
              <li>Privacy Policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Privacy Policy</a></li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">Google Analytics (if implemented)</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Analyzes website traffic and user behavior</li>
              <li>Provides insights on page performance</li>
              <li>Privacy Policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Privacy Policy</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Managing Your Cookie Preferences</h2>

            <h3 className="text-xl font-semibold mb-2 mt-4">Through Our Consent Banner</h3>
            <p>
              When you first visit our website, you'll see a cookie consent banner with options to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Accept All:</strong> Consent to all cookies including advertising</li>
              <li><strong>Reject All:</strong> Only essential cookies will be used</li>
              <li><strong>Customize:</strong> Choose specific cookie categories</li>
            </ul>
            <p className="mt-3">
              You can change your preferences at any time by updating your consent settings.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">Through Browser Settings</h3>
            <p>
              Most web browsers allow you to control cookies through their settings. Options include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Blocking all cookies</li>
              <li>Blocking third-party cookies only</li>
              <li>Clearing cookies when you close your browser</li>
              <li>Making exceptions for specific websites</li>
            </ul>
            <p className="mt-3">
              Browser-specific instructions:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">Opt-Out of Personalized Advertising</h3>
            <p>
              To opt out of personalized advertising from Google and other networks:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ads Settings</a></li>
              <li><a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Digital Advertising Alliance Opt-Out</a></li>
              <li><a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Your Online Choices (EU)</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Impact of Disabling Cookies</h2>
            <p>
              If you disable cookies, please note:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Some features may not work properly (e.g., theme preferences won't be saved)</li>
              <li>You may need to re-enter information more frequently</li>
              <li>You'll still see advertisements, but they won't be personalized to your interests</li>
              <li>We won't be able to remember your consent preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Do Not Track Signals</h2>
            <p>
              Some browsers include "Do Not Track" (DNT) features. Currently, there is no industry standard for responding to DNT signals. Our website does not specifically respond to DNT browser signals, but you can control tracking through the cookie consent options described above.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Updates to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. Please check this page periodically for updates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please refer to our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> or contact us through our website.
            </p>
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
                href="/terms" 
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Terms of Service →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
