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
    <section className="py-12 sm:py-16 bg-card/20 border-y border-border overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight">
                Advancing{' '}
                <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-cyan-400 font-black">
                  Productivity Standards
                </span>{' '}
                <br />
                Through Automation
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
                In today&apos;s fast-moving digital world, speed and accuracy in
                file conversion, document management, and media editing are
                essential. Our platform is engineered to bridge the gap between
                complex workflows and effortless, lightning-fast browser
                execution.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2 p-4 rounded-2xl bg-card border border-border/70">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">
                    Universal Standards
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Every tool generated through our system follows modern web and
                  media standards, ensuring seamless compatibility across all
                  browsers and devices.
                </p>
              </div>
              <div className="space-y-2 p-4 rounded-2xl bg-card border border-border/70">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">
                    Local Data Fidelity
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We implement strict client-side processing protocols so your
                  files stay in your browser memory. Zero remote file storage,
                  zero security leaks, and complete privacy.
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3.5">
              <Activity className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider mb-1">
                  Real-Time Processing Metrics
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Our browser engines process operations per second to convert
                  media, parse documents, and render PDF edits in real time.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50" />
            <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="aspect-[4/5] bg-muted/30 rounded-2xl sm:rounded-3xl border border-border p-5 sm:p-6 flex flex-col justify-end">
                  <Zap className="w-7 h-7 text-primary mb-2.5" />
                  <h4 className="font-black text-base sm:text-lg mb-1">
                    Zero Latency
                  </h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed font-medium">
                    Local processing via WebAssembly ensures your data
                    conversion is instantaneous.
                  </p>
                </div>
                <div className="aspect-square bg-muted/30 rounded-2xl sm:rounded-3xl border border-border p-5 sm:p-6 flex flex-col justify-end">
                  <Globe className="w-7 h-7 text-primary mb-2.5" />
                  <h4 className="font-black text-base sm:text-lg mb-1">
                    Global UI
                  </h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed font-medium">
                    Standardized for modern web workflows worldwide.
                  </p>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8">
                <div className="aspect-square bg-muted/30 rounded-2xl sm:rounded-3xl border border-border p-5 sm:p-6 flex flex-col justify-end">
                  <BookOpen className="w-7 h-7 text-primary mb-2.5" />
                  <h4 className="font-black text-base sm:text-lg mb-1">
                    Smart Engine
                  </h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed font-medium">
                    Deep analysis of document structures and media codecs.
                  </p>
                </div>
                <div className="aspect-[4/5] bg-muted/30 rounded-2xl sm:rounded-3xl border border-border p-5 sm:p-6 flex flex-col justify-end">
                  <ShieldCheck className="w-7 h-7 text-primary mb-2.5" />
                  <h4 className="font-black text-base sm:text-lg mb-1">
                    Privacy First
                  </h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed font-medium">
                    Privacy is baked into every layer of our utility ecosystem.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* High Value Content Block for AdSense */}
        <div className="mt-12 sm:mt-16 max-w-4xl mx-auto space-y-6">
          <h3 className="text-xl sm:text-2xl font-black text-center text-foreground">
            The Role of All-in-One Online Utilities in Modern Workflows
          </h3>
          <div className="prose prose-invert max-w-none text-muted-foreground font-medium text-xs sm:text-sm leading-relaxed columns-1 md:columns-2 gap-8">
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
