import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://gyglsbmpxopaoeljoofp.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_placeholder';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Intercept & guard all supabase.auth and postgrest methods to prevent unhandled 401 promise rejections
if (typeof window !== 'undefined') {
  const isUnauthorizedError = (reason) => {
    if (!reason) return false;
    const status = reason.status ?? reason.statusCode ?? reason.code;
    const msg = String(
      reason.message || reason.error || reason || ''
    ).toLowerCase();

    return (
      status === 401 ||
      status === '401' ||
      msg.includes('unauthorized') ||
      msg.includes('invalid api key') ||
      status === 'PGRST116' ||
      status === '42501'
    );
  };

  // 1. Direct window.onunhandledrejection override to return true and suppress browser error overlays
  const origOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = function (event) {
    if (isUnauthorizedError(event?.reason)) {
      if (typeof event?.preventDefault === 'function') {
        event.preventDefault();
      }
      return true; // Prevents default browser logging and unhandled rejection overlay
    }
    if (typeof origOnUnhandledRejection === 'function') {
      return origOnUnhandledRejection.call(window, event);
    }
  };

  // 2. Add listener for extra event capture
  window.addEventListener('unhandledrejection', (event) => {
    if (isUnauthorizedError(event?.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (
      isUnauthorizedError(event?.error) ||
      isUnauthorizedError(event?.message)
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  if (supabase?.auth) {
    // 3. Safely wrap getSession to resolve with { data: { session: null }, error: null }
    const origGetSession = supabase.auth.getSession.bind(supabase.auth);
    supabase.auth.getSession = async (...args) => {
      try {
        const res = await origGetSession(...args);
        if (
          res?.error &&
          (res.error.status === 401 ||
            res.error.status === '401' ||
            String(res.error.message || '')
              .toLowerCase()
              .includes('unauthorized'))
        ) {
          return { data: { session: null }, error: null };
        }
        return res;
      } catch (err) {
        return { data: { session: null }, error: null };
      }
    };

    // 4. Safely wrap getUser
    if (typeof supabase.auth.getUser === 'function') {
      const origGetUser = supabase.auth.getUser.bind(supabase.auth);
      supabase.auth.getUser = async (...args) => {
        try {
          const res = await origGetUser(...args);
          if (
            res?.error &&
            (res.error.status === 401 ||
              res.error.status === '401' ||
              String(res.error.message || '')
                .toLowerCase()
                .includes('unauthorized'))
          ) {
            return { data: { user: null }, error: null };
          }
          return res;
        } catch (err) {
          return { data: { user: null }, error: null };
        }
      };
    }

    // 5. Safely wrap refreshSession
    if (typeof supabase.auth.refreshSession === 'function') {
      const origRefreshSession = supabase.auth.refreshSession.bind(
        supabase.auth
      );
      supabase.auth.refreshSession = async (...args) => {
        try {
          const res = await origRefreshSession(...args);
          if (
            res?.error &&
            (res.error.status === 401 ||
              res.error.status === '401' ||
              String(res.error.message || '')
                .toLowerCase()
                .includes('unauthorized'))
          ) {
            return { data: { session: null, user: null }, error: null };
          }
          return res;
        } catch (err) {
          return { data: { session: null, user: null }, error: null };
        }
      };
    }

    // 6. Catch internal initializePromise if present on GoTrueClient
    if (
      supabase.auth.initializePromise &&
      typeof supabase.auth.initializePromise.catch === 'function'
    ) {
      supabase.auth.initializePromise.catch(() => {});
    }
  }
}
