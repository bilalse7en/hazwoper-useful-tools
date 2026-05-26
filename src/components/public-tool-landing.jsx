'use client';

import {
  CheckCircle2,
  ChevronRight,
  Zap,
  Target,
  Shield,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toolIdToSlug, toolInfo, toolMetadata } from '@/lib/seo';

export function PublicToolLanding({ toolSlug, onAction }) {
  const info = toolInfo[toolSlug];
  const metadata = toolMetadata[toolSlug];

  if (!info || !metadata) return null;

  const features = [
    {
      title: 'Browser-Based',
      description:
        'All processing happens in your browser. Your files never leave your device.',
      icon: Shield,
    },
    {
      title: 'High Quality',
      description:
        'Maintains original document formatting and media quality during processing.',
      icon: Target,
    },
    {
      title: 'SEO Optimized',
      description:
        'Generated content is structured for maximum search engine visibility.',
      icon: Zap,
    },
    {
      title: 'Professional Output',
      description:
        'Clean HTML structure ready for integration with any training platform.',
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-16 animate-in-card">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider mb-2">
          {info.category}
        </div>
        <h2 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
          {info.name}
        </h2>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          {info.detailedDescription || metadata.description}
        </p>

        <div className="pt-4">
          <Button
            size="lg"
            onClick={onAction}
            className="h-14 px-8 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all gap-2"
          >
            Get Started for Free <ChevronRight className="w-5 h-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required. 100% free for all users.
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="grid md:grid-cols-2 gap-12 items-start py-8">
        <div className="space-y-8">
          <div>
            <h3 className="text-3xl font-bold mb-6">Key Benefits</h3>
            <div className="space-y-4">
              {(info.benefits || []).map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <p className="text-lg leading-relaxed">{benefit}</p>
                </div>
              ))}
              {(!info.benefits || info.benefits.length === 0) && (
                <>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg leading-relaxed">
                      Automated extraction from DOCX and PDF documents.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg leading-relaxed">
                      Clean, semantic HTML output format.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg leading-relaxed">
                      Instant preview and editing capabilities.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-primary/5 border border-primary/10">
            <h4 className="text-xl font-bold mb-4">How to Use This Tool</h4>
            <p className="text-muted-foreground leading-relaxed">
              {info.howToUse ||
                'Upload your document to the interface. Our system will analyze the structure and extract the relevant content blocks according to your needs.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <div
              key={i}
              className="p-8 rounded-3xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all group hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SEO Content Section - High Value */}
      <div className="py-12 border-t border-border space-y-8">
        <h3 className="text-3xl font-bold text-center">
          Why Professional {info.name} Matters?
        </h3>
        <div className="prose prose-slate max-w-none dark:prose-invert">
          <p className="text-lg text-muted-foreground leading-relaxed">
            In today&apos;s digital landscape, content consistency and technical
            optimization are paramount. A professional{' '}
            <strong>{info.name}</strong> ensures that your materials are not
            just readable, but structured for maximum organic reach and
            technical performance.
          </p>
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-4">
              <h4 className="text-xl font-bold">Privacy & Security</h4>
              <p className="text-muted-foreground">
                Unlike server-side tools, our {info.name} processes all data
                directly in your browser. This means your sensitive documents,
                proprietary materials, and personal data never leave your
                device, meeting the highest standards of enterprise security and
                data compliance.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-xl font-bold">Optimization for Web</h4>
              <p className="text-muted-foreground">
                Our output is specifically designed to be compatible with major
                Content Management Systems (CMS) and static site generators. The
                clean HTML structure avoids the common &quot;bloat&quot;
                associated with standard document exports, leading to faster
                page loads and better mobile experiences.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works section */}
      <div className="pt-12 border-t border-border">
        <h3 className="text-3xl font-bold text-center mb-16">
          The Three-Step Process
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Access & Auth',
              desc: 'Unlock the full power of our tools by signing in or completing our quick interactive session challenge.',
            },
            {
              step: '02',
              title: 'Local Processing',
              desc: 'Select your files. Our neural processing engine runs locally on your CPU/GPU for instant results.',
            },
            {
              step: '03',
              title: 'Review & Export',
              desc: 'Fine-tune the output using our built-in editor and export it to your clipboard or a file in seconds.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="relative p-10 rounded-[40px] bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="absolute -top-6 -left-6 w-16 h-16 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center font-black text-2xl shadow-xl shadow-primary/30 rotate-[-10deg]">
                {item.step}
              </span>
              <h4 className="text-2xl font-bold mb-4 mt-4">{item.title}</h4>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="py-16 px-8 rounded-[50px] bg-gradient-to-br from-primary via-blue-600 to-cyan-600 text-white text-center shadow-2xl shadow-primary/20">
        <h3 className="text-4xl font-black mb-6">
          Ready to optimize your workflow?
        </h3>
        <p className="text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
          Start using the {info.name} today and see how much time you can save
          on your content creation process.
        </p>
        <Button
          size="lg"
          variant="secondary"
          onClick={onAction}
          className="h-16 px-10 text-xl font-bold bg-white text-primary hover:bg-slate-100 transition-colors gap-3"
        >
          Launch Tool Now <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
