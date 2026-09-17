'use client';

import { useEffect } from 'react';

const clientBuildId = process.env.NEXT_PUBLIC_APP_BUILD_ID || 'unknown';
const RELOAD_MARKER_KEY = 'ourjourney:last-reloaded-build';

export function useBuildVersionSync() {
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    const triggerReload = (serverBuildId: string) => {
      if (sessionStorage.getItem(RELOAD_MARKER_KEY) === serverBuildId) {
        return;
      }

      sessionStorage.setItem(RELOAD_MARKER_KEY, serverBuildId);
      window.location.reload();
    };

    const checkVersion = async () => {
      if (cancelled || inFlight || document.visibilityState === 'hidden') {
        return;
      }

      inFlight = true;

      try {
        const response = await fetch('/api/version', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { build_id?: string };
        const serverBuildId = data.build_id;

        if (!serverBuildId) {
          return;
        }

        if (serverBuildId === clientBuildId) {
          sessionStorage.removeItem(RELOAD_MARKER_KEY);
          return;
        }

        triggerReload(serverBuildId);
      } catch {
        // Ignore version check failures and keep the current session running.
      } finally {
        inFlight = false;
      }
    };

    const onFocus = () => {
      void checkVersion();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkVersion();
      }
    };

    void checkVersion();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const intervalId = window.setInterval(() => {
      void checkVersion();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);
}
