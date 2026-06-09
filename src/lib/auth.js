// USERS moved to server-side API

export const ROLES = {
  admin: ['*'],
  user: [],
};

// Map tool IDs used in the app to human-readable labels and icons for sidebar
export const NAV_ITEMS = [
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
          .select('role, username, has_generator_access')
          .eq('id', data.user.id)
          .single();

        return {
          id: data.user.id,
          username: profile?.username || username,
          email: data.user.email,
          role: profile?.role || 'user',
          has_generator_access: profile?.has_generator_access || false,
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
    console.error('Login failed', error);
  }
  return null;
}

/**
 * Modernized Access Control
 * 1. Admin always has access
 * 2. If tool is set to FREE in database, everyone has access
 * 3. If tool is set to PAID in database:
 *    - Authenticated users with has_generator_access (PRO) get access
 *    - Admins get access
 *    - Guests/Standard users are restricted
 */
export function hasAccess(user, featureId, toolSettings = null) {
  // 1. Admin Overload
  if (user?.role === 'admin') return true;

  // 2. Resolve Tool ID (handles both 'course' and 'web-content')
  const { toolIdToSlug } = require('./seo');
  const slug = toolIdToSlug[featureId] || featureId;

  // 3. Database Check
  if (toolSettings) {
    const isFree = toolSettings[slug] ?? toolSettings[featureId] ?? null;

    // If explicitly FREE in DB
    if (isFree === true) return true;

    // If explicitly PAID in DB
    if (isFree === false) {
      if (!user) return false;
      return user.has_generator_access === true || user.role === 'admin';
    }
  }

  // 4. Default Fallbacks (if not in DB)
  const defaultFreeTools = [
    'html-cleaner',
    'image-converter',
    'video-compressor',
    'image-to-text',
    'word-to-html',
    'video-converter',
    'audio-converter',
    'video-to-gif',
  ];

  if (defaultFreeTools.includes(featureId) || defaultFreeTools.includes(slug)) {
    return true;
  }

  // Generators are paid by default if not specified
  const isGenerator =
    [
      'course',
      'web-content',
      'blog',
      'blog-generator',
      'glossary',
      'glossary-generator',
      'resources',
      'resource-generator',
      'document-extractor',
      'ai-assistant',
    ].includes(featureId) ||
    [
      'course',
      'web-content',
      'blog',
      'blog-generator',
      'glossary',
      'glossary-generator',
      'resources',
      'resource-generator',
      'document-extractor',
      'ai-assistant',
    ].includes(slug);

  if (isGenerator) {
    if (!user) return false;
    return user.has_generator_access === true;
  }

  return false;
}

export function triggerLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/auth';
  }
}
