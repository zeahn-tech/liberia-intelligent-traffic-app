// ============================================================
// TrafficWatch AI — AlertPanel Component
//
// Displays critical alerts, high-risk detections, and urgent
// system notifications in a compact, scrollable panel.
// ============================================================

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Car,
  Clock,
  MapPin,
  ArrowRight,
  X,
  Bell,
  TrendingUp,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  UserX,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────

export interface AlertItem {
  id: string;
  type: "critical" | "high" | "warning" | "info";
  title: string;
  description: string;
  timestamp: string;
  source?: string;
  location?: string;
  actionable?: boolean;
  actionLabel?: string;
  actionLink?: string;
}

interface AlertPanelProps {
  /** Alerts to display */
  alerts: AlertItem[];
  /** Maximum number to show (default: 5) */
  maxAlerts?: number;
  /** Whether to show the header */
  showHeader?: boolean;
  /** Callback when an alert is dismissed */
  onDismiss?: (id: string) => void;
  /** Callback when alert action is clicked */
  onAction?: (alert: AlertItem) => void;
  /** Title for the panel */
  title?: string;
}

// ─── Alert Type Styles ──────────────────────────────────

const ALERT_STYLES: Record<string, {
  border: string;
  bg: string;
  icon: React.ReactNode;
  badge: string;
  dot: string;
}> = {
  critical: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    icon: <Flame className="w-4 h-4 text-red-500" />,
    badge: "bg-red-500/10 text-red-500 border-red-500/20",
    dot: "bg-red-500",
  },
  high: {
    border: "border-orange-500/30",
    bg: "bg-orange-500/5",
    icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    badge: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    dot: "bg-orange-500",
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    icon: <Bell className="w-4 h-4 text-amber-500" />,
    badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    dot: "bg-amber-500",
  },
  info: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    icon: <TrendingUp className="w-4 h-4 text-blue-500" />,
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    dot: "bg-blue-500",
  },
};

// ─── Time formatting ────────────────────────────────────

function formatAlertTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Component ───────────────────────────────────────────

export function AlertPanel({
  alerts,
  maxAlerts = 5,
  showHeader = true,
  onDismiss,
  onAction,
  title = "Active Alerts",
}: AlertPanelProps) {
  const displayedAlerts = alerts.slice(0, maxAlerts);
  const criticalCount = alerts.filter((a) => a.type === "critical").length;
  const highCount = alerts.filter((a) => a.type === "high").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
            <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
              {title}
            </h3>
            <div className="flex items-center gap-1">
              {criticalCount > 0 && (
                <Badge className="text-[9px] px-1.5 py-0 h-4 bg-red-500/10 text-red-500 border-red-500/20">
                  {criticalCount} critical
                </Badge>
              )}
              {highCount > 0 && (
                <Badge className="text-[9px] px-1.5 py-0 h-4 bg-orange-500/10 text-orange-500 border-orange-500/20">
                  {highCount} high
                </Badge>
              )}
            </div>
          </div>
          {alerts.length > maxAlerts && (
            <span className="text-[9px] text-muted-foreground/50">
              +{alerts.length - maxAlerts} more
            </span>
          )}
        </div>
      )}

      {/* Alerts list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {displayedAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ShieldAlert className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs font-medium text-muted-foreground/50">All clear</p>
            <p className="text-[10px] text-muted-foreground/30 mt-0.5">No active alerts</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {displayedAlerts.map((alert) => {
              const styles = ALERT_STYLES[alert.type] || ALERT_STYLES.info;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`relative border-l-2 ${styles.border} ${styles.bg} px-3 py-2.5 border-b border-border/10 last:border-b-0 group`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5">
                      {styles.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold text-foreground/90 truncate">
                          {alert.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[8px] px-1 py-0 h-3.5 ${styles.badge}`}
                        >
                          {alert.type}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground/70 leading-relaxed line-clamp-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-muted-foreground/40 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatAlertTime(alert.timestamp)}
                        </span>
                        {alert.location && (
                          <span className="text-[9px] text-muted-foreground/40 flex items-center gap-1 truncate max-w-[100px]">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{alert.location}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {alert.actionable && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-5 w-5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                          onClick={() => onAction?.(alert)}
                          title={alert.actionLabel || "View details"}
                        >
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      )}
                      {onDismiss && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-5 w-5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={() => onDismiss(alert.id)}
                          title="Dismiss"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Severity indicator dot (right side) */}
                  <span className={`absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full ${styles.dot} opacity-50`} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
