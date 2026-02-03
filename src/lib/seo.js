/**
 * SEO Configuration for Content Suite
 * Centralized metadata for all tool pages
 */

export const toolMetadata = {
  'web-content': {
    title: 'Web Content Generator - Extract Course Content from Documents | Content Suite',
    description: 'Professional web content generator tool. Extract Overview, Syllabus, FAQs, Glossary, and Resources from DOCX documents. Convert course materials to clean, SEO-optimized HTML.',
    keywords: 'course generator, web content generator, DOCX to HTML, course content extraction, syllabus generator, FAQ generator, HAZWOPER training',
    canonical: '/tools/web-content',
    ogImage: '/og-web-content.png',
  },
  'blog-generator': {
    title: 'Blog Generator - AI-Powered Blog Post Creator | Content Suite',
    description: 'Create professional blog posts from DOCX documents. AI-powered blog generator with automatic formatting, HTML output, and SEO optimization. Perfect for content creators.',
    keywords: 'blog generator, AI blog writer, content generator, blog post creator, DOCX to blog, WordPress content, SEO blog tool',
    canonical: '/tools/blog-generator',
    ogImage: '/og-blog-generator.png',
  },
  'glossary-generator': {
    title: 'Glossary Generator - Create Professional Glossaries from Documents | Content Suite',
    description: 'Generate professional glossaries from DOCX documents. Automatic term extraction, alphabetical sorting, and clean HTML output. Perfect for training materials and documentation.',
    keywords: 'glossary generator, terminology extractor, DOCX glossary, term definition generator, training glossary, documentation tool',
    canonical: '/tools/glossary-generator',
    ogImage: '/og-glossary-generator.png',
  },
  'resource-generator': {
    title: 'Resource Generator - Extract Resources & References | Content Suite',
    description: 'Extract and organize resources, references, and links from documents. Generate clean, categorized resource lists in HTML format.',
    keywords: 'resource generator, reference extractor, link organizer, resource list creator, documentation resources',
    canonical: '/tools/resource-generator',
    ogImage: '/og-resource-generator.png',
  },
  'html-cleaner': {
    title: 'HTML Cleaner - Clean & Format HTML Code Online | Content Suite',
    description: 'Professional HTML cleaner and formatter. Remove unwanted tags, clean up messy code, and optimize HTML for web publishing. Free online tool.',
    keywords: 'HTML cleaner, HTML formatter, clean HTML code, HTML beautifier, code cleaner, web development tool',
    canonical: '/tools/html-cleaner',
    ogImage: '/og-html-cleaner.png',
  },
  'image-converter': {
    title: 'Image Converter - Convert Images to WebP, JPG, PNG Online | Content Suite',
    description: 'Free online image converter. Convert between WebP, JPG, PNG, and other formats. Batch conversion, quality control, and instant download.',
    keywords: 'image converter, webp converter, jpg to png, image format converter, batch image converter, free image tool',
    canonical: '/tools/image-converter',
    ogImage: '/og-image-converter.png',
  },
  'video-compressor': {
    title: 'Video Compressor - Compress Videos Online Free | Content Suite',
    description: 'Free online video compressor. Reduce video file size without losing quality. Supports MP4, MOV, AVI. Client-side processing for privacy.',
    keywords: 'video compressor, compress video online, reduce video size, video compression tool, free video compressor, MP4 compressor',
    canonical: '/tools/video-compressor',
    ogImage: '/og-video-compressor.png',
  },
  'ai-assistant': {
    title: 'AI Assistant - Smart Content Helper | Content Suite',
    description: 'AI-powered content assistant. Get help with writing, editing, and content creation. Intelligent suggestions and improvements.',
    keywords: 'AI assistant, content helper, AI writing tool, smart assistant, content creation AI',
    canonical: '/tools/ai-assistant',
    ogImage: '/og-ai-assistant.png',
  },
  'image-to-text': {
    title: 'Image to Text OCR - Extract Text from Images Online | Content Suite',
    description: 'Free OCR tool. Extract text from images and PDFs. Supports multiple languages, handwriting recognition, and batch processing.',
    keywords: 'OCR, image to text, text extraction, PDF OCR, handwriting recognition, free OCR tool, optical character recognition',
    canonical: '/tools/image-to-text',
    ogImage: '/og-image-to-text.png',
  },
  'document-extractor': {
    title: 'Document Extractor - Extract Content from Documents | Content Suite',
    description: 'Extract and analyze content from DOCX documents. Professional document processing with AI-powered content extraction.',
    keywords: 'document extractor, DOCX extractor, document analyzer, content extraction, document processing',
    canonical: '/tools/document-extractor',
    ogImage: '/og-document-extractor.png',
  },
  'privacy': {
    title: 'Privacy Policy | Content Suite',
    description: 'Privacy Policy for Content Suite - Learn how we collect, use, and protect your data in compliance with GDPR and privacy regulations.',
    keywords: 'privacy policy, GDPR, data protection, cookie policy, user privacy',
    canonical: '/privacy',
  },
  'terms': {
    title: 'Terms of Service | Content Suite',
    description: 'Terms of Service for Content Suite - Read the terms and conditions for using our content generation and media processing tools.',
    keywords: 'terms of service, terms and conditions, user agreement, legal terms',
    canonical: '/terms',
  },
  'cookies': {
    title: 'Cookie Policy | Content Suite',
    description: 'Cookie Policy for Content Suite - Learn about the cookies we use and how to manage your cookie preferences.',
    keywords: 'cookie policy, cookies, tracking, advertising cookies, GDPR cookies',
    canonical: '/cookies',
  },
};

