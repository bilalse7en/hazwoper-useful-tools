'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-provider';
import { showToast, showSuccess } from '@/lib/swal';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState({}); // { partnerId: count }
  const [totalUnread, setTotalUnread] = useState(0);
  const [activeSenderId, setActiveSenderId] = useState(null);

  // Track which contacts we've marked as read in this session to prevent flicker
  const [sessionReadIds, setSessionReadIds] = useState(new Set());

  const fetchAllUnread = useCallback(async () => {
    if (!user) return;

    try {
      const { data: messages } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', user.id)
        .or('is_read.eq.false,is_read.is.null');

      const counts = {};
      let totalToSet = 0;

      // We use a functional update for sessionReadIds and handle other state updates separately
      // but in a coordinated way to avoid loops.
      setSessionReadIds((currentSessionIds) => {
        messages?.forEach((m) => {
          if (
            m.sender_id === activeSenderId ||
            currentSessionIds.has(m.sender_id)
          ) {
            counts[m.sender_id] = 0;
          } else {
            counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
            totalToSet++;
          }
        });

        // Clean up sessionReadIds
        const nextSet = new Set(currentSessionIds);
        let changed = false;
        currentSessionIds.forEach((id) => {
          const actualUnread =
            messages?.filter((m) => m.sender_id === id).length || 0;
          if (actualUnread === 0) {
            nextSet.delete(id);
            changed = true;
          }
        });
        return changed ? nextSet : currentSessionIds;
      });

      setUnreadCounts(counts);
      setTotalUnread(totalToSet);
    } catch (err) {
      console.error('Chat Notification Sync Error:', err);
    }
  }, [user, activeSenderId]);

  const markAsRead = useCallback(
    async (senderId) => {
      if (!user || !senderId) return;
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
          .eq('receiver_id', user.id);

        if (error) throw error;

        // Re-verify after a short delay
        setTimeout(() => fetchAllUnread(), 1000);
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    },
    [user, fetchAllUnread]
  );

  // Initial Fetch & Real-time Subscription
  useEffect(() => {
    if (!user) {
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
      .subscribe();

    const handleReadEvent = (e) => markAsRead(e.detail.senderId);
    window.addEventListener('messagesMarkedAsRead', handleReadEvent);

    return () => {
      window.removeEventListener('messagesMarkedAsRead', handleReadEvent);
      supabase.removeChannel(channel);
    };
  }, [user, fetchAllUnread, markAsRead]);

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
        console.error('Delete error:', err);
        showToast('Delete failed', 'error');
        return { success: false, error: err.message };
      }
    },
    [user]
  );

  const value = useMemo(
    () => ({
      unreadCounts,
      totalUnread,
      markAsRead,
      setActiveChat: setActiveSenderId,
      refreshUnread: fetchAllUnread,
      clearAllMessages,
    }),
    [
      unreadCounts,
      totalUnread,
      markAsRead,
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
