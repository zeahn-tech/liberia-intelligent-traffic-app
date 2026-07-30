// ============================================================
// TrafficWatch AI — OfflineIndicator Component
// ============================================================
// Standalone component that shows network connectivity status,
// offline queue count, and reconnection state.
// ============================================================

import { cn } from "@/lib/utils";
import { useNetwork } from "@/hooks/use-network";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Wifi, WifiOff, RefreshCw, CloudOff } from "lucide-react";

interface OfflineIndicatorProps {
  /** Display variant */
  variant?: "badge" | "bar" | "dot";
  /** Show queued items count */
  showQueueCount?: boolean;
  /** Queue count (from sync system) */
  queueCount?: number;
  /** Additional className */
  className?: string;
  /** Show full text label */
  showLabel?: boolean;
}

export function OfflineIndicator({
  variant = "dot",
  showQueueCount = true,
  queueCount = 0,
  className,
  showLabel = true,
}: OfflineIndicatorProps) {
  const { online, wasOffline } = useNetwork();
  const isReconnecting = wasOffline && online;
  // isSlow is not returned by useNetwork in this version

  // Dot variant (smallest, used in header/nav)
  if (variant === "dot") {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <span className={cn("inline-flex items-center", className)}>
              <span
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  isReconnecting ? "bg-amber-500 animate-pulse" :
                  online ? "bg-emerald-500" : "bg-red-500"
                )}
                aria-label={online ? "Online" : isReconnecting ? "Reconnecting..." : "Offline"}
              />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="text-xs space-y-1">
              {isReconnecting ? (
                <p className="flex items-center gap-1.5 text-amber-600">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Reconnecting...
                </p>
              ) : online ? (
                <p className="flex items-center gap-1.5 text-emerald-600">
                  <Wifi className="w-3 h-3" />
                  Connected
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-red-600">
                  <WifiOff className="w-3 h-3" />
                  Offline
                </p>
              )}
              {showQueueCount && queueCount > 0 && (
                <p className="text-muted-foreground">{queueCount} items queued for sync</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Bar variant (full-width banner at top)
  if (variant === "bar") {
    if (online && !isReconnecting) return null;
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 px-4 py-1.5 text-[11px] font-medium animate-in slide-in-from-top-1 duration-300",
          isReconnecting
            ? "bg-amber-500/10 text-amber-600 border-b border-amber-500/20"
            : "bg-red-500/10 text-red-600 border-b border-red-500/20",
          className
        )}
        role="alert"
        aria-live="polite"
      >
        {isReconnecting ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Reconnecting to server...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            <span>You are offline. Some features may be unavailable.</span>
            {showQueueCount && queueCount > 0 && (
              <span className="opacity-60">· {queueCount} queued</span>
            )}
          </>
        )}
      </div>
    );
  }

  // Badge variant (pill in header/toolbar)
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all",
              isReconnecting
                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                : online
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-red-500/10 text-red-600 border border-red-500/20",
              className
            )}
          >
            {isReconnecting ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : online ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            {showLabel && (
              <span>
                {isReconnecting ? "Reconnecting" : online ? "Online" : "Offline"}
              </span>
            )}
            {showQueueCount && queueCount > 0 && !online && (
              <span className="opacity-60">({queueCount})</span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-xs space-y-1">
            {isReconnecting ? (
              <p>Restoring connection...</p>
            ) : online ? (
              <p>Connected to server</p>
            ) : (
              <p>No network connection</p>
            )}
            {showQueueCount && queueCount > 0 && (
              <p className="text-muted-foreground">{queueCount} pending sync items</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
