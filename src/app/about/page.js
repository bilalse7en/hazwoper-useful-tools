'use client';

import { motion } from 'framer-motion';
import { Shield, Target, Users, Code, Award, Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative pt-32 pb-24 overflow-hidden border-b border-border bg-card/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)]" />
        <div className="container relative mx-auto px-6">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="bg-primary/10 text-primary border-none font-black uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 rounded-full mb-8">
                Since 2024
              </Badge>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 text-foreground leading-none">
                Pioneering <br />
                <span className="text-primary italic">Safety Tech.</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium max-w-2xl">
                Content Suite was born from a simple observation: the
                world&apos;s most critical safety training is often the most
                difficult to document. We&apos;re changing that with
                neural-powered automation.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-20 items-start">
          <div className="space-y-12">
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-foreground flex items-center gap-4">
                <Target className="w-8 h-8 text-primary" />
                Our Mission
              </h2>
              <div className="space-y-6 text-muted-foreground font-medium leading-relaxed">
                <p>
                  Our primary objective is to empower safety professionals and
                  educators with tools that bridge the gap between complex
                  regulatory requirements and modern digital learning. We
                  believe that professional training materials should be
                  accurate, accessible, and automated.
                </p>
                <p>
                  By focusing on industry-specific standards like HAZWOPER and
                  OSHA, we ensure that our neural engines don&apos;t just
                  &quot;write text&quot;—they understand the structural nuances
                  of life-saving information.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {[
                { label: 'Founded', val: '2024' },
                { label: 'Engine Accuracy', val: '99.9%' },
                { label: 'Processed Pages', val: '500K+' },
                { label: 'Active Nodes', val: 'Global' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-6 rounded-3xl bg-card border border-border"
                >
                  <div className="text-2xl font-black text-primary mb-1">
                    {stat.val}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-10 md:p-16 rounded-[60px] bg-primary/5 border border-primary/10 space-y-12 backdrop-blur-3xl relative">
            <div className="absolute top-10 right-10 opacity-10">
              <Landmark className="w-48 h-48" />
            </div>
            <h3 className="text-2xl font-black text-foreground relative z-10">
              The Core Values
            </h3>
            <div className="space-y-10 relative z-10">
              {[
                {
                  title: 'Security by Design',
                  desc: 'We prioritize local-first processing. Your technical data remains in your control, always.',
                  icon: Shield,
                },
                {
                  title: 'Technical Excellence',
                  desc: 'Our stack leverages the latest in WebAssembly and Neural Processing for peak performance.',
                  icon: Code,
                },
                {
                  title: 'Accessibility First',
                  desc: 'Every output is optimized for WCAG 2.1 compliance and SEO visibility.',
                  icon: Users,
                },
              ].map((value, i) => (
                <div key={i} className="flex gap-6">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-lg shadow-primary/20">
                    <value.icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-foreground tracking-tight">
                      {value.title}
                    </h4>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                      {value.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-border bg-muted/20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <Award className="w-16 h-16 text-primary mx-auto mb-8 animate-bounce" />
            <h2 className="text-3xl font-black">Trusted by Professionals</h2>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Content Suite is the preferred documentation engine for safety
              directors, environmental consultants, and corporate compliance
              officers worldwide. Our focus remains on the precision and
              integrity of your technical content.
            </p>
          </div>
        </div>
      </section>

      {/* New: Technical Infrastructure Section */}
      <section className="py-32 bg-card relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="p-10 rounded-[50px] bg-muted/30 border border-border space-y-8">
                <h3 className="text-2xl font-black">Technical Ecosystem</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                      <span className="text-foreground font-black">
                        Decentralized Processing:{' '}
                      </span>
                      By leveraging WebAssembly (WASM), we shift heavy
                      extraction tasks to the client side, ensuring data
                      residency and privacy.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                      <span className="text-foreground font-black">
                        Semantic Mapping:{' '}
                      </span>
                      Our neural layers are trained on over 50,000 industrial
                      safety documents to recognize specialized nomenclature and
                      formatting patterns.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                      <span className="text-foreground font-black">
                        LMS Integration:{' '}
                      </span>
                      Every output is verified against common LMS styling
                      requirements to ensure seamless migration into platforms
                      like Canvas, Moodle, and Blackboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-8">
              <Badge className="bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] px-4 py-1">
                Foundations
              </Badge>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                Architectural <br />
                <span className="text-primary">Integrity.</span>
              </h2>
              <p className="text-xl text-muted-foreground font-medium leading-relaxed">
                We didn&apos;t just build a set of tools; we built a
                professional engineering environment. Our platform is designed
                to handle the rigors of industrial data management while
                providing the simplicity of a modern web application.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* New: Global Impact Section */}
      <section className="py-32 border-t border-border bg-primary/5">
        <div className="container mx-auto px-6 text-center max-w-4xl space-y-12">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            Our Commitment to the <br />
            <span className="text-primary">Safety Community</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-12 text-left pt-12">
            <p className="text-muted-foreground font-medium leading-relaxed">
              As we look toward the future of industrial education, Content
              Suite remains committed to providing accessible, high-performance
              tools for those on the front lines of safety training. We believe
              that high-quality documentation should be an asset, not a burden,
              for organizations striving to maintain compliance and protect
              their workforce.
            </p>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Our roadmap includes expanded support for multi-lingual
              extraction, advanced AI-aided content refinement, and deeper
              integrations with global safety standards. Join the thousands of
              professionals who have already streamlined their documentation
              lifecycle with our ecosystem.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
