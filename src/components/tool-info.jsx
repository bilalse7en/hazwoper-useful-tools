'use client';

import { motion } from 'framer-motion';
import { toolInfo } from '@/lib/seo';
import { CheckCircle2, Info, Zap, Shield, Globe, Cpu } from 'lucide-react';

export function ToolInfo({ slug }) {
  const info = toolInfo[slug];

  if (!info) return null;

  return (
    <div className="mt-20 space-y-20 pb-20 border-t border-border pt-20">
      {/* Detailed Content Section for AdSense Value */}
      <section className="grid lg:grid-cols-2 gap-16 items-start">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Info className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              Technical Documentation
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
            About the <br />
            <span className="text-primary">{info.name}</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed font-medium">
            {info.detailedDescription}
          </p>
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            {info.benefits?.map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-2xl bg-muted/30 border border-border"
              >
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
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
              Operational Excellence
            </h3>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Our {info.name} is engineered to provide high-fidelity output with
              zero latency. By utilizing state-of-the-art algorithms, we ensure
              that every byte of information processed maintains its integrity
              while meeting the latest web standards.
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4 group/item">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-all">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-foreground">
                    Neural Extraction
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    Advanced pattern recognition for deep content mapping
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 group/item">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-all">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-foreground">
                    Secure Governance
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    Enterprise-grade data protection protocols
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 group/item">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-all">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-foreground">
                    Universal Deployment
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    Optimized for search engines and accessibility
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use / Value Prop Section */}
      <section className="bg-muted/30 rounded-[40px] p-10 md:p-20 border border-border">
        <div className="max-w-3xl space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-foreground">
              Strategic Implementation
            </h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed">
              Leveraging the {info.name} effectively requires an understanding
              of your target architecture. Whether you are integrating with a
              modern CMS or a legacy training environment, our tools provide the
              flexibility needed for professional-grade transformation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary shadow-xl shadow-primary/20 flex items-center justify-center text-primary-foreground font-black text-xl">
                1
              </div>
              <h4 className="font-black text-foreground">Step 1: Ingest</h4>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Prepare and upload your raw assets for neural analysis.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary shadow-xl shadow-primary/20 flex items-center justify-center text-primary-foreground font-black text-xl">
                2
              </div>
              <h4 className="font-black text-foreground">Step 2: Process</h4>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Configure extraction parameters and refine technical outputs.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary shadow-xl shadow-primary/20 flex items-center justify-center text-primary-foreground font-black text-xl">
                3
              </div>
              <h4 className="font-black text-foreground">Step 3: Deploy</h4>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Synchronize your finalized content with your professional
                ecosystem.
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground italic pt-8 border-t border-border/50">
            * Note: For the best results, ensure your source documents follow a
            clear hierarchy. The {info.name} works best with standardized
            technical and industrial documentation styles.
          </p>
        </div>
      </section>
    </div>
  );
}
