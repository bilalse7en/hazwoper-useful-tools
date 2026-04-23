/**
 * SEO Configuration for Content Suite
 * Centralized metadata for all tool pages
 */

export const toolMetadata = {
  'web-content': {
    title: 'Web Content Generator - Extract Course Content from Documents | Content Suite',
    description: 'Professional web content generator tool. Extract Overview, Syllabus, FAQs, Glossary, and Resources from DOCX documents. Convert material to clean, SEO-optimized HTML.',
    keywords: 'course generator, web content generator, DOCX to HTML, content extraction, syllabus generator, FAQ generator, professional content',
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
    detailedDescription: 'Transform your boring DOCX course materials into engaging, structured web content. Our generator intelligently identifies module titles, learning objectives, and content blocks to create a professional online learning experience.',
    benefits: [
      'Automatic syllabus generation from document headings',
      'Extraction of learning objectives and module summaries',
      'Clean HTML output ready for any LMS or CMS',
      'Preservation of document structure and hierarchy'
    ],
    howToUse: 'Upload your training DOCX file, select the modules you want to extract, and click generate. You can then copy the clean HTML or export it directly.'
  },
  'blog-generator': {
    name: 'Blog Generator',
    icon: '✍️',
    description: 'Create professional blog posts',
    category: 'Content Creation',
    detailedDescription: 'Turn your technical documents or reports into localized, SEO-ready blog posts. This tool helps you maintain a consistent brand voice while repurposing existing content for your audience.',
    benefits: [
      'AI-enhanced readability and flow',
      'Automatic meta description generation',
      'Structured heading hierarchy (H1-H4)',
      'Direct copy-to-clipboard functionality'
    ],
    howToUse: 'Paste your source text or upload a document, choose your target audience tone, and let the AI structure your blog post for maximum engagement.'
  },
  'glossary-generator': {
    name: 'Glossary Generator',
    icon: '📚',
    description: 'Generate glossaries from documents',
    category: 'Content Creation',
    detailedDescription: 'Consistency is key in technical training. Our glossary generator scans your documents for key terms and definitions, organizing them alphabetically and formatting them for easy reference.',
    benefits: [
      'Automated term extraction using NLP',
      'Alphabetical sorting and categorization',
      'Consistent formatting across all definitions',
      'Easy integration into course resources'
    ],
    howToUse: 'Provide your training manual or technical document. The tool will identify key terms. Review the results and export as a clean, styled glossary.'
  },
  'resource-generator': {
    name: 'Resource Generator',
    icon: '🔗',
    description: 'Extract resources and references',
    category: 'Content Creation',
    detailedDescription: 'Stop hunting for links and references in your PDFs and Word files. Our resource generator gathers every citation, external link, and reference into a structured list.',
    benefits: [
      'One-click extraction of all hyperlink data',
      'Categorization of reference types',
      'Clean link formatting for web menus',
      'Validation of extracted URLs'
    ],
    howToUse: 'Input your source document. The tool will scan for references and external resources, providing a categorized list ready for your resource page.'
  },
  'html-cleaner': {
    name: 'HTML Cleaner',
    icon: '🧹',
    description: 'Clean and format HTML code',
    category: 'Development Tools',
    detailedDescription: 'Get rid of messy inline styles, empty tags, and bloated code from Microsoft Word exports. Our HTML cleaner provides lean, semantic code that loads faster and ranks better.',
    benefits: [
      'Removal of Microsoft Word specific junk tags',
      'Minification or beautification of code',
      'Conversion of complex styling to clean classes',
      'Validation of unclosed tags'
    ],
    howToUse: 'Paste your messy HTML into the editor. Choose your cleaning preferences (remove styles, remove comments, etc.) and get instant clean code.'
  },
  'image-converter': {
    name: 'Image Converter',
    icon: '🖼️',
    description: 'Convert images between formats',
    category: 'Media Tools',
    detailedDescription: 'Optimize your website performance by converting images to modern formats like WebP. Our batch converter handles multiple files at once, all within your browser for total privacy.',
    benefits: [
      'Blazing fast browser-side conversion',
      'Support for WebP, PNG, JPG, and AVIF',
      'Bulk processing for entire image sets',
      'Zero server uploads - 100% private'
    ],
    howToUse: 'Drag and drop your images into the zone. Select your desired output format and quality. Download your optimized images individually or as a ZIP.'
  },
  'video-compressor': {
    name: 'Video Compressor',
    icon: '🎬',
    description: 'Compress videos without quality loss',
    category: 'Media Tools',
    detailedDescription: 'Large video files can slow down your LMS and eat up bandwidth. Our compressor reduces file size while maintaining visual clarity, ensuring smooth playback for all users.',
    benefits: [
      'Client-side FFmpeg processing',
      'Selectable target size or quality level',
      'Preview before and after file sizes',
      'Privacy guaranteed - video never leaves your PC'
    ],
    howToUse: 'Upload your video file. Choose your compression settings based on your needs. Click compress and wait for the browser to process your file.'
  },
  'ai-assistant': {
    name: 'AI Assistant',
    icon: '🤖',
    description: 'Smart content helper',
    category: 'AI Tools',
    detailedDescription: 'The AI Assistant is your dedicated partner for content refinement. Whether you need to simplify complex technical text or brainstorm content questions, the assistant is here to help.',
    benefits: [
      'Context-aware content suggestions',
      'Grammar and style optimization',
      'Interactive Q&A for content development',
      'Connected to latest language standards'
    ],
    howToUse: 'Type your query or paste the content you need help with. The AI will provide tailored suggestions and improvements instantly.'
  },
  'image-to-text': {
    name: 'Image to Text OCR',
    icon: '📷',
    description: 'Extract text from images',
    category: 'AI Tools',
    detailedDescription: 'Convert scanned diagrams, whiteboard notes, or document photos into editable text. Our OCR engine supports multiple languages and maintains relative text positioning.',
    benefits: [
      'High accuracy Tesseract OCR engine',
      'Handwriting recognition capabilities',
      'Multi-language support',
      'Export results as TXT or DOCX'
    ],
    howToUse: 'Upload or paste an image containing text. The OCR engine will process it and display the extracted text for you to edit and copy.'
  },
  'document-extractor': {
    name: 'Document Extractor',
    icon: '📄',
    description: 'Extract content from documents',
    category: 'Content Creation',
    detailedDescription: 'The ultimate tool for bulk content extraction. Analyze complex DOCX structures and pull out tables, lists, and images with precision.',
    benefits: [
      'Precise table and list extraction',
      'Image and media asset gathering',
      'Metadata extraction from document properties',
      'Support for legacy DOCX formatting'
    ],
    howToUse: 'Submit your DOCX document. Use the extraction dashboard to filter for specific elements like tables or images, and export them as needed.'
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