// Map tool IDs used in the app to URL slugs
export const toolIdToSlug = {
  'course': 'web-content',
  'blog': 'blog-generator',
  'glossary': 'glossary-generator',
  'resources': 'resource-generator',
  'html-cleaner': 'html-cleaner',
  'image-converter': 'image-converter',
  'video-compressor': 'video-compressor',
  'ai-assistant': 'ai-assistant',
  'image-to-text': 'image-to-text',
  'document-extractor': 'document-extractor',
};

// Reverse mapping
export const slugToToolId = Object.fromEntries(
  Object.entries(toolIdToSlug).map(([id, slug]) => [slug, id])
);

// Tool display information
export const toolInfo = {
  'web-content': {
    name: 'Web Content Generator',
    icon: '📝',
    description: 'Extract course content from DOCX documents',
    category: 'Content Creation',
  },
  'blog-generator': {
    name: 'Blog Generator',
    icon: '✍️',
    description: 'Create professional blog posts',
    category: 'Content Creation',
  },
  'glossary-generator': {
    name: 'Glossary Generator',
    icon: '📚',
    description: 'Generate glossaries from documents',
    category: 'Content Creation',
  },
  'resource-generator': {
    name: 'Resource Generator',
    icon: '🔗',
    description: 'Extract resources and references',
    category: 'Content Creation',
  },
  'html-cleaner': {
    name: 'HTML Cleaner',
    icon: '🧹',
    description: 'Clean and format HTML code',
    category: 'Development Tools',
  },
  'image-converter': {
    name: 'Image Converter',
    icon: '🖼️',
    description: 'Convert images between formats',
    category: 'Media Tools',
  },
  'video-compressor': {
    name: 'Video Compressor',
    icon: '🎬',
    description: 'Compress videos without quality loss',
    category: 'Media Tools',
  },
  'ai-assistant': {
    name: 'AI Assistant',
    icon: '🤖',
    description: 'Smart content helper',
    category: 'AI Tools',
  },
  'image-to-text': {
    name: 'Image to Text OCR',
    icon: '📷',
    description: 'Extract text from images',
    category: 'AI Tools',
  },
  'document-extractor': {
    name: 'Document Extractor',
    icon: '📄',
    description: 'Extract content from documents',
    category: 'Content Creation',
  },
};

// Get all tool slugs for sitemap generation
export const getAllToolSlugs = () => Object.keys(toolMetadata);

// Structured data for organization
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Content Suite',
  description: 'Professional content generation and media processing tools',
  url: 'https://hazwoper-useful-tools.vercel.app',
  logo: 'https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765460885/Hi.gif',
  sameAs: [],
};

// Generate structured data for a specific tool
export function generateToolSchema(toolSlug) {
  const tool = toolMetadata[toolSlug];
  const info = toolInfo[toolSlug];
  
  if (!tool || !info) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: info.name,
    description: tool.description,
    applicationCategory: 'WebApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  };
}

// Generate breadcrumb schema
export function generateBreadcrumbSchema(toolSlug) {
  const info = toolInfo[toolSlug];
  
  if (!info) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://hazwoper-useful-tools.vercel.app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Tools',
        item: 'https://hazwoper-useful-tools.vercel.app/#tools',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: info.name,
        item: `https://hazwoper-useful-tools.vercel.app/tools/${toolSlug}`,
      },
    ],
  };
}
