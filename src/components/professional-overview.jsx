'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Cpu,
  BarChart,
  Globe,
  FileCheck,
  Lock,
  Search,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { isLowEnd } from '@/lib/utils';

export function ProfessionalOverview() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <section className="py-12 sm:py-16 relative overflow-hidden bg-background">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -mr-72 -mt-72 opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[90px] -ml-60 -mb-60 opacity-50 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4"
          >
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              Industry Standard Compliance
            </span>
          </motion.div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-3 leading-[1.15] text-foreground">
            Authoritative Utility <br />
            <span className="text-primary">Ecosystem &amp; Workspace</span>
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
            At the intersection of artificial intelligence and professional
            productivity standards, we provide a suite of tools engineered for
            the rigorous demands of digital documentation, media editing, and
            content generation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-12 sm:mb-16">
          {[
            {
              title: 'Proprietary Extraction Logic',
              desc: 'Our neural-enhanced processing engines go beyond simple OCR. We analyze the semantic hierarchy of DOCX and PDF documents to identify critical structures, learning objectives, and content blocks.',
              icon: Cpu,
            },
            {
              title: 'Universal Utility Alignment',
              desc: 'Specifically tailored for digital creators and professionals, our tools handle PDF manipulation, media re-encoding, and content conversion with zero friction.',
              icon: FileCheck,
            },
            {
              title: 'SEO-First Architecture',
              desc: 'Every piece of HTML exported by our suite is built with semantic integrity. We prioritize clean heading structures, ARIA accessibility, and structured data patterns to ensure your content is search-engine optimized from the first byte.',
              icon: Search,
            },
            {
              title: 'Enterprise-Grade Privacy',
              desc: "Security is non-negotiable. Media processing, including image conversion and video compression, occurs entirely within your browser's runtime. Your proprietary data never touches our servers.",
              icon: Lock,
            },
            {
              title: 'Digital Transformation',
              desc: 'We bridge the gap between legacy static documentation and modern digital platforms. Seamlessly transition thousands of pages of text into clean, formatted web content.',
              icon: Globe,
            },
            {
              title: 'Analytical Precision',
              desc: 'Monitor tool performance and content accuracy through our advanced administrative telemetry. We provide real-time insights into tool cycles and asset optimization metrics.',
              icon: BarChart,
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="space-y-4 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card/50 backdrop-blur-xl border border-border hover:border-primary/40 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Long Form Copy for AdSense */}
        <div className="max-w-5xl mx-auto space-y-10 py-10 sm:py-12 border-t border-border">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                The Future of Online Productivity &amp; Content Automation
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                In today&apos;s fast-paced digital landscape, the efficiency of
                technical workflows and content creation is paramount. Legacy
                tools often rely on cumbersome software or inefficient
                &quot;copy-paste&quot; methods that consume hundreds of hours of
                valuable time.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                All Useful Tools is designed to eliminate these bottlenecks. By
                leveraging automated processing protocols, we allow creators,
                professionals, and developers to transform documents, media, and
                code into dynamic, web-optimized resources in seconds.
              </p>
              <ul className="space-y-2.5 pt-2">
                {[
                  'Automated Document and Module Mapping',
                  'Intelligent Glossary and Resource Extraction',
                  'Clean HTML5 and PDF Editing Tools',
                  'Secure Local Browser Media Processing',
                ].map((text, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative aspect-square max-w-[340px] mx-auto rounded-3xl bg-gradient-to-br from-primary/20 to-blue-500/20 shadow-xl flex items-center justify-center overflow-hidden group">
              <div className="absolute inset-0 bg-grid-white/[0.05]" />
              <Zap className="w-32 h-32 text-primary opacity-20 group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-card/80 backdrop-blur-xl rounded-2xl border border-border shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    System Status
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-primary rounded-full" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">
                    All Engines Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-center pt-8 sm:pt-10">
            <h3 className="text-xl sm:text-2xl font-black text-foreground">
              Technical Resilience &amp; Scalability
            </h3>
            <div className="max-w-3xl mx-auto space-y-3">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                Our platform architecture is built for the modern web. By
                shifting compute-heavy tasks like media processing and PDF
                manipulation to the client-side using WebAssembly (FFmpeg.wasm,
                PDF-lib, and Tesseract.js), we achieve unprecedented privacy
                standards without sacrificing feature depth.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                Whether you are editing a PDF, converting video clips, or
                extracting large documents, our infrastructure scales with you.
                Every tool in our suite is optimized for speed, reliability, and
                precision.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
