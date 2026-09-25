// USERS moved to server-side API

export const ROLES = {
  superadmin: ['*'],
  admin: ['*'],
  course_creator: [
    'ai-course-creator',
    'course',
    'courses',
    'lesson-quiz-builder',
    'web-content',
    'slide-generator',
    'slide',
  ],
  blog_creator: ['blog', 'blog-generator'],
  content_creator: [
    'course',
    'web-content',
    'blog',
    'blog-generator',
    'glossary',
    'glossary-generator',
    'resources',
    'resource-generator',
    'document-extractor',
    'lesson-quiz-builder',
    'slide-generator',
    'slide',
  ],
  user: [],
};

// Map tool IDs used in the app to human-readable labels and icons for sidebar
export const NAV_ITEMS = [
  {
    id: 'ai-course-creator',
    label: 'AI Course Creator (PRO)',
    icon: 'Sparkles',
  },
  {
    id: 'html-design-enhancer',
    label: 'HTML Design Enhancer (PRO)',
    icon: 'Sparkles',
  },
  { id: 'slide-generator', label: 'Slide Generator', icon: 'Presentation' },
  { id: 'web-content', label: 'Web Content Generator', icon: 'GraduationCap' },
  { id: 'blog-generator', label: 'Blog Generator', icon: 'PenTool' },
  { id: 'glossary-generator', label: 'Glossary Generator', icon: 'BookOpen' },
  {
    id: 'resource-generator',
    label: 'Resource Generator',
    icon: 'FileSpreadsheet',
  },
  { id: 'document-extractor', label: 'Document Extractor', icon: 'FileText' },
  { id: 'html-cleaner', label: 'HTML Cleaner', icon: 'Code' },
  { id: 'image-converter', label: 'Image Converter', icon: 'ImageIcon' },
  { id: 'image-to-text', label: 'Image to Text', icon: 'ScanText' },
  { id: 'video-compressor', label: 'Video Compressor', icon: 'Video' },
  { id: 'video-converter', label: 'Video Converter', icon: 'Repeat' },
  { id: 'audio-converter', label: 'Audio Converter', icon: 'Music' },
  { id: 'video-to-gif', label: 'Video to GIF', icon: 'Video' },
  { id: 'word-to-html', label: 'Word to HTML', icon: 'FileType' },
  { id: 'lesson-quiz-builder', label: 'Lesson Quiz Builder', icon: 'Target' },
  {
    id: 'youtube-downloader',
    label: 'Universal Social Video Downloader',
    icon: 'Globe',
  },
  { id: 'watermark-remover', label: 'Watermark Remover', icon: 'Wand2' },
  { id: 'bg-remover', label: 'AI Background Remover', icon: 'Wand2' },
  { id: 'pdf-editor', label: 'Free PDF Editor', icon: 'FileText' },
  { id: 'ai-assistant', label: 'AI UNIVERSE', icon: 'BrainCircuit' },
];

import { supabase } from './supabase';

export async function authenticate(username, password) {
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username.includes('@') ? username : `${username}@example.com`,
        password: password,
      });

      if (!error && data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select(
            'role, username, has_generator_access, has_course_creator_access, has_ai_access'
          )
          .eq('id', data.user.id)
          .single();

        return {
          id: data.user.id,
          username: profile?.username || username,
          email: data.user.email,
          role: profile?.role || 'user',
          has_generator_access: profile?.has_generator_access || false,
          has_course_creator_access:
            profile?.has_course_creator_access || false,
          has_ai_access: profile?.has_ai_access || false,
          name: profile?.username || username,
        };
      }
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
  } catch (error) {
    console.error('Login failed:', error?.message || String(error));
  }
  return null;
}

/**
 * Modernized Access Control
 * 1. Admin & Superadmin always have access
 * 2. If tool is set to FREE in database, everyone has access
 * 3. Role-based granular access (Course Creator, Blog Editor, Content Specialist)
 * 4. User-level feature flags (has_generator_access, has_course_creator_access, has_ai_access)
 */
