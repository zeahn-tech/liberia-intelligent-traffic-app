import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Clock,
  User,
  FileText,
  Activity,
  CheckCircle2,
  Download,
  Eye,
  Brain,
  Upload,
  Hash,
  ArrowRight,
  AlertTriangle,
  Lock,
  Search,
  X,
  LogIn,
  LogOut,
  FilePlus,
  Edit,
  Trash2,
  UserPlus,
  ArrowUpCircle,
  FileDown,
  AlertCircle,
  UserX,
  UserCheck,
  Settings,
  Database,
  ShieldOff,
  File,
} from "lucide-react";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_ICONS,
  AUDIT_ACTION_COLORS,
  SEVERITY_COLORS,
  type AuditSeverity,
} from "@/lib/audit";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────

export interface AuditEvent {
  id: string;
  type: string;
  description: string;
  performedBy: string;
  performedByName: string;
  targetType: "evidence" | "incident" | "anpr" | "system" | "user" | "ai_analysis";
  targetId: string;
  severity?: AuditSeverity;
  details?: Record<string, unknown>;
  timestamp: string;
}

interface AuditLogProps {
  events: AuditEvent[];
  title?: string;
  description?: string;
  maxHeight?: string;
  compact?: boolean;
  showSearch?: boolean;
  showSeverity?: boolean;
  emptyMessage?: string;
}

// ─── Helper functions ──────────────────────────────────

function getActionLabel(type: string): string {
  return AUDIT_ACTION_LABELS[type] || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getIconForType(type: string): React.ElementType {
  const iconName = AUDIT_ACTION_ICONS[type] || "";
  const iconMap: Record<string, React.ElementType> = {
    "log-in": LogIn,
    "log-out": LogOut,
    "alert-triangle": AlertTriangle,
    lock: Lock,
    shield: Shield,
    "shield-off": ShieldOff,
    "file-plus": FilePlus,
    edit: Edit,
    "trash-2": Trash2,
    "user-plus": UserPlus,
    "arrow-up-circle": ArrowUpCircle,
    upload: Upload,
    eye: Eye,
    download: Download,
    "file-down": FileDown,
    "arrow-right": ArrowRight,
    hash: Hash,
    brain: Brain,
    "alert-circle": AlertCircle,
    "check-circle": CheckCircle2,
    "user-x": UserX,
    "user-check": UserCheck,
    settings: Settings,
    database: Database,
    "file-text": FileText,
    activity: Activity,
  };
  return iconMap[iconName] || Activity;
}

function getColorForType(type: string): string {
  return AUDIT_ACTION_COLORS[type] || "bg-secondary";
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return ts;
  }
}

function getSeverityBadge(severity?: AuditSeverity) {
  if (!severity || severity === "info") return null;
  const colors = SEVERITY_COLORS[severity];
  return (
    <Badge className={`clay-pill text-[9px] px-1.5 py-0 h-4 ${colors}`}>
      {severity}
    </Badge>
  );
}

// ─── Component ──────────────────────────────────────────

