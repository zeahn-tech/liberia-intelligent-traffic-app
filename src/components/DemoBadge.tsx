// ============================================================
// TrafficWatch AI — Demo Badge Component
// ============================================================
// A persistent, clearly visible badge that indicates the
// application is running with demo/seed data.
// ============================================================

import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useDemoMode } from "@/hooks/use-demo-mode";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DemoBadgeProps {
  /** Optional: force show even if not detected as demo */
  forceShow?: boolean;
  /** Optional: compact mode for mobile */
  compact?: boolean;
}

export function DemoBadge({ forceShow = false, compact = false }: DemoBadgeProps) {
  const { isDemo, demoType, label } = useDemoMode();

  if (!isDemo && !forceShow) return null;

  const badgeContent = compact ? (
    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[9px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
      <AlertTriangle className="w-2.5 h-2.5" />
      <span>Demo</span>
    </span>
  ) : (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider shadow-sm">
      <ShieldAlert className="w-3 h-3" />
      <span>DEMO</span>
      {demoType && (
        <span className="hidden sm:inline text-[9px] text-amber-500/70 normal-case font-normal">
          · {label}
        </span>
      )}
    </span>
  );

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="cursor-help">{badgeContent}</div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[280px] text-xs p-3">
          <div className="space-y-1.5">
            <p className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Demo / Development Mode
            </p>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              The data displayed in this application is demo/seed data for
              development and testing purposes only. It does not represent
              real police information, active incidents, or actual enforcement
              actions.
            </p>
            <p className="text-muted-foreground text-[10px] leading-relaxed border-t border-border/20 pt-1.5 mt-1.5">
              AI-generated analyses are estimates. Predictions are not
              guarantees of future incidents. All data should be verified
              before use in any official capacity.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
