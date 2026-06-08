'use client';

import { Suspense, useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Shield,
  ShieldAlert,
  Search,
  RefreshCw,
  Layers,
  ShieldCheck,
  Image as ImageIcon,
  Video,
  FileText,
  Clock,
  Loader2,
  Zap,
  Library,
  Upload,
  Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { InitialLoadingShell } from '@/components/initial-loading-shell';
import { useSearchParams, useRouter } from 'next/navigation';
import { getTimeRemaining, formatSize } from '@/lib/tool-history';
import { toast } from 'sonner';
import { convertImage } from '@/lib/image-converter';

const formatFileType = (type) => {
  if (!type) return 'FILE';
  const t = type.toLowerCase();
  if (t.includes('spreadsheetml.sheet') || t.includes('excel')) return 'EXCEL';
  if (t.includes('wordprocessingml.document') || t.includes('msword'))
    return 'DOCX';
  if (t.includes('pdf')) return 'PDF';
  if (t.includes('image/')) return t.split('/').pop().toUpperCase();
  const ext = t.split('/').pop().toUpperCase();
  return ext.length > 5 ? ext.substring(0, 5) : ext;
};

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeView = searchParams.get('view') || 'dashboard';
  const [mediaItems, setMediaItems] = useState([]);
  const [libraryItems, setLibraryItems] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [blogItems, setBlogItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    async function initializeDashboard() {
      // Emergency timeout to ensure the UI becomes interactive if Supabase hangs
      const safetyTimer = setTimeout(() => {
        setLoading(false);
      }, 5000);

      setLoading(true);
      try {
        // Sequentially verify and fetch base data
        await checkAdmin();
        await fetchUsers(true); // silent fetch but with its own try/catch

        // Context-specific fetching
        if (activeView === 'media' || activeView === 'dashboard') {
          await fetchMediaData();
        }

        if (activeView === 'blogs') {
          await fetchBlogData();
        }

        if (activeView === 'media-library') {
          await fetchLibraryData();
        }
      } catch (err) {
        console.error('Neural Dashboard Initialization Failure:', err);
      } finally {
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    }

    initializeDashboard();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1); // Reset page on view change

    // Subscribe to REALTIME changes for Admin Monitoring
    const channel = supabase
      .channel('admin-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'media_hub' },
        () => {
          fetchMediaData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tool_history' },
        () => {
          fetchMediaData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blogs' },
        () => {
          fetchBlogData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeView]);

  async function checkAdmin() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      setCurrentUserId(session.user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
    } catch (e) {
      console.error('Admin verification error:', e);
    }
  }

  async function fetchMediaData() {
    try {
      let { data: media, error: mediaErr } = await supabase
        .from('media_hub')
        .select('*')
        .order('created_at', { ascending: false });

      if (mediaErr && mediaErr.code === '42703') {
        const fallback = await supabase.from('media_hub').select('*');
        media = fallback.data;
        mediaErr = fallback.error;
      }

      if (mediaErr) throw mediaErr;
      setMediaItems(media || []);

      let { data: history, error: histErr } = await supabase
        .from('tool_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (histErr && histErr.code === '42703') {
        const fallback = await supabase.from('tool_history').select('*');
        history = fallback.data;
        histErr = fallback.error;
      }

      if (histErr) throw histErr;
      setHistoryItems(history || []);
    } catch (err) {
      console.error('Error fetching media data:', err);
    }
  }

  async function fetchLibraryData() {
    try {
      const { data, error } = await supabase
        .from('media_hub')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLibraryItems(data || []);
    } catch (err) {
      console.error('Error fetching library:', err);
    }
  }

  async function handleDirectUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!currentUserId) {
      toast.error('Identity not verified. Please refresh.');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Synchronizing asset...');

    try {
      let fileToUpload = file;

      // GIF special handling: No optimization (to preserve animation) but strict size limit
      if (file.type.includes('gif')) {
        const sizeInMb = file.size / (1024 * 1024);
        if (sizeInMb > 2) {
          toast.error(
            'GIF too large. Maximum size is 2MB to ensure performance.',
            { id: toastId }
          );
          setIsUploading(false);
          return;
        }
      }

      // Optimize non-GIF images to WEBP only
      if (file.type.startsWith('image/') && !file.type.includes('gif')) {
        toast.loading('Optimizing to WebP format...', { id: toastId });
        const conversion = await convertImage(file, 'webp', {
          quality: 80,
          width: 1920,
        });
        fileToUpload = conversion.blob;
      }

      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const filePath = `library/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('media').getPublicUrl(filePath);

      // Record in Media Hub
      const { error: dbError } = await supabase.from('media_hub').insert([
        {
          file_name: file.name,
          file_type: file.type,
          file_size: fileToUpload.size,
          preview_url: publicUrl,
          download_url: publicUrl,
          expires_at: null, // Permanent library asset
          user_id: currentUserId,
        },
      ]);

      if (dbError) throw dbError;

      toast.success('Asset integrated.', {
        id: toastId,
        description: 'Global registry synchronized.',
      });
      fetchLibraryData();
    } catch (err) {
      console.error('Upload failure:', JSON.stringify(err, null, 2) || err);
      toast.error('Upload failed.', {
        id: toastId,
        description:
          err.message || 'Check database connection or bucket existence.',
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function deleteAsset(id, filePath) {
    if (!confirm('Permanent deletion requested. Proceed?')) return;
    try {
      const { error: dbError } = await supabase
        .from('media_hub')
        .delete()
        .eq('id', id);
      if (dbError) throw dbError;

      // Extract path from URL if possible, or just delete from DB
      // For now we just refresh DB view
      fetchLibraryData();
      toast.success('Asset purged.');
    } catch (err) {
      toast.error('Purge failed.');
    }
  }

  async function fetchBlogData() {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogItems(data || []);
    } catch (err) {
      console.error('Error fetching blogs:', err);
    }
  }

  async function deleteBlog(id) {
    if (!confirm('Are you sure you want to delete this editorial sequence?'))
      return;
    try {
      const { error } = await supabase.from('blogs').delete().eq('id', id);
      if (error) throw error;
      fetchBlogData();
    } catch (err) {
      console.error('Error deleting blog:', err);
    }
  }

  async function fetchUsers(silent = false) {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdmin(userId, isAdmin) {
    const newRole = isAdmin ? 'admin' : 'user';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      await fetchUsers(true);
      toast.success('Identity Reconfigured', {
        description: `Role escalated to ${newRole.toUpperCase()} for target subject.`,
      });
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error('Escalation Failed', {
        description: 'Neural synchronization error. Check RLS permissions.',
      });
    }
  }

  async function toggleGeneratorAccess(userId, hasAccess) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ has_generator_access: hasAccess })
        .eq('id', userId);

      if (error) throw error;
      await fetchUsers(true);
      toast.success('Access Logic Updated', {
        description: `Generator suite permissions ${hasAccess ? 'authorized' : 'revoked'}.`,
      });
    } catch (err) {
      console.error('Error updating generator access:', err);
      toast.error('Initialization Failed', {
        description: 'Access policy synchronization failed.',
      });
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedMedia = mediaItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedBlogs = blogItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages =
    activeView === 'permissions'
      ? Math.ceil(filteredUsers.length / itemsPerPage)
      : activeView === 'media'
        ? Math.ceil(mediaItems.length / itemsPerPage)
        : activeView === 'blogs'
          ? Math.ceil(blogItems.length / itemsPerPage)
          : activeView === 'media-library'
            ? Math.ceil(libraryItems.length / itemsPerPage)
            : 0;

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-10 py-6 border-t border-border bg-muted/10">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-xl border-border h-9 px-4 font-black uppercase tracking-widest text-[9px] gap-2"
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              if (
                totalPages > 5 &&
                p !== 1 &&
                p !== totalPages &&
                Math.abs(p - currentPage) > 1
              ) {
                if (p === 2 || p === totalPages - 1)
                  return (
                    <span key={p} className="px-1 text-muted-foreground">
                      ...
                    </span>
                  );
                return null;
              }
              return (
                <Button
                  key={p}
                  variant={currentPage === p ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage(p)}
                  className={cn(
                    'w-9 h-9 rounded-xl font-black text-[10px]',
                    currentPage === p
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {p}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-xl border-border h-9 px-4 font-black uppercase tracking-widest text-[9px] gap-2"
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <InitialLoadingShell isReady={!loading} />
      <div className="container mx-auto px-4 py-10 max-w-7xl animate-in-card space-y-8 focus:outline-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 capitalize">
              {activeView === 'dashboard'
                ? 'System Integrity'
                : activeView === 'media'
                  ? 'Media Monitoring'
                  : activeView === 'blogs'
                    ? 'Editorial Management'
                    : activeView === 'performance'
                      ? 'Optimization Engine'
                      : activeView === 'media-library'
                        ? 'Media Assets'
                        : 'User Registry'}
            </h1>
            <p className="text-muted-foreground mt-1 font-medium text-sm">
              {activeView === 'dashboard'
                ? 'Real-time telemetry and architectural status.'
                : activeView === 'media'
                  ? 'Global upload tracking and artifact auditing.'
                  : activeView === 'blogs'
                    ? 'Manage professional insights and editorial archives.'
                    : activeView === 'performance'
                      ? 'Resource lifecycle management and neural cache purging.'
                      : activeView === 'media-library'
                        ? 'Professional high-fidelity asset management.'
                        : 'Global user identity and permission synchronization.'}
            </p>
          </div>
          {activeView === 'blogs' && (
            <Button
              onClick={() => router.push('/admin/blogs/new')}
              className="h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20"
            >
              Create New Sequence
            </Button>
          )}
          {activeView === 'permissions' && (
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Search registry..."
                  className="pl-11 h-12 w-64 rounded-xl bg-card/40 border-border focus-visible:ring-primary shadow-inner font-medium transition-all"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-xl bg-card/40 border-border hover:bg-primary/5 hover:text-primary transition-all"
                onClick={() => fetchUsers()}
              >
                <RefreshCw
                  className={cn('w-4 h-4', loading ? 'animate-spin' : '')}
                />
              </Button>
            </div>
          )}
        </div>

        {activeView === 'dashboard' ? (
          <div className="space-y-8 animate-in-fade">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  label: 'Registry Entries',
                  value: users.length,
                  icon: User,
                  color: 'bg-primary',
                },
                {
                  label: 'Authorized Admins',
                  value: users.filter((u) => u.role === 'admin').length,
                  icon: ShieldAlert,
                  color: 'bg-emerald-500',
                },
                {
                  label: 'Total Uploads',
                  value: mediaItems.length,
                  icon: ImageIcon,
                  color: 'bg-blue-500',
                },
              ].map((stat, i) => (
                <Card
                  key={i}
                  className="rounded-[40px] border-border shadow-2xl overflow-hidden bg-card/40 backdrop-blur-xl group hover:border-primary/20 transition-all"
                >
                  <div className={cn('h-1.5 w-full', stat.color)} />
                  <CardHeader className="p-8">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-3">
                      <stat.icon className="w-4 h-4" /> {stat.label}
                    </CardTitle>
                    <div className="text-5xl font-black mt-2 tracking-tighter group-hover:scale-105 transition-transform origin-left">
                      {stat.value}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="rounded-[40px] border-border bg-card/40 backdrop-blur-xl p-8 space-y-6">
                <h3 className="text-xl font-black flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  Sync Status
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      label: 'Database Connection',
                      status: 'Active',
                      color: 'bg-emerald-500',
                    },
                    {
                      label: 'Auth Provider',
                      status: 'Operational',
                      color: 'bg-emerald-500',
                    },
                    {
                      label: 'Storage Engine',
                      status: 'Active',
                      color: 'bg-emerald-500',
                    },
                    {
                      label: 'Generator API',
                      status: 'Standby',
                      color: 'bg-blue-500',
                    },
                  ].map((sys, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/30"
                    >
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        {sys.label}
                      </span>
                      <Badge
                        className={cn(
                          'text-[9px] uppercase font-black px-2',
                          sys.color
                        )}
                        variant="default"
                      >
                        {sys.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="rounded-[40px] border-black/5 dark:border-white/10 bg-slate-900 dark:bg-black text-white p-8 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                  <Shield className="w-48 h-48" />
                </div>
                <div className="relative z-10 space-y-6">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Security Protocol
                  </h3>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">
                    The intelligence suite is operating under hardened security
                    protocols. All user role escalations are logged and
                    encrypted.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl border-white/20 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px]"
                    onClick={() => router.push('/admin?view=permissions')}
                  >
                    Review Access Records
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : activeView === 'media' ? (
          <div className="space-y-8 animate-in-fade">
            <Card className="rounded-[40px] shadow-2xl border-border overflow-hidden bg-card/40 backdrop-blur-xl">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b border-border h-14">
                    <TableHead className="pl-10 font-black uppercase tracking-widest text-[10px]">
                      Media Identification
                    </TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">
                      Attributed User
                    </TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">
                      Type
                    </TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">
                      Size
                    </TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">
                      Security Status
                    </TableHead>
                    <TableHead className="pr-10 text-right font-black uppercase tracking-widest text-[10px]">
                      Uploaded
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMedia.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-64 text-center font-black uppercase tracking-widest text-xs text-muted-foreground/50"
                      >
                        No artifacts detected in registry.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedMedia.map((item) => (
                      <TableRow
                        key={item.id}
                        className="h-20 hover:bg-primary/[0.02] border-b border-border/50 group transition-colors"
                      >
                        <TableCell className="pl-10">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
                              {item.file_type.includes('image') &&
                              item.preview_url ? (
                                <Image
                                  src={item.preview_url}
                                  alt="Preview"
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <FileText className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-black text-sm truncate max-w-[200px]">
                                {item.file_name}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground opacity-60">
                                ID: {item.id.substring(0, 8)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const u = users.find((u) => u.id === item.user_id);
                            return (
                              <div className="flex flex-col">
                                <span className="font-bold text-sm">
                                  {u?.full_name || u?.username || 'Guest'}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {u?.email}
                                </span>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="text-[9px] font-black uppercase tracking-widest bg-muted text-muted-foreground border-none"
                          >
                            {formatFileType(item.file_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono font-bold text-muted-foreground">
                            {formatSize(item.file_size)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.expires_at ? (
                            <Badge
                              variant="outline"
                              className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-black uppercase text-[9px] px-3 gap-2"
                            >
                              <Clock className="w-3 h-3" />{' '}
                              {getTimeRemaining(item.expires_at)}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black uppercase text-[9px] px-3 gap-2"
                            >
                              <ShieldCheck className="w-3 h-3" /> Permanent
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="pr-10 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-black">
                              {new Date(item.created_at).toLocaleTimeString(
                                [],
                                { hour: '2-digit', minute: '2-digit' }
                              )}
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {renderPaginationControls()}
            </Card>

            <Card className="rounded-[40px] shadow-2xl border-border bg-card/20 backdrop-blur-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Search className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-black uppercase tracking-widest">
                  Neural History Log
                </h3>
              </div>
              <div className="space-y-3">
                {historyItems.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/30 hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black capitalize">
                          {log.tool_type.replace('_', ' ')} Execution
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          User:{' '}
                          {users.find((u) => u.id === log.user_id)?.username ||
                            'Unknown Account'}{' '}
                          • {log.fileName || 'General Operation'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                      <Badge className="text-[8px] bg-primary/10 text-primary border-none shadow-none mt-1">
                        SECURE LOG
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : activeView === 'blogs' ? (
          <div className="space-y-8 animate-in-fade">
            <Card className="rounded-[40px] shadow-2xl border-border bg-card/40 backdrop-blur-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="h-14 border-b border-border">
                    <TableHead className="pl-10 font-black uppercase tracking-widest text-[10px]">
                      Article Detail
                    </TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">
                      Category
                    </TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">
                      Date
                    </TableHead>
                    <TableHead className="pr-10 text-right font-black uppercase tracking-widest text-[10px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBlogs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-64 text-center font-black uppercase tracking-widest text-xs text-muted-foreground/50"
                      >
                        No editorial sequences detected.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedBlogs.map((blog) => (
                      <TableRow
                        key={blog.id}
                        className="h-24 hover:bg-primary/[0.02] border-b border-border transition-colors group"
                      >
                        <TableCell className="pl-10">
                          <div className="flex flex-col">
                            <span className="font-black text-base">
                              {blog.title}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground opacity-60">
                              /{blog.slug}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-primary/5 text-primary border-none uppercase text-[9px] font-black"
                          >
                            {blog.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-muted-foreground">
                            {blog.date}
                          </span>
                        </TableCell>
                        <TableCell className="pr-10 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl font-bold bg-muted/50 hover:bg-primary/10 hover:text-primary"
                            onClick={() =>
                              router.push(`/admin/blogs/${blog.id}`)
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl font-bold text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteBlog(blog.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {renderPaginationControls()}
            </Card>
          </div>
        ) : activeView === 'performance' ? (
          <div className="space-y-8 animate-in-fade">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="rounded-[40px] border-border bg-card/40 backdrop-blur-xl p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-primary" />
                    Neural Cache Purge
                  </h3>
                  <Badge
                    variant="outline"
                    className="bg-primary/5 text-primary border-primary/20 font-black text-[9px]"
                  >
                    MANUALLY TRIGGERED
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Force synchronization across all edge nodes. This will
                  invalidate all cached paths and assets.
                </p>
                <div className="pt-4 space-y-3">
                  <Button
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                    onClick={async () => {
                      const id = toast.loading('Purging cache...');
                      try {
                        const res = await fetch('/api/admin/clear-cache', {
                          method: 'POST',
                        });
                        const data = await res.json();
                        if (data.success)
                          toast.success('Purged', {
                            id,
                            description: data.message,
                          });
                        else throw new Error(data.message);
                      } catch (err) {
                        toast.error('Failed', { id, description: err.message });
                      }
                    }}
                  >
                    Flush Global Cache
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-14 rounded-2xl border-border hover:bg-primary/5 font-black uppercase tracking-widest text-xs"
                    onClick={() => {
                      localStorage.clear();
                      toast.success('Wiped');
                    }}
                  >
                    Clear Local Memory
                  </Button>
                </div>
              </Card>

              <Card className="rounded-[40px] border-black/5 dark:border-white/10 bg-slate-900 dark:bg-black text-white p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                  <Zap className="w-48 h-48" />
                </div>
                <div className="relative z-10 space-y-6">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />{' '}
                    Resource Shield
                  </h3>
                  <p className="text-sm text-slate-400 font-medium">
                    Optimization credits managed via OptimizedGif Engine.
                  </p>
                  <div className="space-y-4 pt-2">
                    {[
                      {
                        label: 'Image Optimization',
                        used: '143K',
                        limit: '100K',
                        warning: true,
                      },
                      {
                        label: 'Edge Middleware',
                        used: '11K',
                        limit: '1M',
                        warning: false,
                      },
                      {
                        label: 'Data Transfer',
                        used: '3.43GB',
                        limit: '100GB',
                        warning: false,
                      },
                    ].map((stat, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-500">{stat.label}</span>
                          <span
                            className={
                              stat.warning
                                ? 'text-rose-500'
                                : 'text-emerald-500'
                            }
                          >
                            {stat.used} / {stat.limit}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              stat.warning ? 'bg-rose-500' : 'bg-emerald-500'
                            )}
                            style={{ width: stat.warning ? '100%' : '20%' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            <Card className="rounded-[40px] border-border bg-card/40 backdrop-blur-xl p-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Best Practices</h3>
                  <p className="text-muted-foreground text-sm font-medium">
                    System integrity guide.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {[
                  'Use OptimizedGif',
                  'Pre-Compress Media',
                  'Periodic Purge',
                ].map((t, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-3xl bg-muted/20 border border-border/50"
                  >
                    <h4 className="font-black text-sm uppercase tracking-widest mb-2">
                      {t}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Standard optimization protocol for production stability.
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : activeView === 'media-library' ? (
          <div className="space-y-8 animate-in-fade">
            <Card className="rounded-[40px] border-border bg-card/40 backdrop-blur-xl p-8 shadow-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Library className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">
                      Direct Asset Integration
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium max-w-md mt-1">
                      Upload and optimize professional high-fidelity assets.
                      Images are automatically compressed using our optimized
                      neural pipeline.
                    </p>
                  </div>
                </div>
                <label className="relative cursor-pointer group/upload">
                  <div className="h-16 px-10 rounded-[20px] bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5 group-hover/upload:-translate-y-0.5 transition-transform" />
                    )}
                    {isUploading ? 'Neural Processing...' : 'Upload New Asset'}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleDirectUpload}
                    disabled={isUploading}
                    accept="image/*,video/*,application/*"
                  />
                </label>
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {libraryItems
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
                )
                .map((item) => (
                  <Card
                    key={item.id}
                    className="rounded-[36px] overflow-hidden border-border bg-card/40 backdrop-blur-xl group hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                  >
                    <div className="aspect-[4/3] relative bg-muted/30 flex items-center justify-center overflow-hidden">
                      {item.file_type.includes('image') && item.preview_url ? (
                        <Image
                          src={item.preview_url}
                          alt={item.file_name}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          unoptimized
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                          <FileText className="w-16 h-16 text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {formatFileType(item.file_type)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 scale-95 group-hover:scale-100">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="rounded-2xl h-12 w-12 bg-white/10 hover:bg-white/20 border-white/10 text-white backdrop-blur-md"
                          onClick={() =>
                            window.open(item.download_url, '_blank')
                          }
                        >
                          <Search className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="rounded-2xl h-12 w-12 bg-rose-500/80 hover:bg-rose-600 border-none text-white backdrop-blur-md"
                          onClick={() => deleteAsset(item.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm font-black truncate group-hover:text-primary transition-colors">
                          {item.file_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                          Artifact ID: {item.id.substring(0, 8)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <span className="text-[11px] font-bold text-muted-foreground">
                          {formatSize(item.file_size)}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[9px] bg-primary/5 text-primary border-none px-2 h-5 font-black uppercase"
                        >
                          {item.file_type.split('/').pop()}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
            {libraryItems.length > itemsPerPage && renderPaginationControls()}
          </div>
        ) : (
          <Card className="rounded-[40px] shadow-2xl border-border overflow-hidden bg-card/40 backdrop-blur-xl animate-in-fade">
            <CardContent className="p-0">
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30 sticky top-0 z-10">
                    <TableRow className="hover:bg-transparent h-16 border-b border-border">
                      <TableHead className="w-[350px] font-black uppercase tracking-widest text-[10px] pl-10 text-muted-foreground">
                        User Identity
                      </TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                        Registry Reference
                      </TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-center text-muted-foreground">
                        Generator Suite
                      </TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-right pr-10 text-muted-foreground">
                        Escalation
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length === 0 && !loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-64 text-center font-black tracking-widest text-xs uppercase text-muted-foreground"
                        >
                          No matches found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((u) => (
                        <TableRow
                          key={u.id}
                          className="h-24 hover:bg-primary/[0.02] border-b border-border group"
                        >
                          <TableCell className="pl-10">
                            <div className="flex items-center gap-4">
                              <AvatarItem user={u} />
                              <div className="flex flex-col min-w-0">
                                <span className="font-black text-lg tracking-tight truncate">
                                  {u.full_name ||
                                    u.username ||
                                    u.email.split('@')[0]}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                                    {u.first_name} {u.last_name}
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-border" />
                                  <span className="text-[10px] font-medium text-muted-foreground truncate opacity-70 italic">
                                    {u.email}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-[10px] font-mono bg-muted/50 px-2 py-1 rounded-md text-muted-foreground border border-border">
                              {u.id.substring(0, 18)}...
                            </code>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Switch
                                checked={
                                  u.has_generator_access || u.role === 'admin'
                                }
                                disabled={u.role === 'admin'}
                                onCheckedChange={(checked) =>
                                  toggleGeneratorAccess(u.id, checked)
                                }
                              />
                              <span
                                className={cn(
                                  'text-[8px] font-black uppercase tracking-widest',
                                  u.has_generator_access || u.role === 'admin'
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                )}
                              >
                                {u.role === 'admin'
                                  ? 'Fixed Admin'
                                  : u.has_generator_access
                                    ? 'PRO Active'
                                    : 'Restricted'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-10">
                            <div className="flex justify-end items-center gap-4">
                              <Badge
                                className={cn(
                                  'uppercase text-[9px] font-black px-2 mt-0.5',
                                  u.role === 'admin'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-slate-500/10 text-slate-500'
                                )}
                                variant="secondary"
                              >
                                {u.role === 'admin' ? 'Architect' : 'Standard'}
                              </Badge>
                              <Switch
                                checked={u.role === 'admin'}
                                onCheckedChange={(checked) =>
                                  toggleAdmin(u.id, checked)
                                }
                                className="data-[state=checked]:bg-emerald-500"
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {renderPaginationControls()}
            </CardContent>
          </Card>
        )}

        <div className="p-10 rounded-[40px] bg-card/80 dark:bg-black/50 text-foreground transition-all border border-border space-y-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
            <Shield className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black flex items-center gap-3">
              <code className="bg-primary/10 px-3 py-1 rounded-xl text-primary">
                SQL
              </code>{' '}
              Override Guide
            </h3>
            <pre className="bg-black/50 p-6 rounded-2xl mt-6 border border-white/10 font-mono text-sm overflow-x-auto">
              {`UPDATE public.profiles SET role = 'admin', has_generator_access = true WHERE email = 'architect@example.com';`}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}

function AvatarItem({ user }) {
  return (
    <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center font-black text-xl text-primary shadow-sm relative overflow-hidden">
      {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      }
    >
      <AdminDashboard />
    </Suspense>
  );
}
