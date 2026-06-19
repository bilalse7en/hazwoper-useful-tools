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
          if (error.code === '42P01') {
            console.warn(
              'Tool settings table not found. Defaulting to hardcoded values.'
            );
          } else {
            throw error;
          }
        } else if (settings) {
          const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.id] = curr.is_free;
            return acc;
          }, {});
          setToolSettings(settingsMap);
        }
      } catch (err) {
        console.error('Error fetching tool settings in provider:', err);
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
      setLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);

      if (session?.user) {
        await fetchProfile(session.user);

        // Mark as online
        await supabase
          .from('profiles')
          .update({ is_online: true })
          .eq('id', session.user.id);

        // Set up presence channel
        const presenceChannel = supabase.channel('online-users');
        presenceChannel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: session.user.id,
              online_at: new Date().toISOString(),
            });
          }
        });
      } else {
        // Use the ref to get the current user ID without adding `user` to deps
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
    });

    return () => {
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          console.log('Real-time profile update:', payload.new);
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
