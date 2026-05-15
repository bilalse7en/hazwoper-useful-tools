"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, LogIn, Chrome, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function LoginModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleTrigger = () => setIsOpen(true);
    window.addEventListener('trigger-login', handleTrigger);
    return () => window.removeEventListener('trigger-login', handleTrigger);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none bg-transparent shadow-[0_0_50px_rgba(34,197,94,0.1)]">
        <div className="relative p-10 bg-card/90 backdrop-blur-3xl border border-border rounded-[40px] space-y-8 animate-in-card">
          {/* Animated Background Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-b from-primary/10 via-transparent to-transparent opacity-50 z-0" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 blur-[80px] rounded-full" />
          
          <div className="relative z-10 text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-primary/30 transform hover:scale-110 transition-transform cursor-default">
              <LogIn className="w-10 h-10 text-white" />
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-4xl font-black tracking-tight text-foreground italic">
                Authentication Required
              </DialogTitle>
              <DialogDescription className="text-blue-100/60 font-medium leading-relaxed">
                Unlock full access to copy results and download generated files. Join our professional suite today.
              </DialogDescription>
            </div>
          </div>

          <div className="relative z-10 grid gap-4">
            <Button 
              onClick={handleGoogleLogin} 
              disabled={loading}
              className="h-16 rounded-2xl bg-primary text-primary-foreground font-black text-lg gap-4 shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary-foreground flex items-center justify-center group-hover:scale-110 transition-all">
                <Chrome className="w-5 h-5 text-primary" />
              </div>
              {loading ? "Initializing..." : "Continue with Google"}
            </Button>
            
            <p className="text-[10px] text-center text-slate-500 font-black uppercase tracking-[0.2em] pt-2">
              Secure Cloud Identity Protocol
            </p>
          </div>

          <div className="relative z-10 p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
               <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground">Privacy Protected</div>
              <div className="text-[10px] text-muted-foreground">All data processing remains entirely browser-local.</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
