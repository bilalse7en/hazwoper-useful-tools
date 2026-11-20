'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * FullWidthContainer Component
 *
 * For full-bleed sections (hero backgrounds, accent bands, footer wrappers)
 * with optional inner centered content container alignment.
 */
export const FullWidthContainer = forwardRef(function FullWidthContainer(
  {
    children,
    className,
    innerClassName,
    as: Component = 'section',
    containContent = true,
    contentVariant = 'default', // 'default' | 'wide' | 'narrow'
    ...props
  },
  ref
) {
  const contentVariantClasses = {
    default: 'w-full max-w-full 2xl:max-w-[1680px]',
    wide: 'w-full max-w-full 2xl:max-w-[1680px]',
    narrow: 'w-full max-w-full lg:max-w-4xl 2xl:max-w-5xl',
  };

  return (
    <Component
      ref={ref}
      className={cn('w-full relative overflow-hidden', className)}
      {...props}
    >
      {containContent ? (
        <div
          className={cn(
            'w-full mx-auto px-4 sm:px-5 md:px-6 lg:px-7 xl:px-8 2xl:px-8',
            contentVariantClasses[contentVariant] ||
              contentVariantClasses.default,
            innerClassName
          )}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </Component>
  );
});
