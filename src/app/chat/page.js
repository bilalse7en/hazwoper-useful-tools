'use client';

import { Suspense, useState, useEffect } from 'react';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ToolAccessGuard } from '@/components/tool-access-guard';
import { ToolBreadcrumbs } from '@/components/tool-breadcrumbs';
import { useAuth } from '@/components/auth-provider';
import { useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck, Globe, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}

function ChatContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [activePrivateId, setActivePrivateId] = useState(null);

  useEffect(() => {
    const receiver = searchParams.get('receiver');
    if (receiver) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActivePrivateId(receiver);
    }
  }, [searchParams]);

  return (
    <ToolAccessGuard toolId="chat">
      <div className="h-[calc(100vh-64px)] bg-background flex flex-col overflow-hidden">
        {/* Compressed Header */}
        <div className="bg-card/30 backdrop-blur-3xl border-b border-border/40 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">
                Neural Chat{' '}
                <span className="text-primary italic">
                  {activePrivateId ? 'Private' : 'Hub'}
                </span>
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  Signal Active
                </span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  {activePrivateId ? 'Point-to-Point' : 'Global Hub'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:block border-r border-border/30 pr-6">
              <ToolBreadcrumbs slug="chat" className="mb-0 border-none py-0" />
            </div>
            {/* Direct Telemetry Badges */}
            <div className="hidden md:flex items-center gap-4 border-r border-border/30 pr-6 mr-2">
              <div className="flex flex-col items-end">
                <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/50">
                  Latency
                </span>
                <span className="text-[10px] font-black text-emerald-500">
                  24MS
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/50">
                  Encryption
                </span>
                <span className="text-[10px] font-black text-primary">
                  AES-256
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = '/tools/course')}
                className="h-9 px-4 rounded-xl border-primary/30 hover:bg-primary/5 text-primary text-[9px] font-black tracking-widest gap-2 uppercase"
              >
                Back to Tools
              </Button>
              {activePrivateId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActivePrivateId(null)}
                  className="h-9 px-4 rounded-xl border border-border/40 hover:bg-primary/5 text-[9px] font-black tracking-widest gap-2 uppercase"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Exit Private
                </Button>
              )}
              <div className="h-9 px-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                  Secure Channel 01
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Compressed Contacts Sidebar */}
          <div className="w-72 border-r border-border/40 bg-card/10 flex flex-col shrink-0">
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <ChatSidebar
                currentUser={user}
                activeContactId={activePrivateId}
                onSelectContact={(id) => setActivePrivateId(id)}
              />
            </div>
          </div>

          {/* Main Chat Area - Full Height */}
          <div className="flex-1 flex flex-col bg-gradient-to-br from-transparent to-primary/[0.02] relative">
            <ChatWindow
              key={activePrivateId || 'global'}
              isGlobal={!activePrivateId}
              receiverId={activePrivateId}
              onNavigateToPrivate={(id) => setActivePrivateId(id)}
              className="h-full w-full max-w-none shadow-none border-none bg-transparent rounded-none"
            />
          </div>

          {/* Right Info Panel - More Compressed */}
          <div className="w-64 border-l border-border/40 bg-card/10 p-6 space-y-6 hidden xl:block shrink-0">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                  Neural Directives
                </h3>
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                  <p className="text-[11px] font-medium leading-relaxed opacity-70">
                    Engage with the global frequency to coordinate maneuvers or
                    request administrative clearance.
                  </p>
                  <div className="pt-3 border-t border-primary/10">
                    <div className="flex items-center justify-between text-[8px] font-black uppercase mb-1">
                      <span className="text-muted-foreground">
                        Network Load
                      </span>
                      <span className="text-primary">Low</span>
                    </div>
                    <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/40 w-1/4" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  System Identity
                </h3>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/40 border border-border/40">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                    {user?.full_name?.[0] || user?.username?.[0] || 'U'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black truncate">
                      {user?.full_name || user?.username}
                    </span>
                    <span className="text-[7px] font-bold uppercase text-primary/60 tracking-widest">
                      {user?.role} Access
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolAccessGuard>
  );
}
