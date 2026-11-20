'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * PageSection Component
 *
 * Provides consistent vertical rhythm and spacing between page sections.
 * Prevents erratic, cramped, or oversized vertical spacing.
 */
export const PageSection = forwardRef(function PageSection(
  {
    children,
    className,
    as: Component = 'section',
    spacing = 'default', // 'tight' | 'default' | 'loose' | 'hero' | 'none'
    border = false,
    ...props
  },
  ref
) {
  const spacingClasses = {
    tight: 'py-4 sm:py-6 md:py-8',
    default: 'py-8 sm:py-12 md:py-16 lg:py-20',
    loose: 'py-12 sm:py-16 md:py-20 lg:py-28',
    hero: 'pt-8 sm:pt-12 md:pt-16 pb-12 sm:pb-16 md:pb-20',
    none: 'py-0',
  };

  return (
    <Component
      ref={ref}
      className={cn(
        'w-full relative',
        spacingClasses[spacing] || spacingClasses.default,
        border && 'border-b border-border',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});
