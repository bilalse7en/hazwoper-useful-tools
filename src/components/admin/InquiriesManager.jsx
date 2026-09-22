'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Mail,
  Search,
  RefreshCw,
  Sparkles,
  Send,
  Trash2,
  CheckCircle2,
  Clock,
  Reply,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  User,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { showToast, showSuccess, showConfirm } from '@/lib/swal';
import { callPuterAiChat } from '@/lib/se7en-ai';
import { cn } from '@/lib/utils';
import { MagneticCapsuleDock } from '@/components/ui/magnetic-capsule-dock';

export function InquiriesManager({ currentUser, className }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unread' | 'read' | 'replied'
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active admin identity
  const adminName =
    currentUser?.name ||
    currentUser?.full_name ||
    currentUser?.username ||
    (currentUser?.email ? currentUser.email.split('@')[0] : 'Admin Specialist');
  const adminEmail = currentUser?.email || 'admin@allusefultools.com';

  // Fetch inquiries from Supabase
  const fetchInquiries = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Inquiries query notice:', error.message || error);
        if (error.code === '42P01') {
          showToast(
            'Table contact_inquiries missing. Please execute contact_setup.sql in Supabase SQL Editor.',
            'error'
          );
        }
        setInquiries([]);
      } else {
        setInquiries(data || []);
      }
    } catch (err) {
      console.error('Error fetching inquiries:', err);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  // Filtered inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.replied_by_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [inquiries, searchQuery, statusFilter]);

  // Key metrics
  const stats = useMemo(() => {
    const total = inquiries.length;
    const unread = inquiries.filter((i) => i.status === 'unread').length;
    const replied = inquiries.filter((i) => i.status === 'replied').length;
    const rate = total > 0 ? Math.round((replied / total) * 100) : 0;
    return { total, unread, replied, rate };
  }, [inquiries]);

  // Open detail modal and mark as read if currently unread
  const handleSelectInquiry = async (item) => {
    setSelectedInquiry(item);
    setReplyText(item.reply_message || item.ai_draft || '');

    if (item.status === 'unread') {
      try {
        await supabase
          .from('contact_inquiries')
          .update({ status: 'read' })
          .eq('id', item.id);

        setInquiries((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'read' } : i))
        );
        setSelectedInquiry((prev) =>
          prev ? { ...prev, status: 'read' } : null
        );
      } catch (e) {
        console.warn('Could not update status to read:', e);
      }
    }
  };

  // Generate AI reply using Puter AI or intelligent contextual template
  const handleGenerateAIReply = async () => {
    if (!selectedInquiry) return;
    setIsGeneratingAI(true);
    try {
      const prompt = `You are a professional customer relations specialist and technical support lead for "All Useful Tools" (an online suite of document conversion, media processing, and AI tools).
Write a cordial, professional, and directly actionable email reply to the following user inquiry:

Sender Name: ${selectedInquiry.name}
Sender Email: ${selectedInquiry.email}
Inquiry Subject: ${selectedInquiry.subject}
Inquiry Message:
"${selectedInquiry.message}"

Guidelines for your response:
1. Greet the customer warmly by their name (${selectedInquiry.name}).
2. Acknowledge and directly answer their specific question, problem, or feedback.
3. If they asked about a tool, provide clear steps or clarify how our local in-browser processing guarantees privacy and speed.
4. Conclude with a helpful sign-off stating you were assisted by ${adminName} on behalf of the All Useful Tools Support Team.
5. Format the text naturally as an email body without placeholders.`;

      let reply = '';
      try {
        reply = await callPuterAiChat(prompt, 'gpt-4o');
      } catch (puterErr) {
        console.warn('Puter AI fallback triggered:', puterErr);
        reply = `Hello ${selectedInquiry.name},

Thank you for reaching out to the All Useful Tools team regarding "${selectedInquiry.subject}".

We have received your message:
"${selectedInquiry.message.slice(0, 120)}..."

Our technical engineers have reviewed your inquiry. All Useful Tools is engineered to deliver high-performance browser execution with zero server data retention, ensuring your files and operations remain completely private.

If you have any further questions or require assistance with any of our utilities, please don't hesitate to reply directly to this message.

Warm regards,
${adminName} | Support Specialist
All Useful Tools Team
support@hazwoper-useful-tools.vercel.app`;
      }

      setReplyText(reply);

      // Save draft in Supabase
      await supabase
        .from('contact_inquiries')
        .update({ ai_draft: reply })
        .eq('id', selectedInquiry.id);

      showSuccess(
        'AI Reply Drafted',
        'Review and edit the reply below, then save or dispatch.'
      );
    } catch (err) {
      console.error('Failed to generate AI response:', err);
      showToast('Could not generate AI draft', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Save response to Supabase & mark as Replied by current Admin
  const handleSaveReply = async () => {
    if (!selectedInquiry || !replyText.trim()) {
      showToast('Please draft a response before saving.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const timestamp = new Date().toISOString();
      const { error } = await supabase
        .from('contact_inquiries')
        .update({
          reply_message: replyText.trim(),
          status: 'replied',
          replied_at: timestamp,
          replied_by_name: adminName,
          replied_by_email: adminEmail,
        })
        .eq('id', selectedInquiry.id);

      if (error) throw error;

      setInquiries((prev) =>
        prev.map((i) =>
          i.id === selectedInquiry.id
            ? {
                ...i,
                reply_message: replyText.trim(),
                status: 'replied',
                replied_at: timestamp,
                replied_by_name: adminName,
                replied_by_email: adminEmail,
              }
            : i
        )
      );

      setSelectedInquiry((prev) => ({
        ...prev,
        reply_message: replyText.trim(),
        status: 'replied',
        replied_at: timestamp,
        replied_by_name: adminName,
        replied_by_email: adminEmail,
      }));

      showSuccess('Reply Saved', `Inquiry marked as Replied by ${adminName}.`);
    } catch (err) {
      console.error('Failed to save reply:', err);
      showToast('Failed to save response to database', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Open default mail client with pre-filled reply including admin sign-off
  const handleOpenMailClient = () => {
    if (!selectedInquiry) return;
    const subject = encodeURIComponent(`Re: ${selectedInquiry.subject}`);
    const signoff = `\n\n---\nReviewed and sent by: ${adminName}\nAll Useful Tools Technical Team`;
    const finalBody = replyText.includes(adminName)
      ? replyText
      : `${replyText}${signoff}`;
    const body = encodeURIComponent(finalBody);
    window.location.href = `mailto:${selectedInquiry.email}?subject=${subject}&body=${body}`;
  };

  // Copy reply text
  const handleCopyReply = () => {
    if (!replyText) return;
    navigator.clipboard.writeText(replyText);
    setCopied(true);
    showToast('Reply copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Delete inquiry
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    const result = await showConfirm({
      title: 'Delete Inquiry?',
      text: 'This inquiry will be permanently deleted from the database.',
      icon: 'warning',
      confirmButtonText: 'Yes, Delete',
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInquiries((prev) => prev.filter((i) => i.id !== id));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null);
      }
      showSuccess('Inquiry Deleted', 'Entry has been removed.');
    } catch (err) {
      console.error('Error deleting inquiry:', err);
      showToast('Could not delete inquiry', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in-fade">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Submissions',
            value: stats.total,
            icon: Inbox,
            color: 'bg-primary',
            badge: 'ALL TIME',
          },
          {
            label: 'Unread Inquiries',
            value: stats.unread,
            icon: AlertCircle,
            color: 'bg-amber-500',
            badge: stats.unread > 0 ? 'ACTION NEEDED' : 'CLEAR',
          },
          {
            label: 'Replied to',
            value: stats.replied,
            icon: CheckCircle2,
            color: 'bg-emerald-500',
            badge: 'RESOLVED',
          },
          {
            label: 'Resolution Rate',
            value: `${stats.rate}%`,
            icon: Sparkles,
            color: 'bg-indigo-500',
            badge: 'KPI',
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="rounded-[32px] border-border shadow-xl overflow-hidden bg-card/40 backdrop-blur-xl group hover:border-primary/20 transition-all"
          >
            <div className={cn('h-1.5 w-full', stat.color)} />
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-2">
                  <stat.icon className="w-4 h-4 text-primary" /> {stat.label}
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5"
                >
                  {stat.badge}
                </Badge>
              </div>
              <div className="text-4xl font-black mt-3 tracking-tighter text-foreground">
                {stat.value}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Control Bar: Search & Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card/40 p-4 rounded-2xl border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, subject, or message..."
            className="pl-10 h-11 rounded-xl bg-background/50 border-border"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <MagneticCapsuleDock
            items={[
              { id: 'all', label: 'All Inquiries', count: inquiries.length },
              {
                id: 'unread',
                label: 'Unread',
                badge: stats.unread > 0 ? `${stats.unread}` : null,
                badgeColor: 'bg-amber-500 text-slate-950 font-black',
              },
              { id: 'read', label: 'Read', count: stats.read },
              { id: 'replied', label: 'Replied', count: stats.replied },
            ]}
            activeId={statusFilter}
            onChange={setStatusFilter}
            layoutId="inquiries-status-filter-dock"
          />

          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchInquiries()}
            className="h-9 w-9 rounded-xl border-border bg-card/60 hover:text-primary transition-all ml-1"
            title="Refresh Inquiries"
          >
            <RefreshCw
              className={cn('w-4 h-4', loading ? 'animate-spin' : '')}
            />
          </Button>
        </div>
      </div>

      {/* Inquiries Table / List */}
      <Card className="rounded-[32px] border-border shadow-xl bg-card/30 backdrop-blur-xl overflow-hidden">
        <div className="p-6 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="font-black text-lg tracking-tight">
              Contact Submissions ({filteredInquiries.length})
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Click any entry to view full inquiry and generate AI reply
          </span>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-bold uppercase tracking-widest">
              Connecting to Inquiry Pipeline...
            </p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="font-bold text-foreground">No inquiries found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {inquiries.length === 0
                ? 'No messages have been submitted through the contact form yet.'
                : 'No submissions match your active filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filteredInquiries.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectInquiry(item)}
                className={cn(
                  'p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer transition-all hover:bg-primary/5 group',
                  item.status === 'unread' ? 'bg-primary/[0.03]' : ''
                )}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className={cn(
                      'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm transition-transform group-hover:scale-105',
                      item.status === 'replied'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : item.status === 'unread'
                          ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                          : 'bg-muted text-muted-foreground border border-border'
                    )}
                  >
                    {item.status === 'replied' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : item.status === 'unread' ? (
                      <Mail className="w-5 h-5 animate-pulse" />
                    ) : (
                      <MessageSquare className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-black text-sm text-foreground">
                        {item.name}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {item.email}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[9px] font-black uppercase tracking-widest px-2 py-0.5',
                          item.status === 'replied'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : item.status === 'unread'
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {item.status}
                      </Badge>
                      {item.replied_by_name && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-3 h-3" />
                          Replied by {item.replied_by_name}
                        </span>
                      )}
                    </div>

                    <p className="font-bold text-sm text-foreground tracking-tight line-clamp-1">
                      {item.subject}
                    </p>

                    <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  <span className="text-[11px] font-mono text-muted-foreground/70">
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(item.id, e)}
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Inquiry Detail & AI Reply Modal */}
      <Dialog
        open={!!selectedInquiry}
        onOpenChange={(open) => !open && setSelectedInquiry(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[32px] p-8 space-y-6">
          <DialogHeader className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] font-black uppercase tracking-widest px-3 py-1',
                  selectedInquiry?.status === 'replied'
                    ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                    : 'border-primary/30 text-primary bg-primary/10'
                )}
              >
                Status: {selectedInquiry?.status}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">
                {selectedInquiry?.created_at &&
                  new Date(selectedInquiry.created_at).toLocaleString()}
              </span>
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
              {selectedInquiry?.subject}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
              <span>
                From: <strong>{selectedInquiry?.name}</strong> (
                {selectedInquiry?.email})
              </span>
              {selectedInquiry?.ip_address && (
                <span>• IP: {selectedInquiry.ip_address}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* User Message Box */}
          <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
              Inquiry Message Content
            </span>
            <p className="text-sm text-foreground font-medium whitespace-pre-wrap leading-relaxed">
              {selectedInquiry?.message}
            </p>
          </div>

          {/* Previous Saved Reply (if any) */}
          {selectedInquiry?.reply_message &&
            selectedInquiry.status === 'replied' && (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched / Saved
                    Reply
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/80">
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      Admin:{' '}
                      <strong className="text-foreground">
                        {selectedInquiry.replied_by_name || 'Admin'}
                      </strong>
                    </span>
                    {selectedInquiry.replied_by_email && (
                      <span className="text-muted-foreground font-mono text-[10px]">
                        ({selectedInquiry.replied_by_email})
                      </span>
                    )}
                    {selectedInquiry.replied_at && (
                      <span className="text-[10px] font-mono text-muted-foreground ml-2">
                        •{' '}
                        {new Date(selectedInquiry.replied_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-foreground font-medium whitespace-pre-wrap leading-relaxed bg-background/60 p-3.5 rounded-xl border border-emerald-500/20">
                  {selectedInquiry.reply_message}
                </p>
              </div>
            )}

          {/* AI Response Composer */}
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-black uppercase tracking-wider text-foreground">
                  AI Response Studio
                </h4>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono text-muted-foreground bg-muted/30"
                >
                  Reviewing as:{' '}
                  <strong className="text-foreground ml-1">{adminName}</strong>
                </Badge>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleGenerateAIReply}
                disabled={isGeneratingAI}
                className="h-9 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 text-primary-foreground shadow-md"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Formulating Reply...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Draft AI Response
                  </>
                )}
              </Button>
            </div>

            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Draft your response here or click 'Draft AI Response' to have Se7eN AI compose a tailored reply..."
              rows={7}
              className="w-full p-4 rounded-2xl bg-background border border-border text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-sans"
            />

            {/* Action Bar */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyReply}
                  disabled={!replyText.trim()}
                  className="h-9 rounded-xl text-xs font-bold border-border"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {copied ? 'Copied' : 'Copy Text'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenMailClient}
                  disabled={!replyText.trim()}
                  className="h-9 rounded-xl text-xs font-bold border-border hover:bg-primary/5 hover:text-primary"
                  title="Opens default email client with drafted reply"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Open in Mail App
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveReply}
                  disabled={isSaving || !replyText.trim()}
                  className="h-9 px-5 rounded-xl font-black text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Save & Mark Replied
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
