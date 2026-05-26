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
    queueMicrotask(() => setMounted(true));
  }, []);

  return (
    <section className="py-32 relative overflow-hidden bg-background">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -mr-96 -mt-96 opacity-50" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] -ml-72 -mb-72 opacity-50" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-24">
          <motion.div
            initial={mounted && isLowEnd() ? false : { opacity: 0, y: 20 }}
            whileInView={mounted && isLowEnd() ? false : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              Industry Standard Compliance
            </span>
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8 leading-[1.1] text-foreground">
            Authoritative Content <br />
            <span className="text-primary">Generation Ecosystem</span>
          </h2>

          <p className="text-xl text-muted-foreground leading-relaxed font-medium">
            At the intersection of artificial intelligence and professional
            safety standards, we provide a suite of tools engineered for the
            rigorous demands of industrial documentation and training. Our
            ecosystem simplifies complexity, ensuring precision in every module
            generated.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 mb-32">
          {[
            {
              title: 'Proprietary Extraction Logic',
              desc: 'Our neural-enhanced processing engines go beyond simple OCR. We analyze the semantic hierarchy of DOCX and PDF documents to identify critical module structures, learning objectives, and procedural hierarchies.',
              icon: Cpu,
            },
            {
              title: 'HAZWOPER Alignment',
              desc: 'Specifically tailored for safety professionals, our content generators recognize the specific structural requirements of OSHA and HAZWOPER training protocols, automating the creation of compliant training manuals.',
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
              desc: 'We bridge the gap between legacy paper-based documentation and modern digital learning management systems. Seamlessly transition thousands of pages of safety data into clean, formatted web content.',
              icon: Globe,
            },
            {
              title: 'Analytical Precision',
              desc: 'Monitor tool performance and content accuracy through our advanced administrative telemetry. We provide real-time insights into content generation cycles and asset optimization metrics.',
              icon: BarChart,
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={mounted && isLowEnd() ? false : { opacity: 0, y: 20 }}
              whileInView={mounted && isLowEnd() ? false : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="space-y-6 p-8 rounded-[32px] bg-card/40 backdrop-blur-xl border border-border hover:border-primary/30 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="text-muted-foreground font-medium leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Long Form Copy for AdSense */}
        <div className="max-w-5xl mx-auto space-y-16 py-20 border-t border-border">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h3 className="text-3xl font-black text-foreground">
                The Future of Professional Safety Documentation
              </h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                In today&apos;s highly regulated industrial landscape, the
                accuracy of safety training and technical documentation is
                paramount. Legacy systems often rely on manual data entry or
                inefficient &quot;copy-paste&quot; workflows that are prone to
                human error and consume hundreds of hours of professional time.
              </p>
              <p className="text-muted-foreground leading-relaxed font-medium">
                Our Content Suite is designed to eliminate these bottlenecks. By
                leveraging automated extraction protocols, we allow safety
                directors and course architects to transform static documents
                into dynamic, web-optimized resources in seconds. This
                isn&apos;t just about speed&mdash;it&apos;s about ensuring that
                every safety protocol is accurately preserved and clearly
                communicated.
              </p>
              <ul className="space-y-4">
                {[
                  'Automated Syllabus and Module Mapping',
                  'Intelligent Glossary and Terminology Extraction',
                  'Semantic HTML5 LMS-Ready Formatting',
                  'Secure Local Media Processing',
                ].map((text, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-foreground font-bold"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative aspect-square rounded-[60px] bg-gradient-to-br from-primary/20 to-blue-500/20 shadow-2xl flex items-center justify-center overflow-hidden group">
              <div className="absolute inset-0 bg-grid-white/[0.05]" />
              <Zap className="w-48 h-48 text-primary opacity-20 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute bottom-12 left-12 right-12 p-8 bg-card/60 backdrop-blur-2xl rounded-3xl border border-border">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black uppercase tracking-widest text-primary">
                    System Status
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-primary rounded-full" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                    Neural Engine Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 text-center pt-24">
            <h3 className="text-2xl font-black text-foreground">
              Technical Resilience & Scalability
            </h3>
            <div className="max-w-3xl mx-auto">
              <p className="text-muted-foreground leading-relaxed font-medium mb-6">
                Our platform architecture is built for the enterprise. We
                utilize a modern stack involving Next.js, Framer Motion, and
                Supabase to provide a high-performance, low-latency experience.
                By shifting compute-heavy tasks like media processing to the
                client-side using WebAssembly (FFmpeg.wasm and Tesseract.js), we
                achieve unprecedented privacy standards without sacrificing
                feature depth.
              </p>
              <p className="text-muted-foreground leading-relaxed font-medium">
                Whether you are generating a single blog post or a
                multi-thousand-page technical manual, our infrastructure scales
                with you. Every tool in our suite is optimized for speed,
                reliability, and most importantly, the precision required by the
                hazardous materials handling and safety training industries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
