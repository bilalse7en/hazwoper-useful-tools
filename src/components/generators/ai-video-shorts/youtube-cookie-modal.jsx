'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Cookie,
  Upload,
  CheckCircle2,
  Trash2,
  X,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
  KeyRound,
  RefreshCw,
  Copy,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { showToast, showSuccess } from '@/lib/swal';
import { cn } from '@/lib/utils';

export function YouTubeCookieModal({
  isOpen,
  onClose,
  onCookiesUpdated,
  initialUrl = '',
  onAnalyzeUrl,
}) {
  const [cookieStatus, setCookieStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeInputTab, setActiveInputTab] = useState('upload'); // 'upload' | 'paste' | 'guide'
  const [pastedCookies, setPastedCookies] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState(initialUrl);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialUrl) {
      setVideoUrlInput(initialUrl);
    }
  }, [initialUrl]);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/video-shorts/cookies');
      const data = await res.json();
      setCookieStatus(data);
    } catch (err) {
      console.warn('Failed to fetch cookies status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const saveCookies = async (content) => {
    if (!content || !content.trim()) {
      showToast('Please provide valid cookie content.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/video-shorts/cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookiesContent: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save cookies.');

      showSuccess(
        'YouTube Cookies Saved!',
        'Starting YouTube video import and processing...'
      );
      setPastedCookies('');
      await fetchStatus();
      if (onCookiesUpdated) onCookiesUpdated();

      if (videoUrlInput && videoUrlInput.trim() && onAnalyzeUrl) {
        onClose();
        setTimeout(() => {
          onAnalyzeUrl(videoUrlInput.trim());
        }, 200);
      }
    } catch (err) {
      showToast(err.message || 'Failed to save cookies.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await saveCookies(text);
    } catch (err) {
      showToast('Could not read file: ' + err.message, 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleFileDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await saveCookies(text);
    } catch (err) {
      showToast('Could not read file: ' + err.message, 'error');
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/video-shorts/cookies', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete cookies.');
      showToast('Cookies file removed.', 'info');
      await fetchStatus();
      if (onCookiesUpdated) onCookiesUpdated();
    } catch (err) {
      showToast(err.message || 'Failed to delete cookies.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const hasCookies = cookieStatus?.hasCookies;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-xs">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-foreground flex items-center gap-2">
                <span>YouTube Authentication (cookies.txt)</span>
                {hasCookies ? (
                  <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1 font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active</span>
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] text-muted-foreground font-mono"
                  >
                    Not Configured
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                Authenticate yt-dlp with your session to bypass YouTube bot
                detection & sign-in blocks.
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-xl w-8 h-8 p-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Status Alert Banner */}
          {hasCookies ? (
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-foreground">
                    YouTube cookies are active and ready!
                  </p>
                  <p className="text-muted-foreground">
                    File:{' '}
                    <span className="font-mono text-foreground">
                      {cookieStatus.path || 'cookies.txt'}
                    </span>{' '}
                    • Size: {(cookieStatus.size / 1024).toFixed(1)} KB
                    {cookieStatus.updatedAt &&
                      ` • Updated: ${new Date(cookieStatus.updatedAt).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="h-8 rounded-xl text-xs font-bold gap-1 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </Button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-foreground">
                  YouTube Bot Detection Warning
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  YouTube frequently blocks automated tools with{' '}
                  <code className="font-mono text-amber-600 dark:text-amber-400">
                    &ldquo;Please sign in&rdquo;
                  </code>
                  . Uploading your{' '}
                  <span className="font-bold text-foreground">cookies.txt</span>{' '}
                  lets yt-dlp fetch any video without failing or stalling.
                </p>
              </div>
            </div>
          )}

          {/* Direct Start Process Action Card when cookies are active */}
          {hasCookies && (
            <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">
                  Ready to Download: Paste YouTube Link & Start Processing
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  className="h-10 text-xs font-mono bg-background"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!videoUrlInput.trim()}
                  onClick={() => {
                    onClose();
                    if (onAnalyzeUrl) {
                      onAnalyzeUrl(videoUrlInput.trim());
                    }
                  }}
                  className="h-10 px-5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 gap-1.5 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start Process & Save to Media Hub</span>
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Authenticates with your active cookies to download the video,
                saves it to your Media Hub, and queues AI Shorts generation.
              </p>
            </div>
          )}

          {/* Tab Selector: Upload File | Paste Text | Quick Guide */}
          <div className="flex rounded-2xl bg-muted/60 p-1 border border-border/40 gap-1">
            <button
              type="button"
              onClick={() => setActiveInputTab('upload')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer',
                activeInputTab === 'upload'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveInputTab('paste')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer',
                activeInputTab === 'paste'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Text</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveInputTab('guide')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer',
                activeInputTab === 'guide'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>30s Setup Guide</span>
            </button>
          </div>

          {/* Tab 1: File Dropzone */}
          {activeInputTab === 'upload' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-3',
                isDragging
                  ? 'border-primary bg-primary/10 scale-[1.01]'
                  : 'border-border/80 hover:border-primary/50 bg-muted/20 hover:bg-muted/40'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">
                  Drop your{' '}
                  <span className="font-mono text-primary">cookies.txt</span>{' '}
                  here or <span className="underline text-primary">browse</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Standard Netscape format generated from Chrome or Firefox
                  extension.
                </p>
              </div>
              {isSubmitting && (
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving cookies to server...</span>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Paste Raw Content */}
          {activeInputTab === 'paste' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Paste raw cookies.txt content below:</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    Netscape format (# Netscape HTTP Cookie File)
                  </span>
                </label>
                <textarea
                  value={pastedCookies}
                  onChange={(e) => setPastedCookies(e.target.value)}
                  placeholder={`# Netscape HTTP Cookie File\n# https://curl.se/docs/http-cookies.html\n.youtube.com\tTRUE\t/\tTRUE\t1770000000\tLOGIN_INFO\t...`}
                  rows={7}
                  className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/40 leading-relaxed"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPastedCookies('')}
                  disabled={!pastedCookies || isSubmitting}
                  className="rounded-xl text-xs h-9 cursor-pointer"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveCookies(pastedCookies)}
                  disabled={!pastedCookies.trim() || isSubmitting}
                  className="rounded-xl text-xs font-bold h-9 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer gap-1.5"
                >
                  <Cookie className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Cookies'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Tab 3: Step-by-Step Guide */}
          {activeInputTab === 'guide' && (
            <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-4 text-xs">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <span>
                  How to export your YouTube cookies (Takes 30 seconds):
                </span>
              </h4>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      Install a free cookie exporter extension
                    </p>
                    <p className="text-muted-foreground">
                      We recommend the open-source{' '}
                      <strong className="text-foreground">
                        &ldquo;Get cookies.txt LOCALLY&rdquo;
                      </strong>{' '}
                      extension:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href="https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background border border-border hover:border-primary/50 text-[11px] font-semibold text-primary transition-colors"
                      >
                        <span>Chrome / Edge Extension</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://addons.mozilla.org/en-US/firefox/addon/get-cookies-txt-locally/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background border border-border hover:border-primary/50 text-[11px] font-semibold text-primary transition-colors"
                      >
                        <span>Firefox Add-on</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      Open YouTube
                    </p>
                    <p className="text-muted-foreground">
                      Visit{' '}
                      <a
                        href="https://youtube.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        youtube.com
                      </a>{' '}
                      and make sure you are signed into your account.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      Export or Copy
                    </p>
                    <p className="text-muted-foreground">
                      Click the extension icon in your browser toolbar and click{' '}
                      <strong className="text-foreground">
                        &ldquo;Export&rdquo;
                      </strong>{' '}
                      to download{' '}
                      <code className="font-mono text-foreground">
                        cookies.txt
                      </code>{' '}
                      (or click &ldquo;Copy to clipboard&rdquo;).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[11px]">
                    4
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      Drop or Paste here
                    </p>
                    <p className="text-muted-foreground">
                      Upload the file on the &ldquo;Upload File&rdquo; tab or
                      paste the content on the &ldquo;Paste Text&rdquo; tab
                      above.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Your cookies remain strictly private on your server and are
                  only passed to the local yt-dlp binary.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border/60 bg-muted/20 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Bypasses 2026 YouTube DPAPI & Bot walls seamlessly.
          </span>
          <Button
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-bold px-5 cursor-pointer"
          >
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
}
