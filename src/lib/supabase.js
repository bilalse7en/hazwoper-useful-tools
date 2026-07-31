import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://gyglsbmpxopaoeljoofp.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_placeholder';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Intercept & guard all supabase.auth and postgrest methods to prevent unhandled 401 promise rejections
if (typeof window !== 'undefined' && supabase?.auth) {
  // 1. Intercept global unhandledrejection event for 401 / Unauthorized
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const isUnauthorized =
      reason &&
      (reason.status === 401 ||
        reason.status === '401' ||
        reason.message === 'Unauthorized' ||
        reason.error === 'Unauthorized' ||
        String(reason.message || '')
          .toLowerCase()
          .includes('unauthorized') ||
        String(reason || '')
          .toLowerCase()
          .includes('unauthorized') ||
        reason.code === 'PGRST116' ||
        reason.code === '42501');

    if (isUnauthorized) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  // Intercept global uncaught error events
  window.addEventListener('error', (event) => {
    if (
      event?.error?.status === 401 ||
      event?.error?.message === 'Unauthorized' ||
      String(event?.message || '')
        .toLowerCase()
        .includes('unauthorized')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  // 2. Safely wrap getSession to resolve with { data: { session: null }, error: null }
  // when unauthenticated or returning 401 Unauthorized status
  const origGetSession = supabase.auth.getSession.bind(supabase.auth);
  supabase.auth.getSession = async (...args) => {
    try {
      const res = await origGetSession(...args);
      if (
        res?.error &&
        (res.error.status === 401 || res.error.message === 'Unauthorized')
      ) {
        return { data: { session: null }, error: null };
      }
      return res;
    } catch (err) {
      return { data: { session: null }, error: null };
    }
  };

  // 3. Safely wrap getUser
  if (typeof supabase.auth.getUser === 'function') {
    const origGetUser = supabase.auth.getUser.bind(supabase.auth);
    supabase.auth.getUser = async (...args) => {
      try {
        const res = await origGetUser(...args);
        if (
          res?.error &&
          (res.error.status === 401 || res.error.message === 'Unauthorized')
        ) {
          return { data: { user: null }, error: null };
        }
        return res;
      } catch (err) {
        return { data: { user: null }, error: null };
      }
    };
  }

  // 4. Safely wrap refreshSession
  if (typeof supabase.auth.refreshSession === 'function') {
    const origRefreshSession = supabase.auth.refreshSession.bind(supabase.auth);
    supabase.auth.refreshSession = async (...args) => {
      try {
        const res = await origRefreshSession(...args);
        if (
          res?.error &&
          (res.error.status === 401 || res.error.message === 'Unauthorized')
        ) {
          return { data: { session: null, user: null }, error: null };
        }
        return res;
      } catch (err) {
        return { data: { session: null, user: null }, error: null };
      }
    };
  }

  // 5. Catch internal initializePromise if present on GoTrueClient
  if (
    supabase.auth.initializePromise &&
    typeof supabase.auth.initializePromise.catch === 'function'
  ) {
    supabase.auth.initializePromise.catch(() => {});
  }
}
