import { Inter, Orbitron } from 'next/font/google';
import Script from 'next/script';
import { ThemeProvider } from '@/components/theme-provider';
import { DelayedScriptLoader } from '@/components/delayed-script-loader';
import { ClientOverlays } from '@/components/client-overlays';
import './globals.css';

import { GlobalHeader } from '@/components/global-header';
import { Footer } from '@/components/footer';
import { AuthProvider } from '@/components/auth-provider';
import { ChatProvider } from '@/components/chat-provider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const orbitron = Orbitron({
  variable: '--font-orbitron',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  preload: true,
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      'https://hazwoper-useful-tools.vercel.app'
  ),
  title: 'All Useful Tools | All-in-One Online Productivity & Media Utilities',
  description:
    'Free online productivity and media tools: PDF Editor, Word to HTML, Video Compressor, Video to GIF, Audio Converter, Audio Editor, Image Converter, OCR, and AI Assistants.',
  keywords:
    'all useful tools, pdf editor, word to html, video converter, audio converter, image converter, free online tools, productivity suite',
  authors: [{ name: 'All Useful Tools' }],
  other: {
    'google-adsense-account': 'ca-pub-9874465109252768',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-9874465109252768" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; media-src 'self' blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://adservice.google.com https://www.googletagservices.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://*.adtrafficquality.google https://js.puter.com https://*.google.com https://*.gstatic.com https://vercel.live https://*.vercel.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://tagmanager.google.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.puter.com wss://api.puter.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.google-analytics.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://*.adtrafficquality.google https://*.vercel.com https://*.vercel.live; frame-src 'self' https://*.google.com https://*.doubleclick.net https://*.googlesyndication.com https://vercel.live; object-src 'none'; upgrade-insecure-requests;"
        />
        <link
          rel="preconnect"
          href="https://gyglsbmpxopaoeljoofp.supabase.co"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link
          rel="dns-prefetch"
          href="https://gyglsbmpxopaoeljoofp.supabase.co"
        />
        <link rel="dns-prefetch" href="https://js.puter.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
      </head>
      <body
        className={`${inter.variable} ${orbitron.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Script
          id="adsense-init"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9874465109252768"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
        <Script
          id="organization-json-ld"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'All Useful Tools',
              url: 'https://hazwoper-useful-tools.vercel.app',
              logo: 'https://gyglsbmpxopaoeljoofp.supabase.co/storage/v1/object/public/media/library/1779796669800-Hi.gif',
              description:
                'Professional online utilities for document management, media conversion, and content automation.',
              contactPoint: {
                '@type': 'ContactPoint',
                email: 'bilalghaffar46@gmail.com',
                contactType: 'customer service',
              },
            }),
          }}
        />
        <Script
          id="google-consent"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
							window.dataLayer = window.dataLayer || [];
							function gtag(){dataLayer.push(arguments);}
							
							// Default consent mode - denies all until user makes a choice
							gtag('consent', 'default', {
								'ad_storage': 'denied',
								'ad_user_data': 'denied',
								'ad_personalization': 'denied',
								'analytics_storage': 'denied',
								'wait_for_update': 500
							});
						`,
          }}
        />

        {process.env.NODE_ENV === 'production' && <DelayedScriptLoader />}

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          themes={['light', 'dark', 'nebula']}
          storageKey="all-useful-tools-theme"
        >
          <AuthProvider>
            <ChatProvider>
              <div className="flex flex-col min-h-screen relative">
                <GlobalHeader />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <ClientOverlays />
            </ChatProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
