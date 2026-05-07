"use client";

import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { Shield, Mail, ExternalLink, BookOpen, Globe, Lock } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-card/50 border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Company Info */}
          <div className="space-y-6">
            <BrandLogo size="sm" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Next-generation content automation suite for HAZWOPER training developers. 
              Our neural engines provide high-speed, local-first document processing for maximum security.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Link href="mailto:bilalghaffar46@gmail.com" className="hover:text-primary transition-colors">
                <Mail className="w-5 h-5" />
              </Link>
              <Globe className="w-5 h-5" />
            </div>
          </div>

          {/* Core Tools */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Platform Tools</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/tools/web-content" className="hover:text-primary transition-colors">Course Content Gen</Link></li>
              <li><Link href="/tools/blog-generator" className="hover:text-primary transition-colors">Blog Post Generator</Link></li>
              <li><Link href="/tools/glossary-generator" className="hover:text-primary transition-colors">Glossary Extractor</Link></li>
              <li><Link href="/tools/video-compressor" className="hover:text-primary transition-colors">Video Optimizer</Link></li>
              <li><Link href="/tools/image-to-text" className="hover:text-primary transition-colors">Neural OCR Engine</Link></li>
            </ul>
          </div>

          {/* Resources & Guides */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Resources</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/blog" className="hover:text-primary transition-colors flex items-center gap-2"><BookOpen className="w-4 h-4" /> Editorial Blog</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About Our Neural Hub</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors flex items-center gap-2"><Lock className="w-4 h-4" /> Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Why Choose Us */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Compliance & Trust</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-1"><Shield className="w-4 h-4 text-green-500" /></div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Local-First:</strong> All document processing stays in your browser cache. Zero server upload.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="mt-1"><ExternalLink className="w-4 h-4 text-blue-500" /></div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Standards:</strong> Generation of semantic HTML5 compliant with all major WCAG 2.1 accessibility standards.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-medium">
          <p>© {currentYear} HAZWOPER Tools Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> System: Optimal</span>
            <span>Cloud Deployment: Vercel Alpha</span>
            <span>Powered by Neural Flow AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
