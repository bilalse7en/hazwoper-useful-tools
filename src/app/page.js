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

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Show welcome scroll only once ever
    const hasSeenWelcome = localStorage.getItem('welcome_seen');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    // Safety fallback: Ensure we always stop checking after 3 seconds
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 3000);

    // Initial session check
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          console.log('Home: Initial session found', session.user.id);

          // Before we stop checking, let's try to get the profile
          // so paid tools don't flicker or stay hidden
          const { data: profile } = await supabase
            .from('profiles')
            .select(
              'role, username, first_name, last_name, full_name, avatar_url, has_generator_access, email'
            )
            .eq('id', session.user.id)
            .single();

          const baseUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email,
            role: profile?.role || 'user',
            has_generator_access: profile?.has_generator_access || false,
            ...profile,
          };

          setUser(baseUser);
          localStorage.setItem('user', JSON.stringify(baseUser));
        } else {
          // If no session, clear storage
          localStorage.removeItem('user');
        }
      } catch (e) {
        console.error('Auth initialization error:', e);
      } finally {
        setIsChecking(false);
      }
    };
    checkSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Home: Auth state change', event, session?.user?.id);

      if (session?.user) {
        setIsChecking(true); // Re-check if state changes
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select(
              'role, username, first_name, last_name, full_name, avatar_url, has_generator_access, email'
            )
            .eq('id', session.user.id)
            .single();

          const activeUser = {
            id: session.user.id,
            email: session.user.email,
            full_name:
              profile?.full_name || session.user.user_metadata?.full_name || '',
            name:
              profile?.full_name ||
              session.user.user_metadata?.full_name ||
              session.user.email,
            role: profile?.role || 'user',
            has_generator_access: profile?.has_generator_access || false,
            avatar:
              profile?.avatar_url ||
              session.user.user_metadata?.avatar_url ||
              null,
            ...profile,
          };

          setUser(activeUser);
          localStorage.setItem('user', JSON.stringify(activeUser));

          const justLoggedIn = !sessionStorage.getItem('auth_toast_shown');
          if (justLoggedIn && event === 'SIGNED_IN') {
            toast.success('Identity Verified', {
              description: `Welcome back, ${activeUser.name || 'Architect'}. Professional suite fully synchronized.`,
            });
            sessionStorage.setItem('auth_toast_shown', 'true');
          }
        } catch (err) {
          console.error('Profile sync error:', err);
        } finally {
          setIsChecking(false);
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
        sessionStorage.removeItem('auth_toast_shown');
        setIsChecking(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [router]);

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
