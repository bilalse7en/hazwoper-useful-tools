'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Maximize2,
  Minimize2,
  MessageCircle,
  Cpu,
  Zap,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toolInfo } from '@/lib/seo';

const TOOL_SUMMARY = Object.entries(toolInfo)
  .map(([slug, info]) => `- ${info.name}: ${info.description}`)
  .join('\n');

const SYSTEM_PROMPT = `You are the Official Floating Assistant for "HAZWOPER Useful Tools". 
Your mission is to provide quick, helpful guidance about our ecosystem.

Available Tools:
${TOOL_SUMMARY}

Rules:
1. Be concise and professional.
2. Recommend tools for specific user needs.
3. Keep the conversation helpful.
4. If asked about technical details, mention the "/details" page for each tool.`;

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [puterReady, setPuterReady] = useState(false);

  const scrollRef = useRef(null);

  // Load Puter.js SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.puter) {
      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      script.onload = () => {
        window.puter.quiet = true;
        setPuterReady(true);
      };
      document.head.appendChild(script);
    } else if (window.puter) {
      setPuterReady(true);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !puterReady) return;

    const currentInput = input;
    const userMsg = {
      role: 'user',
      content: currentInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (!window.puter) throw new Error('Neural bridge offline');

      const fullMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
          .slice(-5)
          .map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: currentInput },
      ];

      const response = await window.puter.ai.chat(currentInput, {
        model: 'gpt-4o-mini',
        messages: fullMessages,
      });

      const responseText =
        typeof response === 'string'
          ? response
          : response?.message?.content ||
            response?.toString() ||
            'Neural cluster timeout';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: responseText.trim(),
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Connection unstable. Please retry.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[9999] group border-2 border-white/10"
      >
        <MessageCircle className="h-7 w-7 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed right-6 z-[9999] flex flex-col transition-all duration-500 glass-panel-deep rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden',
        isMinimized ? 'bottom-6 h-16 w-64' : 'bottom-6 h-[500px] w-[380px]'
      )}
    >
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-white/5 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest">
              Neural Bot
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest text-green-500/80">
                Active
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:text-red-500"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-black/10"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-40 py-10">
                <Sparkles className="h-8 w-8 text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] max-w-[200px]">
                  Neural assistant online. How can I help?
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'flex gap-2',
                  m.role === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                <div
                  className={cn(
                    'p-3 rounded-2xl text-[12px] leading-relaxed shadow-sm',
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm ml-4'
                      : 'bg-white/5 border border-white/5 rounded-tl-sm mr-4'
                  )}
                >
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 rounded-tl-sm">
                  <Activity className="h-4 w-4 text-primary animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/5 bg-white/5 shrink-0">
            <div className="flex gap-2 bg-black/20 rounded-2xl p-1.5 border border-white/5 focus-within:border-primary/50 transition-all">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask something..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-xs px-3 py-2 outline-none"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-9 w-9 rounded-xl shadow-lg shadow-primary/20"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 opacity-20 hover:opacity-40 transition-opacity">
              <div className="flex items-center gap-1.5">
                <Cpu className="h-2.5 w-2.5" />
                <span className="text-[7px] font-black uppercase tracking-widest">
                  Neural
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-2.5 w-2.5" />
                <span className="text-[7px] font-black uppercase tracking-widest">
                  Secure
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
