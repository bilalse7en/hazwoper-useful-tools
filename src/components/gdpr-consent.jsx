'use client';

import { useState, useEffect } from 'react';
import { X, Settings } from 'lucide-react';

export function GdprConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, cannot be disabled
    functional: true,
    analytics: true,
    advertising: true,
  });

  useEffect(() => {
    // Check if user has already made a consent choice
    const consentGiven = localStorage.getItem('gdpr-consent');
    if (!consentGiven) {
      // Small delay to avoid layout shift on initial page load
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consentGiven);
        setPreferences(saved);
        applyConsent(saved);
      } catch (e) {
        console.error('Error loading consent preferences:', e);
      }
    }
  }, []);

  const applyConsent = (prefs) => {
    // Apply consent preferences
    // For Google AdSense, we'll set the consent mode
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': prefs.analytics ? 'granted' : 'denied',
        'ad_storage': prefs.advertising ? 'granted' : 'denied',
        'ad_user_data': prefs.advertising ? 'granted' : 'denied',
        'ad_personalization': prefs.advertising ? 'granted' : 'denied',
      });
    }

    // Store in localStorage for persistence
    localStorage.setItem('gdpr-consent', JSON.stringify(prefs));
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      advertising: true,
    };
    setPreferences(allAccepted);
    applyConsent(allAccepted);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      advertising: false,
    };
    setPreferences(onlyNecessary);
    applyConsent(onlyNecessary);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    applyConsent(preferences);
    setShowBanner(false);
    setShowCustomize(false);
  };

  const togglePreference = (key) => {
    if (key === 'necessary') return; // Cannot disable necessary cookies
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]" />

      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6 animate-in slide-in-from-bottom duration-300">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-card border-2 border-primary/20 rounded-2xl shadow-2xl p-6 backdrop-blur-xl">
            {!showCustomize ? (
              // Main Banner
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">🍪</div>
                    <h3 className="text-xl font-bold">Cookie Preferences</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We use cookies to enhance your experience, analyze site traffic, and serve personalized advertisements. 
                    By clicking "Accept All", you consent to our use of cookies. Learn more in our{' '}
                    <a href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</a>
                    {' '}and{' '}
                    <a href="/cookies" className="text-primary hover:underline font-medium">Cookie Policy</a>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <button
                    onClick={handleRejectAll}
                    className="px-6 py-2.5 text-sm font-medium border-2 border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={() => setShowCustomize(true)}
                    className="px-6 py-2.5 text-sm font-medium border-2 border-primary/50 rounded-lg hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Customize
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            ) : (
              // Customize Panel
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Customize Cookie Preferences</h3>
                  <button
                    onClick={() => setShowCustomize(false)}
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                    aria-label="Close customize panel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  {/* Necessary Cookies */}
                  <div className="p-4 bg-accent/50 rounded-lg border border-border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Strictly Necessary Cookies</h4>
                        <p className="text-sm text-muted-foreground">
                          Essential for the website to function. Cannot be disabled.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Always Active</span>
                        <div className="w-12 h-6 bg-primary rounded-full relative">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Functional Cookies */}
                  <div className="p-4 bg-accent/50 rounded-lg border border-border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Functional Cookies</h4>
                        <p className="text-sm text-muted-foreground">
                          Remember your preferences (theme, language, tool settings).
                        </p>
                      </div>
                      <button
                        onClick={() => togglePreference('functional')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          preferences.functional ? 'bg-primary' : 'bg-border'
                        }`}
                        aria-label="Toggle functional cookies"
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          preferences.functional ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="p-4 bg-accent/50 rounded-lg border border-border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Analytics Cookies</h4>
                        <p className="text-sm text-muted-foreground">
                          Help us understand how you use our website to improve performance.
                        </p>
                      </div>
                      <button
                        onClick={() => togglePreference('analytics')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          preferences.analytics ? 'bg-primary' : 'bg-border'
                        }`}
                        aria-label="Toggle analytics cookies"
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          preferences.analytics ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Advertising Cookies */}
                  <div className="p-4 bg-accent/50 rounded-lg border border-border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Advertising Cookies</h4>
                        <p className="text-sm text-muted-foreground">
                          Serve personalized ads based on your interests and browsing behavior.
                        </p>
                      </div>
                      <button
                        onClick={() => togglePreference('advertising')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          preferences.advertising ? 'bg-primary' : 'bg-border'
                        }`}
                        aria-label="Toggle advertising cookies"
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          preferences.advertising ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                  <button
                    onClick={handleRejectAll}
                    className="flex-1 px-6 py-2.5 text-sm font-medium border-2 border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    className="flex-1 px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
