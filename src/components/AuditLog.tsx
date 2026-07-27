import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

// ===== Types =====

type AuditEventType =
  | "evidence_uploaded" | "evidence_viewed" | "evidence_downloaded"
  | "evidence_analyzed" | "evidence_transferred" | "evidence_reviewed"
  | "evidence_verified" | "evidence_exported" | "evidence_archived"
  | "hash_verified" | "officer_notes_added"
  | "incident_created" | "incident_updated" | "incident_status_changed"
  | "incident_assigned" | "incident_escalated"
  | "anpr_scanned" | "ai_analysis_completed";

interface AuditEvent {
  id: string;
  type: AuditEventType;
  description: string;
  performedBy: string;
  performedByName: string;
  targetType: "evidence" | "incident" | "anpr" | "system";
  targetId: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

interface AuditLogProps {
  /** Events to display */
  events: AuditEvent[];
  /** Title for the audit log card */
  title?: string;
  /** Description */
  description?: string;
  /** Maximum height before scroll */
  maxHeight?: string;
  /** Min role required to view (default: traffic_officer) */
  minRole?: "officer" | "supervisor" | "admin" | "investigator" | string;
}

// ===== Event Display =====

const EVENT_ICONS: Record<string, React.ElementType> = {
  evidence_uploaded: Upload,
  evidence_viewed: Eye,
  evidence_downloaded: Download,
  evidence_analyzed: Brain,
  evidence_transferred: ArrowRight,
  evidence_reviewed: FileText,
  evidence_verified: CheckCircle2,
  evidence_exported: Download,
  evidence_archived: Activity,
  hash_verified: Hash,
  officer_notes_added: FileText,
  incident_created: FileText,
  incident_updated: Activity,
  incident_status_changed: Activity,
  incident_assigned: User,
  incident_escalated: AlertTriangle,
  anpr_scanned: Shield,
  ai_analysis_completed: Brain,
};

const EVENT_COLORS: Record<string, string> = {
  evidence_uploaded: "bg-emerald-500",
  evidence_viewed: "bg-blue-500",
  evidence_downloaded: "bg-purple-500",
  evidence_analyzed: "bg-indigo-500",
  evidence_transferred: "bg-amber-500",
  evidence_reviewed: "bg-teal-500",
  evidence_verified: "bg-green-500",
  evidence_archived: "bg-secondary",
  hash_verified: "bg-cyan-500",
  officer_notes_added: "bg-amber-500",
  incident_created: "bg-primary",
  incident_status_changed: "bg-warning",
  incident_assigned: "bg-blue-500",
  incident_escalated: "bg-orange-500",
  anpr_scanned: "bg-slate-500",
  ai_analysis_completed: "bg-indigo-500",
};

function getActionLabel(type: AuditEventType): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

// ===== Component =====

export function AuditLog({
  events,
  title = "Audit Trail",
  description = "Complete record of all actions taken",
  maxHeight = "400px",
  minRole = "officer",
}: AuditLogProps) {
  const { user, hasRole } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    setAuthorized(hasRole(minRole as any));
  }, [user, hasRole, minRole]);

  const filteredEvents = events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (!authorized) {
    return (
      <Card className="border-border/50 !rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Lock className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              You do not have the required permissions to view the audit trail.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Required role: {minRole}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 !rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description} — {filteredEvents.length} events</CardDescription>
          </div>
          <Badge variant="outline" className="clay-pill text-[10px] px-1.5 py-0 h-4 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <Shield className="w-2.5 h-2.5 mr-0.5" />
            Authorized Access
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Activity className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No audit events recorded yet</p>
          </div>
        ) : (
          <div className="relative" style={{ maxHeight, overflowY: "auto" }}>
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border/50" />
            <div className="space-y-3">
              {filteredEvents.map((event) => {
                const Icon = EVENT_ICONS[event.type] || Activity;
                const dotColor = EVENT_COLORS[event.type] || "bg-secondary";
                return (
                  <div key={event.id} className="relative pl-10">
                    <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full ${dotColor} border-2 border-card flex items-center justify-center`}>
                      <div className="w-1 h-1 rounded-full bg-card" />
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{getActionLabel(event.type)}</p>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {event.targetId}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">
                            {event.performedByName}
                          </span>
                          {event.details && Object.keys(event.details).length > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              · {Object.entries(event.details).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                        {formatTimestamp(event.timestamp)}
                      </span>
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

// ===== Mock Data Generator =====

export function generateMockAuditEvents(incidentId: string, count: number = 8): AuditEvent[] {
  const base = Date.now() - count * 3600000;
  const officers = ["Sgt. John Kollie", "Ofc. James Tarplah", "TrafficWatch AI", "System Auto-Verify"];

  const eventTypes: AuditEventType[] = [
    "incident_created", "evidence_uploaded", "evidence_uploaded",
    "ai_analysis_completed", "hash_verified", "evidence_viewed",
    "incident_status_changed", "incident_assigned",
  ];

  return Array.from({ length: count }, (_, i) => {
    const type = eventTypes[i % eventTypes.length];
    const officerName = officers[i % officers.length];
    return {
      id: `audit-${incidentId}-${i}`,
      type,
      description: generateDescription(type, incidentId),
      performedBy: `ofc-${(i % 3) + 1}`,
      performedByName: officerName,
      targetType: (type.startsWith("evidence") ? "evidence" : "incident") as "evidence" | "incident",
      targetId: type.startsWith("evidence") ? `EV-${String(i + 1).padStart(3, "0")}` : incidentId,
      timestamp: new Date(base + i * 3600000).toISOString(),
    };
  });
}

function generateDescription(type: AuditEventType, incidentId: string): string {
  switch (type) {
    case "incident_created": return `Incident ${incidentId} was created and submitted`;
    case "evidence_uploaded": return `New evidence uploaded to ${incidentId}`;
    case "ai_analysis_completed": return `AI analysis completed for evidence on ${incidentId}`;
    case "hash_verified": return `SHA-256 hash verification passed for evidence`;
    case "evidence_viewed": return `Evidence reviewed in case ${incidentId}`;
    case "incident_status_changed": return `Status updated on ${incidentId}`;
    case "incident_assigned": return `${incidentId} assigned to investigator`;
    case "evidence_downloaded": return `Evidence downloaded from ${incidentId}`;
    case "evidence_analyzed": return `AI vision analysis run on evidence`;
    case "evidence_transferred": return `Evidence transferred between officers`;
    case "officer_notes_added": return `Officer notes added to evidence`;
    case "incident_escalated": return `${incidentId} escalated to supervisor`;
    default: return `Action performed on ${incidentId}`;
  }
}
