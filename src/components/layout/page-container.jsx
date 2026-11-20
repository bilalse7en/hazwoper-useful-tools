'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * PageContainer Component
 *
 * Professional, centered, responsive container for top-level pages.
 * - Below XXL (< 1536px): 100% full available viewport width with responsive side gutters.
 * - XXL and Above (>= 1536px): Unified centered container clamped strictly to 1680px.
 */
export const PageContainer = forwardRef(function PageContainer(
  {
    children,
    className,
    as: Component = 'div',
    variant = 'default', // 'default' | 'narrow' | 'wide' | 'fluid' | 'editor'
    gutter = 'default', // 'default' | 'tight' | 'loose' | 'none'
    ...props
  },
  ref
) {
  const variantClasses = {
    default: 'w-full max-w-full 2xl:max-w-[1680px]',
    narrow: 'w-full max-w-full lg:max-w-4xl 2xl:max-w-5xl',
    wide: 'w-full max-w-full 2xl:max-w-[1680px]',
    fluid: 'w-full max-w-full',
    editor: 'w-full max-w-full 2xl:max-w-[1680px]',
  };

  const gutterClasses = {
    default: 'px-4 sm:px-5 md:px-6 lg:px-7 xl:px-8 2xl:px-8',
    tight: 'px-3 sm:px-4 md:px-5 lg:px-6',
    loose: 'px-5 sm:px-6 md:px-8 lg:px-10 xl:px-12',
    none: 'px-0',
  };

  return (
    <Component
      ref={ref}
      className={cn(
        'w-full mx-auto transition-all duration-200',
        variantClasses[variant] || variantClasses.default,
        gutterClasses[gutter] || gutterClasses.default,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});
