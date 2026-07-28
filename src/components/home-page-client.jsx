'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { InitialLoadingShell } from '@/components/initial-loading-shell';
import { showSuccess } from '@/lib/swal';
import { ToolsLanding } from '@/components/tools-landing';
import { BlogSection } from '@/components/blog-section';
import { ProfessionalOverview } from '@/components/professional-overview';
import { IndustryInsights } from '@/components/industry-insights';
import { useAuth } from '@/components/auth-provider';

const WelcomeScroll = dynamic(
  () => import('@/components/welcome-scroll').then((mod) => mod.WelcomeScroll),
  {
    loading: () => <InitialLoadingShell isReady={false} />,
    ssr: false,
  }
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
  };

  return (
    <>
      {showWelcome && <WelcomeScroll onComplete={handleWelcomeComplete} />}
      <ToolsLanding user={user} />
      <IndustryInsights />
      <ProfessionalOverview />
      <BlogSection />
    </>
  );
}
