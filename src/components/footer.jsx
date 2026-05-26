'use client';

import Link from 'next/link';
import { BrandLogo } from './brand-logo';
import {
  Shield,
  Mail,
  ExternalLink,
  BookOpen,
  Globe,
  Lock,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { hasAccess, triggerLogin } from '@/lib/auth';
import { cn } from '@/lib/utils';

export function Footer({ overrideShow = false }) {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        queueMicrotask(() => setUser(JSON.parse(storedUser)));
      } catch (e) {}
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, has_generator_access')
          .eq('id', session.user.id)
          .single();

        const u = {
          role: profile?.role || 'user',
          has_generator_access: profile?.has_generator_access || false,
        };
        setUser(u);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't show global footer on tools pages to avoid scrollbar conflicts
  if (!overrideShow && pathname?.startsWith('/tools')) return null;

  const toolLinks = [
    { id: 'course', label: 'Course Content Gen', href: '/tools/web-content' },
    { id: 'blog', label: 'Blog Post Generator', href: '/tools/blog-generator' },
    {
      id: 'glossary',
      label: 'Glossary Extractor',
      href: '/tools/glossary-generator',
    },
    {
      id: 'resources',
      label: 'Resource Generator',
      href: '/tools/resource-generator',
    },
    {
      id: 'video-compressor',
      label: 'Video Optimizer',
      href: '/tools/video-compressor',
    },
    {
      id: 'image-to-text',
      label: 'Neural OCR Engine',
      href: '/tools/image-to-text',
    },
  ];

  return (
    <footer className="relative w-full bg-background border-t border-border mt-auto overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary/5 dark:bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Company Info */}
          <div className="space-y-8">
            <BrandLogo size="sm" />
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              The world&apos;s most advanced content automation suite for
              HAZWOPER professionals. Built with neural processing for
              high-speed, secure documentation.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="mailto:bilalghaffar46@gmail.com"
                className="p-3 rounded-xl bg-card border border-border dark:border-white/5 hover:border-blue-400/50 hover:bg-muted dark:hover:bg-slate-800 transition-all group shadow-sm"
              >
                <Mail className="w-5 h-5 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
              </Link>
              <Link
                href="#"
                className="p-3 rounded-xl bg-card border border-border dark:border-white/5 hover:border-green-400/50 hover:bg-muted dark:hover:bg-slate-800 transition-all group shadow-sm"
              >
                <Globe className="w-5 h-5 text-slate-400 group-hover:text-green-500 dark:group-hover:text-green-400" />
              </Link>
            </div>
          </div>

          {/* Core Tools */}
          <div className="space-y-8">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] text-foreground">
              Platform Engines
            </h3>
            <ul className="space-y-4 text-sm text-muted-foreground font-bold">
              {toolLinks.map((tool) => {
                const allowed = hasAccess(user, tool.id);
                return (
                  <li key={tool.id} className="flex items-center gap-2">
                    {allowed ? (
                      <Link
                        href={tool.href}
                        className="transition-colors hover:text-primary"
                      >
                        {tool.label}
                      </Link>
                    ) : (
                      <button
                        onClick={() => triggerLogin()}
                        className="transition-colors hover:text-amber-500 opacity-70 text-left"
                      >
                        {tool.label}
                      </button>
                    )}
                    {!allowed && <Lock className="w-3 h-3 text-amber-500/50" />}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Resources & Guides */}
          <div className="space-y-8">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] text-foreground">
              Resources
            </h3>
            <ul className="space-y-4 text-sm text-muted-foreground font-bold">
              <li>
                <Link
                  href="/blog"
                  className="hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" /> Editorial Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-foreground transition-colors"
                >
                  About Our Neural Hub
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="hover:text-foreground transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Why Choose Us */}
          <div className="space-y-8">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] text-foreground">
              Security Hub
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
                <div className="mt-1">
                  <Shield className="w-5 h-5 text-green-500 dark:text-green-400 dark:shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
                </div>
                <p className="text-[10px] text-foreground leading-relaxed font-bold">
                  LOCAL-FIRST PROCESSING
                  <br />
                  <span className="text-muted-foreground font-medium">
                    All data stays in your browser. Zero server exposure.
                  </span>
                </p>
              </div>
              <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
                <div className="mt-1">
                  <ExternalLink className="w-5 h-5 text-blue-500 dark:text-blue-400 dark:shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
                </div>
                <p className="text-[10px] text-foreground leading-relaxed font-bold">
                  WCAG 2.1 COMPLIANT
                  <br />
                  <span className="text-muted-foreground font-medium">
                    Output optimized for web accessibility and SEO.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
          <p>© {currentYear} HAZWOPER Tools Platform. Secure Cloud.</p>
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />{' '}
              SYSTEM ACTIVE
            </span>
            <span>POWERED BY NEURAL FLOW AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
