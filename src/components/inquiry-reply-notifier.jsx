'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ArrowRight,
  X,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const LOCAL_STORAGE_KEY = 'my_contact_inquiries';
const DISMISSED_KEY = 'dismissed_inquiry_replies';

export function InquiryReplyNotifier() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeReply, setActiveReply] = useState(null);
  const [visible, setVisible] = useState(false);

  const checkReplies = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) return;

      const inquiries = JSON.parse(stored);
      if (!Array.isArray(inquiries) || inquiries.length === 0) return;

      const inquiryIds = inquiries
        .map((i) => i.id)
        .filter(Boolean)
        .slice(0, 30);

      if (inquiryIds.length === 0) return;

      const res = await fetch('/api/contact/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryIds }),
      });

      if (!res.ok) return;
      const json = await res.json();
      const serverInquiries = json.inquiries || [];

      // Update local storage status cache
      const updatedLocal = inquiries.map((localItem) => {
        const found = serverInquiries.find((s) => s.id === localItem.id);
        if (found) {
          return {
            ...localItem,
            status: found.status,
            reply_message: found.reply_message,
            replied_at: found.replied_at,
            replied_by_name: found.replied_by_name,
          };
        }
        return localItem;
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLocal));

      // Read dismissed replies
      let dismissed = {};
      try {
        dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '{}');
      } catch {
        dismissed = {};
      }

      // Find any replied inquiry whose replied_at is not dismissed
      const newReply = serverInquiries.find((item) => {
        if (item.status !== 'replied' || !item.reply_message) return false;
        const lastDismissedAt = dismissed[item.id];
        // If never dismissed, or reply timestamp is newer than last dismissal
        return (
          !lastDismissedAt ||
          (item.replied_at && item.replied_at !== lastDismissedAt)
        );
      });

      if (newReply) {
        setActiveReply(newReply);
        setVisible(true);
      } else {
        setVisible(false);
      }
    } catch (err) {
      console.warn('[InquiryReplyNotifier] Check notice:', err);
    }
  }, []);

  useEffect(() => {
    // Initial check on mount
    checkReplies();

    // Check on window focus and custom update event
    const handleFocus = () => checkReplies();
    const handleInquiryUpdated = () => checkReplies();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('inquiry_updated', handleInquiryUpdated);

    // Light periodic check every 60 seconds
    const interval = setInterval(checkReplies, 60000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('inquiry_updated', handleInquiryUpdated);
      clearInterval(interval);
    };
  }, [checkReplies]);

  const handleDismiss = () => {
    if (activeReply) {
      try {
        const dismissed = JSON.parse(
          localStorage.getItem(DISMISSED_KEY) || '{}'
        );
        dismissed[activeReply.id] =
          activeReply.replied_at || new Date().toISOString();
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
      } catch (e) {
        console.warn('Could not record dismissal:', e);
      }
    }
    setVisible(false);
  };

  const handleViewReply = () => {
    if (!activeReply) return;

    // Record dismissal for notification pill so it doesn't nag
    handleDismiss();

    const targetUrl = `/contact?inquiry=${encodeURIComponent(activeReply.id)}#inquiry-${activeReply.id}`;

    if (pathname === '/contact') {
      // Already on contact page, trigger smooth scroll to target inquiry card
      const el = document.getElementById(`inquiry-${activeReply.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add(
          'ring-4',
          'ring-primary',
          'transition-all',
          'duration-500'
        );
        setTimeout(() => el.classList.remove('ring-4', 'ring-primary'), 3000);
      } else {
        router.push(targetUrl);
      }
    } else {
      router.push(targetUrl);
    }
  };

  if (!visible || !activeReply) return null;

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Support Inquiry Update"
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="fixed bottom-6 right-6 z-[9999] max-w-md w-[calc(100vw-3rem)] rounded-[28px] bg-card/95 backdrop-blur-2xl border-2 border-emerald-500/40 shadow-2xl shadow-emerald-500/10 p-5 overflow-hidden group"
      >
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl -z-10 pointer-events-none" />

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              Support Reply Received
            </Badge>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss inquiry notification"
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Admin{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {activeReply.replied_by_name || 'Support Specialist'}
              </strong>{' '}
              responded
            </span>
          </div>

          <p className="text-xs font-semibold text-muted-foreground line-clamp-1">
            Re: &ldquo;{activeReply.subject}&rdquo;
          </p>

          <p className="text-xs text-foreground/90 bg-muted/40 p-2.5 rounded-xl border border-border/60 line-clamp-2 leading-relaxed italic">
            &ldquo;{activeReply.reply_message}&rdquo;
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-9 px-3 text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl"
          >
            Dismiss
          </Button>
          <Button
            size="sm"
            onClick={handleViewReply}
            className="h-9 px-4 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-1.5"
          >
            <span>View Official Reply</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
