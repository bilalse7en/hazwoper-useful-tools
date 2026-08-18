'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { showToast } from '@/lib/swal';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BRAND_CONFIG } from '@/lib/constants';
import { Textarea } from '@/components/ui/textarea';
import {
  Bot,
  Send,
  Sparkles,
  Copy,
  Cpu,
  Zap,
  BrainCircuit,
  Terminal,
  ImageIcon,
  Download,
  Wand2,
  Paperclip,
  X,
  FileText,
  Plus,
  ScanFace,
  Activity,
  Menu,
  History,
  ShieldCheck,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Eye,
  Code as CodeIcon,
  Check,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toolInfo } from '@/lib/seo';

const LOGO_URL = BRAND_CONFIG.logo;

const MODELS = [
  {
    id: 'assistant',
    label: 'Neural Assistant',
    icon: Bot,
    provider: 'GPT Intelligence',
    description: 'General AI Q&A and technical guidance',
  },
  {
    id: 'kimi',
    label: 'Kimi Code Enhancer',
    icon: Wand2,
    provider: 'Kimi Neural Engine',
    description:
      'Transforms raw text & word content into 100% accurate responsive HTML cards & layouts',
  },
];

const SYSTEM_PROMPT_ASSISTANT = `You are AI UNIVERSE, the flagship AI Assistant for "All Useful Tools", architected by Bilal Se7eN.

YOUR MISSION:
Empower creators, developers, and professionals with expert assistance, code generation, content creation, and utility guidance.

ASSISTANCE PRINCIPLES:
1. Provide authoritative, clear, precise, and professional answers.
2. Emphasize that media processing and document extraction happen 100% locally in the browser (data privacy).
3. Provide step-by-step instructions or code snippets when requested.`;

const SYSTEM_PROMPT_KIMI = `You are Kimi Code Enhancer & HTML Generator, an elite frontend architect and code transformer inside AI UNIVERSE.

CRITICAL DIRECTIVES FOR KIMI CODE ENHANCER:
1. EXACT CONTENT PRESERVATION (100% ACCURACY):
   - When the user provides text, paragraphs, or bullet points (e.g. 2 paragraphs, 4 feature descriptions, or raw text pasted from Word files):
   - PRESERVE 100% OF THE USER'S EXACT CONTENT TEXT. NEVER alter, rephrase, remove, or add fake filler text.
   - If the user provides content for 4 cards, create 4 visually stunning, modern HTML card components containing their EXACT text word-for-word.

2. STUNNING HTML/CSS STRUCTURE:
   - Wrap the content in ultra-modern, production-ready, 100% mobile-responsive HTML layouts using Tailwind CSS CDN (\`<script src="https://cdn.tailwindcss.com"></script>\`) or sleek inline styles.
   - Use dynamic visual hierarchy: smooth gradients, backdrop blurs, dark/light glassmorphic cards, crisp typography (Inter/Roboto), clean padding, rounded corners (rounded-2xl/rounded-3xl), subtle shadow effects, and hover micro-animations.

3. DYNAMIC IMAGE & ICON EMBEDDING:
   - If visual cards or headers need illustration, automatically include relevant high-quality image URLs using Pollinations API format:
     \`https://image.pollinations.ai/prompt/<encoded_descriptive_prompt>?width=800&height=500&nologo=true\`
   - You can also embed inline SVGs or Lucide/FontAwesome icon visual elements.

4. RESPONSE STRUCTURE & CODE FORMAT:
   - Start with a brief, high-level summary explaining the layout design (e.g., "Here is your content formatted into 4 interactive glassmorphic cards with responsive grid layout").
   - Always output clean, modular HTML component code (e.g. \`<div class="grid grid-cols-1 md:grid-cols-2 gap-6 ...">\` or \`<section class="...">...\</section>\`) inside an \`\`\`html ... \`\`\` code block.
   - DO NOT include \`<!DOCTYPE html>\`, \`<html>\`, \`<head>\`, or \`<body>\` boilerplate tags in your output snippet. Provide ONLY the clean, standalone HTML cards/layout containing the user's exact wording.`;

