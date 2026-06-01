'use client';

import Link from 'next/link';
import { ChevronRight, Home, LayoutGrid } from 'lucide-react';
import { toolInfo } from '@/lib/seo';

export function ToolBreadcrumbs({ slug }) {
  const tool = toolInfo[slug];

  return (
    <nav className="flex items-center gap-2 mb-8 text-[11px] font-black uppercase tracking-widest overflow-x-auto no-scrollbar whitespace-nowrap py-4 border-b border-border/50">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group"
      >
        <Home className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
        <span>Hub</span>
      </Link>

      <ChevronRight className="w-3 h-3 text-border shrink-0" />

      <Link
        href="/tools"
        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group"
      >
        <LayoutGrid className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
        <span>Systems</span>
      </Link>

      <ChevronRight className="w-3 h-3 text-border shrink-0" />

      <div className="flex items-center gap-2 text-primary bg-primary/5 px-4 py-1.5 rounded-full border border-primary/20">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span>{tool?.name || 'Active Tool'}</span>
      </div>
    </nav>
  );
}
