/**
 * SEO Configuration for All Useful Tools
 * Centralized metadata for all tool pages
 */
import { SITE_CONFIG, getCanonicalUrl, getSiteUrl } from '@/lib/site-config';

export const toolMetadata = {
  'ai-course-creator': {
    title:
      'AI Course Creator - Create Professional LMS Courses | All Useful Tools',
    description:
      'Generate full interactive OSHA/HAZWOPER and corporate training courses with AI. Complete with modules, topics, visual canvas components, audio narration scripts, and quizzes.',
    keywords:
      'AI course creator, course generator, LMS course builder, HAZWOPER AI, OSHA course generator, automated course builder',
    canonical: '/tools/ai-course-creator',
    ogImage: '/og-web-content.png',
  },
  'slide-generator': {
    title:
      'Slide Generator - Dynamic Presentation Slide Builder | All Useful Tools',
    description:
      'Create stunning Before vs With AI and Challenge slides with custom text, 4 or 5 points, unique animations, and zero-comment clean HTML.',
    keywords:
      'slide generator, html slides, presentation slide creator, before vs with ai, course slides',
    canonical: '/tools/slide-generator',
    ogImage: '/og-web-content.png',
  },
  'web-content': {
    title:
      'Web Content Generator - Extract Structured Web Content from Documents | All Useful Tools',
    description:
      'Professional web content generator tool. Extract Overview, Syllabus, FAQs, Glossary, and Resources from DOCX documents. Convert material to clean, SEO-optimized HTML.',
    keywords:
      'course generator, web content generator, DOCX to HTML, content extraction, syllabus generator, FAQ generator, all useful tools',
    canonical: '/tools/web-content',
    ogImage: '/og-web-content.png',
  },
  'blog-generator': {
    title: 'Blog Generator - AI-Powered Blog Post Creator | All Useful Tools',
    description:
      'Create professional blog posts from DOCX documents. AI-powered blog generator with automatic formatting, HTML output, and SEO optimization. Perfect for content creators.',
    keywords:
      'blog generator, AI blog writer, content generator, blog post creator, DOCX to blog, WordPress content, SEO blog tool',
    canonical: '/tools/blog-generator',
    ogImage: '/og-blog-generator.png',
  },
  'glossary-generator': {
    title:
      'Glossary Generator - Create Professional Glossaries from Documents | All Useful Tools',
    description:
      'Generate professional glossaries from DOCX documents. Automatic term extraction, alphabetical sorting, and clean HTML output. Perfect for documentation and resource guides.',
    keywords:
      'glossary generator, terminology extractor, DOCX glossary, term definition generator, documentation tool, all useful tools',
    canonical: '/tools/glossary-generator',
    ogImage: '/og-glossary-generator.png',
  },
  'resource-generator': {
    title:
      'Resource Generator - Extract Resources & References | All Useful Tools',
    description:
      'Extract and organize resources, references, and links from documents. Generate clean, categorized resource lists in HTML format.',
    keywords:
      'resource generator, reference extractor, link organizer, resource list creator, documentation resources',
    canonical: '/tools/resource-generator',
    ogImage: '/og-resource-generator.png',
  },
  'html-cleaner': {
    title: 'HTML Cleaner - Clean & Format HTML Code Online | All Useful Tools',
    description:
      'Professional HTML cleaner and formatter. Remove unwanted tags, clean up messy code, and optimize HTML for web publishing. Free online tool.',
    keywords:
      'HTML cleaner, HTML formatter, clean HTML code, HTML beautifier, code cleaner, web development tool',
    canonical: '/tools/html-cleaner',
    ogImage: '/og-html-cleaner.png',
  },
  'image-converter': {
    title:
      'Image Converter - Convert Images to WebP, JPG, PNG Online | All Useful Tools',
    description:
      'Free online image converter. Convert between WebP, JPG, PNG, and other formats. Batch conversion, quality control, and instant download.',
    keywords:
      'image converter, webp converter, jpg to png, image format converter, batch image converter, free image tool',
    canonical: '/tools/image-converter',
    ogImage: '/og-image-converter.png',
  },
  'video-compressor': {
    title: 'Video Compressor - Compress Videos Online Free | All Useful Tools',
    description:
      'Free online video compressor. Reduce video file size without losing quality. Supports MP4, MOV, AVI. Client-side processing for privacy.',
    keywords:
      'video compressor, compress video online, reduce video size, video compression tool, free video compressor, MP4 compressor',
    canonical: '/tools/video-compressor',
    ogImage: '/og-video-compressor.png',
  },
  'ai-assistant': {
    title: 'AI Assistant - Smart Content Helper | All Useful Tools',
    description:
      'AI-powered content assistant. Get help with writing, editing, and content creation. Intelligent suggestions and improvements.',
    keywords:
      'AI assistant, content helper, AI writing tool, smart assistant, content creation AI',
    canonical: '/tools/ai-assistant',
    ogImage: '/og-ai-assistant.png',
  },
  'image-to-text': {
    title:
      'Image to Text OCR - Extract Text from Images Online | All Useful Tools',
    description:
      'Free OCR tool. Extract text from images and PDFs. Supports multiple languages, handwriting recognition, and batch processing.',
    keywords:
      'OCR, image to text, text extraction, PDF OCR, handwriting recognition, free OCR tool, optical character recognition',
    canonical: '/tools/image-to-text',
    ogImage: '/og-image-to-text.png',
  },
  'document-extractor': {
    title:
      'Document Extractor - Extract Content from Documents | All Useful Tools',
    description:
      'Extract and analyze content from DOCX documents. Professional document processing with AI-powered content extraction.',
    keywords:
      'document extractor, DOCX extractor, document analyzer, content extraction, document processing',
    canonical: '/tools/document-extractor',
    ogImage: '/og-document-extractor.png',
  },
  'video-converter': {
    title:
      'Video Converter - Convert Videos Between MP4, WebM, MOV, AVI Online | All Useful Tools',
    description:
      'Free online video converter. Convert between MP4, WebM, MOV, AVI, and GIF formats. Browser-based processing for complete privacy. No upload required.',
    keywords:
      'video converter, MP4 to WebM, convert video online, video format converter, MOV to MP4, AVI converter, free video converter, browser video converter',
    canonical: '/tools/video-converter',
    ogImage: '/og-video-converter.png',
  },
  'audio-converter': {
    title:
      'Audio Converter - Convert MP3, WAV, AAC, OGG Online | All Useful Tools',
    description:
      'Professional browser-based audio converter. Convert between MP3, WAV, AAC, OGG, and M4A formats. High-fidelity re-encoding with complete privacy.',
    keywords:
      'audio converter, MP3 converter, WAV to MP3, convert audio online, AAC converter, free audio converter, browser audio processing, OGG to MP3',
    canonical: '/tools/audio-converter',
    ogImage: '/og-audio-converter.png',
  },
  'audio-editor': {
    title:
      'Audio Editor - Edit, Trim & Apply Audio Filters Online | All Useful Tools',
    description:
      'Free browser-based audio editor. Visualize audio waveform, crop, trim, fade in/out, reverse, adjust speed and volume gain with complete privacy.',
    keywords:
      'audio editor, online audio editor, trim audio, cut mp3, wave editor, fade in audio, pitch speed editor, free audio tool',
    canonical: '/tools/audio-editor',
    ogImage: '/og-audio-editor.png',
  },
  'video-to-gif': {
    title:
      'Video to GIF Converter - Create High-Quality GIFs Under 10 Seconds | All Useful Tools',
    description:
      'Professional video to GIF converter. Optimized for short video clips under 10 seconds. High-quality output with custom framerate and scaling controls.',
    keywords:
      'video to GIF, convert video to GIF, short video converter, 10 second GIF, animated GIF maker, browser video processing',
    canonical: '/tools/video-to-gif',
    ogImage: '/og-video-to-gif.png',
  },
  'word-to-html': {
    title:
      'Word to HTML Converter - Clean Word Content for Web | All Useful Tools',
    description:
      'Professional Word to HTML converter. Remove messy inline styles, extra spans, and empty tags from Word content. Optimized for clean web publishing.',
    keywords:
      'Word to HTML, clean word content, remove word styles, word to clean html, docx to html, legacy content migration, web content cleaner',
    canonical: '/tools/word-to-html',
    ogImage: '/og-word-to-html.png',
  },
  'lesson-quiz-builder': {
    title:
      'Lesson Quiz Builder - Extract Quiz & Assessments from Documents | All Useful Tools',
    description:
      'Professional lesson quiz generator. Automatically extract questions, options, and correct answers from DOCX files using smart mapping for instant LMS & web deployment.',
    keywords:
      'quiz generator, lesson quiz builder, quiz extractor, docx to quiz, automated quiz creator, assessment generator, online education tools',
    canonical: '/tools/lesson-quiz-builder',
    ogImage: '/og-lesson-quiz-builder.png',
  },
  'youtube-downloader': {
    title:
      'Universal Social Video Downloader - Download YouTube, TikTok, IG, FB & Twitter Videos | All Useful Tools',
    description:
      'Download high-quality 4K, 1080p videos and 320kbps MP3 audio from YouTube, TikTok, Instagram Reels, Facebook, Twitter, Reddit, and Pinterest without watermarks. Fast, free, browser-based media downloader.',
    keywords:
      'universal video downloader, tiktok downloader no watermark, instagram reels downloader, youtube video downloader, facebook video downloader, twitter video downloader, mp4 video downloader, mp3 audio extractor',
    canonical: '/tools/youtube-downloader',
    ogImage: '/og-youtube-downloader.png',
  },
  'watermark-remover': {
    title:
      'AI Watermark & Object Remover - Free Online Watermark Eraser | All Useful Tools',
    description:
      'Remove watermarks, logos, dates, stamps, and objects from images online 100% free. AI content-aware inpainting with background removal capabilities.',
    keywords:
      'watermark remover, remove watermark from photo, ai watermark eraser, remove logo from image, free online watermark remover, object remover, remove bg free',
    canonical: '/tools/watermark-remover',
    ogImage: '/og-watermark-remover.png',
  },
  'bg-remover': {
    title:
      'AI Background Remover - Remove Image Background Online Free | All Useful Tools',
    description:
      'Extract subjects and create transparent PNG backgrounds instantly. Free browser-based AI background removal tool for photos and product images.',
    keywords:
      'background remover, remove bg online, free transparent background, ai bg eraser, photo background remover, png background maker',
    canonical: '/tools/bg-remover',
    ogImage: '/og-bg-remover.png',
  },
  'pdf-editor': {
    title:
      'Free Online PDF Editor - Add Pages, Edit Text, Images & Annotate PDFs | All Useful Tools',
    description:
      'Edit PDF documents 100% free online. Add new blank pages, edit or add text, insert images, freehand draw, add signatures, rubber stamps, whiteout text, undo/redo edits, and reorder pages without watermarks.',
    keywords:
      'free pdf editor, edit pdf online, add page to pdf, edit text in pdf, add image to pdf, pdf annotator, digital signature pdf, redact pdf, sejda pdf alternative, pdf24 alternative',
    canonical: '/tools/pdf-editor',
    ogImage: '/og-pdf-editor.png',
  },
  privacy: {
    title: 'Privacy Policy | All Useful Tools',
    description:
      'Privacy Policy for All Useful Tools - Learn how we collect, use, and protect your data in compliance with GDPR and privacy regulations.',
    keywords:
      'privacy policy, GDPR, data protection, cookie policy, user privacy',
    canonical: '/privacy',
  },
  terms: {
    title: 'Terms of Service | All Useful Tools',
    description:
      'Terms of Service for All Useful Tools - Read the terms and conditions for using our content generation and media processing tools.',
    keywords:
      'terms of service, terms and conditions, user agreement, legal terms',
    canonical: '/terms',
  },
  cookies: {
    title: 'Cookie Policy | All Useful Tools',
    description:
      'Cookie Policy for All Useful Tools - Learn about the cookies we use and how to manage your cookie preferences.',
    keywords:
      'cookie policy, cookies, tracking, advertising cookies, GDPR cookies',
    canonical: '/cookies',
  },
};

