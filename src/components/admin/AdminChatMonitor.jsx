'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  User,
  Activity,
  MessageSquare,
  ShieldOff,
  ShieldCheck,
  Search,
  RefreshCw,
  MoreVertical,
  ExternalLink,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function AdminChatMonitor({ onOpenChat, adminUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('is_online', { ascending: false })
        .order('full_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Fetch users error:', err);
      toast.error('System synchronization failure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();

    // Subscribe to profile changes (for live online/block status)
    const channel = supabase
      .channel('admin-user-monitor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.event === 'UPDATE') {
            setUsers((prev) =>
              prev.map((u) => (u.id === payload.new.id ? payload.new : u))
            );
          } else if (payload.event === 'INSERT') {
            setUsers((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleBlock = async (user, block) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          access_granted: !block,
          blocked_by_admin_name: block
            ? adminUser?.name || adminUser?.email
            : null,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(
        block ? 'User sequence terminated' : 'User sequence restored'
      );
    } catch (err) {
      console.error('Block error:', err);
      toast.error('Security override failed');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search active identities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-12 bg-card/40 border-border/40 rounded-2xl focus-visible:ring-primary/40"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchUsers}
          className="h-12 w-12 rounded-2xl border-border/40 bg-card/40 hover:bg-primary/5 hover:text-primary transition-all"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card
            key={user.id}
            className={cn(
              'p-5 rounded-[32px] border-border bg-card/40 backdrop-blur-xl hover:bg-card/60 transition-all group relative overflow-hidden',
              !user.access_granted && 'border-red-500/20 bg-red-500/[0.02]'
            )}
          >
            {!user.access_granted && (
              <div className="absolute top-0 right-0 p-4">
                <Ban className="w-12 h-12 text-red-500/10 rotate-12" />
              </div>
            )}

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center font-black text-xl text-primary shadow-inner">
                    {(user.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  {user.is_online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-background animate-pulse" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-sm tracking-tight truncate max-w-[150px]">
                    {user.full_name || 'Unknown User'}
                  </h4>
                  <p className="text-[10px] font-mono text-muted-foreground opacity-50 uppercase tracking-tighter">
                    {user.role}
                  </p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-[20px] bg-card/95 backdrop-blur-2xl border-border p-2"
                >
                  <DropdownMenuItem
                    onClick={() => onOpenChat(user.id)}
                    className="rounded-xl flex items-center gap-3 p-3 font-bold text-xs"
                  >
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Open Private Line
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl flex items-center gap-3 p-3 font-bold text-xs">
                    <ExternalLink className="w-4 h-4" />
                    View System Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  {user.access_granted ? (
                    <DropdownMenuItem
                      onClick={() => toggleBlock(user, true)}
                      className="rounded-xl flex items-center gap-3 p-3 font-bold text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <ShieldOff className="w-4 h-4" />
                      TERMINATE ACCESS
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => toggleBlock(user, false)}
                      className="rounded-xl flex items-center gap-3 p-3 font-bold text-xs text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      RESTORE CLEARANCE
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    user.is_online
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      : 'bg-muted-foreground/30'
                  )}
                />
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
                  {user.is_online ? 'Active Signal' : 'Signal Lost'}
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-[8px] font-black uppercase tracking-[0.1em] border-none px-2',
                  user.access_granted
                    ? 'bg-primary/5 text-primary'
                    : 'bg-red-500/10 text-red-500'
                )}
              >
                {user.access_granted ? 'CLEARED' : 'DENIED'}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
