'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  MessageSquare,
  ShieldCheck,
  MoreHorizontal,
  Ban,
  AlertTriangle,
  Trash2,
  Bot,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { showConfirm, showToast } from '@/lib/swal';
import { blockUser, reportUser } from '@/lib/moderation';
import { cn } from '@/lib/utils';
import { useChat } from '@/components/chat-provider';

export function ChatSidebar({ onSelectContact, activeContactId, currentUser }) {
  const { unreadCounts, markAsRead } = useChat();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Persistent contact registry: never lose contacts when messages are cleared
  const contactRegistryRef = useRef(new Map());

  useEffect(() => {
    if (!currentUser) return;

    const fetchContacts = async () => {
      setLoading(true);
      try {
        // Fetch the most recent messages for the current user
        const { data: recentMessages, error } = await supabase
          .from('messages')
          .select(
            '*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)'
          )
          .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
          .eq('is_global', false)
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) throw error;

        // Merge into persistent registry (never remove existing contacts)
        recentMessages?.forEach((msg) => {
          const isSent = msg.sender_id === currentUser.id;
          const contactId = isSent ? msg.receiver_id : msg.sender_id;
          const profile = isSent ? msg.receiver : msg.sender;

          if (contactId && profile) {
            const existing = contactRegistryRef.current.get(contactId);
            if (
              !existing ||
              new Date(msg.created_at) > new Date(existing.last_interaction)
            ) {
              contactRegistryRef.current.set(contactId, {
                ...profile,
                last_message: msg.text,
                last_interaction: msg.created_at,
              });
            }
          }
        });

        // Also try to fetch from user_channels table for persistent contacts
        try {
          const { data: channels } = await supabase
            .from('user_channels')
            .select('partner_id, partner:profiles!partner_id(*)')
            .eq('user_id', currentUser.id);

          channels?.forEach((ch) => {
            if (ch.partner && !contactRegistryRef.current.has(ch.partner_id)) {
              contactRegistryRef.current.set(ch.partner_id, {
                ...ch.partner,
                last_message: null,
                last_interaction: ch.partner.created_at,
              });
            }
          });
        } catch {
          // user_channels table may not exist yet, that's fine
        }

        const sortedContacts = Array.from(
          contactRegistryRef.current.values()
        ).sort(
          (a, b) => new Date(b.last_interaction) - new Date(a.last_interaction)
        );

        setContacts(sortedContacts);
      } catch (err) {
        console.error('Sidebar Sync Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();

    // Listen for new messages (to add new contacts) but NOT for deletes (to preserve contacts)
    const channel = supabase
      .channel(`sidebar-sync-${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // Only refresh if this message involves the current user
          if (
            payload.new.sender_id === currentUser.id ||
            payload.new.receiver_id === currentUser.id
          ) {
            fetchContacts();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        () => {
          // On delete: update last_message displays but KEEP contacts
          // Just re-fetch to update the "last message" preview
          fetchContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  if (loading && contacts.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-primary/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="px-2 py-2 flex items-center gap-2 mb-1">
        <MessageSquare className="w-3.5 h-3.5 text-primary opacity-60 dark:opacity-40" />
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 dark:text-muted-foreground/60">
          Authorized Channels
        </span>
      </div>

      {/* Se7eN Bot - Fixed Top Channel */}
      <div
        onClick={() => onSelectContact('se7en-bot')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectContact('se7en-bot');
          }
        }}
        className={cn(
          'w-full p-2 flex items-center gap-3 rounded-xl border transition-all duration-300 relative group overflow-hidden cursor-pointer',
          activeContactId === 'se7en-bot'
            ? 'bg-primary/10 border-primary/30 shadow-sm'
            : 'bg-primary/5 border-primary/10 hover:bg-primary/10 hover:border-primary/20'
        )}
      >
        <div className="relative shrink-0">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center border font-black text-[10px] bg-primary/20 border-primary/30 text-primary overflow-hidden'
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/puter-bot.png"
              alt="Se7eN"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background shadow-sm shadow-emerald-500/20" />
        </div>
        <div className="flex-1 text-left overflow-hidden">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-black tracking-tight truncate text-primary uppercase italic">
              SE7EN BOT
            </span>
            <ShieldCheck className="w-2.5 h-2.5 text-primary shrink-0" />
          </div>
          <div className="flex items-center gap-1 opacity-60">
            <span className="text-[7px] font-black uppercase tracking-widest truncate shrink-0">
              Neural Assistant
            </span>
          </div>
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-border/20 rounded-2xl opacity-30">
          <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">
            No direct signals
          </p>
        </div>
      ) : (
        contacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => {
              onSelectContact(contact.id);
              markAsRead(contact.id);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectContact(contact.id);
                markAsRead(contact.id);
              }
            }}
            className={cn(
              'w-full p-2 flex items-center gap-3 rounded-xl border transition-all duration-300 relative group overflow-hidden cursor-pointer',
              activeContactId === contact.id
                ? 'bg-primary/5 border-primary/20 shadow-sm'
                : 'bg-transparent border-transparent hover:bg-primary/[0.03] hover:border-border/40'
            )}
          >
            <div className="relative shrink-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center border font-black text-[10px]',
                  activeContactId === contact.id
                    ? 'bg-primary/20 border-primary/20 text-primary'
                    : 'bg-muted/40 border-border/40 text-muted-foreground'
                )}
              >
                {contact.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={contact.avatar_url}
                    alt=""
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerText = (
                        contact.full_name ||
                        contact.username ||
                        'U'
                      )
                        .charAt(0)
                        .toUpperCase();
                    }}
                  />
                ) : (
                  (contact.full_name || contact.username || 'U')
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>
              {contact.is_online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background shadow-sm shadow-emerald-500/20" />
              )}
            </div>

            <div className="flex-1 text-left overflow-hidden">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={cn(
                    'text-[11px] font-black tracking-tight truncate',
                    activeContactId === contact.id
                      ? 'text-primary'
                      : 'text-foreground/80'
                  )}
                >
                  {contact.full_name || contact.username || 'Contact'}
                </span>
                {contact.role === 'admin' && (
                  <ShieldCheck className="w-2.5 h-2.5 text-primary shrink-0" />
                )}
                {/* Professionals hide 0 or active chat counts */}
                {(unreadCounts[contact.id] || 0) > 0 &&
                  activeContactId !== contact.id && (
                    <div className="ml-auto min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[8px] font-black flex items-center justify-center animate-in zoom-in shadow-sm shadow-primary/20">
                      {unreadCounts[contact.id]}
                    </div>
                  )}
              </div>
              <div className="flex items-center gap-1 opacity-50 dark:opacity-40">
                <span className="text-[7px] font-black uppercase tracking-widest truncate shrink-0 text-foreground/80 dark:text-foreground/40">
                  {contact.role === 'admin' ? 'Admin Node' : 'Subscriber'}
                </span>
                <span className="text-[7px] opacity-40 shrink-0">•</span>
                <span className="text-[9px] font-medium truncate italic leading-none whitespace-nowrap text-foreground/70 dark:text-foreground/40">
                  {contact.last_message || 'Awaiting signal...'}
                </span>
              </div>
            </div>

            {/* Management Menu (3 dots) */}
            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg hover:bg-primary/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-2xl bg-card/95 backdrop-blur-xl border-border p-2"
                >
                  <DropdownMenuLabel className="text-[8px] font-black uppercase tracking-widest opacity-40 px-3">
                    Channel Control
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      reportUser(
                        currentUser,
                        contact,
                        'System flagged from sidebar'
                      );
                    }}
                    className="rounded-xl flex items-center gap-3 p-2.5 text-xs font-bold text-amber-500 hover:bg-amber-500/10 focus:bg-amber-500/10"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Report User
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      blockUser(currentUser, contact);
                    }}
                    className="rounded-xl flex items-center gap-3 p-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10 focus:bg-red-500/10"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Block Contact
                  </DropdownMenuItem>
                  <div className="h-px bg-border/40 my-1 mx-2" />
                  <DropdownMenuItem
                    onClick={async (e) => {
                      e.stopPropagation();
                      const result = await showConfirm({
                        title: 'Delete History?',
                        text: 'This will erase your visual archive with this subscriber.',
                        icon: 'warning',
                        confirmButtonText: 'Yes, Delete',
                      });
                      if (result.isConfirmed) {
                        // Mark as read first to clear notifications
                        markAsRead(contact.id);
                        // Then trigger a specialized event for the provider to handle thread deletion
                        window.dispatchEvent(
                          new CustomEvent('deleteChatThread', {
                            detail: { partnerId: contact.id },
                          })
                        );
                      }
                    }}
                    className="rounded-xl flex items-center gap-3 p-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
