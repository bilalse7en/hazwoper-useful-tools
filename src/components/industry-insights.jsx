'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  ShieldCheck,
  Zap,
  Globe,
  FileText,
  Activity,
} from 'lucide-react';

export function IndustryInsights() {
  return (
    <section className="py-24 bg-card/20 border-y border-border overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
                Advancing{' '}
                <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-cyan-400 font-black">
                  Productivity Standards
                </span>{' '}
                <br />
                Through Automation
              </h2>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                In today&apos;s fast-moving digital world, speed and accuracy in
                file conversion, document management, and media editing are
                essential. Our platform is engineered to bridge the gap between
                complex workflows and effortless, lightning-fast browser
                execution.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-foreground">
                    Universal Standards
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every tool generated through our system follows modern web and
                  media standards, ensuring seamless compatibility across all
                  browsers and devices.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-foreground">
                    Local Data Fidelity
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We implement strict client-side processing protocols so your
                  files stay in your browser memory. Zero remote file storage,
                  zero security leaks, and complete privacy.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-start gap-4">
              <Activity className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h4 className="font-black text-sm uppercase tracking-wider mb-2">
                  Real-Time Processing Metrics
                </h4>
                <p className="text-xs text-muted-foreground">
                  Our browser engines process millions of operations per second
                  to convert media, parse documents, and render PDF edits in
                  real time.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-50" />
            <div className="relative grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[4/5] bg-muted/30 rounded-[40px] border border-border p-8 flex flex-col justify-end">
                  <Zap className="w-10 h-10 text-primary mb-4" />
                  <h4 className="font-black text-xl mb-2">Zero Latency</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Local processing via WebAssembly ensures your data
                    conversion is instantaneous.
                  </p>
                </div>
                <div className="aspect-square bg-muted/30 rounded-[40px] border border-border p-8 flex flex-col justify-end">
                  <Globe className="w-10 h-10 text-primary mb-4" />
                  <h4 className="font-black text-xl mb-2">Global UI</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Standardized for modern web workflows worldwide.
                  </p>
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="aspect-square bg-muted/30 rounded-[40px] border border-border p-8 flex flex-col justify-end">
                  <BookOpen className="w-10 h-10 text-primary mb-4" />
                  <h4 className="font-black text-xl mb-2">Smart Engine</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Deep analysis of document structures and media codecs.
                  </p>
                </div>
                <div className="aspect-[4/5] bg-muted/30 rounded-[40px] border border-border p-8 flex flex-col justify-end">
                  <ShieldCheck className="w-10 h-10 text-primary mb-4" />
                  <h4 className="font-black text-xl mb-2">Privacy First</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Privacy is baked into every layer of our utility ecosystem.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* High Value Content Block for AdSense */}
        <div className="mt-32 max-w-4xl mx-auto space-y-12">
          <h3 className="text-2xl md:text-3xl font-black text-center text-foreground">
            The Role of All-in-One Online Utilities in Modern Workflows
          </h3>
          <div className="prose prose-invert max-w-none text-muted-foreground font-medium leading-relaxed columns-1 md:columns-2 gap-12">
            <p>
              Modern digital tasks require more than just separate, disconnected
              websites; they demand a cohesive, unified workspace where you can
              edit PDFs, convert audio and video, extract text via OCR, and
              clean HTML in one single place. Our utility platform is designed
              to simplify high-friction workflows, providing professionals with
              the speed and reliability needed to get work done efficiently.
            </p>
            <p>
              By focusing on clean outputs and client-side processing, we ensure
              that every file you convert or generate remains 100% private to
              your device. This reduces bandwidth costs, eliminates upload wait
              times, and provides instant results. Our commitment to performance
              reflects the needs of students, creators, and business
              professionals alike.
            </p>
            <p>
              Furthermore, the architectural resilience of our platform allows
              for continuous updates and expansion. As new formats and browser
              technologies emerge, our utility engine evolves to ensure that
              your workflow remains smooth, frictionless, and lightning-fast.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
