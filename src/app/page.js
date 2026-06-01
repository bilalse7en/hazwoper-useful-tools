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
      const stored = sessionStorage.getItem('user');
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
          // Minimal user info until profile loads
          const baseUser = {
            id: session.user.id,
            ...session.user.user_metadata,
            email: session.user.email,
            name:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email,
            role: 'user', // Default until profile loads
          };
          setUser(baseUser);
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
        // Set basic info immediately
        const baseUser = {
          id: session.user.id,
          email: session.user.email,
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            '',
          name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email,
          avatar:
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture ||
            null,
          role: 'user', // Default
        };

        setUser(baseUser);
        sessionStorage.setItem('user', JSON.stringify(baseUser));

        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select(
              'role, username, first_name, last_name, full_name, avatar_url, has_generator_access, email'
            )
            .eq('id', session.user.id)
            .single();

          if (!error && profile) {
            const activeUser = {
              ...baseUser,
              first_name: profile.first_name || baseUser.first_name || '',
              last_name: profile.last_name || baseUser.last_name || '',
              full_name: profile.full_name || baseUser.full_name,
              username: profile.username || baseUser.email,
              role: profile.role || 'user',
              has_generator_access: profile.has_generator_access || false,
              name: profile.full_name || baseUser.name,
              avatar: profile.avatar_url || baseUser.avatar,
            };

            setUser(activeUser);
            sessionStorage.setItem('user', JSON.stringify(activeUser));

            const justLoggedIn = !sessionStorage.getItem('auth_toast_shown');
            if (justLoggedIn && event === 'SIGNED_IN') {
              toast.success('Identity Verified', {
                description: `Welcome back, ${activeUser.name || 'Architect'}. Professional suite fully synchronized.`,
              });
              sessionStorage.setItem('auth_toast_shown', 'true');
            }
          }
        } catch (err) {
          console.error('Profile sync error:', err);
        }
      } else {
        // Only clear if we don't have a reward-user (legacy support)
        const storedUser = sessionStorage.getItem('user');
        let isRewardUser = false;
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            isRewardUser = parsed.id === 'reward-user';
          } catch (e) {}
        }

        if (!isRewardUser) {
          setUser(null);
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('auth_toast_shown');
        }
      }
      setIsChecking(false);
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

      {/* Deep Information Hub for AdSense Value */}
      <section className="py-24 bg-card/10 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                Professional Resource Center
              </h2>
              <p className="text-muted-foreground font-medium text-lg">
                Comprehensive guides on HAZWOPER compliance and digital safety
                documentation.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  q: 'What is HAZWOPER Compliance?',
                  a: 'HAZWOPER (Hazardous Waste Operations and Emergency Response) refers to a set of guidelines maintained by OSHA to protect workers at hazardous waste sites. Our tools are designed to help safety professionals create training documentation that strictly adheres to these critical regulations.',
                },
                {
                  q: 'How does the Web Content Generator improve training?',
                  a: 'By automating the extraction of syllabi, learning objectives, and module summaries from technical DOCX manuals, we eliminate human error and ensure that training materials are perfectly synchronized with the source documentation.',
                },
                {
                  q: 'Is my data secure on this platform?',
                  a: "Yes. Every tool in our suite operates on a 'Local-First' principle. This means all document processing, image conversion, and video compression occurs entirely within your browser's runtime. Your proprietary safety documents never touch our servers.",
                },
                {
                  q: 'Can I use these tools for any industry?',
                  a: 'While our logic is optimized for industrial safety and OSHA standards, the Content Suite is versatile enough for any technical field requiring precise document-to-web transformation, including healthcare, engineering, and environmental science.',
                },
              ].map((faq, i) => (
                <div
                  key={i}
                  className="p-8 rounded-[32px] bg-background border border-border shadow-sm space-y-4"
                >
                  <h3 className="text-lg font-black text-primary leading-tight">
                    {faq.q}
                  </h3>
                  <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 rounded-[40px] p-10 border border-primary/10 text-center space-y-6">
              <h3 className="text-2xl font-black">
                Ready to scale your documentation?
              </h3>
              <p className="text-muted-foreground font-medium max-w-2xl mx-auto">
                Join thousands of safety professionals who use Content Suite to
                accelerate their compliance workflows and deliver world-class
                training materials.
              </p>
            </div>
          </div>
        </div>
      </section>

      <BlogSection />
    </>
  );
}
