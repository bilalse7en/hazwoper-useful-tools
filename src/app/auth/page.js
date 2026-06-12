'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogIn,
  UserPlus,
  Chrome,
  ShieldCheck,
  Mail,
  Lock,
  Sparkles,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { BrandLogo } from '@/components/brand-logo';
import { supabase } from '@/lib/supabase';
import { showToast, showSuccess } from '@/lib/swal';
import { cn } from '@/lib/utils';

function AuthComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMode =
    searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  const [mode, setMode] = useState(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      showToast(error.message, 'error');
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        showSuccess(
          'Identity Created',
          'Check your email for the confirmation link.'
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        sessionStorage.setItem('just_logged_in', 'true');
        router.push('/');
        showSuccess(
          'Welcome Back',
          'Identity verified. Workspace synchronized.'
        );
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-transparent pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10 space-y-6">
          <div className="flex justify-center">
            <div
              className="relative group p-2 cursor-pointer"
              onClick={() => router.push('/')}
            >
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
              <BrandLogo
                size="lg"
                className="relative group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic leading-none">
              Identity Hub
            </h1>
            <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] opacity-80">
              Secure Protocol Alpha-7
            </p>
          </div>
        </div>

        <Card className="p-8 bg-card/60 backdrop-blur-3xl border border-border rounded-[40px] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

          <div className="flex gap-2 p-1 bg-muted/40 rounded-2xl mb-8 border border-border/50">
            <button
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
                mode === 'login'
                  ? 'bg-card text-primary shadow-sm border border-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LogIn className="w-3.5 h-3.5" />
              Login
            </button>
            <button
              onClick={() => setMode('signup')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
                mode === 'signup'
                  ? 'bg-card text-primary shadow-sm border border-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-5">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">
                    Full Identity Name
                  </label>
                  <div className="relative">
                    <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g. John Architect"
                      className="pl-11 h-14 bg-muted/30 rounded-2xl border-border/40 focus:border-primary/50"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={mode === 'signup'}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">
                Email Terminal
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="comm-link@protocol.com"
                  className="pl-11 h-14 bg-muted/30 rounded-2xl border-border/40 focus:border-primary/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">
                Access Phrase
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  className="pl-11 h-14 bg-muted/30 rounded-2xl border-border/40 focus:border-primary/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-16 rounded-[22px] bg-primary text-primary-foreground font-black text-lg gap-4 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 mt-4 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Verify Identity' : 'Initialize Account'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black">
              <span className="bg-card px-4 text-muted-foreground tracking-[0.3em]">
                OR
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-14 rounded-2xl border-border/60 bg-muted/20 hover:bg-muted/40 text-foreground font-bold text-sm gap-3 group relative overflow-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Chrome className="w-4 h-4" />
            </div>
            Continue with Neural Google
            <Sparkles className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
          </Button>

          <div className="mt-8 flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
            <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
              Your credentials are encrypted using military-grade security.
              Active session protection enabled.
            </p>
          </div>
        </Card>

        <button
          onClick={() => router.push('/')}
          className="mt-8 mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Back to Common Area
        </button>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      }
    >
      <AuthComponent />
    </Suspense>
  );
}

function ArrowRight({ className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
