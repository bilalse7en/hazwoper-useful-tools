'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshCw,
  DatabaseZap,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RotateCcw,
  Flame,
  AlertTriangle,
  Search,
  StopCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { showToast, showSuccess, showConfirm } from '@/lib/swal';
import { cn } from '@/lib/utils';
import {
  syncSingleBlog,
  needsSync,
  SYNC_STATUS,
  CURRENT_BLOG_SYNC_VERSION,
} from '@/lib/blog-sync';

const STATUS_META = {
  completed: {
    label: 'Completed',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: CheckCircle2,
  },
  processing: {
    label: 'Processing',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Loader2,
  },
  failed: {
    label: 'Failed',
    className: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    icon: XCircle,
  },
  pending: {
    label: 'Pending',
    className: 'bg-muted text-muted-foreground border-border',
    icon: Clock,
  },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <Badge
      className={cn(
        'text-[9px] font-black uppercase tracking-widest border gap-1.5',
        meta.className
      )}
    >
      <Icon
        className={cn('w-3 h-3', status === 'processing' && 'animate-spin')}
      />
      {meta.label}
    </Badge>
  );
}

export default function AdminBlogSyncPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [currentBlogTitle, setCurrentBlogTitle] = useState('');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const cancelRef = useRef(false);

  useEffect(() => {
    // Ensure the Puter SDK is available for AI generation
    if (typeof window !== 'undefined' && !window.puter) {
      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      document.head.appendChild(script);
    }

    let cancelled = false;

    // Fetch all blogs in pages of 50 (never one giant request)
    const fetchBlogs = async () => {
      try {
        const PAGE = 50;
        const rows = [];
        for (let from = 0; ; from += PAGE) {
          const { data, error } = await supabase
            .from('blogs')
            .select(
              'id, title, slug, category, content, image_url, sync_status, sync_version, last_synced_at, sync_error, games, faq'
            )
            .order('created_at', { ascending: false })
            .range(from, from + PAGE - 1);
          if (error) throw error;
          if (data) rows.push(...data);
          if (!data || data.length < PAGE) break;
        }
        if (!cancelled) setBlogs(rows);
      } catch (err) {
        showToast(err.message || 'Failed to load blogs.', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBlogs();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const stats = useMemo(() => {
    const count = (status) =>
      blogs.filter((b) => (b.sync_status || SYNC_STATUS.PENDING) === status)
        .length;
    return {
      total: blogs.length,
      completed: count(SYNC_STATUS.COMPLETED),
      processing: count(SYNC_STATUS.PROCESSING),
      pending: blogs.filter((b) =>
        [SYNC_STATUS.PENDING, undefined, null].includes(b.sync_status)
      ).length,
      failed: count(SYNC_STATUS.FAILED),
    };
  }, [blogs]);

  const percent =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const filteredBlogs = useMemo(() => {
    if (!search) return blogs;
    const q = search.toLowerCase();
    return blogs.filter(
      (b) =>
        b.title?.toLowerCase().includes(q) || b.slug?.toLowerCase().includes(q)
    );
  }, [blogs, search]);

  async function runSync(mode) {
    if (running) return;

    if (mode === 'force') {
      const res = await showConfirm({
        title: 'Force Resync All Blogs?',
        text: 'Games and FAQs will be regenerated for EVERY blog and replaced with the latest valid version. Original article content is never modified. Existing feature images are kept.',
        confirmButtonText: 'Force Resync',
        icon: 'warning',
      });
      if (!res.isConfirmed) return;
    }

    setRunning(true);
    cancelRef.current = false;
    setProgress({ processed: 0, total: 0 });
    showToast(
      mode === 'force'
        ? 'Force resync started — regenerating all blogs...'
        : 'Blog synchronization started...',
      'info'
    );

    let succeeded = 0;
    let failed = 0;
    let skipped = 0;
    let processed = 0;

    try {
      // Target selection (idempotent gates live inside syncSingleBlog)
      const targets =
        mode === 'force'
          ? blogs
          : mode === 'retry'
            ? blogs.filter(
                (b) =>
                  b.sync_status === SYNC_STATUS.FAILED ||
                  b.sync_status === SYNC_STATUS.PENDING
              )
            : blogs.filter((b) => needsSync(b));

      setProgress({ processed: 0, total: targets.length });

      // Process one blog at a time (browser-side AI, safest for rate limits)
      for (const blog of targets) {
        if (cancelRef.current) break;

        setCurrentBlogTitle(blog.title || blog.slug);
        setBlogs((prev) =>
          prev.map((b) =>
            b.id === blog.id
              ? { ...b, sync_status: SYNC_STATUS.PROCESSING, sync_error: null }
              : b
          )
        );

        const result = await syncSingleBlog(blog, {
          force: mode === 'force',
          onUpdate: (status, info) => {
            setBlogs((prev) =>
              prev.map((b) =>
                b.id === blog.id
                  ? {
                      ...b,
                      sync_status: status,
                      sync_error: info?.error || null,
                      last_synced_at:
                        status === SYNC_STATUS.COMPLETED
                          ? new Date().toISOString()
                          : b.last_synced_at,
                      sync_version:
                        status === SYNC_STATUS.COMPLETED
                          ? CURRENT_BLOG_SYNC_VERSION
                          : b.sync_version,
                    }
                  : b
              )
            );
          },
        });

        if (result.skipped) skipped += 1;
        else if (result.ok) succeeded += 1;
        else failed += 1;

        processed += 1;
        setProgress({ processed, total: targets.length });
      }

      if (cancelRef.current) {
        showToast(
          `Sync cancelled — ${succeeded} completed, ${failed} failed, ${skipped} skipped.`,
          'info'
        );
      } else if (failed > 0) {
        showToast(
          `Sync finished: ${succeeded} succeeded, ${failed} failed. Use "Retry Failed".`,
          'warning'
        );
      } else {
        showSuccess(
          'Synchronization complete!',
          `${succeeded} processed, ${skipped} already up to date.`
        );
      }
    } catch (err) {
      showToast(err.message || 'Sync run failed.', 'error');
    } finally {
      setCurrentBlogTitle('');
      setRunning(false);
      setRefreshKey((k) => k + 1);
    }
  }

  const isOutdated = (blog) =>
    blog.sync_status === SYNC_STATUS.COMPLETED &&
    blog.sync_version !== CURRENT_BLOG_SYNC_VERSION;

  return (
    <div className="space-y-10 animate-in-fade">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-border pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <DatabaseZap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                Blog <span className="text-primary">Synchronization</span>
              </h1>
              <p className="text-muted-foreground font-medium text-sm">
                Give every blog a feature image, exactly 3 AI games and exactly
                5 AI FAQs — original articles are never modified.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {running ? (
            <Button
              variant="outline"
              onClick={() => (cancelRef.current = true)}
              className="h-12 px-6 rounded-2xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-black uppercase tracking-widest text-[10px] gap-2"
            >
              <StopCircle className="w-4 h-4" /> Cancel Sync
            </Button>
          ) : (
            <>
              <Button
                onClick={() => runSync('all')}
                className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20"
              >
                <RefreshCw className="w-4 h-4" /> Sync All Blogs
              </Button>
              <Button
                onClick={() => runSync('retry')}
                variant="outline"
                className="h-12 px-6 rounded-2xl border-border font-black uppercase tracking-widest text-[10px] gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Retry Failed
              </Button>
              <Button
                onClick={() => runSync('force')}
                variant="outline"
                className="h-12 px-6 rounded-2xl border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-black uppercase tracking-widest text-[10px] gap-2"
              >
                <Flame className="w-4 h-4" /> Force Resync All
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: 'Total Blogs',
            value: stats.total,
            icon: DatabaseZap,
            tone: 'text-primary',
          },
          {
            label: 'Completed',
            value: stats.completed,
            icon: CheckCircle2,
            tone: 'text-emerald-400',
          },
          {
            label: 'Processing',
            value: stats.processing,
            icon: Loader2,
            tone: 'text-amber-400',
          },
          {
            label: 'Pending',
            value: stats.pending,
            icon: Clock,
            tone: 'text-muted-foreground',
          },
          {
            label: 'Failed',
            value: stats.failed,
            icon: XCircle,
            tone: 'text-rose-400',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="rounded-[32px] border-border bg-card/40 backdrop-blur-xl shadow-xl"
            >
              <CardContent className="p-6 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </p>
                  <p
                    className={cn(
                      'text-3xl font-black tracking-tighter',
                      stat.tone
                    )}
                  >
                    {loading ? '—' : stat.value}
                  </p>
                </div>
                <Icon className="w-6 h-6 text-muted-foreground/40" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress */}
      <Card className="rounded-[32px] border-border bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden relative">
        {running && (
          <div className="h-1 w-full bg-gradient-to-r from-primary via-emerald-500 to-primary animate-pulse" />
        )}
        <CardContent className="p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {running
                  ? `Synchronizing (${progress.processed} / ${progress.total})`
                  : 'Synchronization Progress'}
              </p>
              <p className="text-2xl font-black tracking-tighter">
                {stats.completed} / {stats.total} blogs synchronized
              </p>
            </div>
            <span className="text-4xl font-black tracking-tighter text-primary">
              {percent}%
            </span>
          </div>

          <div className="relative h-3 w-full bg-muted/60 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

          {running && currentBlogTitle && (
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="truncate">Processing: {currentBlogTitle}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blog List */}
      <Card className="rounded-[40px] border-border bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary">
              Blog Registry ({filteredBlogs.length})
            </h3>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl h-10 text-xs border-border bg-background/50"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-primary opacity-30" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
                Loading Registry...
              </span>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-xs font-medium">
              No blogs found.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-background/40 hover:border-primary/30 transition-all"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={blog.sync_status} />
                      {isOutdated(blog) && (
                        <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[9px] font-black uppercase tracking-widest gap-1">
                          <AlertTriangle className="w-3 h-3" /> Outdated (v
                          {blog.sync_version})
                        </Badge>
                      )}
                      <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">
                        /{blog.slug}
                      </span>
                    </div>
                    <p className="text-sm font-black text-foreground truncate">
                      {blog.title}
                    </p>
                    {blog.sync_error && (
                      <p className="text-[11px] text-rose-400 font-medium truncate max-w-xl">
                        {blog.sync_error}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-5 shrink-0 text-right">
                    <div className="text-[10px] font-bold text-muted-foreground space-y-0.5">
                      <p>
                        Games:{' '}
                        {Array.isArray(blog.games) ? blog.games.length : 0} ·
                        FAQs: {Array.isArray(blog.faq) ? blog.faq.length : 0}
                      </p>
                      <p>
                        {blog.last_synced_at
                          ? new Date(blog.last_synced_at).toLocaleString()
                          : 'Never synced'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
