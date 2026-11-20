'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * ContentContainer Component
 *
 * For reading text, articles, blog posts, documentation, guides, legal policies, and forms.
 * Enforces comfortable reading measure (max-w-4xl / max-w-5xl) so text lines
 * never stretch to an unreadable 2000px length on large or ultrawide screens.
 */
export const ContentContainer = forwardRef(function ContentContainer(
  {
    children,
    className,
    as: Component = 'div',
    size = 'default', // 'sm' | 'default' | 'lg' | 'form'
    gutter = 'default',
    ...props
  },
  ref
) {
  const sizeClasses = {
    sm: 'max-w-3xl',
    default: 'max-w-4xl lg:max-w-5xl',
    lg: 'max-w-5xl lg:max-w-6xl',
    form: 'max-w-xl sm:max-w-2xl',
  };

  const gutterClasses = {
    default: 'px-4 sm:px-6 md:px-8',
    tight: 'px-3 sm:px-4',
    none: 'px-0',
  };

  return (
    <Component
      ref={ref}
      className={cn(
        'w-full mx-auto transition-all duration-200',
        sizeClasses[size] || sizeClasses.default,
        gutterClasses[gutter] || gutterClasses.default,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});
