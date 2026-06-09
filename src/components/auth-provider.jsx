'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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
        avatar:
          profile?.avatar_url || sessionUser.user_metadata?.avatar_url || null,
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
      } else {
        setUser(null);
        localStorage.removeItem('user');
        sessionStorage.removeItem('auth_toast_shown');
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, refreshUser, logout, toolSettings }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
