'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InitialLoadingShell } from '@/components/initial-loading-shell';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Dynamic imports with SSR enabled for SEO
const ToolsLanding = dynamic(
  () => import('@/components/tools-landing').then((mod) => mod.ToolsLanding),
  {
    loading: () => <InitialLoadingShell isReady={false} />,
  }
);

const BlogSection = dynamic(
  () => import('@/components/blog-section').then((mod) => mod.BlogSection),
  {
    loading: () => <InitialLoadingShell isReady={false} />,
  }
);

const WelcomeScroll = dynamic(
  () => import('@/components/welcome-scroll').then((mod) => mod.WelcomeScroll),
  {
    loading: () => <InitialLoadingShell isReady={false} />,
    ssr: false, // Keep welcome scroll client-only as it's purely interactive
  }
);

const ProfessionalOverview = dynamic(
  () =>
    import('@/components/professional-overview').then(
      (mod) => mod.ProfessionalOverview
    ),
  {
    loading: () => <div className="h-96" />,
  }
);

import { useAuth } from '@/components/auth-provider';

export default function Home() {
  const router = useRouter();
  const { user, loading: isChecking } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Show welcome scroll only once ever
    const hasSeenWelcome = localStorage.getItem('welcome_seen');
    if (!hasSeenWelcome) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const justLoggedIn = !sessionStorage.getItem('auth_toast_shown');
      const hasJustLoggedIn = sessionStorage.getItem('just_logged_in');

      if (justLoggedIn && hasJustLoggedIn) {
        toast.success('Identity Verified', {
          description: `Welcome back, ${user.name || 'Architect'}. Professional suite fully synchronized.`,
        });
        sessionStorage.setItem('auth_toast_shown', 'true');
        sessionStorage.removeItem('just_logged_in');
      }
    }
  }, [user]);

  const handleWelcomeComplete = () => {
    localStorage.setItem('welcome_seen', 'true');
    setShowWelcome(false);
  };

  // Always show ToolsLanding — it handles both logged-in and guest states
  return (
    <>
      {/* Professional SEO Infrastructure */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Content Suite',
            operatingSystem: 'Web',
            applicationCategory: 'BusinessApplication',
            description:
              'Professional automated course content generator and safety documentation tool. Engineered for HAZWOPER compliance, technical blog creation, and media asset management.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              ratingCount: '250',
            },
          }),
        }}
      />

      <InitialLoadingShell isReady={!isChecking} />
      {showWelcome && <WelcomeScroll onComplete={handleWelcomeComplete} />}
      <ToolsLanding user={user} />
      <ProfessionalOverview />
      <BlogSection />
    </>
  );
}
