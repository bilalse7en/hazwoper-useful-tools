import { cn } from '@/lib/utils';
import { BRAND_CONFIG } from '@/lib/constants';
import { OptimizedGif } from '@/components/ui/optimized-gif';

export function BrandLogo({ className, size = 'md', animate = true }) {
  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-16 w-16 lg:h-24 lg:w-24',
  };

  const sizePixels = {
    xs: 24,
    sm: 32,
    md: 36,
    lg: 96,
  };

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-2xl',
        sizeClasses[size],
        className
      )}
    >
      <OptimizedGif
        src={BRAND_CONFIG.logo}
        alt="Content Suite Logo"
        width={sizePixels[size]}
        height={sizePixels[size]}
        priority={true}
        className={cn('h-full w-full object-cover', animate && 'logo-animate')}
      />
    </div>
  );
}