export function AuditLog({
  events,
  title = "Audit Trail",
  description = "Complete record of all actions taken",
  maxHeight = "400px",
  compact = false,
  showSearch = false,
  showSeverity = true,
  emptyMessage = "No audit events recorded yet",
}: AuditLogProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Get unique action types for the filter dropdown
  const actionTypes = useMemo(() => {
    const types = new Set(events.map((e) => e.type));
    return Array.from(types).sort();
  }, [events]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let result = events.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.performedByName.toLowerCase().includes(q) ||
          e.targetId.toLowerCase().includes(q) ||
          getActionLabel(e.type).toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((e) => e.type === typeFilter);
    }

    return result;
  }, [events, searchQuery, typeFilter]);

  return (
    <Card className="border-border/50 !rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description} — {filteredEvents.length} events</CardDescription>
          </div>
          <Badge variant="outline" className="clay-pill text-[10px] px-1.5 py-0 h-4 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shrink-0">
            <Shield className="w-2.5 h-2.5 mr-0.5" />
            Authorized
          </Badge>
        </div>

        {/* Search & filter */}
        {(showSearch || actionTypes.length > 5) && (
          <div className="flex items-center gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search audit events..."
                className="clay-inset pl-8 h-8 text-xs rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-xl">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {actionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getActionLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Activity className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No matching audit events found" : emptyMessage}
            </p>
          </div>
        ) : (
          <div className="relative" style={{ maxHeight, overflowY: "auto" }}>
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border/50" />

            <div className="space-y-3">
              {filteredEvents.map((event) => {
                const Icon = getIconForType(event.type);
                const dotColor = getColorForType(event.type);
                const severityBadge = showSeverity ? getSeverityBadge(event.severity as AuditSeverity) : null;

                return (
                  <div key={event.id} className="relative pl-10 group">
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full ${dotColor} border-2 border-card flex items-center justify-center transition-transform group-hover:scale-125`}
                    >
                      <div className="w-1 h-1 rounded-full bg-card" />
                    </div>

                    <div className="flex items-start justify-between gap-2 p-2 rounded-xl hover:bg-secondary/30 transition-colors -mx-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`w-5 h-5 rounded-md ${dotColor}/10 flex items-center justify-center`}>
                            <Icon className={`w-3 h-3 ${dotColor.replace("bg-", "text-")}`} />
                          </div>
                          <p className="text-sm font-medium">{getActionLabel(event.type)}</p>
                          {severityBadge}
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {event.targetId.length > 16
                              ? event.targetId.substring(0, 16) + "..."
                              : event.targetId}
                          </span>
                        </div>

                        <p className={`text-xs text-muted-foreground mt-0.5 ${compact ? "line-clamp-1" : ""}`}>
                          {event.description}
                        </p>

                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">
                              {event.performedByName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                          {event.targetType && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5">
                              {event.targetType}
                            </Badge>
                          )}
                        </div>

                        {/* Details expansion */}
                        {event.details && Object.keys(event.details).length > 0 && !compact && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Object.entries(event.details).map(([k, v]) => (
                              <span
                                key={k}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground"
                              >
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Mock Data Generator ───────────────────────────────

export function generateMockAuditEvents(incidentId: string, count: number = 10): AuditEvent[] {
  const base = Date.now() - count * 3600000;
  const officers = ["Sgt. John Kollie", "Ofc. James Tarplah", "TrafficWatch AI", "System"];

  const eventTypes = [
    "incident_created",
    "evidence_uploaded",
    "evidence_uploaded",
    "ai_analysis_completed",
    "ai_analysis_reviewed",
    "evidence_viewed",
    "incident_status_changed",
    "incident_assigned",
    "evidence_hash_verified",
    "report_generated",
    "evidence_downloaded",
    "incident_escalated",
  ];

  return Array.from({ length: count }, (_, i) => {
    const type = eventTypes[i % eventTypes.length];
    const officerName = officers[i % officers.length];
    const severities: (AuditSeverity | undefined)[] = [
      undefined, undefined, undefined, undefined,
      "info", "warning", "error",
    ];
    return {
      id: `audit-${incidentId}-${i}-${Date.now()}`,
      type,
      description: generateDescription(type, incidentId),
      performedBy: `ofc-${(i % 3) + 1}`,
      performedByName: officerName,
      targetType: (type.startsWith("evidence") ? "evidence" :
                   type.startsWith("ai") ? "ai_analysis" :
                   type.startsWith("incident") || type === "report_generated" ? "incident" :
                   "system") as AuditEvent["targetType"],
      targetId: type.startsWith("evidence") ? `EV-${String(i + 1).padStart(3, "0")}` : incidentId,
      severity: severities[i % severities.length],
      details: i % 3 === 0 ? { details: `Additional context for event ${i + 1}` } : undefined,
      timestamp: new Date(base + i * 3600000).toISOString(),
    };
  });
}

function generateDescription(type: string, incidentId: string): string {
  switch (type) {
    case "incident_created": return `Incident ${incidentId} was created and submitted for review`;
    case "evidence_uploaded": return `New photographic evidence uploaded to ${incidentId}`;
    case "evidence_viewed": return `Evidence reviewed in case ${incidentId}`;
    case "evidence_downloaded": return `Evidence file downloaded from ${incidentId}`;
    case "evidence_hash_verified": return `SHA-256 hash verification passed for evidence file`;
    case "ai_analysis_completed": return `AI vision analysis completed for evidence on ${incidentId}`;
    case "ai_analysis_reviewed": return `AI analysis findings confirmed by investigating officer`;
    case "incident_status_changed": return `Incident status updated on ${incidentId}`;
    case "incident_assigned": return `${incidentId} assigned to investigator for review`;
    case "incident_escalated": return `${incidentId} escalated to supervisor — requires immediate attention`;
    case "report_generated": return `Official PDF report generated for ${incidentId}`;
    case "user_login": return `User logged in successfully`;
    case "user_logout": return `User logged out of the system`;
    default: return `Action performed on ${incidentId}`;
  }
}
