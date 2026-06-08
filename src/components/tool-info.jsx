'use client';

import { motion } from 'framer-motion';
import { toolInfo } from '@/lib/seo';
import { CheckCircle2, Info, Zap, Shield, Globe, Cpu } from 'lucide-react';

export function ToolInfo({ slug }) {
  const info = toolInfo[slug];

  if (!info) return null;

  return (
    <div className="mt-12 space-y-24 pb-20 border-t border-border pt-12">
      {/* Prime Technical Narrative */}
      <section className="grid lg:grid-cols-2 gap-16 items-start">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Info className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              Core Technical Summary
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
            How the <br />
            <span className="text-primary">{info.name} Works</span>
          </h2>
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground leading-relaxed font-medium">
              {info.detailedDescription}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              In the modern digital landscape, the efficiency of {info.name} is
              paramount. Our implementation focuses on reducing technical debt
              by providing a streamlined interface that automates complex data
              transformations. This ensures that users can focus on creative and
              strategic tasks while the underlying engine handles the heavy
              lifting of {info.category.toLowerCase()} automation.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            {info.benefits?.map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-2xl bg-muted/30 border border-border group hover:border-primary/30 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm font-bold text-foreground opacity-80 leading-snug">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8 bg-card/40 backdrop-blur-2xl border border-border p-8 md:p-12 rounded-[40px] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors" />
          <div className="relative z-10 space-y-6">
            <h3 className="text-2xl font-black text-foreground">
              Technical Architecture & Privacy
            </h3>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Our {info.name} is engineered with a privacy-first approach. By
              utilizing client-side execution models where possible, we minimize
              data transmission to external servers, ensuring that your
              sensitive information remains secure and compliant with global
              data protection standards.
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4 group/item">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-all">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-foreground">
                    Efficiency Matrics
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    Optimized for sub-second processing overhead
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 group/item">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-all">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-foreground">
                    Protocol Integrity
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    Strict adherence to industrial data standards
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 group/item">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-all">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-foreground">
                    Accessibility Standards
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    Compliant with WCAG 2.1 guidelines for inclusive use
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expanded Industry Compliance Section (New Content) */}
      <section className="bg-primary/5 rounded-[40px] p-10 md:p-16 border border-primary/10">
        <div className="grid lg:grid-cols-3 gap-12 items-center">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-3xl font-black text-foreground">
              Industry Compliance & Usage
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h4 className="font-black text-primary uppercase text-xs tracking-widest">
                  Global Reach
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The {info.name} is designed to be used in diverse professional
                  environments, ranging from corporate offices to remote
                  industrial sites. Its robust cross-browser compatibility
                  ensures a consistent experience regardless of local hardware
                  limitations.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-black text-primary uppercase text-xs tracking-widest">
                  Data Management
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We implement strict state management protocols to ensure that
                  transient data is not cached longer than necessary. This
                  reduces the risk of unauthorized access and maintains the
                  &quot;clean environment&quot; necessary for high-stakes{' '}
                  {info.category.toLowerCase()} tasks.
                </p>
              </div>
            </div>
          </div>
          <div className="p-8 bg-card rounded-3xl border border-border flex flex-col items-center text-center space-y-4">
            <Shield className="w-12 h-12 text-primary" />
            <h4 className="text-xl font-bold">Safe Environment</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Verified compatible with OSHA and industrial training standards
              for content dissemination.
            </p>
          </div>
        </div>
      </section>

      {/* Strategic Implementation & FAQ Section */}
      <section className="bg-muted/30 rounded-[40px] p-10 md:p-20 border border-border">
        <div className="max-w-4xl space-y-16">
          <div className="space-y-6 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-black text-foreground">
              Strategic Deployment of the {info.name}
            </h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-3xl">
              Leveraging the {info.name} effectively requires an understanding
              of your target output architecture. Whether you are integrating
              with a modern headless CMS or a legacy training environment, our
              tools provide the flexibility needed for professional-grade
              digital transformation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4 p-6 bg-background/50 rounded-3xl border border-border hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary shadow-xl shadow-primary/20 flex items-center justify-center text-primary-foreground font-black text-xl">
                1
              </div>
              <h4 className="font-black text-foreground">
                Initiation & Intake
              </h4>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Prepare and upload your raw technical assets for multi-stage
                neural analysis and mapping.
              </p>
            </div>
            <div className="space-y-4 p-6 bg-background/50 rounded-3xl border border-border hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary shadow-xl shadow-primary/20 flex items-center justify-center text-primary-foreground font-black text-xl">
                2
              </div>
              <h4 className="font-black text-foreground">Refinement Engine</h4>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Configure extraction parameters to refine technical outputs for
                specific industrial use cases.
              </p>
            </div>
            <div className="space-y-4 p-6 bg-background/50 rounded-3xl border border-border hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary shadow-xl shadow-primary/20 flex items-center justify-center text-primary-foreground font-black text-xl">
                3
              </div>
              <h4 className="font-black text-foreground">
                Validation & Export
              </h4>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Synchronize your finalized content with your professional
                ecosystem via standard export protocols.
              </p>
            </div>
          </div>

          <div className="pt-12 border-t border-border/50">
            <h3 className="text-2xl font-black mb-8">
              Frequently Asked Questions
            </h3>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <h5 className="font-bold text-foreground">
                  Is my data shared with third parties?
                </h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No. The {info.name} operates primarily in your browser. We do
                  not store or sell your content or processed assets to any
                  third party entities.
                </p>
              </div>
              <div className="space-y-3">
                <h5 className="font-bold text-foreground">
                  Does this tool support batch processing?
                </h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Yes, many features of our {info.category.toLowerCase()} suite
                  allow for sequential or batch processing to save time on
                  high-volume projects.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground italic pt-8 border-t border-border/50 opacity-60">
            * Note: For the best results, ensure your source documents follow a
            clear semantic hierarchy. The {info.name} works best with
            standardized technical, scientific, and industrial documentation
            styles.
          </p>
        </div>
      </section>
    </div>
  );
}
