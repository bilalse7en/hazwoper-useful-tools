"use client";

import { CheckCircle2, ChevronRight, Zap, Target, Shield, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toolIdToSlug, toolInfo, toolMetadata } from "@/lib/seo";

export function PublicToolLanding({ toolSlug, onAction }) {
  const info = toolInfo[toolSlug];
  const metadata = toolMetadata[toolSlug];

  if (!info || !metadata) return null;

  const features = [
    { title: "Browser-Based", description: "All processing happens in your browser. Your files never leave your device.", icon: Shield },
    { title: "High Quality", description: "Maintains original document formatting and media quality during processing.", icon: Target },
    { title: "SEO Optimized", description: "Generated content is structured for maximum search engine visibility.", icon: Zap },
    { title: "Professional Output", description: "Clean HTML structure ready for integration with any training platform.", icon: BookOpen },
  ];

  return (
    <div className="space-y-12 animate-in-card">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider mb-2">
          {info.category}
        </div>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
          {info.name}
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {metadata.description}
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h3 className="text-2xl font-bold">Why use our {info.name}?</h3>
          <p className="text-muted-foreground leading-relaxed">
            Our {info.name} is designed specifically for content creators, training professionals, and developers who need to process large volumes of training materials quickly and accurately. 
            By processing everything locally on your machine, we ensure maximum privacy and speed without the need for expensive server-side processing.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-bold">Automated Extraction</p>
                <p className="text-sm text-muted-foreground">Save hours of manual copy-pasting by letting our tool intelligently extract segments.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-bold">Clean Code Generation</p>
                <p className="text-sm text-muted-foreground">Get perfectly formatted HTML that works seamlessly across all web platforms.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-bold">Instant Preview</p>
                <p className="text-sm text-muted-foreground">See your results immediately and make adjustments on the fly.</p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button size="lg" onClick={onAction} className="h-14 px-8 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all gap-2">
              Get Started for Free <ChevronRight className="w-5 h-5" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3 px-1">
              No credit card required. Play our mini-game to unlock instant access.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-bold mb-2">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works section */}
      <div className="pt-8 border-t border-border">
        <h3 className="text-2xl font-bold text-center mb-12">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Authentication", desc: "Sign in or win a session through our space-runner game to access premium features." },
            { step: "02", title: "Upload & Select", desc: "Select your source files or paste your content directly into the tool interface." },
            { step: "03", title: "Process & Export", desc: "Our neural processing engine handles the heavy lifting. Export your results in one click." },
          ].map((item, i) => (
            <div key={i} className="relative p-8 rounded-3xl bg-card border border-border shadow-sm">
              <span className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-xl shadow-lg shadow-primary/30">
                {item.step}
              </span>
              <h4 className="text-xl font-bold mb-3 mt-2">{item.title}</h4>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Section */}
      <div className="py-12 px-8 rounded-[40px] bg-gradient-to-br from-primary/5 via-blue-500/5 to-cyan-500/5 border border-primary/10 text-center">
        <h3 className="text-2xl font-bold mb-4">Trusted by Training Professionals</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Join thousands of developers and content managers who use HAZWOPER Tools to streamline their document processing and web content creation workflows.
        </p>
        <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
          <div className="text-xl font-black italic">ContentSuite</div>
          <div className="text-xl font-black italic">TrainingHub</div>
          <div className="text-xl font-black italic">DocuFlow</div>
          <div className="text-xl font-black italic">EduGen</div>
        </div>
      </div>
    </div>
  );
}