// Map tool IDs used in the app to URL slugs
export const toolIdToSlug = {
  'ai-course-creator': 'ai-course-creator',
  course: 'web-content',
  blog: 'blog-generator',
  glossary: 'glossary-generator',
  resources: 'resource-generator',
  'html-cleaner': 'html-cleaner',
  'image-converter': 'image-converter',
  'video-compressor': 'video-compressor',
  'ai-assistant': 'ai-assistant',
  'image-to-text': 'image-to-text',
  'document-extractor': 'document-extractor',
  'video-converter': 'video-converter',
  'audio-converter': 'audio-converter',
  'audio-editor': 'audio-editor',
  'video-to-gif': 'video-to-gif',
  'word-to-html': 'word-to-html',
  'lesson-quiz-builder': 'lesson-quiz-builder',
  'youtube-downloader': 'youtube-downloader',
  'watermark-remover': 'watermark-remover',
  'bg-remover': 'bg-remover',
  'pdf-editor': 'pdf-editor',
  'slide-generator': 'slide-generator',
};

// Reverse mapping
export const slugToToolId = Object.fromEntries(
  Object.entries(toolIdToSlug).map(([id, slug]) => [slug, id])
);

// Tool display information
export const toolInfo = {
  'slide-generator': {
    name: 'Slide Generator',
    icon: '📽️',
    description:
      'Dynamic presentation slide generator with live interactive preview, customizable points, and zero-comment clean HTML.',
    category: 'Course & Content Creation',
    detailedDescription:
      'The Slide Generator is an intuitive authoring tool designed to generate clean, responsive presentation slides for courses, webinars, and LMS modules. It natively supports Before vs With AI comparison cards with per-item animations and 4 to 5 configurable points, as well as Challenge & AI Solution slides.',
    benefits: [
      'Zero-Comment Clean HTML: Get pure, directly embeddable HTML without junk comments',
      'Dynamic 4 or 5 Points: Toggle points with 1-click and unique 5th icon animations',
      'Live Visual Preview: Hover and test transitions in real time',
      'Quick Bulk-Paste: Auto-distribute copied bullet lines directly into points',
    ],
    howToUse:
      '1. Choose Slide Type (Before vs With AI or Challenge & Help).\n2. Input or bulk-paste your points.\n3. Preview the animations live.\n4. Click Copy Code for pristine, zero-comment HTML.',
    useCases: [
      {
        title: 'LMS Course Slide Creation',
        description:
          'Quickly construct responsive comparison and solution slides.',
      },
      {
        title: 'Presentation & Pitch Decks',
        description:
          'Produce high-converting before/after feature value propositions.',
      },
    ],
  },
  'ai-course-creator': {
    name: 'AI Course Creator (PRO)',
    icon: '✨',
    description:
      'Enterprise-grade Multi-Agent AI Course Generator with 8K Photorealistic Canvas, Humanized Audio Narration, 15 Interactive Quiz Engines, and SCORM/LMS Export',
    category: 'Course & Curriculum Creation',
    detailedDescription:
      'The AI Course Creator is an enterprise-grade curriculum engineering and LMS production platform. Powered by collaborative multi-agent artificial intelligence (Curriculum Architect, Content Specialist, Assessment Evaluator, and Voice Synthesizer), it dynamically converts any occupational safety, compliance, or technical topic into full-scale, accredited instructional courses complete with structured modules, interactive canvas components, slide-by-slide 8K photorealistic imagery, natural Web Speech narration, formative practice quizzes, and accredited final certification exams.',
    benefits: [
      'Multi-Agent AI Engine: 3 collaborative agents draft curriculum, design component canvases, and formulate assessments',
      '8K Photorealistic Canvas & Watermark: Slide-by-slide high-resolution visual safety gear and worksite illustrations with custom branding',
      'Humanized Natural TTS Narration: Natural English speech engine with 0.3s breath pauses, phonetic dictionaries, and instant play/pause/scrubber controls',
      '15 Interactive Quiz Engines: Scenario-based questions, hazard spotter, drag & drop sequence, true/false, inspection checklist, and compulsory final exams',
      'OSHA 29 CFR & ANSI Benchmark Alignment: Pre-configured regulatory taxonomies and pedagogical benchmarks',
      'Instant LMS & SCORM Export: Download course bundles in SCORM 1.2 / 2004, JSON format, or printable compliance summaries',
    ],
    howToUse:
      '1. Enter Course Topic & Objectives: Provide your training topic (e.g. OSHA Fall Protection, Confined Space Entry) or upload reference materials.\n2. Configure Parameters: Select target audience, regulatory standards (OSHA 29 CFR, EPA, ANSI), and custom module/lesson depth.\n3. Launch Multi-Agent AI Engine: The collaborative agents generate structured modules, interactive canvas blocks, and quiz items.\n4. Human Quality Review & Track Changes: Review the AI-generated topics with our built-in human editor review panel to accept or refine text.\n5. Customize in Visual Studio: Drag-and-drop interactive accordions, 3D flip-cards, warning callouts, and upload custom watermarked images.\n6. Publish & Deploy: Export to your LMS, download SCORM bundles, or launch directly in the accredited full-screen student player.',
    useCases: [
      {
        title: 'Safety Training Automation',
        description:
          'Generate complete OSHA 10/30, HAZWOPER, and industrial compliance training modules in seconds with realistic visual aids.',
      },
      {
        title: 'Corporate Onboarding & SOP Standardization',
        description:
          'Create engaging onboarding programs with interactive quizzes and audio narration for distributed enterprise workforces.',
      },
      {
        title: 'Commercial LMS Course Authoring',
        description:
          'Rapidly build monetizable online training courses with custom certificates and verifiable seat time tracking.',
      },
      {
        title: 'Vocational & Technical Education',
        description:
          'Build hands-on procedural sequence walkthroughs and hazard recognition challenges for trade professionals.',
      },
    ],
    faq: [
      {
        question: 'Who has access to the AI Course Creator?',
        answer:
          'Access to the AI Course Creator is managed exclusively by Master Administrator Bilal Ghaffar and is granted to authorized Course Creators and PRO license holders.',
      },
      {
        question:
          'Can I export courses to standard Learning Management Systems (LMS)?',
        answer:
          'Yes! You can export complete course packages in SCORM 1.2, SCORM 2004, and standardized JSON format compatible with Moodle, Canvas, Blackboard, TalentLMS, and custom LMS platforms.',
      },
      {
        question: 'How does the Natural Voice Narration work?',
        answer:
          'The built-in CourseNarrator engine synthesizes crystal-clear speech row-by-row with synchronized closed captions, 0.3s sentence breath pacing, and seamless play/pause/seeking scrubber synchronization.',
      },
      {
        question: 'Does it support interactive widgets and visual components?',
        answer:
          'Yes! Courses support 12+ visual components including 3D Flip-Cards, Interactive Accordions, Multi-Step Workflows, Tabbed Data Panels, Comparison Matrices, and 15 Formative Quiz Engines.',
      },
    ],
  },
  'web-content': {
    name: 'Web Content Generator',
    icon: '📝',
    description: 'Extract course content from DOCX documents',
    category: 'Content Creation',
    detailedDescription:
      'Transform your boring DOCX course materials into engaging, structured web content. Our generator intelligently identifies module titles, learning objectives, and content blocks to create a professional online learning experience.',
    benefits: [
      'Automatic syllabus generation from document headings',
      'Extraction of learning objectives and module summaries',
      'Clean HTML output ready for any LMS or CMS',
      'Preservation of document structure and hierarchy',
    ],
    howToUse:
      'Upload your training DOCX file, select the modules you want to extract, and click generate. You can then copy the clean HTML or export it directly.',
    useCases: [
      {
        title: 'Documentation Migration',
        description:
          'Quickly migrate legacy document manuals into modern web-based platforms while preserving hierarchy.',
      },
      {
        title: 'Training & Onboarding',
        description:
          'Convert technical manuals and guides into structured onboarding checklists and syllabus modules.',
      },
    ],
    faq: [
      {
        question: 'Does it support nested lists and complex tables?',
        answer:
          'Yes, our engine is specifically tuned to recognize and preserve the complex structural hierarchies found in technical documentation.',
      },
      {
        question: 'Can I export to specific LMS formats?',
        answer:
          'The tool provides clean, semantic HTML5 which is the universal standard for modern Learning Management Systems like Adobe Learning Manager or Docebo.',
      },
    ],
  },
  'blog-generator': {
    name: 'Blog Generator',
    icon: '✍️',
    description: 'Create professional blog posts',
    category: 'Content Creation',
    detailedDescription:
      'Turn your technical documents or reports into localized, SEO-ready blog posts. This tool helps you maintain a consistent brand voice while repurposing existing content for your audience.',
    benefits: [
      'AI-enhanced readability and flow',
      'Automatic meta description generation',
      'Structured heading hierarchy (H1-H4)',
      'Direct copy-to-clipboard functionality',
    ],
    howToUse:
      'Paste your source text or upload a document, choose your target audience tone, and let the AI structure your blog post for maximum engagement.',
    useCases: [
      {
        title: 'Industrial News Aggregation',
        description:
          'Summarize complex regulatory updates into readable blog posts for your technical staff and industry peers.',
      },
      {
        title: 'Course Marketing',
        description:
          'Convert module internal descriptions into public-facing blog content to drive course registrations.',
      },
    ],
    faq: [
      {
        question: 'Does it support different writing styles?',
        answer:
          'Yes, you can choose between technical, educational, or corporate tones to match your specific organizational voice.',
      },
      {
        question: 'Is the content SEO optimized?',
        answer:
          'Absolutely. The engine generates proper heading hierarchies and meta descriptions to ensure maximum visibility.',
      },
    ],
  },
  'glossary-generator': {
    name: 'Glossary Generator',
    icon: '📚',
    description: 'Generate glossaries from documents',
    category: 'Content Creation',
    detailedDescription:
      'Consistency is key in technical training. Our glossary generator scans your documents for key terms and definitions, organizing them alphabetically and formatting them for easy reference.',
    benefits: [
      'Automated term extraction using NLP',
      'Alphabetical sorting and categorization',
      'Consistent formatting across all definitions',
      'Easy integration into course resources',
    ],
    howToUse:
      'Provide your training manual or technical document. The tool will identify key terms. Review the results and export as a clean, styled glossary.',
    useCases: [
      {
        title: 'Technical Manual Standardization',
        description:
          'Extract consistent terminology from complex engineering manuals to ensure all staff use the same technical language.',
      },
      {
        title: 'New Hire Orientation',
        description:
          'Generate quick-reference term sheets for trainees to help them master specialized industrial vocabulary.',
      },
    ],
    faq: [
      {
        question: 'Can I manually edit the extracted definitions?',
        answer:
          'Yes, the generator provides a verification interface where you can refine and polish definitions before final export.',
      },
      {
        question: 'How does it pick which terms to define?',
        answer:
          'The engine uses NLP to identify high-frequency technical nouns and specialized acronyms within your source document.',
      },
    ],
  },
  'resource-generator': {
    name: 'Resource Generator',
    icon: '🔗',
    description: 'Extract resources and references',
    category: 'Content Creation',
    detailedDescription:
      'Stop hunting for links and references in your PDFs and Word files. Our resource generator gathers every citation, external link, and reference into a structured list.',
    benefits: [
      'One-click extraction of all hyperlink data',
      'Categorization of reference types',
      'Clean link formatting for web menus',
      'Validation of extracted URLs',
    ],
    howToUse:
      'Input your source document. The tool will scan for references and external resources, providing a categorized list ready for your resource page.',
    useCases: [
      {
        title: 'Appendix Generation',
        description:
          'Automatically compile the "Further Reading" or "References" section for safety training manuals.',
      },
      {
        title: 'Hyperlink Validation',
        description:
          'Extract and audit all external links from your training PDFs to ensure they are current and functional.',
      },
    ],
    faq: [
      {
        question: 'Does it recognize all types of links?',
        answer:
          'It identifies standard web links, document cross-references, and even specialized bibliography markers.',
      },
      {
        question: 'Can I export to a clean HTML format?',
        answer:
          'Yes, the output is formatted as a semantic HTML list, ready to be dropped into any CMS or resource page.',
      },
    ],
  },
  'html-cleaner': {
    name: 'HTML Cleaner',
    icon: '🧹',
    description: 'Clean and format HTML code',
    category: 'Development Tools',
    detailedDescription:
      'Get rid of messy inline styles, empty tags, and bloated code from Microsoft Word exports. Our HTML cleaner provides lean, semantic code that loads faster and ranks better.',
    benefits: [
      'Removal of Microsoft Word specific junk tags',
      'Minification or beautification of code',
      'Conversion of complex styling to clean classes',
      'Validation of unclosed tags',
    ],
    howToUse:
      'Paste your messy HTML into the editor. Choose your cleaning preferences (remove styles, remove comments, etc.) and get instant clean code.',
    useCases: [
      {
        title: 'LMS Content Migration',
        description:
          'Sanitize bloated HTML from legacy course exports before importing into a modern high-performance LMS.',
      },
      {
        title: 'Email Template Optimization',
        description:
          'Clean up dirty HTML code to ensure better rendering and deliverability of technical safety alerts.',
      },
    ],
    faq: [
      {
        question: 'Will it mess up my document structure?',
        answer:
          'No. The cleaner is designed to strip presentation layers (CSS) while carefully preserving semantic hierarchy (H1, P, UL).',
      },
      {
        question: 'Does it remove Microsoft Word specific junk?',
        answer:
          'Specifically. It targets the "Mso" tags, extra spans, and inline XML that Microsoft Word auto-injects into exports.',
      },
    ],
  },
  'image-converter': {
    name: 'Image Converter',
    icon: '🖼️',
    description: 'Convert images between formats',
    category: 'Media Tools',
    detailedDescription:
      'Optimize your website performance by converting images to modern formats like WebP. Our batch converter handles multiple files at once, all within your browser for total privacy.',
    benefits: [
      'Blazing fast browser-side conversion',
      'Support for WebP, PNG, JPG, and AVIF',
      'Bulk processing for entire image sets',
      'Zero server uploads - 100% private',
    ],
    howToUse:
      'Drag and drop your images into the zone. Select your desired output format and quality. Download your optimized images individually or as a ZIP.',
    useCases: [
      {
        title: 'Mobile App Optimization',
        description:
          'Convert high-res equipment photos into lightweight WebP assets for faster loading in mobile field apps.',
      },
      {
        title: 'Digital PDF Compression',
        description:
          'Batch convert PNG screenshots into optimized JPGs to reduce the final file size of technical documentation PDFs.',
      },
    ],
    faq: [
      {
        question: 'Is there a limit on file size?',
        answer:
          'We support files up to 25MB for browser processing, ensuring smooth performance without straining your system.',
      },
      {
        question: 'Are my images uploaded to any server?',
        answer:
          'Never. All conversion happens 100% locally in your browser memory using specialized processing workers.',
      },
    ],
  },
  'video-compressor': {
    name: 'Video Compressor',
    icon: '🎬',
    description: 'Compress videos without quality loss',
    category: 'Media Tools',
    detailedDescription:
      'Large video files can slow down your LMS and eat up bandwidth. Our compressor reduces file size while maintaining visual clarity, ensuring smooth playback for all users.',
    benefits: [
      'Client-side FFmpeg processing',
      'Selectable target size or quality level',
      'Preview before and after file sizes',
      'Privacy guaranteed - video never leaves your PC',
    ],
    howToUse:
      'Upload your video file. Choose your compression settings based on your needs. Click compress and wait for the browser to process your file.',
    useCases: [
      {
        title: 'Safety Training Streaming',
        description:
          'Compress 4K safety demonstration videos for smooth streaming on low-bandwidth site networks.',
      },
      {
        title: 'Internal Knowledge Base',
        description:
          'Maximize storage efficiency on internal servers by compressing weekly safety briefing recordings.',
      },
    ],
    faq: [
      {
        question: 'Will I lose significant video quality?',
        answer:
          'The engine uses intelligent CRF (Constant Rate Factor) encoding to find the "sweet spot" between file size and visual clarity.',
      },
      {
        question: 'How long does compression take?',
        answer:
          'Processing time depends on your CPU and video length; typically, a 5-minute HD clip finishes in under 2 minutes.',
      },
    ],
  },
  'ai-assistant': {
    name: 'AI Hub',
    icon: '✨',
    description:
      'Se7eN AI & Kimi Code Enhancer with live web scraping & JSON/XML export',
    category: 'AI Tools',
    detailedDescription:
      'AI Hub integrates Se7eN AI and Kimi Code Enhancer. Extract live web data from URLs into structured JSON or XML, analyze uploaded images and documents, generate free HD AI images, and convert raw text into 100% accurate responsive HTML cards.',
    benefits: [
      'Live web scraping & URL data extraction to JSON and XML',
      'Multi-modal image, PDF, DOCX, and Excel data extraction',
      'Free high-definition AI image generation',
      'Kimi Code Enhancer for responsive HTML cards & layouts',
    ],
    howToUse:
      'Select Se7eN AI Pro or Kimi Code Enhancer. Paste any web URL, upload documents/images, or prompt for code and image generation with instant JSON, XML, or CSV export.',
    useCases: [
      {
        title: 'Technical Summarization',
        description:
          'Condense long regulatory documents into executive summaries for rapid internal distribution.',
      },
      {
        title: 'Content Refinement',
        description:
          'Improve the clarity and impact of safety warnings and procedural instructions for industrial manuals.',
      },
    ],
    faq: [
      {
        question: 'Which model does the AI use?',
        answer:
          'The assistant is powered by high-performance neural clusters optimized for technical and scientific linguistics.',
      },
      {
        question: 'Can it help with technical writing?',
        answer:
          'Yes, it can suggest improvements for passive voice, technical terminology, and semantic structure.',
      },
    ],
  },
  'image-to-text': {
    name: 'Image to Text OCR',
    icon: '📷',
    description: 'Extract text from images',
    category: 'AI Tools',
    detailedDescription:
      'Convert scanned diagrams, whiteboard notes, or document photos into editable text. Our OCR engine supports multiple languages and maintains relative text positioning.',
    benefits: [
      'High accuracy Tesseract OCR engine',
      'Handwriting recognition capabilities',
      'Multi-language support',
      'Export results as TXT or DOCX',
    ],
    howToUse:
      'Upload or paste an image containing text. The OCR engine will process it and display the extracted text for you to edit and copy.',
    useCases: [
      {
        title: 'Legacy Archive Digitization',
        description:
          'Convert scanned paper safety logs and handwritten incident reports into searchable digital databases.',
      },
      {
        title: 'Diagram Label Extraction',
        description:
          'Extract technical labels and data from engineering diagrams and flowcharts for documentation updates.',
      },
    ],
    faq: [
      {
        question: 'Does it support multiple languages?',
        answer:
          'Yes, the OCR engine is trained to recognize technical characters in over 50 global languages.',
      },
      {
        question: 'Can it read messy handwriting?',
        answer:
          'It has specialized neural layers for handwriting recognition, though results vary based on image clarity.',
      },
    ],
  },
  'document-extractor': {
    name: 'Document Extractor',
    icon: '📄',
    description: 'Extract content from documents',
    category: 'Content Creation',
    detailedDescription:
      'The ultimate tool for bulk content extraction. Analyze complex DOCX structures and pull out tables, lists, and images with precision. Whether you are migrating content between platforms or auditing legacy training documents, the Document Extractor automates what would otherwise take hours of manual copy-paste work.',
    benefits: [
      'Precise table and list extraction',
      'Image and media asset gathering',
      'Metadata extraction from document properties',
      'Support for legacy DOCX formatting',
    ],
    howToUse:
      'Submit your DOCX document. Use the extraction dashboard to filter for specific elements like tables or images, and export them as needed.',
    useCases: [
      {
        title: 'Content Audit',
        description:
          'Bulk extract all table data from 100+ safety manuals to verify compliance metrics across a fleet.',
      },
      {
        title: 'Media Asset Harvesting',
        description:
          'Gather all embedded images and diagrams from technical manuals for use in new digital training modules.',
      },
    ],
    faq: [
      {
        question: 'Can I extract images separately?',
        answer:
          'Yes, the extraction interface allows you to toggle between text, tables, and media assets during the intake process.',
      },
      {
        question: 'Does it handle legacy Word formats?',
        answer:
          'It is optimized for modern DOCX but has fallback mapping for older document structures.',
      },
    ],
  },
  'video-converter': {
    name: 'Video Converter',
    icon: '🎞️',
    description: 'Convert videos between formats',
    category: 'Media Tools',
    detailedDescription:
      'Need to convert a video from one format to another? Our browser-based Video Converter handles the heavy lifting using FFmpeg WebAssembly technology. Convert between MP4, WebM, MOV, AVI, and even animated GIF — all without uploading your files to any server. Your videos stay on your device the entire time, ensuring complete privacy and zero bandwidth costs.',
    benefits: [
      'Browser-based FFmpeg conversion — no uploads needed',
      'Support for MP4, WebM, MOV, AVI, and GIF output',
      'Adjustable quality presets for file size control',
      'Batch processing for multiple videos at once',
    ],
    howToUse:
      'Drag and drop your video files into the converter. Choose your desired output format and quality level. Click convert and download your re-encoded videos instantly from your browser.',
    useCases: [
      {
        title: 'Cross-Platform Compatibility',
        description:
          'Convert proprietary industrial video formats into universal MP4 files for playback on any device.',
      },
      {
        title: 'Social Safety Campaigns',
        description:
          'Convert long safety demonstrations into short, high-quality GIFs for internal social feeds.',
      },
    ],
    faq: [
      {
        question: 'What is the maximum resolution supported?',
        answer:
          'We support scaling and conversion up to 4K resolution, depending on your local hardware acceleration.',
      },
      {
        question: 'Does it support HEVC/H.265?',
        answer:
          'Yes, our browser engine includes modern codec support for high-efficiency video encoding.',
      },
    ],
  },
  'audio-converter': {
    name: 'Audio Converter',
    icon: '🎵',
    description: 'Convert between audio formats',
    category: 'Media Tools',
    detailedDescription:
      'The Audio Converter is a high-performance utility designed for creators and professionals who need to re-encode audio assets for web delivery. Whether you are converting voice recordings from WAV to compact MP3 or preparing OGG files for specialized players, our tool ensures acoustic integrity. Powered by FFmpeg WebAssembly, all processing happens locally in your browser, ensuring that your proprietary audio content never leaves your device.',
    benefits: [
      'High-fidelity re-encoding (MP3, WAV, AAC, OGG)',
      'Adjustable bitrate settings for file size control',
      'Batch processing for multiple audio files',
      'Zero-upload, 100% private browser-based conversion',
    ],
    howToUse:
      'Upload your audio files. Select the target format (like MP3 or WAV) and choose a bitrate preset. Click Convert to process your files and download the results immediately.',
    useCases: [
      {
        title: 'Podcast & Voiceover Distribution',
        description:
          'Convert high-fidelity interview recordings into optimized MP3s for web and platform distribution.',
      },
      {
        title: 'Audio Alert & Web Integration',
        description:
          'Convert WAV recordings of alert notifications into compact OGG or AAC files for use in web applications.',
      },
    ],
    faq: [
      {
        question: 'Can I adjust the audio quality?',
        answer:
          'Yes, you can choose from various bitrate presets ranging from 64kbps up to 320kbps for crystal-clear audio.',
      },
      {
        question: 'Does it support batch conversion?',
        answer:
          'Absolutely. You can drop multiple audio files at once and they will be processed in a high-priority queue.',
      },
    ],
  },
  'audio-editor': {
    name: 'Audio Editor',
    icon: '🎛️',
    description: 'Edit, trim & apply filters to audio',
    category: 'Media Tools',
    detailedDescription:
      'A professional browser-based audio waveform editor inspired by Audiomass. Load any audio file to visualize its waveform, select regions with your cursor, trim, amplify volume, change playback speed, add fade in/out effects, and reverse audio. All processing is powered by FFmpeg WebAssembly for high-fidelity output without any server uploads.',
    benefits: [
      'Interactive visual waveform workspace with drag-to-select',
      'Lossless trimming and selection-based cropping',
      'Speed, gain, fade, and reverse audio processors',
      'Export to MP3 or WAV with full undo history',
    ],
    howToUse:
      'Upload an audio file to see its waveform. Drag on the canvas to select a region. Use the sidebar controls to adjust volume, speed, fades, or reverse. Click Trim to crop or Apply Filters to process. Download your edited audio.',
    useCases: [
      {
        title: 'Voiceover & Narration Editing',
        description:
          'Trim silence, amplify low speaker volumes, and add smooth fades to voice narration clips.',
      },
      {
        title: 'Sound Effect & Sample Isolation',
        description:
          'Isolate specific sounds or audio segments from long field recordings for video or game projects.',
      },
    ],
    faq: [
      {
        question: 'Are my audio files uploaded to a server?',
        answer:
          'No. All processing happens locally in your browser via WebAssembly. Your media never leaves your device.',
      },
      {
        question: 'What export formats are supported?',
        answer: 'You can export edited audio as MP3 or WAV (lossless) format.',
      },
    ],
  },
  'video-to-gif': {
    name: 'Video to GIF',
    icon: '🎞️',
    description: 'Create high-quality training GIFs',
    category: 'Media Tools',
    detailedDescription:
      'The Video to GIF converter is specifically optimized for creating short, high-performance demonstrations for websites, documentation, and tutorials. Designed for clips under 10 seconds, it uses advanced Lanczos scaling and palette generation to ensure that your GIFs are crisp and professional. By converting demonstration videos into lightweight GIFs, you can improve engagement without the overhead of heavy video players.',
    benefits: [
      'Optimized for 10-second high-fidelity clips',
      'Advanced palette generation for vibrant color accuracy',
      'Customizable scaling and framerate for web compatibility',
      'Privacy-first local processing via FFmpeg WASM',
    ],
    howToUse:
      'Select a short video clip (recommend under 10 seconds). Configure your output dimensions and framerate. The tool will generate a high-quality animated GIF instantly for your documentation or social media.',
    useCases: [
      {
        title: 'Product Walkthroughs & SOPs',
        description:
          'Create looping visual demonstrations of repetitive digital or physical tasks for documentation.',
      },
      {
        title: 'Email Newsletter Engagement',
        description:
          'Embed lightweight animated clip highlights in email communications for higher engagement.',
      },
    ],
    faq: [
      {
        question: 'Why just 10 seconds?',
        answer:
          'GIFs over 10 seconds become extremely large; we optimize for short, high-fidelity loops that maintain web performance.',
      },
      {
        question: 'Can I control the dimensions?',
        answer:
          'Yes, you can scale the output to fit your specific documentation layout (e.g., sidebars or full-width sections).',
      },
    ],
  },
  'word-to-html': {
    name: 'Word to HTML',
    icon: '📝',
    description: 'Clean conversion of Word content',
    category: 'Content Creation',
    detailedDescription:
      'The Word to HTML converter is an essential utility for technical writers and content managers who need to migrate content from Microsoft Word into web-based platforms. Word exports are notoriously bloated with non-standard XML tags and thousands of lines of inline styles. This tool strips away the mess, allowing you to selectively remove empty tags, attributes, and extra spans while maintaining the structural integrity of your text.',
    benefits: [
      'Strips messy Microsoft Word XML and inline styling',
      'One-click removal of empty tags and extra spans',
      'Live preview of cleaned HTML output',
      'Supports batch cleaning of large document segments',
    ],
    howToUse:
      'Paste your content directly from a Word document or upload a .docx file. Use the cleaning filters on the right to toggle specific removals. Copy the sanitized, lightweight HTML ready for your CMS.',
    useCases: [
      {
        title: 'Corporate Wiki Migration',
        description:
          'Migrate thousands of Word-based technical articles into a clean, searchable internal wiki ecosystem.',
      },
      {
        title: 'Clean Web Publishing',
        description:
          'Sanitize marketing copy written in Word before publishing to ensure no layout-breaking code is imported.',
      },
    ],
    faq: [
      {
        question: 'Does it strip all formatting?',
        answer:
          'It strips non-standard styling while maintaining core semantics like bold, italics, lists, and headings.',
      },
      {
        question: 'Can I remove specific attributes like "style"?',
        answer:
          'Yes, the cleaning panel allows you to toggle the removal of inline styles, classes, and IDs individually.',
      },
    ],
  },
  'lesson-quiz-builder': {
    name: 'Lesson Quiz Builder',
    icon: '🎯',
    description: 'Generate lesson quizzes from documents',
    category: 'Content Creation',
    detailedDescription:
      'The Lesson Quiz Builder is a specialized extraction unit engineered for educators and course creators. It utilizes advanced mapping protocols to scan your DOCX documents for "Lesson Quiz" sections, automatically identifying questions, distractor options, and correct answer markers. By automating the high-friction task of manual quiz transcription, it ensures that your assessments maintain 100% fidelity to the source material while being ready for instant deployment to your digital ecosystem.',
    benefits: [
      'Automatic detection of specialized Lesson Quiz nomenclature',
      'Neural mapping of questions to their respective options (A-D)',
      'High-precision identification of correct answer markers',
      'Removal of legacy formatting for clean web-ready output',
      'Reduced transcription errors in high-stakes testing',
      'Direct copy-to-clipboard functionality for rapid deployment',
    ],
    howToUse:
      '1. Prepare your training DOCX ensuring the quiz section is clearly marked. 2. Upload the document to the Lesson Quiz Builder terminal. 3. The engine will parse the content and display the identified questions. 4. Review the correct answer highlights and click "Generate HTML" to receive your clean, styled assessment code.',
    useCases: [
      {
        title: 'Course Certification & Quizzes',
        description:
          'Quickly generate structured quizzes for digital courses, certifications, and educational modules.',
      },
      {
        title: 'Knowledge Verification',
        description:
          'Automate the creation of post-module knowledge checks for complex training courses.',
      },
    ],
    faq: [
      {
        question:
          'Which markers does the engine recognize for correct answers?',
        answer:
          'The engine is tuned to identify bold text, highlighted backgrounds, or bracketed indicators as correct answer markers within the source DOCX.',
      },
      {
        question: 'Can it handle multiple-choice and true/false questions?',
        answer:
          'Absolutely. The mapping logic is robust enough to categorize various question types commonly used in education.',
      },
    ],
  },
  'youtube-downloader': {
    name: 'Universal Social Video Downloader',
    icon: '🌐',
    description:
      'Download videos & MP3 audio from YouTube, TikTok, Instagram, FB & Twitter',
    category: 'Media Processing',
    detailedDescription:
      'High-performance universal social video and audio extractor. Download 4K, 1080p MP4 videos or 320kbps MP3 audio files from YouTube, TikTok, Instagram Reels, Facebook, Twitter, Reddit, and Pinterest with zero watermarks.',
    benefits: [
      'Extract 4K, 2K, 1080p, 720p MP4 videos across all social platforms',
      'Download high-fidelity 320kbps MP3 audio tracks',
      'Watermark-free downloads for TikTok, Instagram Reels, and Shorts',
      'Instant video info, thumbnail, and creator metadata parsing',
      '100% free and unlimited conversions',
    ],
    howToUse:
      'Paste your video link from YouTube, TikTok, Instagram, Facebook, Twitter, Reddit, or Pinterest into the search box, click Fetch Video, then select your preferred Video or Audio format to download.',
    useCases: [
      {
        title: 'Offline Video Presentations',
        description:
          'Download instructional videos and demonstrations for offline review and field presentations.',
      },
      {
        title: 'Audio Training Extraction',
        description:
          'Convert instructional YouTube video lectures into MP3 podcasts for mobile listening.',
      },
    ],
    faq: [
      {
        question: 'Are there any watermarks added to downloaded files?',
        answer:
          'No! All downloads are 100% clean and free of watermarks or modifications.',
      },
      {
        question: 'Is it completely free to use?',
        answer:
          'Yes, our YouTube downloader is 100% free without download caps or subscription requirements.',
      },
    ],
  },
  'watermark-remover': {
    name: 'AI Watermark & Object Remover',
    icon: '🪄',
    description:
      'Erase watermarks, logos, dates, and unwanted text from photos',
    category: 'Media Processing',
    detailedDescription:
      'Intelligent AI-powered watermark and object removal tool. Paint over watermarks, timestamps, logos, or unwanted objects on your images and erase them seamlessly using content-aware inpainting.',
    benefits: [
      'Interactive brush tool to highlight watermarks easily',
      'Smart content-aware inpainting for seamless background reconstruction',
      'Erase logos, dates, text overlays, and photo stamps',
      'Full resolution download without quality loss',
      'Client-side canvas processing for complete data privacy',
    ],
    howToUse:
      'Upload your image, adjust the brush size slider, paint over the watermark or logo you want to remove, and click "Erase Watermark" to download your clean image.',
    useCases: [
      {
        title: 'Document & Photo Cleaning',
        description:
          'Clean sample images, watermarked stock graphics, and stamped technical diagrams for presentations.',
      },
      {
        title: 'Product Image Touchups',
        description:
          'Remove unwanted date stamps or copyright watermarks from product photos.',
      },
    ],
    faq: [
      {
        question: 'Does the tool blur or damage the original image?',
        answer:
          'No, our content-aware inpainting algorithm samples adjacent pixels to intelligently rebuild texture while preserving sharpness.',
      },
      {
        question: 'Are my uploaded images kept private?',
        answer:
          'Yes, processing happens locally in your browser canvas so your images never leave your computer.',
      },
    ],
  },
  'bg-remover': {
    name: 'AI Background Remover',
    icon: '✂️',
    description: 'Remove background from photos and create transparent PNGs',
    category: 'Media Processing',
    detailedDescription:
      'Instant browser-based AI background remover. Automatically key out image backgrounds to generate clean transparent PNGs for web publishing and product cataloging.',
    benefits: [
      'Automated background removal for images',
      'High-precision subject edge preservation',
      'Instant transparent PNG export',
      '100% free and private browser processing',
    ],
    howToUse:
      'Upload your photo, click "Remove Background", and download your high-resolution transparent PNG file.',
    useCases: [
      {
        title: 'E-commerce & Product Catalogs',
        description:
          'Extract product items onto clean transparent backgrounds for online stores and digital catalogs.',
      },
    ],
    faq: [
      {
        question: 'What file format is saved?',
        answer:
          'Clean transparent background images are saved as high-quality PNG files.',
      },
    ],
  },
  'pdf-editor': {
    name: 'Free PDF Editor',
    icon: '📄',
    description:
      'Edit PDFs online: add pages, insert images, edit text, draw, and sign',
    category: 'Document Tools',
    detailedDescription:
      'Full-featured client-side PDF Editor. Edit text, add new blank pages, insert images, draw annotations, whiteout/redact content, place digital signatures and official rubber stamps, reorder pages, and export crisp PDFs with full undo/redo support.',
    benefits: [
      'Insert new pages anywhere with custom page sizes (Letter, A4, Legal)',
      'Add & edit text with custom font families, colors, and styling',
      'Upload images, logos, and signatures with drag-and-drop',
      'Whiteout & blackout redact sensitive document content',
      'Freehand drawing pen & highlighter tools',
      'Preset official rubber stamps (Approved, Confidential, Draft, etc.)',
      'Reorder, duplicate, rotate, and delete pages visually',
      'Full Undo / Redo history stack',
    ],
    howToUse:
      'Upload an existing PDF or click "New Blank", select tools from the top bar to add text, images, drawings, or stamps, manage pages from the sidebar, and click "Download PDF" to save.',
    useCases: [
      {
        title: 'Contract & Form Signing',
        description:
          'Draw or type your signature and place date stamps directly onto PDF forms and contracts.',
      },
      {
        title: 'Document Redaction & Correction',
        description:
          'Whiteout old text and overlay updated text, logos, or callouts onto PDF files.',
      },
      {
        title: 'PDF Page Assembly',
        description:
          'Insert blank pages, reorder pages, rotate upside-down scans, or remove unnecessary pages.',
      },
    ],
    faq: [
      {
        question: 'Is it completely free to edit and download PDFs?',
        answer:
          'Yes! Our PDF Editor is 100% free with no page limits, no caps, and no forced watermarks.',
      },
      {
        question: 'Are my uploaded PDF files safe and private?',
        answer:
          'Yes, all processing happens locally inside your browser using WebAssembly and HTML5 canvas. Your documents are never uploaded to any remote server.',
      },
    ],
  },
};

