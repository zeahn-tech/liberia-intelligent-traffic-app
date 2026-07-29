import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  X,
  Shield,
  Smartphone,
  Monitor,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

/**
 * PwaInstallPrompt — a respectful, elegant install banner for TrafficWatch AI.
 *
 * Behavior:
 * - Captures the browser's `beforeinstallprompt` event once.
 * - Shows a compact card with an "Install App" button and "Not now" dismiss.
 * - Dismissals are stored in localStorage so the prompt won't reappear
 *   on subsequent visits (configurable timeout).
 * - Automatically hides if the app is already running in standalone mode.
 * - Hides permanently after successful installation.
 * - Shows platform-specific hints (mobile vs desktop).
 */
export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ── Platform detection ──────────────────────────────
  useEffect(() => {
    const check = () => {
      setIsMobile(
        /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.matchMedia("(pointer: coarse)").matches
      );
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Standalone mode detection ────────────────────────
  useEffect(() => {
    const match = window.matchMedia("(display-mode: standalone)");
    setIsStandalone(match.matches);
    const handler = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    match.addEventListener("change", handler);
    return () => match.removeEventListener("change", handler);
  }, []);

  // ── Capture beforeinstallprompt ──────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the default mini-infobar from appearing
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user has dismissed recently
      const lastDismiss = localStorage.getItem("tw-pwa-dismissed");
      if (lastDismiss) {
        const elapsed = Date.now() - parseInt(lastDismiss, 10);
        const DAY_MS = 86_400_000;
        // Respect dismissal for 30 days
        if (elapsed < 30 * DAY_MS) {
          return;
        }
        localStorage.removeItem("tw-pwa-dismissed");
      }

      setDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // ── Handle successful installation ───────────────────
  useEffect(() => {
    const handler = () => {
      setJustInstalled(true);
      setDeferredPrompt(null);
      setDismissed(true);
      // Don't show again
      localStorage.setItem("tw-pwa-dismissed", String(Date.now()));
    };
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, []);

  // ── Track paused visibility to re-evaluate ───────────
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible" && justInstalled) {
        setJustInstalled(false);
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [justInstalled]);

  // ── Install action ───────────────────────────────────
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      (deferredPrompt as unknown as { prompt: () => Promise<void> }).prompt();
      const result = await (
        deferredPrompt as unknown as { userChoice: Promise<{ outcome: string }> }
      ).userChoice;
      if (result.outcome === "accepted") {
        setJustInstalled(true);
      }
    } catch {
      // User dismissed the native dialog or browser doesn't support prompt()
    } finally {
      setDeferredPrompt(null);
      setInstalling(false);
      setDismissed(true);
    }
  }, [deferredPrompt]);

  // ── Dismiss ──────────────────────────────────────────
  const handleDismiss = useCallback(() => {
    setDismissed(true);
    // Persist dismissal for 30 days
    localStorage.setItem("tw-pwa-dismissed", String(Date.now()));
  }, []);

  // ── Render nothing if conditions aren't met ──────────
  if (
    isStandalone ||
    justInstalled ||
    (!deferredPrompt && !justInstalled)
  ) {
    return null;
  }

  // ── Success state (brief) ────────────────────────────
  if (justInstalled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-[100] max-w-sm"
      >
        <div className="clay-card !rounded-2xl p-4 bg-card border border-success/20 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Installed Successfully
              </p>
              <p className="text-xs text-muted-foreground">
                TrafficWatch AI is now on your device
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Install prompt card ──────────────────────────────
  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          key="pwa-install-prompt"
          initial={{ opacity: 0, y: -24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-4 right-4 z-[100] max-w-sm w-full sm:w-auto"
        >
          <div className="clay-card !rounded-2xl p-4 bg-gradient-to-br from-card to-secondary/50 border border-border/50 shadow-xl">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2.5 right-2.5 p-1 rounded-lg hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Dismiss install prompt"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/90 to-primary/70 flex items-center justify-center shrink-0 shadow-sm">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>

              <div className="flex-1 min-w-0 pr-4">
                {/* Title */}
                <p className="text-sm font-bold text-foreground">
                  Install TrafficWatch AI
                </p>

                {/* Description */}
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {isMobile
                    ? "Add to your home screen for faster access, offline support, and a full-screen experience."
                    : "Install as a desktop app for offline access, faster loading, and a dedicated window."}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mt-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/60 text-[10px] font-medium text-muted-foreground">
                    <Download className="w-3 h-3" />
                    Offline-ready
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/60 text-[10px] font-medium text-muted-foreground">
                    {isMobile ? (
                      <Smartphone className="w-3 h-3" />
                    ) : (
                      <Monitor className="w-3 h-3" />
                    )}
                    {isMobile ? "Home screen" : "Desktop app"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleInstall}
                    disabled={installing}
                    className="clay-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {installing ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        Installing...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        Install App
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Type declaration for beforeinstallprompt ──────────
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}
