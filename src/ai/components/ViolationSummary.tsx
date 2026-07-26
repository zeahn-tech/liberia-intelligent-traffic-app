import { Badge } from "@/components/ui/badge";
import { ConfidenceBar } from "./ConfidenceBar";
import { cn } from "@/lib/utils";
import { AlertTriangle, Car, Gavel, ShieldAlert } from "lucide-react";
import type { ViolationDetection } from "../types";

interface ViolationSummaryProps {
  violations: ViolationDetection[];
  className?: string;
}

const severityConfig = {
  critical: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: ShieldAlert },
  serious: { color: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle },
  moderate: { color: "bg-info/10 text-info border-info/20", icon: Car },
  minor: { color: "bg-success/10 text-success border-success/20", icon: Gavel },
};

export function ViolationSummary({ violations, className }: ViolationSummaryProps) {
  if (!violations || violations.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground py-4 text-center", className)}>
        No violations detected
      </div>
    );
  }

  const topViolation = violations.reduce((a, b) =>
    a.confidence > b.confidence ? a : b
  );

  const severityConf = severityConfig[topViolation.severity] || severityConfig.minor;
  const SeverityIcon = severityConf.icon;

  return (
    <div className={cn("space-y-3", className)}>
      {violations.map((violation, idx) => {
        const sevConf = severityConfig[violation.severity] || severityConfig.minor;
        const SevIcon = sevConf.icon;

        return (
          <div
            key={idx}
            className={cn(
              "rounded-xl p-3 border transition-colors",
              idx === 0
                ? "bg-secondary/40 border-border/50"
                : "bg-secondary/20 border-border/30"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <SevIcon className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {formatViolationType(violation.category)}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {violation.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={cn("clay-pill text-[10px] px-2 py-0 h-5", sevConf.color)}
                >
                  {violation.severity}
                </Badge>
              </div>
            </div>

            <div className="mt-2 pl-6">
              <ConfidenceBar score={violation.confidence} size="sm" />
            </div>

            {violation.fineAmount != null && (
              <div className="mt-1 pl-6 text-xs text-muted-foreground">
                Fine: ${violation.fineAmount.toLocaleString()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatViolationType(category: string): string {
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
