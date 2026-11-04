import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Gamepad2,
  ShieldCheck,
  Clock,
  Wand2,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  BookOpen,
  Layout,
  Code,
  Video,
  Search,
  ChevronRight,
  LogIn,
  Repeat,
  Music,
  FileType,
  AudioWaveform,
  Target,
  Scissors,
  FileCode,
} from 'lucide-react';
import { toolIdToSlug, toolInfo } from '@/lib/seo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, isLowEnd } from '@/lib/utils';
import { triggerLogin, hasAccess } from '@/lib/auth';
import { useAuth } from '@/components/auth-provider';
import { MainframeHeroBanner } from '@/components/home/mainframe-hero-banner';
import { FrozenGlassToolsGallery } from '@/components/home/frozen-glass-tools-gallery';
import { VanteEssentialUtilities } from '@/components/home/vante-essential-utilities';
import { FacetGlassSuite } from '@/components/home/facet-glass-suite';

const iconMap = {
  'ai-video-shorts': Scissors,
  'ai-course-creator': Sparkles,
  course: Layout,
  blog: FileText,
  glossary: BookOpen,
  resources: Search,
  'html-cleaner': Code,
  'image-converter': ImageIcon,
  'video-compressor': Video,
  'ai-assistant': MessageSquare,
  'image-to-text': Wand2,
  'document-extractor': FileText,
  'video-converter': Repeat,
  'audio-converter': Music,
  'audio-editor': AudioWaveform,
  'video-to-gif': Video,
  'word-to-html': FileType,
  'lesson-quiz-builder': Target,
  'youtube-downloader': Video,
  'watermark-remover': Wand2,
  'bg-remover': Wand2,
  'pdf-editor': FileText,
  'html-design-enhancer': Sparkles,
  'adobe-stock-finder': Search,
  'course-json-converter': FileCode,
};

// Free tools that anyone can access (even without login)
const FREE_TOOL_IDS = [
  'html-cleaner',
  'image-converter',
  'video-compressor',
  'image-to-text',
  'document-extractor',
  'video-converter',
  'audio-converter',
  'audio-editor',
  'video-to-gif',
  'word-to-html',
  'youtube-downloader',
  'watermark-remover',
  'bg-remover',
  'pdf-editor',
  'ai-video-shorts',
  'adobe-stock-finder',
  'course-json-converter',
];

// Generator tools that require login + generator access
const GENERATOR_TOOL_IDS = [
  'ai-course-creator',
  'html-design-enhancer',
  'course',
  'blog',
  'glossary',
  'resources',
  'lesson-quiz-builder',
  'ai-assistant',
];

export function ToolsLanding({ user }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isGuest = !user;
  const isAdmin = user?.role === 'admin';
  const hasGeneratorAccess = user?.has_generator_access || isAdmin;

  const { toolSettings } = useAuth();

  const tools = Object.entries(toolIdToSlug).map(([id, slug]) => ({
    id,
    slug,
    ...toolInfo[slug],
  }));

  // Determine free/paid dynamically based on database SLUG
  const isToolFree = (tool) => {
    // Check dynamic settings first using the SLUG (key in toolInfo/database)
    if (toolSettings && toolSettings[tool.slug] !== undefined) {
      return toolSettings[tool.slug] === true;
    }

    // Fallback to hardcoded logic if database is empty/loading
    const FREE_TOOL_SLUGS = [
      'html-cleaner',
      'image-converter',
      'video-compressor',
      'image-to-text',
      'document-extractor',
      'video-converter',
      'audio-converter',
      'audio-editor',
      'video-to-gif',
      'word-to-html',
      'youtube-downloader',
      'watermark-remover',
      'bg-remover',
      'pdf-editor',
    ];
    return FREE_TOOL_SLUGS.includes(tool.slug);
  };

  const freeTools = tools.filter((t) => isToolFree(t));
  const generatorAndPaidTools = tools.filter((t) => !isToolFree(t));

  // Determine access based on user role and dynamic settings
  const hasAccessToTool = (toolOrId) => {
    if (
      user?.role === 'admin' ||
      user?.role === 'superadmin' ||
      (user?.email || '').toLowerCase() === 'bilalghaffar46@gmail.com'
    ) {
      return true;
    }
    const toolId = typeof toolOrId === 'object' ? toolOrId.id : toolOrId;
    const toolSlug = typeof toolOrId === 'object' ? toolOrId.slug : toolOrId;

    if (
      toolSettings &&
      (toolSettings[toolSlug] === true || toolSettings[toolId] === true)
    ) {
      return true;
    }

    return hasAccess(user, toolId || toolSlug, toolSettings);
  };

  return (
    <div className="min-h-screen bg-transparent pb-16">
      {/* Hero Section: Full-Bleed 3D Human Mainframe Banner matching AI Studio Design */}
      <MainframeHeroBanner user={user} />

      {/* Section 2: Frozen Glass Studio 3D Gallery (Real Professional Tools Only, Cylinder 3D Stage) */}
      <FrozenGlassToolsGallery />

      {/* Free / Utility Tools Section: Vante - Craft in Motion Scroll-Driven 3D Choreography */}
      <VanteEssentialUtilities user={user} isGuest={isGuest} />

      {/* Professional Call to Action: Facet Designed in Glass 3D Sculpture */}
      <FacetGlassSuite user={user} isGuest={isGuest} />
    </div>
  );
}

function LockIcon({ className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
