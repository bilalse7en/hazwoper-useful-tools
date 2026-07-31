'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({
  user: null,
  loading: true,
  refreshUser: () => {},
  logout: () => {},
  toolSettings: {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [toolSettings, setToolSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Use a ref to track the current user ID for cleanup in auth state changes
  // This avoids putting `user` in the useEffect dependency array
  const userIdRef = useRef(null);
  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem('auth_toast_shown');
    window.location.href = '/';
  };

  const fetchProfile = async (sessionUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(
          'role, username, first_name, last_name, full_name, avatar_url, has_generator_access, email'
        )
        .eq('id', sessionUser.id)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
      }

      // Sync avatar from Gmail metadata to profile Table if profile avatar is missing
      const metadataAvatar = sessionUser.user_metadata?.avatar_url;
      if (metadataAvatar && !profile?.avatar_url) {
        await supabase
          .from('profiles')
          .update({ avatar_url: metadataAvatar })
          .eq('id', sessionUser.id);
      }

      const activeUser = {
        id: sessionUser.id,
        email: sessionUser.email,
        full_name:
          profile?.full_name || sessionUser.user_metadata?.full_name || '',
        name:
          profile?.full_name ||
          sessionUser.user_metadata?.full_name ||
          sessionUser.email,
        role: profile?.role || 'user',
        has_generator_access: profile?.has_generator_access || false,
        avatar: profile?.avatar_url || metadataAvatar || null,
        ...profile,
      };

      setUser(activeUser);
      localStorage.setItem('user', JSON.stringify(activeUser));
      return activeUser;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  };

  const refreshUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchProfile(session.user);
    } else {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  // Main initialization effect — runs ONCE on mount
  useEffect(() => {
    // Initial sync from localStorage for immediate UI response
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored user');
      }
    }

    // Check active session
    const initAuth = async () => {
      setLoading(true);
      try {
        // Fetch Tool Settings
        const { data: settings, error } = await supabase
          .from('tool_settings')
          .select('id, is_free');
        if (error) {
          console.warn(
            'Tool settings query notice (fallback active):',
            error?.message || error
          );
        } else if (settings) {
          const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.id] = curr.is_free;
            return acc;
          }, {});
          setToolSettings(settingsMap);
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (err) {
        if (
          err?.status === 401 ||
          err?.message === 'Unauthorized' ||
          err?.message?.includes('Unauthorized')
        ) {
          console.warn(
            '[Session Shield] Auth session unavailable (guest mode).'
          );
        } else if (
          err?.message === 'Invalid API key' ||
          err?.message?.includes('API key')
        ) {
          console.warn(
            'Supabase connection: Running with placeholder or invalid API key. Local configuration fallback active.'
          );
        } else {
          console.warn(
            '[Session Shield] Auth initialization error:',
            err?.message || err
          );
        }
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initAuth().catch((err) => {
      console.warn(
        '[Session Shield] Uncaught auth initialization error:',
        err?.message || err
      );
      setLoading(false);
    });

    // Listen for auth state changes
    let subscription;
    try {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          if (session?.user) {
            await fetchProfile(session.user);
          } else {
            const currentUserId = userIdRef.current;
            if (currentUserId) {
              await supabase
                .from('profiles')
                .update({ is_online: false })
                .eq('id', currentUserId);
            }
            setUser(null);
            localStorage.removeItem('user');
            sessionStorage.removeItem('auth_toast_shown');
          }
          setLoading(false);
        } catch (cbErr) {
          console.warn(
            '[Session Shield] Auth state change handler error:',
            cbErr?.message || cbErr
          );
          setLoading(false);
        }
      });
      subscription = sub;
    } catch (subErr) {
      console.warn(
        '[Session Shield] Auth subscription setup error:',
        subErr?.message || subErr
      );
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Dedicated presence & heartbeat effect for active user
  useEffect(() => {
    let heartbeatInterval;
    let presenceChannel;

    if (user?.id) {
      const updateOnlineStatus = async (online = true) => {
        try {
          await supabase
            .from('profiles')
            .update({
              is_online: online,
              last_seen_at: new Date().toISOString(),
            })
            .eq('id', user.id);
        } catch (err) {
          console.warn('[Presence] Status update skipped:', err?.message);
        }
      };

      // Mark online immediately
      updateOnlineStatus(true);

      // Heartbeat every 30 seconds to keep last_seen_at fresh
      heartbeatInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          updateOnlineStatus(true);
        }
      }, 30000);

      // Track tab visibility changes & unload
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          updateOnlineStatus(false);
        } else {
          updateOnlineStatus(true);
        }
      };

      const handleBeforeUnload = () => {
        const data = JSON.stringify({
          is_online: false,
          last_seen_at: new Date().toISOString(),
        });
        navigator.sendBeacon?.(`/api/profile?userId=${user.id}`, data);
        updateOnlineStatus(false);
      };

      window.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Set up global Supabase presence channel
      presenceChannel = supabase.channel('online-users-global', {
        config: { presence: { key: user.id } },
      });

      presenceChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            id: user.id,
            username: user.username || user.full_name || 'User',
            full_name: user.full_name || user.username || 'User',
            avatar_url: user.avatar_url || user.avatar || null,
            role: user.role || 'user',
            online_at: new Date().toISOString(),
          });
        }
      });

      return () => {
        clearInterval(heartbeatInterval);
        window.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        if (presenceChannel) {
          presenceChannel.untrack();
          supabase.removeChannel(presenceChannel);
        }
        updateOnlineStatus(false);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Dedicated real-time listener for user profile changes
  useEffect(() => {
    if (!user?.id) return;

    const profileSubscription = supabase
      .channel(`profile-sync-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          // Real-time profile sync
          // Pure functional update to avoid stale closure issues
          setUser((prev) => {
            const updated = { ...prev, ...payload.new };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [user?.id]);

  return (
    <AuthContext.Provider
      value={{ user, loading, refreshUser, logout, toolSettings }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
