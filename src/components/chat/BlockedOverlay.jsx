'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { ShieldAlert } from 'lucide-react';

export function BlockedOverlay() {
  const { user } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    if (!user) return;

    // Initial check
    const checkStatus = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('access_granted, blocked_by_admin_name')
        .eq('id', user.id)
        .single();

      if (data && data.access_granted === false) {
        setIsBlocked(true);
        setAdminName(data.blocked_by_admin_name);
      }
    };

    checkStatus();

    // Real-time subscription to profile changes
    const channel = supabase
      .channel(`profile-status-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.access_granted === false) {
            setIsBlocked(true);
            setAdminName(payload.new.blocked_by_admin_name);
          } else {
            setIsBlocked(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!isBlocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="max-w-md w-full space-y-8 p-12 rounded-[40px] border border-red-500/20 bg-red-500/5 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none" />

        <div className="relative space-y-6">
          <div className="w-24 h-24 rounded-[32px] bg-red-500/20 flex items-center justify-center text-red-500 mx-auto shadow-inner">
            <ShieldAlert className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tighter uppercase text-red-500">
              Access Terminated
            </h2>
            <p className="text-muted-foreground font-medium text-lg leading-relaxed">
              Your administrative credentials have been revoked. Current session
              frozen.
            </p>
          </div>

          <div className="pt-6 border-t border-red-500/20">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-red-400/60">
              Instructional Directive:
            </p>
            <p className="mt-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-red-200">
              Please get permissions from{' '}
              {adminName || 'Technical Administrator'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
