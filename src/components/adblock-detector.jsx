'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldOff,
  RotateCw,
  Heart,
  Laptop,
  Smartphone,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Robust AdBlocker detection probe.
 * Combines DOM bait element inspection and network script request check.
 */
async function performAdBlockCheck() {
  if (typeof window === 'undefined') return false;

  // Check manual test query param (?test-adblock=true)
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('test-adblock') === 'true') {
      return true;
    }
  } catch (e) {
    // Ignore URL parsing errors
  }

  // Probe 1: Bait element CSS detection (checks if ad-block stylesheet rules hide or collapse ad elements)
  let domBlocked = false;
  try {
    const bait = document.createElement('div');
    bait.className =
      'adsbygoogle adsbox ad-placement pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad-text banner-ad';
    bait.style.cssText =
      'position: absolute !important; left: -9999px !important; top: -9999px !important; width: 10px !important; height: 10px !important; pointer-events: none !important; opacity: 1 !important;';
    bait.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bait);

    const computed = window.getComputedStyle(bait);
    if (
      computed.display === 'none' ||
      computed.visibility === 'hidden' ||
      computed.opacity === '0' ||
      bait.offsetParent === null ||
      bait.offsetHeight === 0 ||
      bait.offsetLeft === 0 ||
      bait.clientHeight === 0
    ) {
      domBlocked = true;
    }

    if (bait.parentNode) {
      bait.parentNode.removeChild(bait);
    }
  } catch (e) {
    // Ignore DOM inspection issues
  }

  if (domBlocked) return true;

  // Probe 2: Network fetch check against Google AdSense script endpoint
  try {
    const request = new Request(
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
      {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
      }
    );
    await fetch(request);
  } catch (err) {
    // Failed to fetch Google AdSense script means a network-level blocker / extension blocked it
    return true;
  }

  return false;
}

export function AdBlockDetector() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [activeTab, setActiveTab] = useState('extension');
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState(false);

  const runDetection = useCallback(async () => {
    const blocked = await performAdBlockCheck();
    setIsBlocked(blocked);
    return blocked;
  }, []);

  useEffect(() => {
    // Small delay to let page stabilize and not interrupt early hydration
    const timer = setTimeout(() => {
      runDetection();
    }, 1200);

    return () => clearTimeout(timer);
  }, [runDetection]);

  // Lock background scrolling when adblock modal is active
  useEffect(() => {
    if (isBlocked) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isBlocked]);

  const handleRefresh = async () => {
    setIsChecking(true);
    setCheckError(false);

    // Re-check detection
    const stillBlocked = await performAdBlockCheck();

    if (!stillBlocked) {
      setIsBlocked(false);
      window.location.reload();
    } else {
      setIsChecking(false);
      setCheckError(true);
    }
  };

  if (!isBlocked) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adblock-dialog-title"
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl p-5 sm:p-8 space-y-6">
        {/* Header with glowing badge */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 mx-auto shadow-inner">
            <ShieldOff className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
              <Heart className="w-3.5 h-3.5 fill-primary text-primary" />
              <span>Support Free Community Tools</span>
            </div>
            <h2
              id="adblock-dialog-title"
              className="text-2xl sm:text-3xl font-black tracking-tight"
            >
              Ad Blocker Detected
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              All Useful Tools is{' '}
              <strong className="text-foreground font-semibold">
                100% free
              </strong>{' '}
              with no subscriptions or login walls. To keep our servers running
              and continue providing these tools freely,{' '}
              <strong className="text-foreground font-semibold">
                please disable your ad blocker
              </strong>{' '}
              for this site.
            </p>
          </div>
        </div>

        {/* How to Turn Off Instructions */}
        <div className="p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border/50 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              How to disable your ad blocker
            </span>
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              Quick 3-step guide
            </span>
          </div>

          {/* Browser selector tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-background/80 rounded-xl border border-border/50">
            <button
              type="button"
              onClick={() => setActiveTab('extension')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer',
                activeTab === 'extension'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Laptop className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">AdBlock / uBlock</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('brave')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer',
                activeTab === 'brave'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Brave Browser</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mobile')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer',
                activeTab === 'mobile'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Safari / Mobile</span>
            </button>
          </div>

          {/* Tab Step Details */}
          <div className="text-xs sm:text-sm space-y-2 pt-1">
            {activeTab === 'extension' && (
              <ol className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Click the{' '}
                    <strong className="text-foreground">
                      AdBlock / uBlock
                    </strong>{' '}
                    icon in your browser toolbar (top-right corner).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Click{' '}
                    <strong className="text-foreground">
                      &quot;Pause on this site&quot;
                    </strong>{' '}
                    or toggle the power switch to{' '}
                    <strong className="text-foreground">OFF</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Click the{' '}
                    <strong className="text-foreground">
                      &quot;I&apos;ve Turned It Off — Refresh Page&quot;
                    </strong>{' '}
                    button below to resume using the tools.
                  </span>
                </li>
              </ol>
            )}

            {activeTab === 'brave' && (
              <ol className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Click the orange{' '}
                    <strong className="text-foreground">Lion / Shield</strong>{' '}
                    icon on the right side of the address bar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Toggle the switch to{' '}
                    <strong className="text-foreground">
                      &quot;Shields DOWN&quot;
                    </strong>{' '}
                    for this site.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Click the{' '}
                    <strong className="text-foreground">
                      &quot;I&apos;ve Turned It Off — Refresh Page&quot;
                    </strong>{' '}
                    button below to resume using the tools.
                  </span>
                </li>
              </ol>
            )}

            {activeTab === 'mobile' && (
              <ol className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Tap the{' '}
                    <strong className="text-foreground">&quot;aA&quot;</strong>{' '}
                    or settings icon in your mobile browser address bar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Tap{' '}
                    <strong className="text-foreground">
                      &quot;Turn Off Content Blockers&quot;
                    </strong>{' '}
                    (or whitelist this website in your ad blocker app).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Tap the{' '}
                    <strong className="text-foreground">
                      &quot;I&apos;ve Turned It Off — Refresh Page&quot;
                    </strong>{' '}
                    button below to resume using the tools.
                  </span>
                </li>
              </ol>
            )}
          </div>
        </div>

        {/* Error Message if Still Blocked */}
        {checkError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs sm:text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <strong className="font-semibold">
                Ad blocker is still active.
              </strong>
              <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-300/80">
                Please make sure you have paused or turned off the blocker for
                this website, then click the button below again.
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <Button
            onClick={handleRefresh}
            disabled={isChecking}
            size="lg"
            className="w-full text-sm sm:text-base font-bold py-6 rounded-2xl shadow-xl shadow-primary/25 cursor-pointer flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            <RotateCw
              className={cn(
                'w-4 h-4 shrink-0',
                isChecking && 'animate-spin text-primary-foreground'
              )}
            />
            <span>
              {isChecking
                ? 'Verifying Status...'
                : "I've Turned It Off — Refresh Page"}
            </span>
          </Button>
          <p className="text-center text-[11px] text-muted-foreground/60 mt-3">
            Once refreshed with ads enabled, you will have immediate full access
            to all tools.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdBlockDetector;
