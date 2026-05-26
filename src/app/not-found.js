'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Ghost, Compass, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand-logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background Neural Network Aesthetic */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-2xl w-full text-center space-y-12"
      >
        {/* Header */}
        <div className="space-y-4">
          <div className="flex justify-center mb-10">
            <BrandLogo size="lg" />
          </div>

          <div className="relative inline-block">
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
                y: [0, -10, 10, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <h1 className="text-[12rem] md:text-[16rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-primary/40 to-transparent select-none">
                404
              </h1>
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Ghost className="w-24 h-24 text-primary animate-bounce opacity-80" />
            </div>
          </div>

          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground -mt-8">
            Identity Not Found
          </h2>
          <p className="text-xl text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
            The neural path you&apos;ve requested does not exist in our primary
            sector. It may have been relocated or purged from the registry.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
          <Button
            size="lg"
            className="h-16 px-10 rounded-[24px] font-black text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/30 border-none transition-all hover:scale-105 active:scale-95 group"
            asChild
          >
            <Link href="/">
              <Home className="mr-3 w-6 h-6 transition-transform group-hover:scale-110" />
              Return to Base
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-16 px-10 rounded-[24px] font-black text-lg border-primary/20 hover:bg-primary/5 text-primary transition-all active:scale-95 group"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-3 w-6 h-6 transition-transform group-hover:-translate-x-2" />
            Previous Sector
          </Button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-center gap-8 pt-10 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3 h-3" />
            Error 404: Path_Mismatch
          </div>
          <div className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-2">
            <Compass className="w-3 h-3" />
            Scanning Backup Nodes...
          </div>
        </div>
      </motion.div>

      {/* Decorative Corner Accents */}
      <div className="absolute top-0 right-0 p-12 opacity-10">
        <div className="w-64 h-64 border-t-2 border-r-2 border-primary rounded-tr-[80px]" />
      </div>
      <div className="absolute bottom-0 left-0 p-12 opacity-10">
        <div className="w-64 h-64 border-b-2 border-l-2 border-primary rounded-bl-[80px]" />
      </div>
    </div>
  );
}