// Get all tool slugs for sitemap generation
export const getAllToolSlugs = () => Object.keys(toolMetadata);

// Technical & Regulatory Standards References for Tools
export const toolReferences = {
  'ai-course-creator': [
    {
      title: 'ADL SCORM 1.2 & 2004 Conformance Guidelines',
      url: 'https://adlnet.gov/projects/scorm/',
      organization: 'Advanced Distributed Learning (ADL) Initiative',
    },
    {
      title: 'IEEE 1484.12.1 Standard for Learning Object Metadata',
      url: 'https://standards.ieee.org/ieee/1484.12.1/3342/',
      organization: 'IEEE Standards Association',
    },
    {
      title: 'W3C Web Speech API Specification',
      url: 'https://www.w3.org/TR/speech-api/',
      organization: 'World Wide Web Consortium (W3C)',
    },
  ],
  'web-content': [
    {
      title: 'ECMA-376 Office Open XML File Formats',
      url: 'https://www.ecma-international.org/publications-and-standards/standards/ecma-376/',
      organization: 'Ecma International',
    },
    {
      title: 'W3C HTML5 Semantic Elements Specification',
      url: 'https://www.w3.org/TR/html52/semantics.html',
      organization: 'World Wide Web Consortium (W3C)',
    },
    {
      title: 'Web Content Accessibility Guidelines (WCAG) 2.1',
      url: 'https://www.w3.org/TR/WCAG21/',
      organization: 'W3C Web Accessibility Initiative (WAI)',
    },
  ],
  'blog-generator': [
    {
      title: 'Google Search Central: SEO Starter Guide',
      url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
      organization: 'Google Search Central',
    },
    {
      title: 'Readability Metrics & Psycholinguistic Text Analysis',
      url: 'https://www.w3.org/WAI/GL/low-vision-a11y-tf/wiki/Understanding_Readability',
      organization: 'W3C Accessibility Working Group',
    },
  ],
  'glossary-generator': [
    {
      title: 'ISO 704:2009 Terminology Work — Principles and Methods',
      url: 'https://www.iso.org/standard/38109.html',
      organization: 'International Organization for Standardization (ISO)',
    },
    {
      title: 'W3C HTML Description List (<dl>, <dt>, <dd>) Standard',
      url: 'https://html.spec.whatwg.org/multipage/grouping-content.html#the-dl-element',
      organization: 'WHATWG',
    },
  ],
  'resource-generator': [
    {
      title: 'RFC 3986: Uniform Resource Identifier (URI) Generic Syntax',
      url: 'https://www.rfc-editor.org/rfc/rfc3986',
      organization: 'Internet Engineering Task Force (IETF)',
    },
    {
      title: 'Dublin Core Metadata Element Set, Version 1.1',
      url: 'https://www.dublincore.org/specifications/dublin-core/dces/',
      organization: 'Dublin Core Metadata Initiative',
    },
  ],
  'html-cleaner': [
    {
      title: 'WHATWG HTML Living Standard: HTML Sanitization & Parsing',
      url: 'https://html.spec.whatwg.org/multipage/parsing.html',
      organization: 'WHATWG',
    },
    {
      title: 'W3C Markup Validation Service Technical Notes',
      url: 'https://validator.w3.org/docs/',
      organization: 'World Wide Web Consortium (W3C)',
    },
  ],
  'image-converter': [
    {
      title: 'W3C HTML Canvas 2D Context Specification',
      url: 'https://www.w3.org/TR/2dcontext/',
      organization: 'World Wide Web Consortium (W3C)',
    },
    {
      title: 'WebP Image Format Specification',
      url: 'https://developers.google.com/speed/webp/docs/compression',
      organization: 'Google Developers',
    },
    {
      title: 'AV1 Image File Format (AVIF) Specification',
      url: 'https://aomediacodec.github.io/av1-avif/',
      organization: 'Alliance for Open Media (AOMedia)',
    },
  ],
  'video-compressor': [
    {
      title: 'FFmpeg Documentation and Video Codec Specifications',
      url: 'https://ffmpeg.org/documentation.html',
      organization: 'FFmpeg Project',
    },
    {
      title: 'ISO/IEC 14496-10: Advanced Video Coding (H.264 / AVC)',
      url: 'https://www.iso.org/standard/66069.html',
      organization: 'International Organization for Standardization (ISO)',
    },
  ],
  'ai-assistant': [
    {
      title: 'W3C CSS Backgrounds and Borders Module Level 3',
      url: 'https://www.w3.org/TR/css-backgrounds-3/',
      organization: 'World Wide Web Consortium (W3C)',
    },
    {
      title: 'Attention Is All You Need (Transformer Architecture)',
      url: 'https://arxiv.org/abs/1706.03762',
      organization: 'Cornell University arXiv',
    },
  ],
  'image-to-text': [
    {
      title: 'Tesseract OCR Engine Architecture & Character Recognition',
      url: 'https://github.com/tesseract-ocr/tesseract',
      organization: 'Open Source Community / Ray Smith',
    },
    {
      title:
        'ITU-T T.4 / T.6 Recommendations for Document Facsimile Image Encoding',
      url: 'https://www.itu.int/rec/T-REC-T.4/en',
      organization: 'International Telecommunication Union',
    },
  ],
  'document-extractor': [
    {
      title: 'ISO/IEC 29500-1:2016 Office Open XML File Formats',
      url: 'https://www.iso.org/standard/71691.html',
      organization: 'ISO/IEC JTC 1/SC 34',
    },
    {
      title: 'PKWARE .ZIP File Format Specification',
      url: 'https://support.pkware.com/home/pkzip/developer-tools/appnote',
      organization: 'PKWARE Inc.',
    },
  ],
  'video-converter': [
    {
      title: 'Matroska Media Container Specifications (MKV & WebM)',
      url: 'https://www.matroska.org/technical/specs.html',
      organization: 'Matroska Project',
    },
    {
      title: 'WebAssembly Core Specification',
      url: 'https://www.w3.org/TR/wasm-core-1/',
      organization: 'World Wide Web Consortium (W3C)',
    },
  ],
  'audio-converter': [
    {
      title: 'W3C Web Audio API Recommendation',
      url: 'https://www.w3.org/TR/webaudio/',
      organization: 'World Wide Web Consortium (W3C)',
    },
    {
      title: 'Xiph.Org FLAC (Free Lossless Audio Codec) Format',
      url: 'https://xiph.org/flac/format.html',
      organization: 'Xiph.Org Foundation',
    },
  ],
  'audio-editor': [
    {
      title: 'W3C AudioContext & AudioBufferSourceNode Architecture',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode',
      organization: 'MDN Web Docs / W3C',
    },
    {
      title: 'IEC 60268 Sound System Equipment Standards',
      url: 'https://www.iec.ch/',
      organization: 'International Electrotechnical Commission',
    },
  ],
  'video-to-gif': [
    {
      title: 'Graphics Interchange Format (GIF89a) Specification',
      url: 'https://www.w3.org/Graphics/GIF/spec-gif89a.txt',
      organization: 'CompuServe Incorporated / W3C',
    },
    {
      title:
        'Lanczos Resampling and Sinc Filtering in Discrete Signal Processing',
      url: 'https://en.wikipedia.org/wiki/Lanczos_resampling',
      organization: 'IEEE Signal Processing Society',
    },
  ],
  'word-to-html': [
    {
      title: 'Microsoft Office Open XML Document Schema Documentation',
      url: 'https://learn.microsoft.com/en-us/office/open-xml/word/overview-of-wordprocessingml',
      organization: 'Microsoft Learn',
    },
    {
      title: 'W3C XHTML & Semantic Markup Guidelines',
      url: 'https://www.w3.org/TR/xhtml1/',
      organization: 'World Wide Web Consortium (W3C)',
    },
  ],
  'lesson-quiz-builder': [
    {
      title: 'IMS Global QTI (Question & Test Interoperability) 2.1 Standard',
      url: 'https://www.imsglobal.org/question/index.html',
      organization: '1EdTech Consortium',
    },
    {
      title: 'Moodle Aiken Format Specification',
      url: 'https://docs.moodle.org/en/Aiken_format',
      organization: 'Moodle Docs',
    },
  ],
  'youtube-downloader': [
    {
      title:
        'RFC 7230: Hypertext Transfer Protocol (HTTP/1.1): Message Syntax & Routing',
      url: 'https://www.rfc-editor.org/rfc/rfc7230',
      organization: 'Internet Engineering Task Force (IETF)',
    },
    {
      title: 'W3C Media Source Extensions (MSE) Recommendation',
      url: 'https://www.w3.org/TR/media-source/',
      organization: 'World Wide Web Consortium (W3C)',
    },
  ],
  'watermark-remover': [
    {
      title: 'Image Inpainting via Navier-Stokes and Fast Marching Methods',
      url: 'https://en.wikipedia.org/wiki/Inpainting',
      organization: 'Computer Vision & Mathematical Imaging',
    },
    {
      title: 'HTML Canvas Pixel Manipulation with ImageData',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas',
      organization: 'MDN Web Docs',
    },
  ],
  'bg-remover': [
    {
      title:
        'Salient Object Detection and Semantic Segmentation via Deep Learning',
      url: 'https://arxiv.org/abs/2005.09007',
      organization: 'arXiv Computer Vision Foundation',
    },
    {
      title: 'WebAssembly SIMD & Multithreading Capabilities',
      url: 'https://v8.dev/features/simd',
      organization: 'Google V8 Project',
    },
  ],
  'pdf-editor': [
    {
      title: 'ISO 32000-1:2008 Document Management — Portable Document Format',
      url: 'https://www.iso.org/standard/51502.html',
      organization: 'International Organization for Standardization (ISO)',
    },
    {
      title: 'Adobe PostScript & PDF Reference Manual (6th Edition)',
      url: 'https://opensource.adobe.com/',
      organization: 'Adobe Systems Incorporated',
    },
    {
      title: 'PDF.js Mozilla Open Source PDF Rendering Engine',
      url: 'https://mozilla.github.io/pdf.js/',
      organization: 'Mozilla Foundation',
    },
  ],
};

