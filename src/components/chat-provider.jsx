'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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
      // 1. Fetch breakdown by sender for Sidebar
      const { data: messages } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', user.id)
        .or('is_read.eq.false,is_read.is.null');

      // We need to access sessionReadIds without having it in dependencies
      // Using functional updates for everything to ensure consistency
      setSessionReadIds((currentSessionIds) => {
        const counts = {};
        let totalToSet = 0;

        messages?.forEach((m) => {
          // If sender is currently active OR was recently marked as read, ignore their unread count
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

        setUnreadCounts(counts);

        setTotalUnread(totalToSet);

        // Clean up sessionReadIds: if DB now objectively shows 0 unread for a contact,
        // we can stop tracking them in the session set.
        const next = new Set(currentSessionIds);
        let changed = false;
        currentSessionIds.forEach((id) => {
          const actualUnread =
            messages?.filter((m) => m.sender_id === id).length || 0;
          if (actualUnread === 0) {
            next.delete(id);
            changed = true;
          }
        });
        return changed ? next : currentSessionIds;
      });
    } catch (err) {
      console.error('Chat Notification Sync Sync Error:', err);
    }
  }, [user, activeSenderId]);

  const markAsRead = useCallback(
    async (senderId) => {
      if (!user || !senderId) return;

      // 1. Optimistic Update
      setSessionReadIds((prev) => new Set(prev).add(senderId));

      setUnreadCounts((prev) => {
        const currentCount = prev[senderId] || 0;
        if (currentCount > 0) {
          setTotalUnread((total) => Math.max(0, total - currentCount));
        }
        return { ...prev, [senderId]: 0 };
      });

      try {
        // 2. Database Update - Simplified and more aggressive to ensure persistence
        const { error } = await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('sender_id', senderId)
          .eq('receiver_id', user.id);

        if (error) {
          console.error('Supabase Update Error:', error);
          showToast('Sync Error: Failed to mark as read.', 'error');
          throw error;
        }

        // 3. Re-verify after a delay
        setTimeout(fetchAllUnread, 1000);
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    },
    [user, fetchAllUnread]
  );

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
          if (payload.eventType === 'UPDATE' && payload.new.is_read) {
            return;
          }
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

  const value = {
    unreadCounts,
    totalUnread,
    markAsRead,
    setActiveChat: setActiveSenderId,
    refreshUnread: fetchAllUnread,
    clearAllMessages: async (isGlobalOnly = true, partnerId = null) => {
      if (!user) return { success: false, error: 'Unauthorized' };

      // Requirement: Global purge is ADMIN ONLY
      if (isGlobalOnly && user.role !== 'admin') {
        return {
          success: false,
          error: 'Administrative clearance required for global purge.',
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
          // Admin doing a mass wipe (all global and all private)
          query = query.neq('id', '00000000-0000-0000-0000-000000000000');
        } else {
          // Non-admin trying mass wipe: Not allowed
          return { success: false, error: 'Unauthorized mass purge attempt.' };
        }

        const { error } = await query;
        if (error) throw error;

        showSuccess(
          'Chat signal purged',
          isGlobalOnly ? 'Global frequency cleared.' : 'Channel wiped.'
        );
        return { success: true };
      } catch (err) {
        console.error('Purge error:', err);
        showToast('Purge failed', 'error');
        return { success: false, error: err.message };
      }
    },
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
