'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { InitialLoadingShell } from '@/components/initial-loading-shell';
import { showSuccess } from '@/lib/swal';
import { ToolsLanding } from '@/components/tools-landing';
import { useAuth } from '@/components/auth-provider';
import { AdContainer } from '@/components/layout/ad-container';

const WelcomeScroll = dynamic(
  () => import('@/components/welcome-scroll').then((mod) => mod.WelcomeScroll),
  {
    loading: () => <InitialLoadingShell isReady={false} />,
    ssr: false,
  }
);

const IndustryInsights = dynamic(
  () =>
    import('@/components/industry-insights').then(
      (mod) => mod.IndustryInsights
    ),
  { ssr: true }
);

const ProfessionalOverview = dynamic(
  () =>
    import('@/components/professional-overview').then(
      (mod) => mod.ProfessionalOverview
    ),
  { ssr: true }
);

const FeaturedCoursesSection = dynamic(
  () =>
    import('@/components/featured-courses-section').then(
      (mod) => mod.FeaturedCoursesSection
    ),
  { ssr: true }
);

export function HomePageClient() {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
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
        showSuccess(
          'Identity Verified',
          `Welcome back, ${user.name || 'Architect'}. Suite synchronized.`
        );
        sessionStorage.setItem('auth_toast_shown', 'true');
        sessionStorage.removeItem('just_logged_in');
      }
    }
  }, [user]);

  const handleWelcomeComplete = () => {
    localStorage.setItem('welcome_seen', 'true');
    setShowWelcome(false);

    // Open the Theme & Performance Setup modal directly on the landing page
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('open_environmental_setup'));
      }
    }, 400);
  };

  return (
    <>
      {showWelcome && <WelcomeScroll onComplete={handleWelcomeComplete} />}
      <ToolsLanding user={user} />

      {/* Centered Top Banner Advertisement */}
      <div className="site-container py-4">
        <AdContainer position="top-banner" margin="tight" />
      </div>

      <FeaturedCoursesSection />

      {/* Centered In-Content Advertisement */}
      <div className="site-container py-4">
        <AdContainer position="in-content" margin="tight" />
      </div>

      <IndustryInsights />
      <ProfessionalOverview />

      {/* Centered Footer Advertisement */}
      <div className="site-container py-4">
        <AdContainer position="footer" margin="tight" />
      </div>
    </>
  );
}
