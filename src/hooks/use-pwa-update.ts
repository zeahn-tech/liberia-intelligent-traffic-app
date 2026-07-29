import { useState, useEffect, useCallback, useRef } from "react";

interface PwaUpdateState {
  /** Whether a new SW version has been detected and is ready */
  updateAvailable: boolean;
  /**
   * Apply the update: send SKIP_WAITING to the waiting SW,
   * then reload all open clients.
   */
  applyUpdate: () => void;
  /** Dismiss this update notification (until next update event) */
  dismissUpdate: () => void;
}

/**
 * usePwaUpdate — tracks new service worker versions and allows
 * the user to apply them at their convenience.
 *
 * Detection flow:
 * 1. On mount, find the active registration from `navigator.serviceWorker`
 * 2. Listen for `updatefound` — a new SW is being fetched
 * 3. When the installing SW's `state` transitions to `installed`,
 *    a new version is ready → set `updateAvailable: true`
 * 4. `applyUpdate()` posts SKIP_WAITING and reloads the page
 */
export function usePwaUpdate(): PwaUpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const waitingSwRef = useRef<ServiceWorker | null>(null);
  const dismissedRef = useRef(false);

  const applyUpdate = useCallback(() => {
    if (waitingSwRef.current) {
      // Tell the waiting SW to activate
      waitingSwRef.current.postMessage({ type: "SKIP_WAITING" });

      // Reload once the new SW takes over
      const onStateChange = () => {
        if (waitingSwRef.current?.state === "activated") {
          window.location.reload();
        }
      };
      waitingSwRef.current.addEventListener("statechange", onStateChange, {
        once: true,
      });

      // Fallback: reload after a short delay if the SW doesn't fire statechange
      setTimeout(() => window.location.reload(), 3000);
    } else {
      // No waiting SW but user requested update — just reload
      window.location.reload();
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    dismissedRef.current = true;
    setUpdateAvailable(false);
    // Persist dismissal for this session
    sessionStorage.setItem("tw-sw-update-dismissed", "true");
  }, []);

  useEffect(() => {
    // Don't run in SSR / non-browser
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    // Check for previous dismissal this session
    if (sessionStorage.getItem("tw-sw-update-dismissed") === "true") {
      dismissedRef.current = true;
      return;
    }

    let mounted = true;

    const handleRegistration = (
      registration: ServiceWorkerRegistration
    ) => {
      if (!mounted) return;

      // Check if there's already a waiting SW
      if (registration.waiting) {
        waitingSwRef.current = registration.waiting;
        if (!dismissedRef.current) {
          setUpdateAvailable(true);
        }
        return;
      }

      // Listen for a new SW being fetched
      registration.addEventListener("updatefound", () => {
        const installingSw = registration.installing;
        if (!installingSw) return;

        installingSw.addEventListener("statechange", () => {
          if (!mounted) return;
          if (
            installingSw.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // New version is fully fetched and installed
            waitingSwRef.current = installingSw;
            if (!dismissedRef.current) {
              setUpdateAvailable(true);
            }
          }
        });
      });
    };

    // Try to get the existing registration
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (reg) handleRegistration(reg);
      })
      .catch(() => {
        // SW registration not available (e.g. in dev with no SW)
      });

    // Listen for new registrations from vite-plugin-pwa
    // (fires when the SW is first registered or updated)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // The SW has changed — re-check for waiting workers
      if (!mounted) return;
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => {
          if (reg?.waiting && !dismissedRef.current) {
            waitingSwRef.current = reg.waiting;
            setUpdateAvailable(true);
          }
        })
        .catch(() => {});
    });

    return () => {
      mounted = false;
    };
  }, []);

  return { updateAvailable, applyUpdate, dismissUpdate };
}
