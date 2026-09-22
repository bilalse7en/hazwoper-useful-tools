'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function MagneticCapsuleDock({
  items = [],
  activeId,
  onChange,
  className,
  layoutId = 'magnetic-dock-pill',
  variant = 'default', // 'default' | 'amber' | 'primary'
  size = 'default', // 'sm' | 'default'
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const currentActive = hoveredId !== null ? hoveredId : activeId;

  return (
    <div
      onMouseLeave={() => setHoveredId(null)}
      className={cn(
        'relative inline-flex items-center p-1 rounded-full bg-muted/50 dark:bg-zinc-900/60 backdrop-blur-xl border border-border/70 dark:border-white/10 shadow-xs ring-1 ring-black/[0.03] dark:ring-white/[0.05] overflow-x-auto max-w-full scrollbar-none select-none',
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;
        const isGlidingHere = currentActive === item.id;

        const sizeClasses =
          size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs';

        const content = (
          <>
            {/* Dynamic Framer Motion Magnetic Sliding Pill */}
            {isGlidingHere && (
              <motion.div
                layoutId={layoutId}
                className={cn(
                  'absolute inset-0 rounded-full z-0 pointer-events-none transition-shadow',
                  isActive && hoveredId === null
                    ? variant === 'amber'
                      ? 'bg-amber-500 text-slate-950 shadow-xs border border-amber-400'
                      : variant === 'primary'
                        ? 'bg-primary text-primary-foreground shadow-xs border border-primary/20'
                        : 'bg-background dark:bg-zinc-800 shadow-xs border border-border/80 dark:border-white/15'
                    : 'bg-background/90 dark:bg-zinc-800/90 shadow-xs border border-border/60 dark:border-white/10'
                )}
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 32,
                }}
              />
            )}

            <span className="relative z-10 flex items-center gap-1.5 font-semibold tracking-wide">
              {Icon && (
                <Icon
                  className={cn(
                    'w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 shrink-0',
                    isActive
                      ? variant === 'amber'
                        ? 'text-slate-950 dark:text-slate-950'
                        : variant === 'primary'
                          ? 'text-primary-foreground'
                          : 'text-primary'
                      : 'text-muted-foreground/70 group-hover:text-foreground'
                  )}
                />
              )}

              <span className="whitespace-nowrap">{item.label}</span>

              {item.badge && (
                <span
                  className={cn(
                    'text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 tracking-wider',
                    item.badgeColor ||
                      (isActive
                        ? variant === 'amber'
                          ? 'bg-slate-950/20 text-slate-950'
                          : 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground')
                  )}
                >
                  {item.badge}
                </span>
              )}

              {item.count !== undefined && item.count !== null && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0',
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted/80 text-muted-foreground'
                  )}
                >
                  {item.count}
                </span>
              )}

              {/* Active Micro Glowing Beacon */}
              {isActive && (
                <span className="relative flex h-1.5 w-1.5 ml-0.5 shrink-0">
                  <span
                    className={cn(
                      'animate-ping absolute inline-flex h-full w-full rounded-full opacity-60',
                      variant === 'amber' ? 'bg-amber-400' : 'bg-primary'
                    )}
                  />
                  <span
                    className={cn(
                      'relative inline-flex rounded-full h-1.5 w-1.5',
                      variant === 'amber'
                        ? 'bg-slate-950 dark:bg-amber-400'
                        : variant === 'primary'
                          ? 'bg-primary-foreground'
                          : 'bg-primary shadow-[0_0_6px_var(--primary)]'
                    )}
                  />
                </span>
              )}
            </span>
          </>
        );

        const commonClasses = cn(
          'relative rounded-full transition-all duration-200 select-none group flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          sizeClasses,
          isGlidingHere
            ? isActive && hoveredId === null && variant === 'amber'
              ? 'text-slate-950 font-black'
              : isActive && hoveredId === null && variant === 'primary'
                ? 'text-primary-foreground font-black'
                : 'text-foreground font-bold'
            : 'text-muted-foreground/80 hover:text-foreground'
        );

        if (item.href) {
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => onChange && onChange(item.id)}
              onMouseEnter={() => setHoveredId(item.id)}
              className={commonClasses}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange && onChange(item.id)}
            onMouseEnter={() => setHoveredId(item.id)}
            className={commonClasses}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
