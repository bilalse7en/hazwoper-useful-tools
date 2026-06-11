'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  RefreshCw,
  Ban,
  MessageSquare,
  AlertTriangle,
  UserX,
  History,
  Activity,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { createColumnHelper } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export function ChatModerationList({ onOpenChat }) {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);

      // Also fetch recent reports
      const { data: reportData } = await supabase
        .from('user_interactions')
        .select(
          '*, reporter:profiles!reporter_id(full_name, email), target:profiles!target_id(full_name, email)'
        )
        .eq('type', 'report')
        .order('created_at', { ascending: false })
        .limit(50);

      setReports(reportData || []);

      // Fetch recent messages
      const { data: messageData } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(full_name, email, role)')
        .order('created_at', { ascending: false })
        .limit(50);

      setMessages(messageData || []);
    } catch (err) {
      console.error('Moderation Sync Error:', err);
      // If table doesn't exist, we might need SQL execution
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();

    const channel = supabase
      .channel('moderation-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchUsers()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_interactions' },
        () => fetchUsers()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchUsers()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const toggleFreeze = async (user, freeze) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_frozen: freeze })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(
        freeze
          ? `Identity ${user.full_name} Frozen`
          : `Identity ${user.full_name} Restored`,
        {
          description: freeze
            ? 'Messenger protocols suspended.'
            : 'Full signal clearance granted.',
        }
      );
    } catch (err) {
      toast.error('Protocol Override Failed');
    }
  };

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor('full_name', {
      header: 'Terminal Subject',
      cell: (info) => {
        const u = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border shadow-inner',
                u.is_frozen
                  ? 'bg-red-500/10 border-red-500/20 text-red-500'
                  : 'bg-primary/10 border-primary/20 text-primary'
              )}
            >
              {(u.full_name || u.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-black text-xs tracking-tight truncate">
                {u.full_name || u.username || 'Unknown Subject'}
              </span>
              <span className="text-[9px] font-mono opacity-40 truncate">
                {u.email}
              </span>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('role', {
      header: 'Authority',
      cell: (info) => (
        <Badge
          variant="outline"
          className={cn(
            'uppercase text-[8px] font-black tracking-widest px-2 py-0.5',
            info.getValue() === 'admin'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : 'bg-muted text-muted-foreground border-border/40'
          )}
        >
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('is_frozen', {
      header: 'Link Status',
      cell: (info) => {
        const isFrozen = info.getValue();
        return (
          <Badge
            variant="outline"
            className={cn(
              'uppercase text-[8px] font-black tracking-widest px-2 py-0.5 animate-pulse',
              isFrozen
                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            )}
          >
            {isFrozen ? 'FROZEN' : 'ACTIVE'}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('created_at', {
      header: 'Registered',
      cell: (info) => (
        <span className="text-[10px] font-mono opacity-50">
          {new Date(info.getValue()).toLocaleDateString()}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Directives</div>,
      cell: (info) => {
        const u = info.row.original;
        const isAdmin = u.role === 'admin';
        return (
          <div className="flex justify-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl hover:bg-primary/5"
                >
                  <MoreHorizontal className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-2xl bg-card/95 backdrop-blur-xl border-border p-2"
              >
                <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest opacity-40 px-3">
                  Protocol Commands
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => onOpenChat(u.id)}
                  className="rounded-xl flex items-center gap-3 p-3 text-xs font-bold"
                >
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Direct Intercept
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border/40" />

                {u.is_frozen ? (
                  <DropdownMenuItem
                    onClick={() => toggleFreeze(u, false)}
                    className="rounded-xl flex items-center gap-3 p-3 text-xs font-bold text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    REVOKE FREEZE (RESTORE)
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    disabled={isAdmin}
                    onClick={() => toggleFreeze(u, true)}
                    className={cn(
                      'rounded-xl flex items-center gap-3 p-3 text-xs font-bold text-red-500 hover:bg-red-500/5',
                      isAdmin && 'opacity-20 grayscale'
                    )}
                  >
                    <Ban className="w-4 h-4" />
                    FREEZE SUBJECT
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }),
  ];

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tighter uppercase italic">
            Chat Modulation <span className="text-primary">Registry</span>
          </h2>
          <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1">
            Live Sentinel Surveillance Active
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-40" />
            <Input
              placeholder="Search Identities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-card/40 border-border/40 rounded-xl text-xs"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchUsers}
            className="h-10 w-10 rounded-xl bg-card border-border/40 hover:bg-primary/5"
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', loading && 'animate-spin')}
            />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="rounded-[32px] border border-border/40 bg-card/30 backdrop-blur-3xl overflow-hidden shadow-2xl shadow-primary/5">
            <DataTable
              columns={columns}
              data={filteredUsers}
              loading={loading}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Live Signal Intercept */}
          <div className="p-6 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Live Signal Intercept
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
              {messages.length === 0 ? (
                <div className="text-center py-6 opacity-20">
                  <p className="text-[9px] font-black uppercase tracking-widest">
                    No active signals detected
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 rounded-2xl bg-card/40 border border-border/40 space-y-1 hover:border-emerald-500/20 transition-colors cursor-pointer group"
                    onClick={() => onOpenChat(msg.sender_id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black text-primary uppercase tracking-widest">
                        {msg.is_global ? 'Global Frequency' : 'Direct Line'}
                      </span>
                      <span className="text-[7px] font-mono opacity-40">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium leading-relaxed opacity-80 break-words">
                      <span className="font-black text-primary pr-1">
                        {msg.sender?.full_name || 'Subject'}:
                      </span>
                      {msg.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Incoming Incident Reports */}
          <div className="p-6 rounded-[32px] bg-primary/5 border border-primary/10 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" />
              Incoming Incident Reports
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
              {reports.length === 0 ? (
                <div className="text-center py-8 opacity-20">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest">
                    No Alerts Flagged
                  </p>
                </div>
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-3 rounded-2xl bg-card/40 border border-border/40 space-y-2 group hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">
                        Misconduct Signal
                      </span>
                      <span className="text-[7px] font-mono opacity-40">
                        {new Date(report.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium leading-relaxed italic opacity-80 underline underline-offset-4 decoration-primary/20">
                      &quot;{report.reason}&quot;
                    </p>
                    <div className="flex items-center gap-2 pt-2 border-t border-border/20 mt-2">
                      <div className="flex flex-col flex-1">
                        <span className="text-[7px] uppercase font-bold opacity-40">
                          Reporter
                        </span>
                        <span className="text-[9px] font-bold truncate">
                          {report.reporter?.full_name || 'Subject'}
                        </span>
                      </div>
                      <UserX className="w-3 h-3 opacity-20" />
                      <div className="flex flex-col flex-1 text-right">
                        <span className="text-[7px] uppercase font-bold opacity-40">
                          Target
                        </span>
                        <span className="text-[9px] font-bold text-primary truncate">
                          {report.target?.full_name || 'Node'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Modulation Metrics */}
          <div className="p-6 rounded-[32px] bg-card/40 border border-border/40 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <History className="w-3 h-3" />
              Modulation Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/20">
                <span className="block text-[8px] font-black opacity-40 uppercase mb-1">
                  Total Identity
                </span>
                <span className="text-xl font-black italic">
                  {users.length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-red-500/[0.03] border border-red-500/10">
                <span className="block text-[8px] font-black text-red-500 uppercase mb-1">
                  Frozen Link
                </span>
                <span className="text-xl font-black text-red-500 italic">
                  {users.filter((u) => u.is_frozen).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
