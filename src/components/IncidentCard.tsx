// ============================================================
// TrafficWatch AI — IncidentCard Component
// ============================================================
// Reusable incident summary card for lists, dashboards, and
// search results. Supports compact and full variants.
// ============================================================

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Car,
  AlertTriangle,
  MapPin,
  Clock,
  User,
  ChevronRight,
  Shield,
  Gavel,
  ExternalLink,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────

export interface IncidentSummary {
  id: string;
  title: string;
  description?: string;
  severity: "critical" | "high" | "serious" | "moderate" | "minor" | "low";
  status: string;
  vehiclePlate?: string;
  vehicleType?: string;
  vehicleColor?: string;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
  officerName?: string;
  officerBadge?: string;
  officerAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  violationType?: string;
  evidenceCount?: number;
  isAiAnalyzed?: boolean;
  isEscalated?: boolean;
  isAssigned?: boolean;
}

interface IncidentCardProps {
  incident: IncidentSummary;
  /** Display variant */
  variant?: "card" | "compact" | "list" | "detail";
  /** Show action buttons */
  showActions?: boolean;
  /** Show description */
  showDescription?: boolean;
  /** Show officer avatar */
  showOfficer?: boolean;
  /** Show map location indicator */
  showLocation?: boolean;
  /** Callback when card is clicked */
  onClick?: (id: string) => void;
  /** Callback for assignment action */
  onAssign?: (id: string) => void;
  /** Callback for escalation */
  onEscalate?: (id: string) => void;
  /** Callback for viewing on map */
  onViewMap?: (id: string) => void;
  /** Additional className */
  className?: string;
}

// ─── Severity & Status styling ──────────────────────────

const SEVERITY_STYLES: Record<string, { dot: string; bg: string; text: string; border: string }> = {
  critical: { dot: "bg-red-500", bg: "bg-red-500/5", text: "text-red-600 dark:text-red-400", border: "border-l-red-500" },
  high: { dot: "bg-orange-500", bg: "bg-orange-500/5", text: "text-orange-600 dark:text-orange-400", border: "border-l-orange-500" },
  serious: { dot: "bg-orange-500", bg: "bg-orange-500/5", text: "text-orange-600 dark:text-orange-400", border: "border-l-orange-500" },
  moderate: { dot: "bg-amber-500", bg: "bg-amber-500/5", text: "text-amber-600 dark:text-amber-400", border: "border-l-amber-500" },
  minor: { dot: "bg-blue-500", bg: "bg-blue-500/5", text: "text-blue-600 dark:text-blue-400", border: "border-l-blue-500" },
  low: { dot: "bg-zinc-400", bg: "bg-zinc-400/5", text: "text-zinc-600 dark:text-zinc-400", border: "border-l-zinc-400" },
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-700",
  submitted: "bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  under_review: "bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  assigned: "bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  investigating: "bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  escalated: "bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  confirmed: "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  resolved: "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  closed: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800/30 dark:text-zinc-400 dark:border-zinc-700",
  rejected: "bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  archived: "bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-800/20 dark:text-zinc-500 dark:border-zinc-700",
};

function getSeverityStyle(severity: string) {
  return SEVERITY_STYLES[severity] || SEVERITY_STYLES.minor;
}

function formatTimestamp(ts?: string): string {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return ts; }
}

function getStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

// ─── Component ──────────────────────────────────────────

