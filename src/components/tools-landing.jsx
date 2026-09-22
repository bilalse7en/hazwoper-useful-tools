import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Gamepad2,
  ShieldCheck,
  Clock,
  Wand2,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  BookOpen,
  Layout,
  Code,
  Video,
  Search,
  ChevronRight,
  LogIn,
  Repeat,
  Music,
  FileType,
  AudioWaveform,
  Target,
} from 'lucide-react';
import { toolIdToSlug, toolInfo } from '@/lib/seo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, isLowEnd } from '@/lib/utils';
import { triggerLogin, hasAccess } from '@/lib/auth';
import { useAuth } from '@/components/auth-provider';

const iconMap = {
  'ai-course-creator': Sparkles,
  course: Layout,
  blog: FileText,
  glossary: BookOpen,
  resources: Search,
  'html-cleaner': Code,
  'image-converter': ImageIcon,
  'video-compressor': Video,
  'ai-assistant': MessageSquare,
  'image-to-text': Wand2,
  'document-extractor': FileText,
  'video-converter': Repeat,
  'audio-converter': Music,
  'audio-editor': AudioWaveform,
  'video-to-gif': Video,
  'word-to-html': FileType,
  'lesson-quiz-builder': Target,
  'youtube-downloader': Video,
  'watermark-remover': Wand2,
  'bg-remover': Wand2,
  'pdf-editor': FileText,
};

// Free tools that anyone can access (even without login)
const FREE_TOOL_IDS = [
  'html-cleaner',
  'image-converter',
  'video-compressor',
  'image-to-text',
  'document-extractor',
  'video-converter',
  'audio-converter',
  'audio-editor',
  'video-to-gif',
  'word-to-html',
  'youtube-downloader',
  'watermark-remover',
  'bg-remover',
  'pdf-editor',
];

// Generator tools that require login + generator access
const GENERATOR_TOOL_IDS = [
  'ai-course-creator',
  'course',
  'blog',
  'glossary',
  'resources',
  'lesson-quiz-builder',
  'ai-assistant',
];