// Structured data for organization
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_CONFIG.name,
  description: SITE_CONFIG.description,
  url: getSiteUrl(),
  logo: 'https://gyglsbmpxopaoeljoofp.supabase.co/storage/v1/object/public/media/library/1779796669800-Hi.gif',
  contactPoint: {
    '@type': 'ContactPoint',
    email: SITE_CONFIG.contactEmail,
    contactType: 'customer support',
  },
};

// Generate WebSite Schema with SearchAction
export function generateWebSiteSchema() {
  const baseUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: baseUrl,
    description: SITE_CONFIG.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/tools?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

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
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web Browser',
    url: getCanonicalUrl(`/tools/${toolSlug}`),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

// Generate breadcrumb schema
export function generateBreadcrumbSchema(toolSlug) {
  const info = toolInfo[toolSlug];
  if (!info) return null;

  const baseUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Tools',
        item: `${baseUrl}/tools`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: info.name,
        item: getCanonicalUrl(`/tools/${toolSlug}`),
      },
    ],
  };
}

// Generate FAQ structured data for a specific tool
export function generateFAQSchema(faqList = []) {
  if (!faqList || faqList.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqList.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

// Reusable Next.js Page Metadata Helper (PRD Section 58)
export function createPageMetadata({
  title,
  description,
  path = '',
  image,
  keywords,
  noindex = false,
}) {
  const canonicalUrl = getCanonicalUrl(path);
  const siteUrl = getSiteUrl();
  const pageTitle = title.includes(SITE_CONFIG.name)
    ? title
    : `${title} | ${SITE_CONFIG.name}`;
  const ogImageUrl = image
    ? image.startsWith('http')
      ? image
      : `${siteUrl}${image.startsWith('/') ? image : `/${image}`}`
    : `${siteUrl}${SITE_CONFIG.defaultOgImage}`;

  return {
    title: pageTitle,
    description: description || SITE_CONFIG.description,
    keywords: keywords || undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: description || SITE_CONFIG.description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      type: 'website',
      images: [{ url: ogImageUrl }],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: description || SITE_CONFIG.description,
      images: [ogImageUrl],
    },
    robots: noindex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}