export function IncidentCard({
  incident,
  variant = "card",
  showActions = true,
  showDescription = true,
  showOfficer = true,
  showLocation = true,
  onClick,
  onAssign,
  onEscalate,
  onViewMap,
  className,
}: IncidentCardProps) {
  const severityStyle = getSeverityStyle(incident.severity);

  // Compact variant (for lists, sidebars)
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-b-0 hover:bg-secondary/30 transition-colors cursor-pointer group",
          className
        )}
        onClick={() => onClick?.(incident.id)}
        role="button"
        tabIndex={0}
      >
        <div className={cn("w-2 h-2 rounded-full shrink-0", severityStyle.dot)} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
            {incident.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
            <span className="font-mono text-[9px]">{incident.id}</span>
            {incident.vehiclePlate && (
              <span className="font-mono">· {incident.vehiclePlate}</span>
            )}
            <span>· {formatTimestamp(incident.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className={cn("text-[9px] px-1.5 py-0 h-4 capitalize", STATUS_STYLES[incident.status] || "bg-secondary text-muted-foreground")}
          >
            {getStatusLabel(incident.status)}
          </Badge>
          <ChevronRight className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  }

  // List variant (horizontal row)
  if (variant === "list") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 px-4 py-3 border-b border-border/30 last:border-b-0 hover:bg-secondary/20 transition-colors cursor-pointer group",
          className
        )}
        onClick={() => onClick?.(incident.id)}
        role="button"
        tabIndex={0}
      >
        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", severityStyle.dot)} />
        <div className="flex gap-2 flex-1 min-w-0 items-center">
          <span className="text-[10px] font-mono text-muted-foreground w-20 shrink-0">{incident.id}</span>
          <p className="text-xs font-medium truncate flex-1">{incident.title}</p>
          {incident.vehiclePlate && (
            <span className="text-[10px] font-mono text-muted-foreground w-16 truncate shrink-0">{incident.vehiclePlate}</span>
          )}
          <Badge
            variant="outline"
            className={cn("text-[9px] px-1.5 py-0 h-4 capitalize shrink-0", STATUS_STYLES[incident.status] || "bg-secondary text-muted-foreground")}
          >
            {getStatusLabel(incident.status)}
          </Badge>
          {incident.officerName && (
            <span className="text-[10px] text-muted-foreground w-24 truncate shrink-0">{incident.officerName}</span>
          )}
          <span className="text-[10px] text-muted-foreground w-16 shrink-0">{formatTimestamp(incident.createdAt)}</span>
        </div>
      </div>
    );
  }

  // Detail variant
  if (variant === "detail") {
    return (
      <Card className={cn("border-border/50 overflow-hidden", className)}>
        <CardHeader className={cn("px-5 py-4 flex-row items-center justify-between border-b border-border/30", severityStyle.bg)}>
          <div className="flex items-center gap-3">
            <div className={cn("w-3 h-3 rounded-full", severityStyle.dot)} />
            <div>
              <p className="text-sm font-semibold">{incident.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono text-muted-foreground">{incident.id}</span>
                <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4 capitalize", STATUS_STYLES[incident.status])}>
                  {getStatusLabel(incident.status)}
                </Badge>
              </div>
            </div>
          </div>
          {showActions && (
            <div className="flex gap-1">
              {onAssign && (
                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => onAssign(incident.id)}>
                  Assign
                </Button>
              )}
              {onEscalate && incident.status !== "escalated" && (
                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => onEscalate(incident.id)}>
                  Escalate
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {showDescription && incident.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{incident.description}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {incident.vehiclePlate && (
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Plate</p>
                <p className="text-xs font-mono font-semibold">{incident.vehiclePlate}</p>
              </div>
            )}
            {incident.vehicleType && (
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Vehicle</p>
                <p className="text-xs">{incident.vehicleType}{incident.vehicleColor ? ` · ${incident.vehicleColor}` : ""}</p>
              </div>
            )}
            {incident.violationType && (
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Violation</p>
                <p className="text-xs">{incident.violationType}</p>
              </div>
            )}
            {incident.evidenceCount !== undefined && (
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Evidence</p>
                <p className="text-xs">{incident.evidenceCount} items</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {incident.officerName && showOfficer && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <User className="w-3 h-3" />
                <span>{incident.officerName}</span>
                {incident.officerBadge && <span className="font-mono">· #{incident.officerBadge}</span>}
              </div>
            )}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatTimestamp(incident.createdAt)}</span>
            </div>
            {incident.locationAddress && showLocation && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[150px]">{incident.locationAddress}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default: card variant
  return (
    <Card
      className={cn(
        "border-border/50 overflow-hidden transition-all hover:shadow-sm hover:border-border group cursor-pointer",
        `border-l-2 ${severityStyle.border}`,
        className
      )}
      onClick={() => onClick?.(incident.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-muted-foreground">{incident.id}</span>
              {incident.isEscalated && (
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-red-500/10 text-red-600 border-red-500/20">
                  Escalated
                </Badge>
              )}
              {incident.isAssigned && (
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-purple-500/10 text-purple-600 border-purple-500/20">
                  Assigned
                </Badge>
              )}
            </div>
            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
              {incident.title}
            </p>
            {showDescription && incident.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                {incident.description}
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn("text-[9px] px-1.5 py-0 h-4 capitalize shrink-0", STATUS_STYLES[incident.status] || "bg-secondary text-muted-foreground")}
          >
            {getStatusLabel(incident.status)}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-[10px] text-muted-foreground">
          {incident.vehiclePlate && (
            <span className="flex items-center gap-1">
              <Car className="w-3 h-3" />
              <span className="font-mono font-semibold">{incident.vehiclePlate}</span>
            </span>
          )}
          {incident.locationAddress && showLocation && (
            <span className="flex items-center gap-1 truncate max-w-[180px]">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{incident.locationAddress}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimestamp(incident.createdAt)}
          </span>
          {incident.evidenceCount !== undefined && (
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {incident.evidenceCount} evidence
            </span>
          )}
        </div>

        {showOfficer && incident.officerName && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/20">
            <div className="flex items-center gap-2">
              <UserAvatar
                fullName={incident.officerName}
                badgeNumber={incident.officerBadge}
                size="sm"
                showTooltip={false}
                showBadge={false}
              />
              <div>
                <p className="text-[11px] font-medium">{incident.officerName}</p>
                {incident.officerBadge && (
                  <p className="text-[9px] font-mono text-muted-foreground">#{incident.officerBadge}</p>
                )}
              </div>
            </div>
            {showActions && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] rounded-lg"
                onClick={(e) => { e.stopPropagation(); onClick?.(incident.id); }}
              >
                View Details
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
