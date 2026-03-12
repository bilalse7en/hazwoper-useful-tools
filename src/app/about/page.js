import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';

export const metadata = {
  title: 'About Us | Content Suite',
  description: 'Learn more about HAZWOPER Tools (Content Suite) - our mission, our tools, and how we help training developers create high-quality content.',
  robots: 'index, follow',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <Link 
            href="/" 
            className="text-primary hover:text-primary/80 transition-colors mb-8 inline-block"
          >
            ← Back to Home
          </Link>
          <BrandLogo size="lg" className="mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
            About Content Suite
          </h1>
          <p className="text-xl text-muted-foreground">
            Empowering training developers with intelligent content tools.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
          <section className="bg-muted/30 p-8 rounded-3xl border border-border/50">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg leading-relaxed">
              Content Suite (HAZWOPER Tools) was created with a single goal: to simplify the complex workflow of creating high-quality, compliance-ready training materials. We believe that training developers should spend their time on instructional design and quality, not on tedious manual formatting and data extraction.
            </p>
          </section>

          <section className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Privacy First</h2>
              <p className="text-muted-foreground">
                We take data privacy seriously. Unlike many online tools that upload your sensitive documents to remote servers, HAZWOPER Tools processes everything **locally in your browser**. Your documents never leave your computer, ensuring maximum security and compliance with your organization's data policies.
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Client-Side Power</h2>
              <p className="text-muted-foreground">
                By leveraging modern web technologies, we've moved the processing power from the server to your device. This means faster processing speeds, no file size limits due to upload bandwidth, and a smoother, more responsive user experience.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Our Core Tools</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { name: "Web Content Generator", desc: "Convert course materials from DOCX to clean, SEO-friendly HTML." },
                { name: "Document Extractor", desc: "Intelligently extract key information from large training manuals." },
                { name: "Media Processors", desc: "Compress videos and convert images for web optimization without quality loss." },
                { name: "AI Assistants", desc: "Neural-powered help for drafting FAQs, glossaries, and module overviews." },
              ].map((tool, i) => (
                <div key={i} className="p-6 border border-border rounded-2xl hover:bg-muted/20 transition-colors">
                  <h3 className="font-bold mb-2">{tool.name}</h3>
                  <p className="text-sm text-muted-foreground">{tool.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="text-center py-12 border-t border-border">
            <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground mb-6">
              Have questions or suggestions? We'd love to hear from you.
            </p>
            <a 
              href="mailto:bilalghaffar46@gmail.com" 
              className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
            >
              Email Us
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
