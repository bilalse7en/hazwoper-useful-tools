'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-provider';
import { showToast, showSuccess } from '@/lib/swal';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState({}); // { partnerId: count }
  const [totalUnread, setTotalUnread] = useState(0);
  const [globalUnread, setGlobalUnread] = useState(0);
  const [activeSenderId, setActiveSenderId] = useState(null);
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState([]);

  // Track which contacts we've marked as read in this session to prevent flicker
  const [sessionReadIds, setSessionReadIds] = useState(new Set());

  // Use refs for values accessed inside callbacks to keep callback identities stable
  const userRef = useRef(null);
  const activeSenderRef = useRef(null);
  const isGlobalOpenRef = useRef(false);

  // Fetch online users from database & Realtime presence
  const fetchOnlineUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, username, full_name, role, avatar_url, is_online, last_seen_at'
        )
        .eq('is_online', true)
        .order('full_name', { ascending: true });

      if (!error && data) {
        setOnlineUsers(data);
      }
    } catch (err) {
      console.warn('[Online Users] Fetch error:', err?.message);
    }
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    activeSenderRef.current = activeSenderId;
  }, [activeSenderId]);

  useEffect(() => {
    isGlobalOpenRef.current = isGlobalChatOpen;
  }, [isGlobalChatOpen]);

  const fetchAllUnread = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    try {
      // --- Private message unread counts ---
      const { data: privateMessages } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', currentUser.id)
        .eq('is_global', false)
        .eq('is_read', false);

      const counts = {};
      let privateTotal = 0;
      const currentActiveSender = activeSenderRef.current;

      setSessionReadIds((currentSessionIds) => {
        (privateMessages || []).forEach((m) => {
          if (
            m.sender_id === currentActiveSender ||
            currentSessionIds.has(m.sender_id)
          ) {
            counts[m.sender_id] = 0;
          } else {
            counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
            privateTotal++;
          }
        });

        // Clean up sessionReadIds for contacts with no unread
        const nextSet = new Set(currentSessionIds);
        let changed = false;
        currentSessionIds.forEach((id) => {
          const actualUnread = (privateMessages || []).filter(
            (m) => m.sender_id === id
          ).length;
          if (actualUnread === 0) {
            nextSet.delete(id);
            changed = true;
          }
        });
        return changed ? nextSet : currentSessionIds;
      });

      setUnreadCounts(counts);

      // --- Global message unread count ---
      let globalCount = 0;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('last_read_global_at')
          .eq('id', currentUser.id)
          .single();

        const lastRead = profile?.last_read_global_at;

        let globalQuery = supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('is_global', true)
          .neq('sender_id', currentUser.id);

        if (lastRead) {
          globalQuery = globalQuery.gt('created_at', lastRead);
        }

        const { count, error: gErr } = await globalQuery;
        if (!gErr) {
          globalCount = isGlobalOpenRef.current ? 0 : count || 0;
        }
      } catch {
        // last_read_global_at column may not exist yet
      }

      setGlobalUnread(globalCount);
      setTotalUnread(privateTotal + globalCount);
    } catch (err) {
      console.warn(
        '[Chat Shield] Notification sync skipped:',
        err?.message || err
      );
    }
  }, []); // stable — no deps, uses refs

  const markAsRead = useCallback(
    async (senderId) => {
      const currentUser = userRef.current;
      if (!currentUser || !senderId) return;
      if (senderId === 'se7en-bot' || senderId === 'puter-ai') return;

      // 1. Optimistic Update
      setSessionReadIds((prev) => {
        if (prev.has(senderId)) return prev;
        const next = new Set(prev);
        next.add(senderId);
        return next;
      });

      setUnreadCounts((prev) => {
        const currentCount = prev[senderId] || 0;
        if (currentCount > 0) {
          setTotalUnread((total) => Math.max(0, total - currentCount));
        }
        if (currentCount === 0 && prev[senderId] === 0) return prev;
        return { ...prev, [senderId]: 0 };
      });

      try {
        const { error } = await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('sender_id', senderId)
          .eq('receiver_id', currentUser.id);

        if (error) throw error;

        // Re-verify after a short delay
        setTimeout(() => fetchAllUnread(), 1000);
      } catch (err) {
        console.warn(
          '[Chat Shield] Mark as read skipped:',
          err?.message || err
        );
      }
    },
    [fetchAllUnread]
  );

  // Initial Fetch & Real-time Subscription — depend only on user?.id to avoid loops
  useEffect(() => {
    if (!user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnreadCounts({});
      setTotalUnread(0);
      setSessionReadIds(new Set());
      return;
    }

    fetchAllUnread();

    const channel = supabase
      .channel(`chat-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new.is_read) return;
          fetchAllUnread();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'is_global=eq.true',
        },
        () => {
          fetchAllUnread();
        }
      )
      .subscribe();

    const handleReadEvent = (e) => markAsRead(e.detail.senderId);
    window.addEventListener('messagesMarkedAsRead', handleReadEvent);

    return () => {
      window.removeEventListener('messagesMarkedAsRead', handleReadEvent);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const clearAllMessages = useCallback(
    async (isGlobalOnly = true, partnerId = null) => {
      if (!user) return { success: false, error: 'Unauthorized' };

      // Requirement: Global delete is ADMIN ONLY
      if (isGlobalOnly && user.role !== 'admin') {
        return {
          success: false,
          error: 'Administrative clearance required for global delete.',
        };
      }

      if (partnerId === 'se7en-bot' || partnerId === 'puter-ai') {
        localStorage.removeItem(`bot_chat_${user.id}`);
        if (partnerId === 'puter-ai') {
          localStorage.removeItem(`puter_chat_${user.id}`);
        }
        showSuccess('Chat signal cleared', 'Neural Bot thread reset.');
        window.dispatchEvent(
          new CustomEvent('deleteChatThread', { detail: { partnerId } })
        );
        return { success: true };
      }

      try {
        let query = supabase.from('messages').delete();

        if (isGlobalOnly) {
          // Admin clearing global
          query = query.eq('is_global', true);
        } else if (partnerId) {
          // User clearing a specific private thread
          query = query
            .eq('is_global', false)
            .or(
              `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
            );
        } else if (user.role === 'admin') {
          // Admin doing a mass delete (all global and all private)
          query = query.neq('id', '00000000-0000-0000-0000-000000000000');
        } else {
          // Non-admin trying mass delete: Not allowed
          return { success: false, error: 'Unauthorized mass delete attempt.' };
        }

        const { error } = await query;
        if (error) throw error;

        showSuccess(
          'Chat signal deleted',
          isGlobalOnly ? 'Global frequency cleared.' : 'Channel wiped.'
        );

        // Instant UI Response: Notify all open ChatWindow instances to clear their local state
        if (isGlobalOnly) {
          window.dispatchEvent(new CustomEvent('deleteGlobalChat'));
        } else if (partnerId) {
          window.dispatchEvent(
            new CustomEvent('deleteChatThread', { detail: { partnerId } })
          );
        }

        return { success: true };
      } catch (err) {
        console.warn('[Chat Shield] Delete error:', err?.message || err);
        showToast('Delete failed', 'error');
        return { success: false, error: err.message };
      }
    },
    [user]
  );

  // Subscribe to real-time profile online updates
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOnlineUsers();

    const profilesChannel = supabase
      .channel('public-profiles-online-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchOnlineUsers();
        }
      )
      .subscribe();

    const presenceChannel = supabase.channel('online-users-global');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const presentUsers = Object.values(state)
          .flat()
          .map((u) => ({
            id: u.id,
            username: u.username,
            full_name: u.full_name,
            role: u.role,
            avatar_url: u.avatar_url,
            is_online: true,
          }));
        if (presentUsers.length > 0) {
          setOnlineUsers((prev) => {
            const map = new Map();
            prev.forEach((p) => map.set(p.id, p));
            presentUsers.forEach((pu) => {
              if (pu.id)
                map.set(pu.id, { ...map.get(pu.id), ...pu, is_online: true });
            });
            return Array.from(map.values());
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [fetchOnlineUsers]);

  // Mark global chat as read when user opens global chat
  const markGlobalAsRead = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    setIsGlobalChatOpen(true);
    setGlobalUnread(0);
    try {
      await supabase
        .from('profiles')
        .update({ last_read_global_at: new Date().toISOString() })
        .eq('id', currentUser.id);
    } catch {
      // Column may not exist yet
    }
    setTimeout(() => fetchAllUnread(), 500);
  }, [fetchAllUnread]); // stable — uses ref for user

  // Track when global chat is closed
  const markGlobalChatClosed = useCallback(() => {
    setIsGlobalChatOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      unreadCounts,
      totalUnread,
      globalUnread,
      onlineUsers,
      fetchOnlineUsers,
      markAsRead,
      markGlobalAsRead,
      markGlobalChatClosed,
      setActiveChat: setActiveSenderId,
      refreshUnread: fetchAllUnread,
      clearAllMessages,
    }),
    [
      unreadCounts,
      totalUnread,
      globalUnread,
      onlineUsers,
      fetchOnlineUsers,
      markAsRead,
      markGlobalAsRead,
      markGlobalChatClosed,
      setActiveSenderId,
      fetchAllUnread,
      clearAllMessages,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
