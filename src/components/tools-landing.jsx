"use client";

import { motion } from "framer-motion";
import Link from "next/link";
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
  LogIn
} from "lucide-react";
import { toolIdToSlug, toolInfo } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { triggerLogin } from "@/lib/auth";

const iconMap = {
  'course': Layout,
  'blog': FileText,
  'glossary': BookOpen,
  'resources': Search,
  'html-cleaner': Code,
  'image-converter': ImageIcon,
  'video-compressor': Video,
  'ai-assistant': MessageSquare,
  'image-to-text': Wand2,
  'document-extractor': FileText,
};

// Free tools that anyone can access (even without login)
const FREE_TOOL_IDS = ['html-cleaner', 'image-converter', 'video-compressor', 'image-to-text', 'document-extractor'];

// Generator tools that require login + generator access
const GENERATOR_TOOL_IDS = ['course', 'blog', 'glossary', 'resources'];

export function ToolsLanding({ user }) {
  const isGuest = !user;
  const isAdmin = user?.role === 'admin';
  const hasGeneratorAccess = user?.has_generator_access || isAdmin;

  const tools = Object.entries(toolIdToSlug).map(([id, slug]) => ({
    id,
    slug,
    ...toolInfo[slug]
  }));

  // For guests: only show free tools
  // For logged-in: show everything
  const freeTools = tools.filter(t => FREE_TOOL_IDS.includes(t.id));
  const generatorTools = tools.filter(t => GENERATOR_TOOL_IDS.includes(t.id));
  const utilityTools = tools.filter(t => !GENERATOR_TOOL_IDS.includes(t.id) && !FREE_TOOL_IDS.includes(t.id));

  // Combine remaining utility tools that aren't free (like ai-assistant) 
  const allUtilityForGuest = freeTools;
  const allUtilityForUser = tools.filter(t => !GENERATOR_TOOL_IDS.includes(t.id));

  return (
    <div className="min-h-screen bg-transparent pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-background/50 dark:bg-background/40 backdrop-blur-md border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="container relative mx-auto px-6">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 rounded-full bg-primary/10 text-primary border-primary/20 flex items-center gap-2 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground opacity-80">Professional Tool Suite</span>
              </Badge>
              
              {isGuest ? (
                <>
                  <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-foreground leading-[1.1]">
                    Free Online<br />
                    <span className="text-primary">Content Tools</span>
                  </h1>
                  <p className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl font-medium">
                    Powerful browser-based tools for image conversion, video compression, OCR, and more. No sign-up required to start.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button size="lg" className="h-14 px-8 rounded-2xl font-bold shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-primary-foreground border-none" asChild>
                      <Link href="#free-tools">
                        Explore Free Tools
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Link>
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="h-14 px-8 rounded-2xl font-bold border-primary/30 hover:bg-primary/5 text-primary"
                      onClick={() => router.push('/auth?mode=login')}
                    >
                      <LogIn className="mr-2 w-5 h-5" />
                      Sign In for Full Access
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-foreground leading-[1.1]">
                    Welcome home,<br />
                    <span className="text-primary">{user?.name?.split(' ')[0]}</span>
                  </h1>
                  <p className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl font-medium">
                    Ready to accelerate your productivity? Explore our suite of specialized tools designed for content creators and safety professionals.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button size="lg" className="h-14 px-8 rounded-2xl font-bold shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-primary-foreground border-none" asChild>
                      <Link href="#all-tools">
                        Explore All Tools
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Link>
                    </Button>
                    {!isAdmin && !user?.has_generator_access && (
                      <div className="flex items-center gap-3 px-6 py-3 bg-muted/50 rounded-2xl border border-border backdrop-blur-sm">
                        <Clock className="w-5 h-5 text-primary" />
                        <span className="text-sm font-bold text-foreground opacity-80">Limited access enabled</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Generator Tools Section — Visible to all, but locked without access */}
      {(
        <section id="generators" className="py-24 container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl font-black mb-3 flex items-center gap-4 text-foreground">
                <Wand2 className="w-10 h-10 text-primary" />
                Content Generators
              </h2>
              <p className="text-muted-foreground font-medium">Advanced AI-powered tools for professional content creation.</p>
            </div>
            {!hasGeneratorAccess && (
              <Badge variant="outline" className="h-11 px-5 rounded-2xl border-dashed bg-primary/10 text-primary border-primary/30 gap-3 font-black uppercase text-[10px] tracking-widest">
                <ShieldCheck className="w-5 h-5" />
                {isGuest ? "Login for Purchase/Access" : "Global Access Required"}
              </Badge>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {generatorTools.map((tool, index) => {
              const Icon = iconMap[tool.id] || Layout;
              const locked = !hasGeneratorAccess;

              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group h-full"
                >
                  <Card className={cn(
                    "h-full relative overflow-hidden transition-all duration-500 border-border hover:border-primary/50 rounded-[40px] shadow-2xl bg-card/40 backdrop-blur-xl hover:bg-muted/40",
                    locked && "opacity-80 grayscale-[0.8]"
                  )}>
                    {locked ? (
                      <div className="absolute top-8 right-8 z-20 flex flex-col items-end gap-2">
                        <Badge variant="secondary" className="text-[8px] bg-primary/10 text-primary border-primary/20 px-3 py-1 font-black">PAID</Badge>
                        <div className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-black/40 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-black/5 dark:border-white/10 group-hover:scale-110 transition-transform">
                          <LockIcon className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute top-8 right-8 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end gap-2">
                        <Badge variant="outline" className="text-[8px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1 font-black">PRO</Badge>
                        <div className="w-10 h-10 rounded-xl bg-primary/10 backdrop-blur-xl flex items-center justify-center border border-primary/20">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    )}
                      
                    <CardContent className="p-10 flex flex-col h-full relative z-10">
                      <div className={cn(
                        "w-20 h-20 rounded-[28px] mb-8 flex items-center justify-center transition-all duration-500 shadow-xl bg-primary/10 border border-border text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-6",
                        locked && "bg-muted opacity-50"
                      )}>
                        <Icon className="w-10 h-10" />
                      </div>
                      <h3 className="text-2xl font-black mb-4 text-foreground tracking-tight">{tool.name}</h3>
                      <p className="text-muted-foreground text-base leading-relaxed mb-10 font-medium flex-1">
                        {tool.description}
                      </p>
                      <Button 
                        variant={locked ? "outline" : "default"} 
                        className={cn(
                          "w-full h-14 rounded-2xl font-black text-lg transition-all border-none shadow-xl", 
                          locked ? "bg-muted text-muted-foreground cursor-default" : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 hover:scale-[1.02]"
                        )}
                        onClick={locked ? (isGuest ? triggerLogin : undefined) : undefined}
                        asChild={!locked}
                      >
                        {locked ? (
                          <span className="flex items-center gap-2">
                            {isGuest ? "Unlock Access" : "Locked Tool"}
                            <ChevronRight className="w-5 h-5 opacity-50" />
                          </span>
                        ) : (
                          <Link href={`/tools/${tool.slug}`}>
                            Start Engine
                            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                          </Link>
                        )}
                      </Button>
                    </CardContent>
                    
                    {/* Decorative background accent */}
                    <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-colors duration-700" />
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Free / Utility Tools Section */}
      <section id={isGuest ? "free-tools" : "all-tools"} className="py-24 bg-muted/20 backdrop-blur-sm border-y border-border">
        <div className="container mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl font-black mb-3 flex items-center gap-4 text-foreground">
              <Zap className="w-10 h-10 text-primary" />
              {isGuest ? "Free Online Tools" : "Essential Utilities"}
            </h2>
            <p className="text-muted-foreground font-medium">
              {isGuest 
                ? "Powerful browser-based tools — no account required. Process everything locally." 
                : "Universal tools available for all registered identity profiles."
              }
            </p>
          </div>

          <div className={cn(
            "grid gap-6",
            isGuest ? "md:grid-cols-2 lg:grid-cols-4" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
          )}>
            {(isGuest ? freeTools : allUtilityForUser).map((tool, index) => {
              const Icon = iconMap[tool.id] || Layout;
              return (
                <Link key={tool.id} href={`/tools/${tool.slug}`}>
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    className={cn(
                      "p-8 bg-card/60 backdrop-blur-xl border border-border rounded-[32px] hover:border-primary/40 transition-all hover:shadow-2xl group text-center relative overflow-hidden",
                      isGuest && "min-h-[200px] flex flex-col items-center justify-center"
                    )}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 mx-auto mb-6 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-md">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] block text-foreground opacity-80 group-hover:text-primary group-hover:opacity-100 transition-colors">{tool.name?.replace(' Generator', '')}</span>
                    {isGuest && (
                      <Badge variant="secondary" className="mt-4 text-[8px] bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 px-3 py-1">FREE</Badge>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/0 group-hover:from-primary/5 transition-all" />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Professional Call to Action */}
      <section className="py-24 container mx-auto px-6">
        <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-[50px] p-10 md:p-20 flex flex-col md:flex-row items-center gap-16 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-[120px] -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors" />
          <div className="flex-1 space-y-8 relative z-10">
            <div className="w-20 h-20 rounded-3xl bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-500">
               <ShieldCheck className="w-12 h-12 text-primary-foreground" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black leading-tight text-foreground tracking-tight">
                Experience the Full<br />
                <span className="text-primary">Professional Suite</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-xl font-medium leading-relaxed">
                Join our network of safety professionals and content architects. Synchronize your assets across devices and unlock the full potential of our neural generation engine.
              </p>
            </div>
            <Button 
              size="lg" 
              className="h-16 px-10 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/40 border-none transition-all hover:scale-[1.05]" 
              onClick={() => router.push(isGuest ? '/auth?mode=signup' : '/profile')}
            >
              {isGuest ? "Initialize Your Account" : "Access Your Profile"}
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
          <div className="relative w-full md:w-[450px] aspect-[4/3] bg-muted/50 border border-border rounded-[40px] overflow-hidden shadow-2xl group-hover:shadow-[0_0_100px_rgba(var(--primary-rgb),0.1)] transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent mix-blend-overlay" />
            <div className="absolute inset-0 flex items-center justify-center text-9xl animate-pulse">🚀</div>
            <div className="absolute bottom-8 left-8 right-8 bg-card/90 backdrop-blur-2xl border border-border p-6 rounded-3xl shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-foreground font-black tracking-tight text-lg">Identity Hub</span>
                  <span className="text-[10px] text-primary font-black uppercase tracking-widest">Active Verification Flow</span>
                </div>
                <Badge className="bg-primary px-4 py-1 font-black text-xs h-8 text-primary-foreground border-none">SECURE</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function LockIcon({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