export function hasAccess(user, featureId, toolSettings = null) {
  // 1. Master & Admin Overload (unlimited access to all tools)
  const isMasterUser =
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    (user?.email || '').toLowerCase() === 'bilalghaffar46@gmail.com';

  if (isMasterUser) return true;

  // 2. Resolve Tool ID (handles both 'course' and 'web-content')
  const { toolIdToSlug } = require('./seo');
  const slug = toolIdToSlug[featureId] || featureId;

  // Special Case: Chat is free for ALL logged in users, always locked for guests
  if (slug === 'chat' || featureId === 'chat') {
    return !!user;
  }

  // 3. Database Check (if explicitly overridden)
  if (toolSettings) {
    const isFree = toolSettings[slug] ?? toolSettings[featureId] ?? null;

    // If explicitly FREE in DB
    if (isFree === true) return true;

    // If explicitly PAID in DB
    if (isFree === false) {
      if (!user) return false;
      if (user.role === 'admin' || user.role === 'superadmin') return true;
      if (
        [
          'ai-course-creator',
          'course',
          'courses',
          'web-content',
          'lesson-quiz-builder',
        ].includes(slug) ||
        [
          'ai-course-creator',
          'course',
          'courses',
          'web-content',
          'lesson-quiz-builder',
        ].includes(featureId)
      ) {
        return (
          user.has_course_creator_access === true ||
          user.has_generator_access === true ||
          user.role === 'course_creator'
        );
      }
      return user.has_generator_access === true;
    }
  }

  // 4. Default Free Tools
  const defaultFreeTools = [
    'html-cleaner',
    'image-converter',
    'video-compressor',
    'image-to-text',
    'word-to-html',
    'video-converter',
    'audio-converter',
    'video-to-gif',
    'audio-editor',
    'youtube-downloader',
    'watermark-remover',
    'bg-remover',
    'pdf-editor',
    'chat',
    'slide-generator',
    'slide',
  ];

  if (defaultFreeTools.includes(featureId) || defaultFreeTools.includes(slug)) {
    return true;
  }

  // 5. Course Creator Suite Access
  const isCourseTool =
    [
      'ai-course-creator',
      'course',
      'courses',
      'web-content',
      'lesson-quiz-builder',
    ].includes(featureId) ||
    [
      'ai-course-creator',
      'course',
      'courses',
      'web-content',
      'lesson-quiz-builder',
    ].includes(slug);

  if (isCourseTool) {
    if (!user) return false;
    return (
      user.has_course_creator_access === true ||
      user.has_generator_access === true ||
      user.role === 'course_creator' ||
      user.role === 'admin' ||
      user.role === 'superadmin'
    );
  }

  // 6. Blog Creator Access
  const isBlogTool =
    ['blog', 'blog-generator'].includes(featureId) ||
    ['blog', 'blog-generator'].includes(slug);

  if (isBlogTool) {
    if (!user) return false;
    return (
      user.role === 'blog_creator' ||
      user.role === 'content_creator' ||
      user.has_generator_access === true ||
      user.role === 'admin' ||
      user.role === 'superadmin'
    );
  }

  // 7. General Generator Access
  const isGenerator =
    [
      'glossary',
      'glossary-generator',
      'resources',
      'resource-generator',
      'document-extractor',
      'ai-assistant',
    ].includes(featureId) ||
    [
      'glossary',
      'glossary-generator',
      'resources',
      'resource-generator',
      'document-extractor',
      'ai-assistant',
    ].includes(slug);

  if (isGenerator) {
    if (!user) return false;
    return (
      user.has_generator_access === true ||
      user.role === 'content_creator' ||
      user.role === 'admin' ||
      user.role === 'superadmin'
    );
  }

  // 8. HTML Design Enhancer (PRO / Admin & Pro Accounts)
  const isHtmlEnhancer =
    featureId === 'html-design-enhancer' || slug === 'html-design-enhancer';
  if (isHtmlEnhancer) {
    if (!user) return false;
    return (
      user.role === 'admin' ||
      user.role === 'superadmin' ||
      user.has_generator_access === true ||
      user.has_ai_access === true
    );
  }

  return false;
}

export function triggerLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/auth';
  }
}
