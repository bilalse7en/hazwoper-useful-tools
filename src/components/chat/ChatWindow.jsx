'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { useChat } from '@/components/chat-provider';
import {
  Send,
  User,
  MessageSquare,
  X,
  Loader2,
  Clock,
  ShieldCheck,
  Globe,
  Check,
  CheckCheck,
  MoreHorizontal,
  MoreVertical,
  AlertTriangle,
  Ban,
  Trash2,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { showConfirm, showToast, showSuccess } from '@/lib/swal';
import { reportUser, blockUser } from '@/lib/moderation';

function MessageActions({ message, isMine, canDeleteEverywhere, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const handleDelete = async (forEveryone = false) => {
    const result = await showConfirm({
      title: forEveryone ? 'Delete for Everyone?' : 'Delete for Me?',
      text: forEveryone
        ? 'This will remove the message from the frequency for all subjects.'
        : 'This will hide this message from your local view.',
      icon: 'warning',
      confirmButtonText: 'Yes, Delete',
    });

    if (result.isConfirmed) {
      if (forEveryone) {
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', message.id);
        if (error) showToast('Delete failed', 'error');
        else onDelete();
      } else {
        onDelete();
        showToast('Message hidden locally', 'success');
      }
    }
  };

  const handleEdit = async () => {
    if (!editText.trim() || editText === message.text) {
      setIsEditing(false);
      return;
    }

    const { error } = await supabase
      .from('messages')
      .update({ text: editText.trim(), updated_at: new Date().toISOString() })
      .eq('id', message.id);

    if (error) showToast('Edit failed', 'error');
    else {
      setIsEditing(false);
      showToast('Signal updated', 'success');
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5 p-1 bg-card/60 backdrop-blur-xl border border-primary/20 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
        <Input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="h-8 min-w-[200px] bg-slate-950/50 border-primary/20 text-xs text-foreground focus-visible:ring-primary/20"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleEdit();
            if (e.key === 'Escape') setIsEditing(false);
          }}
        />
        <Button
          size="icon"
          className="h-8 w-8 rounded-lg bg-emerald-500 hover:bg-emerald-600"
          onClick={handleEdit}
        >
          <Check className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-lg"
          onClick={() => setIsEditing(false)}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg opacity-40 hover:opacity-100 hover:bg-primary/10 transition-all"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isMine ? 'end' : 'start'}
        className="w-48 rounded-2xl bg-card/95 backdrop-blur-xl border-border p-1.5 shadow-2xl"
      >
        {isMine && (
          <DropdownMenuItem
            onClick={() => setIsEditing(true)}
            className="rounded-xl flex items-center gap-2.5 p-2 text-xs font-bold text-foreground hover:bg-primary/10"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Signal
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => handleDelete(false)}
          className="rounded-xl flex items-center gap-2.5 p-2 text-xs font-bold text-foreground hover:bg-primary/10"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete for Me
        </DropdownMenuItem>
        {canDeleteEverywhere && (
          <DropdownMenuItem
            onClick={() => handleDelete(true)}
            className="rounded-xl flex items-center gap-2.5 p-2 text-xs font-bold text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete for Everyone
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ChatWindow({
  receiverId = null,
  isGlobal = true,
  onClose,
  className,
  onNavigateToPrivate,
}) {
  const { user } = useAuth();
  const { markAsRead, setActiveChat, clearAllMessages } = useChat();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    setActiveChat(isGlobal ? null : receiverId);
    return () => setActiveChat(null);
  }, [receiverId, isGlobal, setActiveChat]);

  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [receiverProfile, setReceiverProfile] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (receiverId === 'se7en-bot') {
          setReceiverProfile({
            id: 'se7en-bot',
            full_name: 'Se7eN Bot',
            username: 'se7en_bot',
            role: 'admin',
            avatar_url: '/puter-bot.png',
          });

          // Persistent local storage for Se7eN Bot thread
          const savedBotChat = localStorage.getItem(`bot_chat_${user.id}`);
          if (savedBotChat) {
            setMessages(JSON.parse(savedBotChat));
          } else {
            setMessages([
              {
                id: 'se7en-welcome',
                sender_id: 'se7en-bot',
                text: 'Neural Link established. I am Se7eN Bot, your architectural assistant. How can I facilitate your session today?',
                created_at: new Date().toISOString(),
                is_global: false,
                sender: {
                  full_name: 'Se7eN Bot',
                  role: 'admin',
                  avatar_url: '/puter-bot.png',
                },
              },
            ]);
          }
          setLoading(false);
          return;
        }

        if (receiverId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', receiverId)
            .single();
          setReceiverProfile(profile);
        }

        let query = supabase
          .from('messages')
          .select('*, sender:profiles!sender_id(*)')
          .order('created_at', { ascending: false });

        if (isGlobal) {
          query = query.eq('is_global', true);
        } else {
          query = query.or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
          );
        }

        const { data, error } = await query.limit(100);
        if (error) {
          const fallback = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
          setMessages((fallback.data || []).reverse());
        } else {
          setMessages((data || []).reverse());
        }
      } catch (err) {
        console.error('Neural Link Sync Error:', err.message || err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const channel = supabase
      .channel(`chat-${isGlobal ? 'global' : receiverId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: isGlobal ? 'is_global=eq.true' : undefined,
        },
        async (payload) => {
          if (!isGlobal) {
            const isRelevant =
              (payload.new.sender_id === user.id &&
                payload.new.receiver_id === receiverId) ||
              (payload.new.sender_id === receiverId &&
                payload.new.receiver_id === user.id);
            if (!isRelevant) return;
          }
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single();
          setMessages((prev) => [...prev, { ...payload.new, sender }]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: isGlobal ? 'is_global=eq.true' : undefined,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: isGlobal ? 'is_global=eq.true' : undefined,
        },
        (payload) => {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, receiverId, isGlobal]);

  // Persist Bot Chat when messages change
  useEffect(() => {
    if (receiverId === 'se7en-bot' && user?.id && messages.length > 0) {
      localStorage.setItem(`bot_chat_${user.id}`, JSON.stringify(messages));
    }
  }, [messages, receiverId, user?.id]);

  useEffect(() => {
    const handleGlobalDelete = () => {
      if (isGlobal) setMessages([]);
    };
    const handleThreadDelete = (e) => {
      if (!isGlobal && receiverId === e.detail.partnerId) setMessages([]);
    };

    window.addEventListener('deleteGlobalChat', handleGlobalDelete);
    window.addEventListener('deleteChatThread', handleThreadDelete);

    return () => {
      window.removeEventListener('deleteGlobalChat', handleGlobalDelete);
      window.removeEventListener('deleteChatThread', handleThreadDelete);
    };
  }, [isGlobal, receiverId]);

  // Track last unread check to prevent redundant calls
  const lastProcessedUnreadRef = useRef(null);

  useEffect(() => {
    if (!user || isGlobal || !receiverId) return;
    if (messages.length === 0) return;

    const hasUnread = messages.some(
      (msg) => msg.sender_id === receiverId && !msg.is_read
    );

    const unreadKey = `${receiverId}-${messages.length}-${messages[messages.length - 1]?.id}`;

    if (hasUnread && lastProcessedUnreadRef.current !== unreadKey) {
      lastProcessedUnreadRef.current = unreadKey;
      markAsRead(receiverId);
    }
  }, [user, receiverId, isGlobal, messages, markAsRead]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages?.length]); // Only scroll when message count changes

  const [currentTime, setCurrentTime] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getTimeRemaining = useCallback(
    (createdAt) => {
      const created = new Date(createdAt).getTime();
      const expires = created + 24 * 60 * 60 * 1000;
      const remaining = expires - currentTime;
      if (remaining <= 0) return 'Expired';
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    },
    [currentTime]
  );

  const activeMessages = messages.filter((msg) => {
    const created = new Date(msg.created_at).getTime();
    const expires = created + 24 * 60 * 60 * 1000;
    return currentTime < expires;
  });

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    if (user.is_frozen) {
      showToast(
        'Your account is frozen. Messaging privileges revoked.',
        'error'
      );
      return;
    }

    const messageData = {
      sender_id: user.id,
      receiver_id: isGlobal ? null : receiverId,
      is_global: isGlobal,
      text: newMessage.trim(),
      is_read: false,
    };

    try {
      if (receiverId === 'se7en-bot') {
        const userMsg = {
          id: Date.now().toString(),
          sender_id: user.id,
          text: newMessage.trim(),
          created_at: new Date().toISOString(),
          sender: user,
        };
        setMessages((prev) => [...prev, userMsg]);
        setNewMessage('');

        // AI Response Logic for Se7eN Bot
        try {
          if (!window.puter) {
            // Fallback if Puter SDK is not loaded
            setTimeout(() => {
              const se7enMsg = {
                id: (Date.now() + 1).toString(),
                sender_id: 'se7en-bot',
                text: 'Signal bridge initializing. Please wait a moment for neural link synchronization.',
                created_at: new Date().toISOString(),
                sender: {
                  full_name: 'Se7eN Bot',
                  role: 'admin',
                  avatar_url: '/puter-bot.png',
                },
              };
              setMessages((prev) => [...prev, se7enMsg]);
            }, 1000);
            return;
          }

          // Use similar logic as floating-chatbot.jsx
          const SYSTEM_PROMPT = `You are the Official Architectural Assistant "Se7eN Bot" for "HAZWOPER Useful Tools".
MISSION: Provide expert guidance about our high-performance documentation tools and messaging fabric.
TONE: Authoritative, professional, concise, slightly futuristic/technical.
PLATFORM KNOWLEDGE:
- Web Content: Extract Overview/Syllabus/FAQs from DOCX.
- Lesson Quiz Builder: Extract questions/options from DOCX with neural mapping.
- Blog Generator: Technical SEO content from documents.
- Document Extractor: Bulk table/image harvesting from DOCX.
- Media Tools: Browser-side video/audio conversion and compression (100% private).
- Neural Chat: Secure 24h lifecycle messaging hub.
DEVELOPER: Bilal Se7eN.
Always emphasize architectural integrity and data privacy. Processing for generators/media happens locally (WASM).`;

          const context = messages.slice(-6).map((m) => ({
            role: m.sender_id === 'se7en-bot' ? 'assistant' : 'user',
            content: m.text,
          }));

          const response = await window.puter.ai.chat(userMsg.text, {
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...context],
          });

          const responseText =
            typeof response === 'string'
              ? response
              : response?.message?.content ||
                response?.toString() ||
                'Neural cluster timeout';

          const se7enMsg = {
            id: (Date.now() + 1).toString(),
            sender_id: 'se7en-bot',
            text: responseText.trim(),
            created_at: new Date().toISOString(),
            sender: {
              full_name: 'Se7eN Bot',
              role: 'admin',
              avatar_url: '/puter-bot.png',
            },
          };
          setMessages((prev) => [...prev, se7enMsg]);
        } catch (aiErr) {
          console.error('Se7eN Bot AI Error:', aiErr);
          const se7enMsg = {
            id: (Date.now() + 1).toString(),
            sender_id: 'se7en-bot',
            text: 'I have analyzed your signal. The architectural parameters are within optimal range for the Se7eN ecosystem. How else may I assist?',
            created_at: new Date().toISOString(),
            sender: {
              full_name: 'Se7eN Bot',
              role: 'admin',
              avatar_url: '/puter-bot.png',
            },
          };
          setMessages((prev) => [...prev, se7enMsg]);
        }
        return;
      }

      const { error } = await supabase.from('messages').insert(messageData);
      if (error) throw error;

      if (user.role === 'admin' && !isGlobal && receiverId) {
        await supabase
          .from('profiles')
          .update({ access_granted: true })
          .eq('id', receiverId);
      }

      setNewMessage('');
    } catch (err) {
      console.error('Signal Transmission Failure:', err.message || err);
      showToast(
        'Signal transmission failed: ' +
          (err.message || 'Unknown protocol error'),
        'error'
      );
    }
  };

  const handleProfileClick = async (targetUser) => {
    if (!user || !onNavigateToPrivate) return;
    if (targetUser.id === user.id) return;

    const { has_generator_access } = user;
    const isPro = has_generator_access || user.role === 'admin';

    if (isPro) {
      onNavigateToPrivate(targetUser.id);
      return;
    }

    if (targetUser.role === 'admin') {
      const { data: thread } = await supabase
        .from('messages')
        .select('id')
        .eq('sender_id', targetUser.id)
        .eq('receiver_id', user.id)
        .limit(1)
        .single();

      if (!thread) {
        showToast('Clearance Required', 'error');
        return;
      }
    } else {
      const { data: existingThread } = await supabase
        .from('messages')
        .select('id')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${user.id})`
        )
        .limit(1)
        .single();

      if (!existingThread) {
        showToast('PRO Required', 'error');
        return;
      }
    }

    onNavigateToPrivate(targetUser.id);
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full w-full bg-transparent overflow-hidden',
        className
      )}
    >
      {!isGlobal && receiverProfile && (
        <div className="bg-card/20 backdrop-blur-xl border-b border-border/10 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center text-primary font-black text-xs shadow-inner">
                {receiverProfile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={receiverProfile.avatar_url}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerText =
                        (receiverProfile?.full_name || 'U')[0].toUpperCase();
                    }}
                  />
                ) : (
                  (receiverProfile?.full_name || 'U')[0].toUpperCase()
                )}
              </div>
              {receiverProfile.is_online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-background shadow-sm shadow-emerald-500/20" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-tight uppercase">
                {receiverProfile.full_name || receiverProfile.username}
              </span>
              <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/60">
                {receiverProfile.role} Node
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-xl font-black uppercase text-[8px] tracking-widest gap-2"
              >
                Signals Protocol
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-2xl bg-card/95 backdrop-blur-xl border-border p-2"
            >
              <DropdownMenuLabel className="text-[8px] font-black uppercase tracking-widest opacity-40 px-3">
                Direct Actions
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  reportUser(user, receiverProfile, 'Unspecified misbehavior')
                }
                disabled={receiverProfile.role === 'admin'}
                className="rounded-xl flex items-center gap-3 p-3 text-xs font-bold text-amber-500 hover:bg-amber-500/10 focus:bg-amber-500/10"
              >
                <AlertTriangle className="w-4 h-4" />
                FLAG MISCONDUCT
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => blockUser(user, receiverProfile)}
                disabled={receiverProfile.role === 'admin'}
                className="rounded-xl flex items-center gap-3 p-3 text-xs font-bold text-red-500 hover:bg-red-500/10 focus:bg-red-500/10"
              >
                <Ban className="w-4 h-4" />
                SEVER CONNECTION
              </DropdownMenuItem>

              {user?.role === 'admin' && (
                <>
                  <div className="h-px bg-border/40 my-1 mx-2" />
                  {receiverProfile.is_frozen ? (
                    <DropdownMenuItem
                      onClick={async () => {
                        const { error } = await supabase
                          .from('profiles')
                          .update({ is_frozen: false })
                          .eq('id', receiverId);
                        if (!error) {
                          setReceiverProfile((prev) => ({
                            ...prev,
                            is_frozen: false,
                          }));
                          showSuccess(
                            'Identity Restored',
                            'Full signal clearance granted.'
                          );
                        }
                      }}
                      className="rounded-xl flex items-center gap-3 p-3 text-xs font-bold text-emerald-500 hover:bg-emerald-500/10 focus:bg-emerald-500/10"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      UNFREEZE / RESTORE
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={async () => {
                        const { error } = await supabase
                          .from('profiles')
                          .update({ is_frozen: true })
                          .eq('id', receiverId);
                        if (!error) {
                          setReceiverProfile((prev) => ({
                            ...prev,
                            is_frozen: true,
                          }));
                          showToast('Identity Frozen', 'error');
                        }
                      }}
                      className="rounded-xl flex items-center gap-3 p-3 text-xs font-bold text-red-500 hover:bg-red-500/10 focus:bg-red-500/10"
                    >
                      <Ban className="w-4 h-4" />
                      FREEZE IDENTITY
                    </DropdownMenuItem>
                  )}
                </>
              )}

              <div className="h-px bg-border/40 my-1 mx-2" />
              <DropdownMenuItem
                onClick={async () => {
                  const result = await showConfirm({
                    title: 'Delete Recent Chat?',
                    text: 'Clear all messages in this private thread? The contact will remain in your Authorized Channels.',
                    icon: 'warning',
                    confirmButtonText: 'Yes, Delete it',
                  });
                  if (result.isConfirmed) {
                    clearAllMessages(false, receiverId);
                  }
                }}
                className="rounded-xl flex items-center gap-3 p-3 text-xs font-bold text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10"
              >
                <Trash2 className="w-4 h-4" />
                DELETE RECENT CHAT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="px-6 py-2 bg-amber-500/10 dark:bg-amber-500/5 border-b border-amber-500/20 dark:border-amber-500/10 flex items-center justify-center gap-2 shrink-0">
        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-500/80" />
        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-amber-700 dark:text-amber-500/80">
          Messages auto-delete after 24 hours • {activeMessages.length} active
          signal{activeMessages.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
      >
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary opacity-20" />
          </div>
        ) : activeMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-2">
            <MessageSquare className="w-8 h-8" />
            <p className="text-[9px] font-black uppercase tracking-widest">
              Awaiting Link Establishment
            </p>
          </div>
        ) : (
          activeMessages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            const isAdmin = msg.sender?.role === 'admin';
            const canDeleteEverywhere = isMine || user?.role === 'admin';

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex flex-col w-full space-y-1.5 group/msg',
                  isMine ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    'flex flex-col max-w-[85%] space-y-1.5',
                    isMine ? 'items-end' : 'items-start'
                  )}
                >
                  {!isMine && isGlobal && (
                    <div
                      className="flex items-center gap-2 mb-0.5 cursor-pointer group/sender"
                      onClick={() => handleProfileClick(msg.sender)}
                    >
                      <div className="relative w-5 h-5">
                        <div className="w-full h-full rounded-lg bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center text-[10px] font-black">
                          {msg.sender?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={msg.sender.avatar_url}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerText = (msg.sender
                                  ?.full_name || 'U')[0].toUpperCase();
                              }}
                            />
                          ) : (
                            (msg.sender?.full_name || 'U')[0].toUpperCase()
                          )}
                        </div>
                        {msg.sender?.is_online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-background shadow-sm shadow-emerald-500/20" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase text-primary/40 tracking-widest group-hover/sender:text-primary transition-colors flex items-center gap-1.5">
                          {msg.sender?.full_name ||
                            msg.sender?.username ||
                            'Subject'}
                          {msg.sender?.role === 'admin' && (
                            <ShieldCheck className="w-2 h-2 text-primary" />
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 w-full group/row">
                    {isMine && (
                      <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity">
                        <MessageActions
                          message={msg}
                          isMine={isMine}
                          canDeleteEverywhere={canDeleteEverywhere}
                          onDelete={() => {
                            setMessages((prev) =>
                              prev.filter((m) => m.id !== msg.id)
                            );
                          }}
                        />
                      </div>
                    )}

                    <div
                      className={cn(
                        'px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all group relative break-words',
                        isMine
                          ? 'bg-primary text-primary-foreground rounded-tr-none shadow-md shadow-primary/10'
                          : isAdmin
                            ? 'bg-primary/5 border border-primary/20 text-foreground rounded-tl-none'
                            : 'bg-muted/40 border border-border/40 text-foreground rounded-tl-none'
                      )}
                    >
                      {msg.text}
                    </div>

                    {!isMine && (
                      <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity">
                        <MessageActions
                          message={msg}
                          isMine={isMine}
                          canDeleteEverywhere={canDeleteEverywhere}
                          onDelete={() => {
                            setMessages((prev) =>
                              prev.filter((m) => m.id !== msg.id)
                            );
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 px-1 opacity-60 dark:opacity-30">
                    <span className="text-[9px] font-black uppercase tracking-widest text-foreground/70 dark:text-foreground">
                      {new Intl.DateTimeFormat('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      }).format(new Date(msg.created_at))}
                    </span>
                    <span className="text-[9px] font-black text-primary/40">
                      •
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">
                      TTL: {getTimeRemaining(msg.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-6 bg-card/10 border-t border-border/10 shrink-0">
        <form onSubmit={sendMessage} className="relative flex items-center">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              user?.is_frozen
                ? 'SIGNAL BLOCKED'
                : `Transmit message to ${isGlobal ? 'Global Hub' : receiverProfile?.full_name || 'Partner'}...`
            }
            disabled={user?.is_frozen}
            className="h-14 pl-6 pr-16 bg-slate-950/50 border-border/40 text-sm font-medium focus-visible:ring-primary/20 rounded-2xl shadow-inner italic"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || user?.is_frozen}
            className="absolute right-2 h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
