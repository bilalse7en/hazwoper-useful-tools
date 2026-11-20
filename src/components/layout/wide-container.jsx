'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * WideContainer Component
 *
 * For dashboards, tool directories, media hub galleries, and tool workspaces.
 * - Below XXL (< 1536px): 100% full available viewport width with responsive side gutters.
 * - XXL and Above (>= 1536px): Unified centered container clamped strictly to 1680px.
 */
export const WideContainer = forwardRef(function WideContainer(
  { children, className, as: Component = 'div', gutter = 'default', ...props },
  ref
) {
  const gutterClasses = {
    default: 'px-4 sm:px-5 md:px-6 lg:px-7 xl:px-8 2xl:px-8',
    tight: 'px-3 sm:px-4 md:px-5',
    none: 'px-0',
  };

  return (
    <Component
      ref={ref}
      className={cn(
        'w-full mx-auto max-w-full 2xl:max-w-[1680px] transition-all duration-200',
        gutterClasses[gutter] || gutterClasses.default,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});