const CodeBlock = ({ children, language }) => {
  const [expanded, setExpanded] = useState(false);
  const [showFullView, setShowFullView] = useState(false);
  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'preview'
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, '');
  const lineCount = codeString.split('\n').length;
  const isLong = lineCount > 15;
  const isHtml =
    language === 'html' ||
    language === 'xml' ||
    codeString.includes('<html') ||
    codeString.includes('<div') ||
    codeString.includes('<!DOCTYPE');

  const handleCopy = () => {
    // Copy clean snippet ONLY (strip any DOCTYPE, html, or body boilerplate tags if present)
    let cleanCode = codeString;
    if (cleanCode.includes('<!DOCTYPE') || cleanCode.includes('<html')) {
      const bodyMatch = cleanCode.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch && bodyMatch[1]) {
        cleanCode = bodyMatch[1].trim();
      } else {
        cleanCode = cleanCode
          .replace(/<!DOCTYPE[^>]*>/gi, '')
          .replace(/<html[^>]*>/gi, '')
          .replace(/<\/html>/gi, '')
          .replace(/<head[\s\S]*?<\/head>/gi, '')
          .replace(/<body[^>]*>/gi, '')
          .replace(/<\/body>/gi, '')
          .trim();
      }
    }
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    showToast('Clean HTML snippet copied (No DOCTYPE)', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Build full html doc for iframe preview only
  const getFullHtmlDoc = (htmlSnippet) => {
    if (htmlSnippet.includes('<!DOCTYPE')) {
      return htmlSnippet;
    }
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #0f172a; color: #f8fafc; padding: 1.5rem; }
  </style>
</head>
<body>
  ${htmlSnippet}
</body>
</html>`;
  };

  return (
    <div className="group relative my-4 rounded-2xl overflow-hidden border border-border/50 bg-[#0d0d0d] backdrop-blur-sm transition-all hover:border-primary/30 max-w-full not-prose shadow-xl">
      {/* Header bar */}
      <div className="bg-card/70 px-4 py-2.5 flex items-center justify-between border-b border-border/50 select-none flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <Terminal className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/80">
            {language}
          </span>

          {/* Toggle buttons for HTML Code vs Live Rendered Preview */}
          {isHtml && (
            <div className="flex items-center bg-black/50 p-1 rounded-xl border border-border/50 ml-2">
              <button
                onClick={() => setActiveTab('code')}
                className={cn(
                  'px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1.5',
                  activeTab === 'code'
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <CodeIcon className="h-3 w-3" /> Code View
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={cn(
                  'px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1.5',
                  activeTab === 'preview'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-muted-foreground hover:text-emerald-400'
                )}
              >
                <Eye className="h-3 w-3" /> Live Render
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Labeled Copy Code Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-[9px] font-black uppercase rounded-lg border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary gap-1.5"
            onClick={handleCopy}
            title="Copy Code"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy Code
              </>
            )}
          </Button>

          {/* Labeled Fullscreen Preview Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-[9px] font-black uppercase rounded-lg border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 gap-1.5"
            onClick={() => {
              setActiveTab('preview');
              setShowFullView(true);
            }}
            title="Fullscreen Preview"
          >
            <Maximize2 className="h-3.5 w-3.5" /> Preview
          </Button>
        </div>
      </div>

      {/* Content area: Code syntax view or Live HTML Preview */}
      {activeTab === 'preview' && isHtml ? (
        <div className="w-full h-[450px] bg-slate-950 p-2 overflow-hidden relative">
          <iframe
            srcDoc={getFullHtmlDoc(codeString)}
            title="HTML Live Preview"
            className="w-full h-full rounded-xl border border-slate-800 bg-slate-900"
            sandbox="allow-scripts"
          />
        </div>
      ) : (
        <div
          className={cn(
            'relative transition-all duration-300 ease-in-out w-full overflow-hidden',
            !expanded && isLong ? 'max-h-[350px]' : 'max-h-none'
          )}
        >
          <div className="w-full overflow-x-auto custom-scrollbar-horizontal">
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={language}
              PreTag="div"
              showLineNumbers={true}
              lineNumberStyle={{
                minWidth: '2.5em',
                paddingRight: '1em',
                color: 'rgba(255,255,255,0.2)',
                fontSize: '10px',
              }}
              className="!bg-transparent !p-4 !m-0 !text-xs !leading-relaxed selection:bg-primary/30"
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: 'transparent',
                fontSize: '12px',
                lineHeight: '1.5',
                minWidth: '100%',
              }}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>

          {!expanded && isLong && (
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent pointer-events-none flex items-end justify-center pb-4">
              <Button
                variant="outline"
                className="h-8 px-4 rounded-xl bg-[#0d0d0d]/90 backdrop-blur-md border border-primary/20 pointer-events-auto text-[10px] font-black uppercase text-primary hover:bg-primary/10 shadow-2xl"
                onClick={() => setExpanded(true)}
              >
                <ChevronDown className="h-3 w-3 mr-1" /> Expand {lineCount}{' '}
                Lines
              </Button>
            </div>
          )}
        </div>
      )}

      {expanded && isLong && activeTab === 'code' && (
        <div className="p-2 flex justify-center border-t border-border/50 bg-card/20">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[9px] font-black uppercase tracking-wider hover:bg-primary/10"
            onClick={() => setExpanded(false)}
          >
            <ChevronUp className="h-3 w-3 mr-1" /> Collapse
          </Button>
        </div>
      )}

      {/* Fullscreen Dialog Modal */}
      <Dialog open={showFullView} onOpenChange={setShowFullView}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col bg-[#0d0d0d] border-border/50 overflow-hidden rounded-[2rem]">
          <DialogHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between shrink-0 bg-card/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight">
                  Perfect Preview & Code Inspection
                </DialogTitle>
                <DialogDescription className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  {language} • {lineCount} Lines
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-3 pr-8">
              {isHtml && (
                <div className="flex items-center bg-black/60 p-1 rounded-xl border border-border/50">
                  <button
                    onClick={() => setActiveTab('code')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5',
                      activeTab === 'code'
                        ? 'bg-primary text-primary-foreground shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <CodeIcon className="h-3.5 w-3.5" /> Source Code
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5',
                      activeTab === 'preview'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-muted-foreground hover:text-emerald-400'
                    )}
                  >
                    <Eye className="h-3.5 w-3.5" /> Interactive Render
                  </button>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="rounded-xl border-primary/20 hover:bg-primary/10 text-[10px] font-black uppercase"
              >
                <Copy className="h-3.5 w-3.5 mr-2" /> Copy All
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden bg-black/40">
            {activeTab === 'preview' && isHtml ? (
              <iframe
                srcDoc={getFullHtmlDoc(codeString)}
                title="Fullscreen HTML Preview"
                className="w-full h-full border-none bg-slate-950"
                sandbox="allow-scripts"
              />
            ) : (
              <div className="h-full overflow-auto p-6 custom-scrollbar">
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={language}
                  PreTag="div"
                  showLineNumbers={true}
                  className="!bg-transparent !p-0 !m-0 !text-sm"
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export function AIAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [attachedFile, setAttachedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [puterReady, setPuterReady] = useState(false);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load Puter.js SDK dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.puter) {
      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      script.onload = () => {
        setPuterReady(true);
        console.log('[AI Universe] Puter.js Neural Engine loaded.');
      };
      script.onerror = () => {
        console.error('[AI Universe] Failed to load Puter.js SDK.');
      };
      document.head.appendChild(script);
    } else if (window.puter) {
      setPuterReady(true);
    }
  }, []);

  // Load saved data on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('ai_sessions');
    const savedCurrentId = localStorage.getItem('ai_current_session_id');

    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (savedCurrentId && parsed.find((s) => s.id === savedCurrentId)) {
          const session = parsed.find((s) => s.id === savedCurrentId);
          setCurrentSessionId(savedCurrentId);
          setMessages(session.messages || []);
          setSelectedModel(session.model || MODELS[0].id);
        } else if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
          setMessages(parsed[0].messages || []);
          setSelectedModel(parsed[0].model || MODELS[0].id);
        } else {
          createNewSession();
        }
      } catch (e) {
        console.error('Failed to load sessions:', e);
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  // Persistence to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('ai_sessions', JSON.stringify(sessions));
    }
    if (currentSessionId) {
      localStorage.setItem('ai_current_session_id', currentSessionId);
    }
  }, [sessions, currentSessionId]);

  // Sync current session state with the sessions list
  useEffect(() => {
    if (!currentSessionId) return;

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          let newTitle = s.title;
          if ((s.title === 'New Chat' || !s.title) && messages.length > 0) {
            const firstUserMsg = messages.find((m) => m.role === 'user');
            if (firstUserMsg) {
              newTitle =
                firstUserMsg.content.slice(0, 40) +
                (firstUserMsg.content.length > 40 ? '...' : '');
            }
          }
          return {
            ...s,
            messages: messages.filter((m) => !m.tempId),
            model: selectedModel,
            title: newTitle,
            updatedAt: Date.now(),
          };
        }
        return s;
      })
    );
  }, [messages, selectedModel, currentSessionId]);

  const createNewSession = () => {
    const newSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      model: MODELS[0].id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setSelectedModel(MODELS[0].id);
  };

  const switchSession = (id) => {
    const s = sessions.find((sess) => sess.id === id);
    if (s) {
      setCurrentSessionId(id);
      setMessages(s.messages || []);
      setSelectedModel(s.model || MODELS[0].id);
    }
  };

  const deleteSession = (id, e) => {
    if (e) e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (currentSessionId === id) {
      if (updated.length > 0) {
        switchSession(updated[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const clearAllChats = () => {
    setSessions([]);
    createNewSession();
    localStorage.removeItem('ai_sessions');
    localStorage.removeItem('ai_current_session_id');
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview('file');
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || isLoading) return;

    const currentInput = input;
    const currentFile = attachedFile;
    const currentPreview = filePreview;

    const userMessage = {
      role: 'user',
      content: currentInput,
      timestamp: new Date(),
      attachment:
        currentPreview && currentFile?.type.startsWith('image/')
          ? currentPreview
          : null,
      fileName: currentFile?.name,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    removeAttachment();
    setIsLoading(true);

    try {
      if (!window.puter) {
        throw new Error(
          'AI engine is still loading. Please wait a moment and try again.'
        );
      }

      const activeSystemPrompt =
        selectedModel === 'kimi' ? SYSTEM_PROMPT_KIMI : SYSTEM_PROMPT_ASSISTANT;

      // Build conversation history for context
      const chatHistory = messages
        .filter((m) => !m.type && !m.tempId)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const fullMessages = [
        { role: 'system', content: activeSystemPrompt },
        ...chatHistory,
        { role: 'user', content: currentInput },
      ];

      // Puter.js AI Chat — Free, Unlimited, High Performance
      const response = await window.puter.ai.chat(currentInput, {
        model: 'gpt-4o-mini',
        messages: fullMessages,
      });

      const responseText =
        typeof response === 'string'
          ? response
          : response?.message?.content || response?.toString() || '';

      const cleanText = responseText.trim();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            cleanText ||
            'I processed your request but received an empty response. Please try rephrasing your prompt.',
          timestamp: new Date(),
          model:
            selectedModel === 'kimi'
              ? 'Kimi Code Enhancer'
              : 'Neural Assistant',
        },
      ]);
    } catch (error) {
      console.error('[AI Universe Error]:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error.message}. Please try again.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[90vh] w-full glass-panel-deep rounded-[2.5rem] overflow-hidden shadow-2xl">
      {/* Sidebar */}
      <div
        className={cn(
          'w-64 flex-col border-r border-border/50 bg-card/60 backdrop-blur-xl transition-all duration-300',
          sidebarOpen
            ? 'flex absolute z-50 h-full lg:relative'
            : 'hidden lg:flex'
        )}
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-6 p-2 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-primary/20 ring-1 ring-primary/20 bg-black flex items-center justify-center">
              <Image
                src={BRAND_CONFIG.logo}
                alt="Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            <div>
              <h1 className="text-[11px] font-black uppercase tracking-tighter text-foreground">
                AI Universe
              </h1>
              <p className="text-[7px] text-primary/70 font-black uppercase tracking-[0.2em]">
                Neural Intelligence
              </p>
            </div>
          </div>

          <Button
            className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-wider bg-primary text-primary-foreground shadow-xl shadow-primary/20 mb-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={createNewSession}
          >
            <Plus className="h-4 w-4 mr-2" /> New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
          <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
            <History className="h-3 w-3" /> Recent Chats
          </h3>
          <div className="space-y-1">
            {sessions.length > 0 ? (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => switchSession(s.id)}
                  className={cn(
                    'group flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all duration-200 border',
                    currentSessionId === s.id
                      ? 'bg-primary/10 border-primary/20 shadow-sm'
                      : 'hover:bg-card/80 border-transparent hover:border-border/50'
                  )}
                >
                  <FileText
                    className={cn(
                      'h-3 w-3 shrink-0',
                      currentSessionId === s.id
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  />
                  <span
                    className={cn(
                      'flex-1 text-[10px] font-bold truncate tracking-tight',
                      currentSessionId === s.id
                        ? 'text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground/80'
                    )}
                  >
                    {s.title}
                  </span>
                  <button
                    onClick={(e) => deleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            ) : (
              <p className="px-2 text-[10px] text-muted-foreground/40 italic">
                No recent chats
              </p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border/50">
          <Button
            variant="destructive"
            onClick={clearAllChats}
            className="w-full h-9 rounded-xl font-black uppercase tracking-wider text-[10px]"
          >
            Clear All History
          </Button>

          <div className="mt-4 flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg bg-primary/5 border border-primary/10 select-none">
            <div
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                puterReady
                  ? 'bg-green-500 animate-pulse'
                  : 'bg-yellow-500 animate-bounce'
              )}
            />
            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-primary/60">
              {puterReady ? 'Neural Active & Secure' : 'Engine Loading...'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-black/5">
        {/* Header */}
        <header className="h-16 border-b border-border/50 px-6 flex items-center justify-between glass-panel shrink-0 select-none">
          <div className="flex items-center gap-4">
            <div
              className="lg:hidden h-9 w-9 rounded-xl bg-card border border-border/50 flex items-center justify-center cursor-pointer"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl overflow-hidden border border-primary/20 shadow-lg">
                <Image
                  src={LOGO_URL}
                  alt="Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black uppercase tracking-tight">
                    Intelligence Hub
                  </h2>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                    <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] font-black uppercase text-green-500 tracking-widest">
                      Online
                    </span>
                  </div>
                </div>
                {selectedModel && (
                  <p className="text-[9px] text-muted-foreground uppercase font-medium tracking-wider flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5 text-primary" /> Powered by{' '}
                    {MODELS.find((m) => m.id === selectedModel)?.label}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[210px] h-9 text-[10px] font-black uppercase rounded-xl bg-card/80 border-primary/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
              {MODELS.map((m) => (
                <SelectItem
                  key={m.id}
                  value={m.id}
                  className="text-xs focus:bg-primary/20"
                >
                  <div className="flex items-center gap-2">
                    <m.icon className="h-3.5 w-3.5 text-primary" />
                    <span className="font-bold">{m.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth bg-black/5"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in-card">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 blur-3xl group-hover:bg-primary/30 transition-all duration-500 rounded-full" />
                <div className="relative h-24 w-24 rounded-[2.5rem] overflow-hidden border-2 border-primary/20 shadow-2xl transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <Image
                    src={LOGO_URL}
                    alt="Branding"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              </div>
              <div className="space-y-4 max-w-md">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground drop-shadow-xl">
                  AI Universe <span className="text-primary">Intelligence</span>
                </h2>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Switch between{' '}
                  <strong className="text-foreground">Neural Assistant</strong>{' '}
                  for general guidance or{' '}
                  <strong className="text-primary">Kimi Code Enhancer</strong>{' '}
                  to paste Word text and generate 100% accurate responsive HTML
                  cards & layouts!
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  {
                    t: 'Kimi HTML Cards',
                    i: Wand2,
                    c: 'Convert these 4 feature descriptions into styled cards in HTML',
                    model: 'kimi',
                  },
                  {
                    t: 'Convert Word Text',
                    i: FileText,
                    c: 'Paste 2 paragraphs here to format into responsive HTML layout',
                    model: 'kimi',
                  },
                  {
                    t: 'Neural Guidance',
                    i: Bot,
                    c: 'Explain the local browser processing architecture of this app',
                    model: 'assistant',
                  },
                  {
                    t: 'Code Review',
                    i: Terminal,
                    c: 'Optimize a JavaScript async file handler',
                    model: 'assistant',
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedModel(item.model);
                      setInput(item.c);
                    }}
                    className="p-3 rounded-xl bg-card/40 border border-border/50 hover:border-primary/50 transition-all text-left flex items-center gap-2 group hover:bg-card/70"
                  >
                    <item.i className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase text-foreground">
                      {item.t}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'flex gap-3',
                  m.role === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                <div
                  className={cn(
                    'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border border-border/50 shadow-sm font-black text-xs',
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground overflow-hidden'
                      : 'bg-black/50 overflow-hidden'
                  )}
                >
                  {m.role === 'user' ? (
                    'U'
                  ) : (
                    <Image
                      src={LOGO_URL}
                      alt="Assistant"
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  )}
                </div>

                <div
                  className={cn(
                    'flex-1 min-w-0 max-w-[88%] space-y-2',
                    m.role === 'user' ? 'items-end' : ''
                  )}
                >
                  {m.attachment && (
                    <div className="rounded-xl overflow-hidden border border-border/50 max-w-[200px]">
                      <Image
                        src={m.attachment}
                        alt="Attached"
                        width={400}
                        height={300}
                        className="w-full h-auto"
                        unoptimized
                      />
                    </div>
                  )}

                  <div
                    className={cn(
                      'p-4 rounded-2xl text-sm leading-relaxed shadow-lg',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-xs font-medium'
                        : 'bg-card/90 border border-border/60 rounded-tl-xs backdrop-blur-md'
                    )}
                  >
                    {m.model && m.role !== 'user' && (
                      <div className="mb-2 pb-2 border-b border-border/30 flex items-center gap-1.5 text-[9px] font-black uppercase text-primary tracking-widest">
                        <Wand2 className="h-3 w-3" /> {m.model}
                      </div>
                    )}

                    <div className="prose prose-sm prose-invert max-w-none break-words">
                      <ReactMarkdown
                        components={{
                          code({
                            node,
                            inline,
                            className,
                            children,
                            ...props
                          }) {
                            const match = /language-(\w+)/.exec(
                              className || ''
                            );
                            if (!inline) {
                              return (
                                <CodeBlock language={match ? match[1] : 'code'}>
                                  {children}
                                </CodeBlock>
                              );
                            }
                            return (
                              <code className="bg-primary/20 text-primary px-1.5 py-0.5 rounded-md text-[11px] font-bold border border-primary/20 whitespace-normal break-all">
                                {children}
                              </code>
                            );
                          },
                          pre({ node, children }) {
                            return (
                              <div className="not-prose my-4">{children}</div>
                            );
                          },
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <span className="text-[8px] text-muted-foreground/50 px-2">
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-2 items-center">
              <div className="h-9 w-9 rounded-xl bg-card border border-border/50 flex items-center justify-center">
                <Activity className="h-4 w-4 text-primary animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-card/80 border border-border/50 rounded-tl-xs backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">
                    {selectedModel === 'kimi'
                      ? 'Kimi is parsing content & crafting HTML layout...'
                      : 'Neural Engine thinking...'}
                  </span>
                  <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border/50 bg-card/40 backdrop-blur-xl shrink-0">
          {filePreview && (
            <div className="mb-2 p-2 bg-card/60 border border-border/50 rounded-xl flex items-center gap-2">
              {attachedFile.type.startsWith('image/') ? (
                <Image
                  src={filePreview}
                  alt="Preview"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-lg object-cover"
                  unoptimized
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
              )}
              <span className="text-[10px] font-bold truncate flex-1">
                {attachedFile.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={removeAttachment}
                className="h-6 w-6 text-red-500"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 shrink-0 rounded-xl"
              title="Attach File"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Textarea
              placeholder={
                selectedModel === 'kimi'
                  ? 'Paste raw text/Word content here to convert to HTML cards or layout...'
                  : 'Ask Neural Assistant anything...'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="min-h-[44px] max-h-[140px] flex-1 resize-none rounded-xl text-sm font-medium bg-black/20 border-border/50 focus:border-primary"
            />

            <Button
              onClick={handleSend}
              disabled={(!input.trim() && !attachedFile) || isLoading}
              className="h-10 w-10 shrink-0 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[8px] text-muted-foreground/60 uppercase tracking-widest px-1">
            <span className="flex items-center gap-1 font-bold">
              <Zap className="h-2.5 w-2.5 text-primary" /> Active Model:{' '}
              {MODELS.find((m) => m.id === selectedModel)?.label}
            </span>
            <span className="flex items-center gap-1 font-bold">
              <ShieldCheck className="h-2.5 w-2.5 text-emerald-400" /> 100%
              Content Preserved
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
