import { usePwaUpdate } from "@/hooks/use-pwa-update";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X, Shield, ArrowUpCircle } from "lucide-react";

/**
 * PwaUpdatePrompt — elegant "Update Available" banner for TrafficWatch AI.
 *
 * Behavior:
 * - Detects new SW versions via `usePwaUpdate` hook.
 * - Shows a compact, non-intrusive banner at the top of the viewport.
 * - "Update Now" triggers SW skip-waiting + page reload.
 * - "Later" dismisses for the current session (via sessionStorage).
 * - Animates in/out with spring transitions.
 * - Automatically respects user's reduced-motion preference.
 */
export function PwaUpdatePrompt() {
  const { updateAvailable, applyUpdate, dismissUpdate } = usePwaUpdate();

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          key="pwa-update-prompt"
          initial={{ opacity: 0, y: -32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -32, scale: 0.96 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 28,
          }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] w-[calc(100%-2rem)] max-w-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="clay-card !rounded-2xl bg-gradient-to-r from-primary/5 via-card to-primary/5 border border-primary/20 shadow-xl overflow-hidden">
            {/* Accent bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

            <div className="relative p-4 flex items-start gap-3">
              {/* Shield icon */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 shadow-sm">
                <ArrowUpCircle className="w-5 h-5 text-primary" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">
                    Update Available
                  </p>
                  <button
                    onClick={dismissUpdate}
                    className="p-1 rounded-lg hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground shrink-0"
                    aria-label="Dismiss update notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  A new version of TrafficWatch AI is ready.
                  Update now to get the latest features and fixes.
                </p>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    onClick={applyUpdate}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Update Now
                  </button>
                  <button
                    onClick={dismissUpdate}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
                  >
                    Later
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
