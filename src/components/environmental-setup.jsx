'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Monitor,
  Cpu,
  Sparkles,
  Moon,
  Sun,
  CheckCircle2,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EnvironmentalSetup() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const { theme, setTheme, systemTheme } = useTheme();
  const [performance, setPerformance] = useState('high');

  useEffect(() => {
    const isComplete = localStorage.getItem('environmental_setup_complete');
    if (!isComplete) {
      // Small delay to let the initial landing breathe
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(
      'performance_mode',
      performance === 'low' ? 'true' : 'false'
    );
    localStorage.setItem('environmental_setup_complete', 'true');
    setIsOpen(false);

    // Refresh to apply global performance state if needed, or just let components react
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      // Optional: window.location.reload();
    }
  };

  const autoDetectTheme = () => {
    if (systemTheme) {
      setTheme(systemTheme);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-3xl"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-card border border-border shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] rounded-[40px] overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-muted">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{
                width: step === 1 ? '33.33%' : step === 2 ? '66.66%' : '100%',
              }}
            />
          </div>

          <div className="p-8 md:p-12 space-y-10">
            {/* Step 1: Hardware Capability */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Cpu className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight italic uppercase italic">
                    Engine Calibration
                  </h2>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    Our platform uses neural-grade visual effects. Tell us about
                    your hardware to optimize your processing environment.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => setPerformance('high')}
                    className={cn(
                      'p-8 rounded-3xl border-2 transition-all text-left flex flex-col gap-4 group',
                      performance === 'high'
                        ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10'
                        : 'border-border bg-muted/40 hover:border-primary/30'
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                        performance === 'high'
                          ? 'bg-primary text-white'
                          : 'bg-card text-muted-foreground'
                      )}
                    >
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase tracking-tight text-foreground">
                        High Performance
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 font-medium italic">
                        Full neural visuals & particles
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPerformance('low')}
                    className={cn(
                      'p-8 rounded-3xl border-2 transition-all text-left flex flex-col gap-4 group',
                      performance === 'low'
                        ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10'
                        : 'border-border bg-muted/40 hover:border-primary/30'
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                        performance === 'low'
                          ? 'bg-primary text-white'
                          : 'bg-card text-muted-foreground'
                      )}
                    >
                      <Monitor className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase tracking-tight text-foreground">
                        Efficiency Mode
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 font-medium italic">
                        Optimized for low-end hardware
                      </p>
                    </div>
                  </button>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  className="w-full h-16 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Confirm Capabilities
                </Button>
              </motion.div>
            )}

            {/* Step 2: Visual Aesthetic */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight uppercase italic">
                    Visual Sync
                  </h2>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    Select your preferred documentation aesthetic. We can
                    automatically synchronize with your operating system or
                    allow you to initialize the Nebula profile.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'light', icon: Sun, label: 'Light' },
                    { id: 'dark', icon: Moon, label: 'Dark' },
                    { id: 'nebula', icon: Sparkles, label: 'Nebula' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        'p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3',
                        theme === t.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-muted/40 hover:border-primary/30'
                      )}
                    >
                      <t.icon
                        className={cn(
                          'w-6 h-6',
                          theme === t.id
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        )}
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <span className="text-xs font-bold text-muted-foreground">
                      OS Synchronization Detected
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={autoDetectTheme}
                    className="text-[10px] font-black uppercase tracking-widest text-primary"
                  >
                    Auto-Sync
                  </Button>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="h-14 rounded-xl px-8 font-black uppercase tracking-widest border-border hover:bg-primary/5 hover:text-primary"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1 h-14 rounded-xl font-black text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Next Sequence
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Finalization */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8 py-8"
              >
                <div className="relative mx-auto w-24 h-24">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                    className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative w-full h-full rounded-full bg-primary flex items-center justify-center text-white"
                  >
                    <CheckCircle2 className="w-12 h-12" />
                  </motion.div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-4xl font-black tracking-tight uppercase italic">
                    Protocol Initialized
                  </h2>
                  <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                    Environment calibrated for{' '}
                    {performance === 'high' ? 'High Performance' : 'Efficiency'}
                    . Visual theme set to {theme}.
                  </p>
                </div>

                <Button
                  onClick={handleComplete}
                  className="w-full h-16 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/40 group"
                >
                  Enter Command Hub
                  <Zap className="ml-2 w-5 h-5 group-hover:scale-125 transition-transform" />
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