export function ToolsLanding({ user }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isGuest = !user;
  const isAdmin = user?.role === 'admin';
  const hasGeneratorAccess = user?.has_generator_access || isAdmin;

  const { toolSettings } = useAuth();

  const tools = Object.entries(toolIdToSlug).map(([id, slug]) => ({
    id,
    slug,
    ...toolInfo[slug],
  }));

  // Determine free/paid dynamically based on database SLUG
  const isToolFree = (tool) => {
    // Check dynamic settings first using the SLUG (key in toolInfo/database)
    if (toolSettings && toolSettings[tool.slug] !== undefined) {
      return toolSettings[tool.slug] === true;
    }

    // Fallback to hardcoded logic if database is empty/loading
    const FREE_TOOL_SLUGS = [
      'html-cleaner',
      'image-converter',
      'video-compressor',
      'image-to-text',
      'document-extractor',
      'video-converter',
      'audio-converter',
      'audio-editor',
      'video-to-gif',
      'word-to-html',
      'youtube-downloader',
      'watermark-remover',
      'bg-remover',
      'pdf-editor',
    ];
    return FREE_TOOL_SLUGS.includes(tool.slug);
  };

  const freeTools = tools.filter((t) => isToolFree(t));
  const generatorAndPaidTools = tools.filter((t) => !isToolFree(t));

  // Determine access based on user role and dynamic settings
  const hasAccessToTool = (toolOrId) => {
    if (
      user?.role === 'admin' ||
      user?.role === 'superadmin' ||
      (user?.email || '').toLowerCase() === 'bilalghaffar46@gmail.com'
    ) {
      return true;
    }
    const toolId = typeof toolOrId === 'object' ? toolOrId.id : toolOrId;
    const toolSlug = typeof toolOrId === 'object' ? toolOrId.slug : toolOrId;

    if (
      toolSettings &&
      (toolSettings[toolSlug] === true || toolSettings[toolId] === true)
    ) {
      return true;
    }

    return hasAccess(user, toolId || toolSlug, toolSettings);
  };

  return (
    <div className="min-h-screen bg-transparent pb-16">
      {/* Hero Section: Balanced 2-Column Responsive Layout */}
      <section className="relative pt-10 sm:pt-14 md:pt-16 pb-10 sm:pb-12 overflow-hidden bg-background/50 dark:bg-background/40 backdrop-blur-md border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.08),transparent_55%)] pointer-events-none" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Hero Column */}
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-7 space-y-4 text-left"
            >
              <Badge
                variant="secondary"
                className="px-3.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-2 w-fit text-[10px] font-black uppercase tracking-widest"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Professional Tool Suite</span>
              </Badge>

              {isGuest ? (
                <>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
                    Free Online <br />
                    <span className="text-primary">Content Utilities</span>
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl font-medium">
                    Fast browser-based tools including{' '}
                    <strong>PDF Editing</strong>,{' '}
                    <strong>Audio Conversion</strong>,{' '}
                    <strong>Video Compression</strong>, and <strong>OCR</strong>
                    . Zero server uploads — 100% private.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button
                      size="lg"
                      className="h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-primary-foreground border-none text-sm"
                      asChild
                    >
                      <Link href="/tools">
                        Explore All Tools
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 px-6 rounded-xl font-bold border-border bg-card/60 hover:bg-muted text-foreground text-sm"
                      onClick={() => router.push('/auth?mode=login')}
                    >
                      <LogIn className="mr-2 w-4 h-4 text-primary" />
                      Sign In for AI Studio
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
                    Welcome home, <br />
                    <span className="text-primary">
                      {user?.name?.split(' ')[0] || 'Member'}
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl font-medium">
                    Accelerate your workflow with our full suite of local-first
                    conversion, media editing, and AI authoring tools.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button
                      size="lg"
                      className="h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-primary-foreground border-none text-sm"
                      asChild
                    >
                      <Link href="/tools">
                        Explore Workspace
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                    {!isAdmin && !user?.has_generator_access && (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/60 rounded-xl border border-border text-xs font-bold text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>Standard Clearance Active</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>

            {/* Right Hero Column: Quick Launch Utility Hub (Fills blank void) */}
            <motion.div
              initial={false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <div className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 blur-3xl -z-10" />

                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">
                      Quick Launch Utilities
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5"
                  >
                    INSTANT LOCAL
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      name: 'PDF Editor',
                      desc: 'Vector & Signatures',
                      slug: 'pdf-editor',
                      icon: FileText,
                      badge: 'FREE',
                    },
                    {
                      name: 'Audio Converter',
                      desc: 'MP3, WAV, FLAC',
                      slug: 'audio-converter',
                      icon: Music,
                      badge: 'FREE',
                    },
                    {
                      name: 'Video Compressor',
                      desc: 'WASM Bitrate Saver',
                      slug: 'video-compressor',
                      icon: Video,
                      badge: 'FREE',
                    },
                    {
                      name: 'Image to Text',
                      desc: 'Local OCR Extraction',
                      slug: 'image-to-text',
                      icon: Wand2,
                      badge: 'FREE',
                    },
                  ].map((quick, i) => (
                    <Link
                      key={i}
                      href={`/tools/${quick.slug}`}
                      className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all space-y-1 group/item"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                          <quick.icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {quick.badge}
                        </span>
                      </div>
                      <p className="font-bold text-xs text-foreground group-hover/item:text-primary transition-colors truncate">
                        {quick.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {quick.desc}
                      </p>
                    </Link>
                  ))}
                </div>

                <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60">
                  <span className="flex items-center gap-1.5 font-medium text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Processed locally in browser
                  </span>
                  <Link
                    href="/tools"
                    className="font-bold text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    All 21 Tools
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Generator Tools Section — Visible to all, but locked without access */}
      {
        <section
          id="generators"
          className="py-12 sm:py-16 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black mb-1.5 flex items-center gap-3 text-foreground">
                <Wand2 className="w-8 h-8 text-primary" />
                Professional Tools
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                Advanced AI-powered generators and specialized utilities.
              </p>
            </div>
            {!hasGeneratorAccess && (
              <Badge
                variant="outline"
                className="h-9 px-4 rounded-xl border-dashed bg-primary/10 text-primary border-primary/30 gap-2 font-black uppercase text-[9px] tracking-widest"
              >
                <ShieldCheck className="w-4 h-4" />
                {isGuest ? 'Login for Access' : 'Clearance Required'}
              </Badge>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {generatorAndPaidTools.map((tool, index) => {
              const Icon = iconMap[tool.id] || Layout;
              const locked = !hasAccessToTool(tool);

              return (
                <motion.div
                  key={tool.id}
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="group h-full"
                >
                  <Card
                    className={cn(
                      'h-full relative overflow-hidden transition-all duration-300 border-border hover:border-primary/50 rounded-2xl sm:rounded-3xl shadow-lg bg-card/60 backdrop-blur-xl hover:bg-card/90',
                      locked && 'opacity-85'
                    )}
                  >
                    {locked ? (
                      <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-1.5">
                        <Badge
                          variant="secondary"
                          className="text-[8px] bg-primary/10 text-primary border-primary/20 px-2 py-0.5 font-black"
                        >
                          PAID
                        </Badge>
                        <div className="w-9 h-9 rounded-xl bg-background/80 backdrop-blur-md flex items-center justify-center shadow-md border border-border group-hover:scale-105 transition-transform">
                          <LockIcon className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute top-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end gap-1.5">
                        <Badge
                          variant="outline"
                          className="text-[8px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 font-black"
                        >
                          PRO
                        </Badge>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 backdrop-blur-md flex items-center justify-center border border-primary/20">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                        </div>
                      </div>
                    )}

                    <CardContent className="p-6 flex flex-col h-full relative z-10">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-all duration-300 shadow-sm bg-primary/10 border border-border text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-3',
                          locked && 'bg-muted opacity-60'
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-black mb-1.5 text-foreground tracking-tight">
                        {tool.name}
                      </h3>
                      <p className="text-muted-foreground text-xs leading-relaxed mb-6 font-medium flex-1 line-clamp-3">
                        {tool.description}
                      </p>
                      <Button
                        variant={locked ? 'outline' : 'default'}
                        className={cn(
                          'w-full h-11 rounded-xl font-bold text-sm transition-all shadow-md',
                          locked
                            ? 'bg-muted/70 text-muted-foreground border-border cursor-default'
                            : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20'
                        )}
                        onClick={
                          locked
                            ? isGuest
                              ? triggerLogin
                              : undefined
                            : undefined
                        }
                        asChild={!locked}
                      >
                        {locked ? (
                          <span className="flex items-center gap-1.5 text-xs">
                            {isGuest ? 'Unlock Access' : 'Locked Tool'}
                            <ChevronRight className="w-4 h-4 opacity-60" />
                          </span>
                        ) : (
                          <Link href={`/tools/${tool.slug}`}>
                            Start Engine
                            <ArrowRight className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        )}
                      </Button>
                    </CardContent>

                    {/* Decorative background accent */}
                    <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-colors" />
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>
      }

      {/* Free / Utility Tools Section: Tightened Spacing */}
      <section
        id={isGuest ? 'free-tools' : 'all-tools'}
        className="py-12 sm:py-16 bg-muted/20 backdrop-blur-sm border-y border-border"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black mb-1.5 flex items-center gap-3 text-foreground">
              <Zap className="w-8 h-8 text-primary" />
              {isGuest ? 'Free Online Tools' : 'Essential Utilities'}
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              {isGuest
                ? 'Powerful browser-based tools — zero installation required. Process everything locally.'
                : 'Universal tools available for all registered identity profiles.'}
            </p>
          </div>

          <div
            className={cn(
              'grid gap-4 sm:gap-5',
              isGuest
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
            )}
          >
            {(isGuest
              ? freeTools
              : tools.filter((t) => !generatorAndPaidTools.includes(t))
            ).map((tool, index) => {
              const Icon = iconMap[tool.id] || Layout;
              return (
                <Link key={tool.id} href={`/tools/${tool.slug}`}>
                  <motion.div
                    whileHover={
                      mounted && isLowEnd() ? {} : { y: -4, scale: 1.02 }
                    }
                    className="p-4 sm:p-5 bg-card/70 backdrop-blur-xl border border-border/80 rounded-2xl hover:border-primary/40 transition-all hover:shadow-lg group text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 mx-auto mb-3 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] block text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {tool.name?.replace(' Generator', '')}
                    </span>
                    {isGuest && (
                      <Badge
                        variant="secondary"
                        className="mt-2 text-[7px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.2 font-black uppercase"
                      >
                        FREE
                      </Badge>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Professional Call to Action: Balanced Cubic Layout */}
      <section className="py-12 sm:py-16 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="bg-card/60 backdrop-blur-2xl border border-border rounded-3xl p-6 sm:p-10 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 p-24 bg-primary/5 rounded-full blur-[90px] -mr-24 -mt-24 pointer-events-none" />
          <div className="flex-1 space-y-5 relative z-10 text-left">
            <div className="w-14 h-14 rounded-2xl bg-primary shadow-xl shadow-primary/30 flex items-center justify-center text-primary-foreground">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-foreground tracking-tight">
                Experience the Full <br />
                <span className="text-primary">Professional Suite</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-lg font-medium leading-relaxed">
                Join thousands of creators and professionals. Transform your
                digital workflow with instant local-first tools and AI
                authoring.
              </p>
            </div>
            <Button
              size="lg"
              className="h-12 px-7 rounded-xl font-black text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/30 border-none transition-all hover:scale-[1.02]"
              onClick={() =>
                router.push(isGuest ? '/auth?mode=signup' : '/profile')
              }
            >
              {isGuest ? 'Initialize Account' : 'Access Your Profile'}
              <ChevronRight className="ml-1.5 w-4 h-4" />
            </Button>
          </div>

          <div className="relative w-full md:w-[360px] aspect-[4/3] bg-muted/30 border border-border/80 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="text-6xl animate-pulse select-none">⚡</div>
            <div className="absolute bottom-4 left-4 right-4 bg-card/90 backdrop-blur-xl border border-border p-3.5 rounded-xl shadow-md flex items-center justify-between">
              <div>
                <span className="text-foreground font-black text-xs block">
                  Identity Desk
                </span>
                <span className="text-[9px] text-muted-foreground font-medium">
                  Verified Local Processing
                </span>
              </div>
              <Badge className="bg-primary px-2.5 py-0.5 font-black text-[9px] text-primary-foreground border-none">
                ACTIVE
              </Badge>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function LockIcon({ className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
