'use client';

import { useState, useEffect, useRef } from 'react';
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
  AlertTriangle,
  Ban,
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
import { toast } from 'sonner';
import { reportUser, blockUser } from '@/lib/moderation';

export function ChatWindow({
  receiverId = null,
  isGlobal = true,
  onClose,
  className,
  onNavigateToPrivate,
}) {
  const { user } = useAuth();
  const { markAsRead, setActiveChat } = useChat();
  const [messages, setMessages] = useState([]);

  // Track active chat in provider to prevent notification flicker
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
        // Fetch receiver profile if direct chat
        if (receiverId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', receiverId)
            .single();
          setReceiverProfile(profile);
        }

        // Fetch latest messages
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
          console.warn('Supabase Relation Error (Likely SQL not run):', error);
          // Fallback to simple query if relationship fails
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

    // Subscribe to new messages and read status updates
    const channel = supabase
      .channel(`chat-${isGlobal ? 'global' : receiverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: isGlobal ? 'is_global=eq.true' : undefined,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // If direct chat, filter manually
            if (!isGlobal) {
              const isRelevant =
                (payload.new.sender_id === user.id &&
                  payload.new.receiver_id === receiverId) ||
                (payload.new.sender_id === receiverId &&
                  payload.new.receiver_id === user.id);
              if (!isRelevant) return;
            }

            // Fetch sender info for the new message
            const { data: sender } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', payload.new.sender_id)
              .single();

            setMessages((prev) => [...prev, { ...payload.new, sender }]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, receiverId, isGlobal]);

  // Mark as read when messages arrive or window opens
  useEffect(() => {
    if (!user || isGlobal || !receiverId) return;
    if (messages.length === 0) return;

    const hasUnread = messages.some(
      (msg) => msg.sender_id === receiverId && !msg.is_read
    );
    if (hasUnread) {
      markAsRead(receiverId);
    }
  }, [user, receiverId, isGlobal, messages, markAsRead]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    if (user.is_frozen) {
      toast.error('Signal Blocked', {
        description:
          'Your communication protocols have been suspended by central administration. Revocation required.',
      });
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
      const { error } = await supabase.from('messages').insert(messageData);
      if (error) throw error;

      // AUTO-ACCESS GRANT: If admin messages a user directly, ensure user is not blocked
      if (user.role === 'admin' && !isGlobal && receiverId) {
        await supabase
          .from('profiles')
          .update({ access_granted: true })
          .eq('id', receiverId);
      }

      setNewMessage('');
    } catch (err) {
      console.error('Signal Transmission Failure:', err.message || err);
      toast.error(
        'Signal transmission failed: ' +
          (err.message || 'Unknown protocol error')
      );
    }
  };

  const handleProfileClick = async (targetUser) => {
    if (!user || !onNavigateToPrivate) return;
    if (targetUser.id === user.id) return;

    const { has_generator_access } = user;
    const isPro = has_generator_access || user.role === 'admin';

    // Rule: Pro users and Admins have full clearance to initiate contact.
    if (isPro) {
      onNavigateToPrivate(targetUser.id);
      return;
    }

    // Rule: For non-Pro users, restrict initiation.
    if (targetUser.role === 'admin') {
      // Check for existing administrative invite (any previous message from this admin)
      const { data: thread } = await supabase
        .from('messages')
        .select('id')
        .eq('sender_id', targetUser.id)
        .eq('receiver_id', user.id)
        .limit(1)
        .single();

      if (!thread) {
        toast.error('Clearance Required', {
          description:
            'Direct communication with administrators requires PRO protocol authorization or an administrative invite.',
        });
        return;
      }
    } else {
      // Non-Pro to Non-Pro: Restricted initiation.
      // But if there's an existing thread (someone messaged them), allow it.
      const { data: existingThread } = await supabase
        .from('messages')
        .select('id')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${user.id})`
        )
        .limit(1)
        .single();

      if (!existingThread) {
        toast.error('PRO Required', {
          description:
            'Initiating private lines with subscribers requires professional-grade authorization.',
        });
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
      {/* User-to-User Moderation Header (Only for Private) */}
      {!isGlobal && receiverProfile && (
        <div className="bg-card/20 backdrop-blur-xl border-b border-border/10 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs shadow-inner">
              {(receiverProfile.full_name ||
                receiverProfile.username ||
                'U')[0].toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-tight">
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
      >
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary opacity-20" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-2">
            <MessageSquare className="w-8 h-8" />
            <p className="text-[9px] font-black uppercase tracking-widest">
              Awaiting Link Establishment
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.sender_id === user?.id;
            const isAdmin = msg.sender?.role === 'admin';

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex flex-col max-w-[85%] space-y-1.5',
                  isMine ? 'ml-auto items-end' : 'mr-auto items-start'
                )}
              >
                {!isMine && isGlobal && (
                  <div
                    className="flex items-center gap-2 mb-0.5 cursor-pointer group/sender"
                    onClick={() => handleProfileClick(msg.sender)}
                  >
                    <div className="w-5 h-5 rounded-lg bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center text-[10px] font-black">
                      {msg.sender?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={msg.sender.avatar_url}
                          alt=""
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
                    <span className="text-[8px] font-black uppercase text-primary/40 tracking-widest group-hover/sender:text-primary transition-colors">
                      {msg.sender?.full_name ||
                        msg.sender?.username ||
                        'Subject'}
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    'px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all group relative',
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-tr-none shadow-md shadow-primary/10'
                      : isAdmin
                        ? 'bg-primary/5 border border-primary/20 text-foreground rounded-tl-none'
                        : 'bg-muted/40 border border-border/40 text-foreground rounded-tl-none'
                  )}
                >
                  {msg.text}
                  {/* Subtle highlight bar */}
                  <div
                    className={cn(
                      'absolute top-0 bottom-0 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
                      isMine
                        ? 'right-full mr-2 bg-primary/40'
                        : 'left-full ml-2 bg-primary/40'
                    )}
                  />
                </div>

                <div className="flex items-center gap-2 opacity-30 px-1">
                  <span className="text-[7px] font-black uppercase tracking-widest">
                    {new Intl.DateTimeFormat('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    }).format(new Date(msg.created_at))}
                  </span>
                  {isAdmin && (
                    <ShieldCheck className="w-2.5 h-2.5 text-primary" />
                  )}
                  {isMine && !isGlobal && (
                    <div className="flex items-center">
                      {msg.is_read ? (
                        <CheckCheck className="w-3 h-3 text-primary animate-in zoom-in" />
                      ) : (
                        <Check className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sleek Input */}
      <div className="p-6 shrink-0">
        <form onSubmit={sendMessage} className="relative group">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Initialize signal..."
            className="h-12 pl-5 pr-14 bg-card/40 border-border/40 rounded-2xl text-xs focus-visible:ring-primary/20 transition-all group-hover:border-primary/20"
          />
          <div className="absolute right-1.5 top-1.5">
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim()}
              className="h-9 w-9 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
