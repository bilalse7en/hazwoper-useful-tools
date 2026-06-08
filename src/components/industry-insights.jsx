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
                <span className="text-secondary">Safety Standards</span> <br />
                Through Automation
              </h2>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                In the highly regulated world of HAZWOPER (Hazardous Waste
                Operations and Emergency Response), accuracy in training
                documentation is not just a matter of efficiency&mdash;it&apos;s
                a matter of life and safety. Our platform is engineered to
                bridge the gap between complex regulatory requirements and
                scalable content dissemination.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-secondary" />
                  <h4 className="font-bold text-foreground">OSHA Alignment</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every module generated through our system follows the semantic
                  hierarchy recommended by OSHA 29 CFR 1910.120, ensuring that
                  learning objectives are clearly stated and verified.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-secondary" />
                  <h4 className="font-bold text-foreground">
                    Technical Fidelity
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We implement strict state management protocols to ensure that
                  transient data is not cached longer than necessary. This
                  reduces the risk of unauthorized access and maintains the
                  &quot;clean environment&quot; necessary for high-stakes
                  industrial safety tasks.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-secondary/5 border border-secondary/10 flex items-start gap-4">
              <Activity className="w-6 h-6 text-secondary shrink-0 mt-1" />
              <div>
                <h5 className="font-black text-sm uppercase tracking-wider mb-2">
                  Real-Time Processing Metrics
                </h5>
                <p className="text-xs text-muted-foreground">
                  Our engine analyzes over 500 semantic markers per second to
                  identify critical safety definitions, warnings, and procedural
                  steps within your source documents.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl opacity-50" />
            <div className="relative grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[4/5] bg-muted/30 rounded-[40px] border border-border p-8 flex flex-col justify-end">
                  <Zap className="w-10 h-10 text-secondary mb-4" />
                  <h5 className="font-black text-xl mb-2">Zero Latency</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Local processing via WebAssembly ensures your data
                    conversion is instantaneous.
                  </p>
                </div>
                <div className="aspect-square bg-muted/30 rounded-[40px] border border-border p-8 flex flex-col justify-end">
                  <Globe className="w-10 h-10 text-secondary mb-4" />
                  <h5 className="font-black text-xl mb-2">Global UI</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Standardized for international safety documentation.
                  </p>
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="aspect-square bg-muted/30 rounded-[40px] border border-border p-8 flex flex-col justify-end">
                  <BookOpen className="w-10 h-10 text-secondary mb-4" />
                  <h5 className="font-black text-xl mb-2">NLP Library</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Deep analysis of technical and industrial linguistics.
                  </p>
                </div>
                <div className="aspect-[4/5] bg-muted/30 rounded-[40px] border border-border p-8 flex flex-col justify-end">
                  <ShieldCheck className="w-10 h-10 text-secondary mb-4" />
                  <h5 className="font-black text-xl mb-2">GDPR Ready</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Privacy is baked into every layer of our content ecosystem.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* High Value Content Block for AdSense */}
        <div className="mt-32 max-w-4xl mx-auto space-y-12">
          <h3 className="text-2xl md:text-3xl font-black text-center text-foreground">
            The Role of Professional Tools in Technical Safety
          </h3>
          <div className="prose prose-invert max-w-none text-muted-foreground font-medium leading-relaxed columns-1 md:columns-2 gap-12">
            <p>
              Modern safety training requires more than just static content; it
              demands a dynamic relationship between the instructor and the
              source material. Our content generators are designed to simplify
              the complex workflows associated with OSHA and HAZWOPER
              compliance, providing course architects with the precision
              required to translate scientific and legal data into accessible
              educational modules.
            </p>
            <p>
              By focusing on clean HTML output and semantic integrity, we ensure
              that every training asset generated is optimized for search
              engines and accessibility standards. This reduces the friction of
              content migration between platforms and ensures that critical
              safety information is always accessible to those who need it most.
              Our commitment to technical excellence reflects the high standards
              of the industrial and medical centers we serve across the globe.
            </p>
            <p>
              Furthermore, the architectural resilience of our platform allows
              for consistent updates in response to changing federal
              regulations. As new safety standards emerge, our neural engine
              updates its mapping protocols to ensure that your generated
              content remains legally compliant and educationally effective,
              providing a future-proof solution for industrial documentation
              management.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
