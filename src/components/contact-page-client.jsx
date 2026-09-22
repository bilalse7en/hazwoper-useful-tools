'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Copy,
  Check,
  CornerDownRight,
  User,
  Inbox,
  HelpCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { showSuccess, showAlert, showToast } from '@/lib/swal';
import { cn } from '@/lib/utils';

const LOCAL_STORAGE_KEY = 'my_contact_inquiries';

export function ContactPageClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });

  // Inquiries tracking state
  const [myInquiries, setMyInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messageInputRef = useRef(null);
  const formRef = useRef(null);

  // Fetch updated status of inquiries from server
  const refreshInquiryStatus = useCallback(async (idsToFetch = null) => {
    if (typeof window === 'undefined') return;

    let targetIds = idsToFetch;
    if (!targetIds) {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            targetIds = parsed.map((i) => i.id).filter(Boolean);
          }
        }
      } catch (e) {
        console.warn('Failed to parse local inquiries:', e);
      }
    }

    if (!targetIds || targetIds.length === 0) return;

    setInquiriesLoading(true);
    try {
      const res = await fetch('/api/contact/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryIds: targetIds }),
      });

      if (!res.ok) return;
      const data = await res.json();
      const serverInquiries = data.inquiries || [];

      setMyInquiries((prev) => {
        const merged = prev.map((local) => {
          const match = serverInquiries.find((s) => s.id === local.id);
          return match ? { ...local, ...match } : local;
        });

        // Also add any server records that weren't in state
        serverInquiries.forEach((serv) => {
          if (!merged.some((m) => m.id === serv.id)) {
            merged.push(serv);
          }
        });

        merged.sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );

        try {
          localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify(merged.slice(0, 30))
          );
        } catch (storageErr) {
          console.warn('Storage save warning:', storageErr);
        }

        return merged;
      });
    } catch (err) {
      console.warn('Failed to fetch inquiry status:', err);
    } finally {
      setInquiriesLoading(false);
    }
  }, []);

  // Initialize inquiries on mount and check URL query param
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load from local storage
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMyInquiries(parsed);
          refreshInquiryStatus(parsed.map((i) => i.id));
        }
      }
    } catch (e) {
      console.warn('Local storage read error:', e);
    }

    // Check for ?inquiry=ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const inqParam = urlParams.get('inquiry');
    if (inqParam) {
      setHighlightedId(inqParam);
      // If we don't have this inquiry locally yet, fetch it by ID
      refreshInquiryStatus([inqParam]);

      setTimeout(() => {
        const el = document.getElementById(`inquiry-${inqParam}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 700);
    }
  }, [refreshInquiryStatus]);

  // Handle email-based historical lookup
  const handleLookupByEmail = async (e) => {
    e.preventDefault();
    if (!lookupEmail.trim()) return;

    setLookupLoading(true);
    try {
      const res = await fetch(
        `/api/contact/status?email=${encodeURIComponent(lookupEmail.trim().toLowerCase())}`
      );
      const data = await res.json();
      const found = data.inquiries || [];

      if (found.length === 0) {
        showToast('No inquiries found for this email address.', 'info');
      } else {
        setMyInquiries((prev) => {
          const combined = [...found];
          prev.forEach((item) => {
            if (!combined.some((c) => c.id === item.id)) {
              combined.push(item);
            }
          });
          combined.sort(
            (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
          );
          localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify(combined.slice(0, 30))
          );
          return combined;
        });

        showSuccess(
          'Inquiries Retrieved',
          `Found ${found.length} inquiry record(s) linked to your email.`
        );
        setShowLookup(false);
      }
    } catch (err) {
      console.error('Lookup error:', err);
      showToast('Failed to retrieve inquiries. Please try again.', 'error');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Pre-fill form for follow-up response
  const handleFollowUp = (inquiry) => {
    setFormData({
      name: inquiry.name || '',
      email: inquiry.email || '',
      subject: inquiry.subject.startsWith('Re:')
        ? inquiry.subject
        : `Re: ${inquiry.subject}`,
      message: '',
    });

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }, 400);

    showToast('Form pre-filled for follow-up message.', 'info');
  };

  const handleCopyReply = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Official response copied to clipboard.', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.subject.trim() ||
      !formData.message.trim()
    ) {
      setStatus({
        type: 'error',
        message: 'Please complete all required fields before dispatching.',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        console.warn('Failed to parse response JSON:', parseErr);
        data = {
          error: res.ok
            ? null
            : `Server status ${res.status}: Failed to process inquiry`,
        };
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch message.');
      }

      const assignedId =
        data.inquiryId || data.inquiry?.id || 'inq-' + Date.now().toString(36);

      // Create new local inquiry record
      const newInquiryRecord = {
        id: assignedId,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        status: 'unread',
        created_at: data.inquiry?.created_at || new Date().toISOString(),
        reply_message: null,
        replied_at: null,
        replied_by_name: null,
      };

      // Update state and localStorage
      setMyInquiries((prev) => {
        const updated = [
          newInquiryRecord,
          ...prev.filter((i) => i.id !== assignedId),
        ].slice(0, 30);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed saving to localStorage:', e);
        }
        return updated;
      });

      // Highlight new entry
      setHighlightedId(assignedId);

      // Notify global notifier
      window.dispatchEvent(new Event('inquiry_updated'));

      setStatus({
        type: 'success',
        message:
          data.message ||
          'Message safely dispatched. We will be in touch shortly.',
      });
      showSuccess(
        'Message Dispatched',
        data.message || 'Inquiry successfully transmitted.'
      );

      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });

      // Scroll to the inquiries section so user sees their inquiry card immediately
      setTimeout(() => {
        const el = document.getElementById(`inquiry-${assignedId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    } catch (err) {
      console.error('Contact form submission error:', err);
      setStatus({
        type: 'error',
        message:
          err.message ||
          'Unable to deliver message at this time. Please try again.',
      });
      showAlert('Delivery Issue', err.message || 'Could not send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Hero Section: Balanced 2-Column Responsive Layout */}
      <section className="relative pt-10 sm:pt-14 md:pt-16 pb-10 sm:pb-12 overflow-hidden border-b border-border bg-card/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.06),transparent_60%)] pointer-events-none" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Hero Column */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-7 space-y-4 text-left"
            >
              <Badge className="bg-primary/10 text-primary border border-primary/20 font-black uppercase tracking-[0.15em] text-[10px] px-3.5 py-1 rounded-full w-fit flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Technical Support Desk
              </Badge>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
                Get in <span className="text-primary italic">Touch.</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-medium max-w-xl">
                Have questions about our tools, custom workflows, or feature
                requests? Our engineering team reviews all user transmissions
                and delivers verified administrator responses.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-1.5 bg-muted/50 border border-border/80 px-3 py-1.5 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  ~2-4h Turnaround
                </span>
                <span className="flex items-center gap-1.5 bg-muted/50 border border-border/80 px-3 py-1.5 rounded-xl">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Zero Server Data Retention
                </span>
                <span className="flex items-center gap-1.5 bg-muted/50 border border-border/80 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  On-Page Reply Tracking
                </span>
              </div>
            </motion.div>

            {/* Right Hero Column: Support SLA & Operations Matrix (Fills void) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <div className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl p-6 shadow-xl space-y-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 blur-3xl -z-10" />

                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">
                      Support Ops Live
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5"
                  >
                    ALL REGIONS ACTIVE
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" /> Response Time
                    </span>
                    <p className="text-xl font-black text-foreground">
                      ~2-4 Hrs
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Standard business SLA
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />{' '}
                      Resolution
                    </span>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      99.8%
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Verified engineer replies
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Direct Inquiries Email
                    </span>
                    <p className="font-mono font-bold text-foreground">
                      bilalghaffar46@gmail.com
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText('bilalghaffar46@gmail.com');
                      showToast('Email copied to clipboard', 'success');
                    }}
                    className="h-8 px-2.5 rounded-xl text-[11px] font-bold"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tracked Inquiries & Official Responses Section */}
      {myInquiries.length > 0 && (
        <section
          id="inquiries-list"
          className="py-10 border-b border-border bg-card/30"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    Your Inquiries &amp; Official Responses
                  </h2>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Real-time conversation thread between you and our technical
                    staff.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshInquiryStatus()}
                  disabled={inquiriesLoading}
                  className="rounded-xl h-8 px-3 text-xs font-bold border-border bg-background"
                >
                  <RefreshCw
                    className={cn(
                      'w-3.5 h-3.5 mr-1.5',
                      inquiriesLoading ? 'animate-spin' : ''
                    )}
                  />
                  Refresh
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLookup((prev) => !prev)}
                  className="rounded-xl h-8 px-3 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  <Search className="w-3.5 h-3.5 mr-1.5" />
                  {showLookup ? 'Hide Lookup' : 'Lookup Inquiries'}
                </Button>
              </div>
            </div>

            {/* Email Lookup Drawer */}
            <AnimatePresence>
              {showLookup && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleLookupByEmail}
                  className="mb-6 p-5 rounded-2xl bg-muted/40 border border-border space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                      Retrieve Inquiries from Another Device
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the email address used during your submission to load
                    your inquiry history into this session.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <Input
                      type="email"
                      value={lookupEmail}
                      onChange={(e) => setLookupEmail(e.target.value)}
                      placeholder="Enter your inquiry email address..."
                      required
                      className="h-10 rounded-xl bg-background border-border"
                    />
                    <Button
                      type="submit"
                      disabled={lookupLoading}
                      className="h-10 px-5 rounded-xl font-bold text-xs bg-primary text-primary-foreground shrink-0"
                    >
                      {lookupLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Find Inquiries'
                      )}
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Threaded Inquiries List */}
            <div className="space-y-6">
              {myInquiries.map((item) => {
                const isReplied =
                  item.status === 'replied' && Boolean(item.reply_message);
                const isHighlighted = highlightedId === item.id;

                return (
                  <div
                    key={item.id}
                    id={`inquiry-${item.id}`}
                    className={cn(
                      'rounded-2xl sm:rounded-3xl border bg-card p-5 sm:p-6 transition-all duration-300 relative overflow-hidden',
                      isHighlighted
                        ? 'ring-4 ring-primary/40 border-primary shadow-xl'
                        : 'border-border shadow-md hover:border-primary/30'
                    )}
                  >
                    {/* Glowing highlight indicator */}
                    {isHighlighted && (
                      <div className="absolute top-0 right-0 w-28 h-28 bg-primary/10 blur-2xl -z-10 pointer-events-none" />
                    )}

                    {/* TOP CARD: USER'S ORIGINAL MESSAGE */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/60">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-foreground font-black text-xs uppercase border border-border">
                            {item.name
                              ? item.name.slice(0, 2).toUpperCase()
                              : 'ME'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-foreground">
                                {item.name || 'You'}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                ({item.email})
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground/70">
                              Transmitted on{' '}
                              {new Date(item.created_at).toLocaleString(
                                undefined,
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isReplied ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Response Received
                            </Badge>
                          ) : item.status === 'read' ? (
                            <Badge
                              variant="outline"
                              className="border-blue-500/30 text-blue-500 bg-blue-500/10 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              In Review
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Queued
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-sm sm:text-base font-black text-foreground tracking-tight">
                          {item.subject}
                        </h4>
                        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap bg-muted/20 p-3 sm:p-4 rounded-xl border border-border/40 font-medium">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    {/* THREAD CONNECTOR */}
                    <div className="flex items-center gap-2 my-3 pl-3 text-muted-foreground/60">
                      <div className="w-0.5 h-4 bg-border" />
                      <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Official Response Thread
                      </span>
                    </div>

                    {/* BOTTOM CARD: OFFICIAL ADMIN RESPONSE */}
                    {isReplied ? (
                      <div className="rounded-xl sm:rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/40 bg-emerald-500/[0.04] p-4 sm:p-5 space-y-3 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-emerald-500/20">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-sm text-foreground">
                                  {item.replied_by_name ||
                                    'Technical Support Lead'}
                                </span>
                                <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                                  Verified Admin Response
                                </Badge>
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                Answered on{' '}
                                {item.replied_at
                                  ? new Date(item.replied_at).toLocaleString(
                                      undefined,
                                      {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      }
                                    )
                                  : 'Recently'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleCopyReply(item.reply_message, item.id)
                              }
                              className="h-7 px-2.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground"
                            >
                              {copiedId === item.id ? (
                                <>
                                  <Check className="w-3 h-3 mr-1 text-emerald-500" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleFollowUp(item)}
                              className="h-7 px-3 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            >
                              Follow-up
                            </Button>
                          </div>
                        </div>

                        {/* Admin Message Content */}
                        <div className="p-3 sm:p-4 rounded-xl bg-background/80 border border-emerald-500/20 text-xs sm:text-sm leading-relaxed text-foreground font-medium whitespace-pre-wrap">
                          {item.reply_message}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 flex items-start gap-3 text-muted-foreground">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="text-[11px] font-black uppercase tracking-wider text-foreground">
                            Under Engineering Review
                          </h5>
                          <p className="text-xs leading-relaxed">
                            Our technical support team reviews inquiries within
                            2-4 hours. You will receive a live notification on
                            any page of this site when answered.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Main Contact Form & Details Section: Tightened Spacing */}
      <section
        ref={formRef}
        className="py-12 sm:py-16 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl"
      >
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                Communication Hub
              </h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                We prioritize high-speed responses for all user inquiries.
                Expect a response within 2-4 business hours.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  label: 'General Inquiries',
                  val: 'bilalghaffar46@gmail.com',
                  icon: Mail,
                  color: 'text-blue-500',
                },
                {
                  label: 'Technical Support',
                  val: 'support@allusefultools.com',
                  icon: MessageSquare,
                  color: 'text-primary',
                },
                {
                  label: 'Global Infrastructure',
                  val: 'Secure Cloud Platform',
                  icon: MapPin,
                  color: 'text-emerald-500',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 rounded-2xl bg-card border border-border group hover:border-primary/40 transition-all shadow-sm"
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${item.color} group-hover:bg-primary group-hover:text-white transition-all shrink-0`}
                  >
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="font-bold text-sm text-foreground truncate">
                      {item.val}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h4 className="font-black text-xs uppercase tracking-tight text-foreground">
                  Encrypted &amp; Verified Channel
                </h4>
              </div>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                All communications through our official channels are encrypted.
                When our team responds, you will be notified across the website
                with a verified administrator response.
              </p>
            </div>
          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-3xl -z-10" />

            <form className="space-y-5 relative z-10" onSubmit={handleSubmit}>
              {status.type === 'success' && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{status.message}</span>
                </div>
              )}

              {status.type === 'error' && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{status.message}</span>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label
                    htmlFor="name"
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1"
                  >
                    Full Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="h-11 rounded-xl bg-background border-border/60 focus:ring-primary text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1"
                  >
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@company.com"
                    className="h-11 rounded-xl bg-background border-border/60 focus:ring-primary text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="subject"
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1"
                >
                  Subject
                </label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Tool Feedback or Technical Inquiry"
                  className="h-11 rounded-xl bg-background border-border/60 focus:ring-primary text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="message"
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1"
                >
                  Message
                </label>
                <Textarea
                  ref={messageInputRef}
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="How can our engineering team assist you today?"
                  className="min-h-[120px] rounded-xl bg-background border-border/60 focus:ring-primary p-3.5 text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="h-13 w-full rounded-xl font-black text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/30 group cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Dispatching Transmission...
                  </span>
                ) : (
                  <span className="flex items-center justify-center w-full">
                    Dispatch Message
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] pt-1">
                <Clock className="w-3.5 h-3.5" />
                Response Time: ~2-4 Business Hours
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
