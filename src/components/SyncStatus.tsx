// ============================================================
// TrafficWatch AI — SyncStatus Component
// ============================================================
// Shows sync queue status, pending/processing/completed counts,
// last sync time, and provides manual sync trigger.
// ============================================================

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  Upload,
  AlertCircle,
  Wifi,
  CloudOff,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────

export interface SyncState {
  /** Whether currently connected/online */
  online: boolean;
  /** Whether a sync operation is in progress */
  syncing: boolean;
  /** Number of items pending */
  pending: number;
  /** Items being processed */
  processing: number;
  /** Items that failed */
  failed: number;
  /** Items synced this session */
  completed: number;
  /** ISO timestamp of last sync */
  lastSyncedAt?: string;
  /** Error message if last sync failed */
  lastError?: string;
}

interface SyncStatusProps {
  /** Sync state from your sync system */
  state: SyncState;
  /** Display variant */
  variant?: "badge" | "card" | "inline";
  /** Callback to trigger manual sync */
  onSync?: () => Promise<void>;
  /** Additional className */
  className?: string;
  /** Show detailed breakdown */
  showDetails?: boolean;
}

// ─── Helpers ────────────────────────────────────────────

function formatTimeAgo(ts?: string): string {
  if (!ts) return "Never";
  try {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  } catch { return ts; }
}

// ─── Component ──────────────────────────────────────────

export function SyncStatus({
  state,
  variant = "badge",
  onSync,
  className,
  showDetails = false,
}: SyncStatusProps) {
  const [syncing, setSyncing] = useState(false);

  const totalQueued = state.pending + state.processing;
  const hasIssues = state.failed > 0 || state.lastError;
  const isEmpty = state.pending === 0 && state.processing === 0 && state.failed === 0;

  const handleSync = async () => {
    if (!onSync || syncing) return;
    setSyncing(true);
    try {
      await onSync();
    } finally {
      setSyncing(false);
    }
  };

  // Inline variant (compact, for header bars)
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2 text-[10px]", className)}>
        {state.syncing || syncing ? (
          <span className="flex items-center gap-1 text-primary">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Syncing...
          </span>
        ) : !state.online ? (
          <span className="flex items-center gap-1 text-muted-foreground">
            <CloudOff className="w-3 h-3" />
            Offline
          </span>
        ) : hasIssues ? (
          <span className="flex items-center gap-1 text-amber-600">
            <AlertCircle className="w-3 h-3" />
            {state.failed} failed
          </span>
        ) : (
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="w-3 h-3" />
            Synced
          </span>
        )}

        {!isEmpty && state.online && (
          <span className="text-muted-foreground">
            {totalQueued} pending
          </span>
        )}
      </div>
    );
  }

  // Card variant (full details panel)
  if (variant === "card") {
    return (
      <div className={cn(
        "rounded-xl border border-border/50 p-4 space-y-3",
        hasIssues ? "bg-amber-500/5 border-amber-500/20" : "bg-card",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {state.syncing || syncing ? (
              <RefreshCw className="w-4 h-4 text-primary animate-spin" />
            ) : state.online ? (
              <Wifi className="w-4 h-4 text-emerald-500" />
            ) : (
              <CloudOff className="w-4 h-4 text-muted-foreground" />
            )}
            <h3 className="text-sm font-semibold">
              {state.syncing || syncing ? "Syncing..." : state.online ? "Synchronized" : "Offline"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">
              <Clock className="w-3 h-3 mr-1" />
              {formatTimeAgo(state.lastSyncedAt)}
            </Badge>
            {onSync && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] rounded-lg"
                onClick={handleSync}
                disabled={state.syncing || syncing || !state.online}
              >
                <RefreshCw className={cn("w-3 h-3 mr-1", (state.syncing || syncing) && "animate-spin")} />
                Sync Now
              </Button>
            )}
          </div>
        </div>

        {showDetails && (
          <div className="grid grid-cols-4 gap-3">
            <div className={cn(
              "p-2 rounded-lg text-center",
              state.completed > 0 ? "bg-emerald-500/10" : "bg-secondary/50"
            )}>
              <p className="text-lg font-bold text-emerald-600">{state.completed}</p>
              <p className="text-[9px] text-muted-foreground">Completed</p>
            </div>
            <div className={cn(
              "p-2 rounded-lg text-center",
              state.pending > 0 ? "bg-blue-500/10" : "bg-secondary/50"
            )}>
              <p className="text-lg font-bold text-blue-600">{state.pending}</p>
              <p className="text-[9px] text-muted-foreground">Pending</p>
            </div>
            <div className={cn(
              "p-2 rounded-lg text-center",
              state.processing > 0 ? "bg-amber-500/10" : "bg-secondary/50"
            )}>
              <p className="text-lg font-bold text-amber-600">{state.processing}</p>
              <p className="text-[9px] text-muted-foreground">Syncing</p>
            </div>
            <div className={cn(
              "p-2 rounded-lg text-center",
              state.failed > 0 ? "bg-red-500/10" : "bg-secondary/50"
            )}>
              <p className={cn("text-lg font-bold", state.failed > 0 ? "text-red-600" : "text-muted-foreground")}>
                {state.failed}
              </p>
              <p className="text-[9px] text-muted-foreground">Failed</p>
            </div>
          </div>
        )}

        {state.lastError && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/5 text-[11px] text-red-600">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <p>{state.lastError}</p>
          </div>
        )}
      </div>
    );
  }

  // Default: badge variant (compact pill)
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all cursor-help",
              state.syncing || syncing
                ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                : hasIssues
                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                : state.online
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
              className
            )}
          >
            {(state.syncing || syncing) ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : !state.online ? (
              <CloudOff className="w-3 h-3" />
            ) : (
              <Upload className="w-3 h-3" />
            )}
            <span>
              {(state.syncing || syncing) ? "Syncing" :
               hasIssues ? `${state.failed} failed` :
               isEmpty ? "Synced" :
               `${totalQueued} to sync`}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-3">
          <div className="space-y-1.5 text-xs">
            <p className="font-semibold">Sync Status</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
              <span>Status:</span>
              <span className={state.online ? "text-emerald-600" : "text-red-600"}>
                {state.online ? "Connected" : "Offline"}
              </span>
              <span>Pending:</span>
              <span>{state.pending}</span>
              <span>Completed:</span>
              <span className="text-emerald-600">{state.completed}</span>
              {state.failed > 0 && (
                <>
                  <span>Failed:</span>
                  <span className="text-red-600">{state.failed}</span>
                </>
              )}
            </div>
            <p className="text-muted-foreground pt-1 border-t border-border/20">
              Last sync: {formatTimeAgo(state.lastSyncedAt)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
