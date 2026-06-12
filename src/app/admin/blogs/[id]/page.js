'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Globe,
  FileText,
  Layout,
  User,
  Clock,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Bot,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { showToast, showSuccess } from '@/lib/swal';
import { cn } from '@/lib/utils';
import { recordMediaUpload } from '@/lib/media-hub';
import { convertImage } from '@/lib/image-converter';
import { markdownToHtml } from '@/lib/html-converter';

export default function AdminBlogEditPage() {
  const params = useParams();
  const id = params.id;
  const isNew = id === 'new';
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [puterReady, setPuterReady] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Productivity',
    read_time: '1 min read',
    author: 'Content Suite Team',
    date: new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    description: '',
    content: '',
    image_url: '',
  });

  useEffect(() => {
    async function fetchBlog() {
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          setFormData(data);
          setOriginalImageUrl(data.image_url);
        }
      } catch (err) {
        showToast('Failed to retrieve editorial data.', 'error');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    async function init() {
      // Load Puter SDK
      if (typeof window !== 'undefined' && !window.puter) {
        const script = document.createElement('script');
        script.src = 'https://js.puter.com/v2/';
        script.async = true;
        script.onload = () => setPuterReady(true);
        document.head.appendChild(script);
      } else if (window.puter) {
        setPuterReady(true);
      }

      if (!isNew) {
        await fetchBlog();
      } else {
        // Auto-detect author from session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setFormData((prev) => ({
              ...prev,
              author: `${profile.full_name} (${profile.role === 'admin' ? 'Architect' : profile.role})`,
            }));
          }
        }
      }
    }
    init();
  }, [id, isNew]);

  // Auto-Read Time Calculation
  useEffect(() => {
    const words = formData.content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200); // 200 wpm average
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData((prev) => ({ ...prev, read_time: `${minutes} min read` }));
  }, [formData.content]);

  const titleToSlug = (title) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: titleToSlug(val),
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `blog-media/${fileName}`;

      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (error) {
        if (error.message.includes('Bucket not found')) {
          throw new Error(
            "Neural Storage Error: Please create a 'media' bucket in Supabase Storage with public access."
          );
        }
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('media').getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image_url: publicUrl }));

      // Track in Media Hub
      recordMediaUpload({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        previewUrl: publicUrl,
        downloadUrl: publicUrl,
        expiresAt: null,
      });

      showSuccess('Media asset uploaded to neural storage.');
    } catch (err) {
      showToast(err.message || 'Media upload failed.', 'error');
      console.error(
        'Upload Error Details:',
        err.message,
        err.details,
        err.hint
      );
    } finally {
      setSaving(false);
    }
  };

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiInput, setAiInput] = useState({ title: '', wordCount: '2000' });

  const executeAIGeneration = async () => {
    if (!aiInput.title) {
      showToast('Neural prompt is required for synthesis.', 'error');
      return;
    }

    if (!puterReady || !window.puter) {
      showToast('Puter AI Engine not initialized. Please refresh.', 'error');
      return;
    }

    setIsAIModalOpen(false);
    setGenerating(true);
    showToast(`Synthesizing editorial...`, 'info');

    try {
      const systemPrompt = `You are an elite HAZWOPER and Industrial Safety technical writer. 
      Your goal is to write a comprehensive, research-driven blog post of approximately ${aiInput.wordCount} words.
      
      Requirements:
      1. Create a professional, authoritative title (do not use the user's prompt as the title).
      2. Use semantic HTML (h2, h3, p, strong, ul, li).
      3. Include at least ONE professional <table> with technical data.
      4. Include at least ONE <blockquote> using <q> or <blockquote> tags.
      5. Tone: Highly professional, industrial, and authoritative.
      6. Output ONLY a valid JSON object:
      {
        "title": "Professional Title Here",
        "content": "HTML Body Content Here",
        "summary": "1-sentence SEO summary"
      }`;

      const response = await window.puter.ai.chat(`Topic: "${aiInput.title}"`, {
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }],
      });

      const text =
        typeof response === 'string'
          ? response
          : response?.message?.content || response?.toString();

      // Intelligent Failsafe Parser
      let data = { title: '', content: '', summary: '' };
      const objectMatch = text.match(/\{[\s\S]*\}/);

      if (objectMatch) {
        try {
          data = JSON.parse(objectMatch[0]);
        } catch (e) {
          console.warn(
            'JSON fragment detected but unparseable, using raw recovery.'
          );
        }
      }

      // If parsing failed or we have raw text
      if (!data.title || !data.content) {
        console.log('Initiating Raw Neural Recovery Sequence...');
        // Extract title from first # or H1/H2
        const titleMatch = text.match(
          /(?:#|<h2>|<h3>)\s*(.*?)(?:\n|<\/h[1-3]>|$)/i
        );
        data.title = titleMatch ? titleMatch[1].trim() : aiInput.title;
        // Perfect HTML Transformation
        data.content = markdownToHtml(text.trim());
        data.summary = text.replace(/[#*`]/g, '').substring(0, 160) + '...';
      }

      setFormData((prev) => ({
        ...prev,
        title: data.title || aiInput.title,
        description:
          data.summary ||
          'Professional editorial sequence synthesized by Puter AI.',
        content: data.content,
        category: 'Technical safety',
        read_time: `${Math.ceil(parseInt(aiInput.wordCount) / 200)} min read`,
        slug: titleToSlug(data.title || aiInput.title),
      }));

      showSuccess('Sequence Synchronized (Recovery Active).');
    } catch (err) {
      showToast('AI Synthesis failed. Check connectivity.', 'error');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };
  const generateAIImage = async () => {
    if (!formData.title) {
      showToast('Please provide a title to guide the neural artist.', 'error');
      return;
    }

    setImageGenerating(true);
    showToast('Consulting Puter AI for the perfect prompt...', 'info');

    try {
      // 1. Ask Puter for an optimized image prompt
      let finalizedPrompt = `professional cinematic 8k photography, industrial safety workspace, ${formData.title}, clean minimal composition, high-end corporate aesthetic, photorealistic`;

      if (puterReady && window.puter) {
        try {
          const puterResponse = await window.puter.ai.chat(
            `I need a professional, high-end photography prompt for an article titled "${formData.title}". 
            Context: Industrial safety, HAZWOPER, professional workspace. 
            Rules: No text in image, 8k resolution, cinematic lighting. 
            Output only the 1-sentence prompt itself.`,
            { model: 'gpt-4o' }
          );
          const aiPrompt =
            typeof puterResponse === 'string'
              ? puterResponse
              : puterResponse?.message?.content || puterResponse?.toString();
          if (aiPrompt) finalizedPrompt = aiPrompt.trim();
        } catch (e) {
          console.warn('Puter prompt enhancement failed, using fallback.');
        }
      }

      showToast('Neural artist is drawing your hero image...', 'info');

      // 2. Generate the URL (Pollinations - Improved Endpoint)
      const encodedPrompt = encodeURIComponent(finalizedPrompt);
      const tempImageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;

      // 3. Fetch via Proxy with Failover Architecture
      let response;
      try {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(tempImageUrl)}`;
        response = await fetch(proxyUrl);

        if (!response.ok) {
          console.warn(
            `Neural Synthesis Layer 1 blocked (${response.status}). Initiating industrial failover...`
          );
          // Failover: High-quality professional industrial safety photo
          const failoverKeyword =
            formData.category?.toLowerCase() || 'industrial safety';
          const fallbackUrl = `https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=1280&h=720&sig=${Date.now()}`;
          response = await fetch(
            `/api/proxy-image?url=${encodeURIComponent(fallbackUrl)}`
          );
        }
      } catch (e) {
        console.error('Circuit Breaker Tripped:', e);
        throw new Error(
          'Neural transmission failure. The AI engine is currently unreachable.'
        );
      }

      if (!response.ok || response.status === 415) {
        throw new Error(
          `Editorial Block: ${response.status}. The visual provider rejected the request as unsafe or invalid.`
        );
      }

      const rawBlob = await response.blob();
      if (!rawBlob || rawBlob.size < 100) {
        throw new Error(
          'Synchronized sequence is too small or corrupt. Neural stream compromised.'
        );
      }

      const rawFile = new File([rawBlob], 'raw_gen.jpg', {
        type: rawBlob.type || 'image/jpeg',
      });

      // 4. Neural Optimization (Compression & Conversion)
      console.log(
        'Synthesizing optimized asset from raw stream...',
        rawBlob.type,
        rawBlob.size
      );
      const optimized = await convertImage(rawFile, 'webp', {
        quality: 80,
        width: 1280,
      });
      const optimizedBlob = optimized.blob;

      // 5. Upload to Supabase
      const fileName = `ai_optimized_${Date.now()}.webp`;
      const filePath = `blog-media/${fileName}`;

      const { error } = await supabase.storage
        .from('media')
        .upload(filePath, optimizedBlob, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (error) throw error;

      // 6. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('media').getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image_url: publicUrl }));

      // 7. Track in Media Hub
      recordMediaUpload({
        fileName: fileName,
        fileType: 'image/webp',
        fileSize: optimizedBlob.size,
        previewUrl: publicUrl,
        downloadUrl: publicUrl,
        expiresAt: null,
      });

      showSuccess(
        `Asset Optimized (${optimized.reduction}% reduction) & Persisted.`
      );
    } catch (err) {
      showToast(
        err.message || 'Neural drawing or persistence failed.',
        'error'
      );
      console.error('Neural Error:', err);
    } finally {
      setImageGenerating(false);
    }
  };

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setSaving(true);

    const { id: _, created_at, updated_at, ...cleanedData } = formData;

    // Handle image cleanup if it was changed
    if (originalImageUrl && originalImageUrl !== formData.image_url) {
      try {
        if (
          originalImageUrl.includes(
            '/storage/v1/object/public/media/blog-media/'
          )
        ) {
          const oldPath = originalImageUrl.split('blog-media/').pop();
          if (oldPath) {
            await supabase.storage
              .from('media')
              .remove([`blog-media/${oldPath}`]);
            console.log('Orphaned asset deleted:', oldPath);
          }
        }
      } catch (e) {
        console.warn('Failed to cleanup old asset:', e);
      }
    }

    const finalData = {
      ...cleanedData,
      date: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    try {
      console.log('Commencing Editorial Sync for ID:', id);
      if (isNew) {
        const { error } = await supabase.from('blogs').insert([finalData]);
        if (error) throw error;
        showSuccess('Editorial sequence initialized successfully.');
      } else {
        const { error } = await supabase
          .from('blogs')
          .update(finalData)
          .eq('id', id);
        if (error) throw error;
        showSuccess('Editorial sequence synchronized.');
      }

      console.log('Sync Successful, returning to registry.');
      router.push('/admin?view=blogs');
      router.refresh(); // Ensure the dashboard picks up the new data
    } catch (err) {
      showToast(err.message || 'Database synchronization failed.', 'error');
      console.error(
        'Supabase Error Details:',
        err.message,
        err.details,
        err.hint
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-10 h-10 animate-spin text-primary opacity-20" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
          Decrypting Sequence...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-border pb-10">
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin?view=blogs')}
            className="group -ml-3 pl-3 pr-4 rounded-xl hover:bg-primary/5 text-muted-foreground hover:text-primary font-bold"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Registry
          </Button>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight tracking-tighter">
              {isNew ? 'Initialize' : 'Refine'}{' '}
              <span className="text-primary">Sequence</span>
            </h1>
            <p className="text-muted-foreground font-medium text-sm">
              {isNew
                ? 'Configure a new professional insight for the global editorial archive.'
                : `Updating registry entry for sequence ID: ${id.substring(0, 8)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={handleSubmit}
            disabled={saving || generating}
            className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isNew ? 'Execute Initialization' : 'Sync Changes'}
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-10"
      >
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[40px] shadow-2xl border-border bg-card/40 backdrop-blur-xl p-10 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Core Content
                </h3>
                <Button
                  type="button"
                  onClick={() => setIsAIModalOpen(true)}
                  disabled={generating}
                  variant="outline"
                  className="rounded-xl border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest h-9 px-4 hover:bg-primary hover:text-white transition-all gap-2"
                >
                  <Bot
                    className={cn('w-3.5 h-3.5', generating && 'animate-pulse')}
                  />
                  {generating ? 'Negotiating...' : 'Puter AI Synthesis'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const sanitized = markdownToHtml(formData.content);
                    setFormData((prev) => ({ ...prev, content: sanitized }));
                    showSuccess('Sequence Sanitized to Professional HTML');
                  }}
                  className="rounded-full bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Sanitize to HTML
                </Button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Article Title
                  </label>
                  <Input
                    name="title"
                    value={formData.title || ''}
                    onChange={handleTitleChange}
                    required
                    placeholder="Enter a professional editorial title..."
                    className="h-14 rounded-2xl bg-muted/30 border-border/50 text-xl font-black focus-visible:ring-primary/40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Editorial Body (HTML Support)
                  </label>
                  <textarea
                    name="content"
                    value={formData.content || ''}
                    onChange={handleChange}
                    required
                    placeholder="Construct your professional editorial content here..."
                    rows={20}
                    className="w-full p-8 rounded-[32px] bg-muted/30 border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all font-mono text-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-[40px] shadow-2xl border-border bg-card/40 backdrop-blur-xl p-10 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Metadata & Brief
            </h3>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Archive Description (for Cards)
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                placeholder="Condensed summary for the grid view..."
                className="w-full min-h-[120px] p-6 rounded-2xl bg-muted/30 border border-border/50 focus:border-primary/50 outline-none font-medium text-sm leading-relaxed"
              />
            </div>
          </Card>
        </div>

        {/* Sidebar Configuration */}
        <div className="space-y-8">
          {/* Image Upload Card */}
          <Card className="rounded-[40px] shadow-2xl border-border bg-card/40 backdrop-blur-xl p-8 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border pb-4">
              <ImageIcon className="w-4 h-4" />
              Hero Media
            </h3>
            <div
              className="relative group cursor-pointer aspect-video rounded-2xl bg-muted/30 border border-dashed border-border overflow-hidden flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-all"
              onClick={() => !imageGenerating && fileInputRef.current?.click()}
            >
              {imageGenerating ? (
                <div className="flex flex-col items-center gap-3 animate-pulse">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Synthesizing...
                  </span>
                </div>
              ) : formData.image_url ? (
                <>
                  <Image
                    src={formData.image_url}
                    className="w-full h-full object-cover"
                    alt="Hero"
                    width={400}
                    height={225}
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black text-[10px] text-white uppercase tracking-widest">
                    Change Asset
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      Upload Resource
                    </p>
                    <p className="text-[9px] text-muted-foreground font-medium">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
              />
            </div>
            <Button
              type="button"
              onClick={generateAIImage}
              disabled={imageGenerating || !formData.title}
              className="w-full h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 text-[10px] font-black uppercase tracking-widest transition-all gap-2"
            >
              <Bot
                className={cn(
                  'w-3.5 h-3.5',
                  imageGenerating && 'animate-pulse'
                )}
              />
              {imageGenerating ? 'Drawing...' : 'Puter AI Image Synthesis'}
            </Button>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Or Paste Asset URL
              </label>
              <Input
                name="image_url"
                value={formData.image_url || ''}
                onChange={handleChange}
                placeholder="https://..."
                className="h-10 rounded-xl bg-muted/30 border-border/50 text-[10px] font-mono"
              />
            </div>
          </Card>

          <Card className="rounded-[40px] shadow-2xl border-border bg-card/40 backdrop-blur-xl p-8 space-y-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border pb-4">
              <Globe className="w-4 h-4" />
              Registry Config
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Slug (URL Path)
                </label>
                <Input
                  name="slug"
                  value={formData.slug || ''}
                  onChange={handleChange}
                  required
                  placeholder="e.g. hazwoper-safety-tech"
                  className="h-12 rounded-xl bg-muted/30 border-border/50 font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Category Segment
                </label>
                <Input
                  name="category"
                  value={formData.category || ''}
                  onChange={handleChange}
                  className="h-12 rounded-xl bg-muted/30 border-border/50 text-xs font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-primary/60">
                  Target Read Time (AI Guidance)
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
                  <Input
                    name="read_time"
                    value={formData.read_time || ''}
                    onChange={handleChange}
                    placeholder="e.g. 5 min read"
                    className="h-12 pl-12 rounded-xl bg-primary/5 border-primary/10 text-xs font-black text-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Assigned Author (Auto)
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    name="author"
                    value={formData.author || ''}
                    readOnly
                    className="h-12 pl-12 rounded-xl bg-muted/30 border-border/50 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Publication Identity (Auto)
                </label>
                <Input
                  name="date"
                  value={formData.date || ''}
                  readOnly
                  className="h-12 rounded-xl bg-muted/30 border-border/50 text-xs font-bold"
                />
              </div>
            </div>
          </Card>

          <div className="p-8 rounded-[32px] bg-primary/5 border border-primary/10 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">
              Security Note
            </h4>
            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
              Changes made here are permanently recorded in the global registry.
              High-impact content should be audited before final execution.
            </p>
          </div>
        </div>
      </form>

      {/* AI Neural Synthesis Modal */}
      {isAIModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in-fade">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => setIsAIModalOpen(false)}
          />
          <Card className="w-full max-w-lg relative z-10 rounded-[40px] border-border bg-card/60 backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.2)] overflow-hidden">
            <div className="h-2 w-full bg-primary" />
            <CardHeader className="p-10 pb-6">
              <CardTitle className="text-3xl font-black tracking-tighter flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Bot className="w-6 h-6" />
                </div>
                Puter AI Synthesis
              </CardTitle>
              <p className="text-muted-foreground mt-2 font-medium">
                Define your editorial parameters to ignite the generation
                engine.
              </p>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Neural Synthesis Prompt
                  </label>
                  <Input
                    placeholder="e.g. Write a feature spotlight on the Image Converter..."
                    value={aiInput.title}
                    onChange={(e) =>
                      setAiInput({ ...aiInput, title: e.target.value })
                    }
                    className="h-14 rounded-2xl bg-muted/30 border-border/50 text-base font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Target Word Count
                  </label>
                  <Input
                    placeholder="e.g. 2000"
                    value={aiInput.wordCount}
                    onChange={(e) =>
                      setAiInput({ ...aiInput, wordCount: e.target.value })
                    }
                    className="h-14 rounded-2xl bg-muted/30 border-border/50 text-base font-bold"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <Button
                  onClick={executeAIGeneration}
                  disabled={!aiInput.title}
                  className="h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                >
                  Ignite Synthesis Engine
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsAIModalOpen(false)}
                  className="h-12 rounded-xl text-muted-foreground font-black uppercase tracking-widest text-[10px]"
                >
                  Abort Sequence
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
