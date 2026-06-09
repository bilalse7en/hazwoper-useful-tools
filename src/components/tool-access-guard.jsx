'use client';

import { useAuth } from '@/components/auth-provider';
import { hasAccess, triggerLogin } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogIn, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function ToolAccessGuard({ toolId, children }) {
  const { user, toolSettings, loading } = useAuth();

  if (loading) return null;

  const allowed = hasAccess(user, toolId, toolSettings);

  if (allowed) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card/40 backdrop-blur-3xl border border-border rounded-[40px] p-10 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-12 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />

        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-8 shadow-inner border border-primary/20">
          <Lock className="w-10 h-10" />
        </div>

        <h2 className="text-3xl font-black mb-4 tracking-tight">
          Access Restricted
        </h2>
        <p className="text-muted-foreground mb-10 font-medium leading-relaxed">
          This professional utility is reserved for authorized accounts. Please
          sign in or upgrade your permissions to initialize this tool.
        </p>

        <div className="flex flex-col gap-4">
          {!user ? (
            <Button
              size="lg"
              className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
              onClick={triggerLogin}
            >
              <LogIn className="mr-3 w-5 h-5" />
              Sign In to Unlock
            </Button>
          ) : (
            <Button
              size="lg"
              className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
              asChild
            >
              <Link href="/profile">
                <ShieldAlert className="mr-3 w-5 h-5" />
                Request PRO Access
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            className="h-12 rounded-xl text-muted-foreground font-bold hover:text-foreground"
            asChild
          >
            <Link href="/tools">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Tools Hub
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
