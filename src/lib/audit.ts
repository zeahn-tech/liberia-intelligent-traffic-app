// ============================================================
// TrafficWatch AI — Unified Audit Logging Library
//
// Records security-sensitive actions from all parts of the app.
// All actions are logged to the audit_logs table via Supabase.
// ============================================================

import { supabase } from "@/supabase/client";

// ─── All Audit Action Types ─────────────────────────────

export const AUDIT_ACTIONS = {
  // ── Authentication ──
  USER_LOGIN: "user_login",
  USER_LOGOUT: "user_logout",
  USER_LOGIN_FAILED: "user_login_failed",
  PASSWORD_CHANGED: "password_changed",
  MFA_ENABLED: "mfa_enabled",
  MFA_DISABLED: "mfa_disabled",

  // ── Incidents ──
  INCIDENT_CREATED: "incident_created",
  INCIDENT_UPDATED: "incident_updated",
  INCIDENT_DELETED: "incident_deleted",
  INCIDENT_STATUS_CHANGED: "incident_status_changed",
  INCIDENT_ASSIGNED: "incident_assigned",
  INCIDENT_ESCALATED: "incident_escalated",

  // ── Evidence ──
  EVIDENCE_UPLOADED: "evidence_uploaded",
  EVIDENCE_VIEWED: "evidence_viewed",
  EVIDENCE_DOWNLOADED: "evidence_downloaded",
  EVIDENCE_EXPORTED: "evidence_exported",
  EVIDENCE_DELETED: "evidence_deleted",
  EVIDENCE_TRANSFERRED: "evidence_transferred",
  EVIDENCE_HASH_VERIFIED: "evidence_hash_verified",

  // ── AI Analysis ──
  AI_ANALYSIS_REQUESTED: "ai_analysis_requested",
  AI_ANALYSIS_COMPLETED: "ai_analysis_completed",
  AI_ANALYSIS_FAILED: "ai_analysis_failed",
  AI_ANALYSIS_REVIEWED: "ai_analysis_reviewed",

  // ── Users & Permissions ──
  USER_ROLE_CHANGED: "user_role_changed",
  USER_CREATED: "user_created",
  USER_DEACTIVATED: "user_deactivated",
  USER_ACTIVATED: "user_activated",
  USER_PERMISSIONS_UPDATED: "user_permissions_updated",

  // ── System / Admin ──
  SYSTEM_CONFIG_CHANGED: "system_config_changed",
  SETTINGS_UPDATED: "settings_updated",
  REPORT_GENERATED: "report_generated",
  AUDIT_LOGS_EXPORTED: "audit_logs_exported",
  DATABASE_MAINTENANCE_RUN: "database_maintenance_run",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export type AuditSeverity = "info" | "warning" | "error" | "critical";

export interface AuditEntry {
  action: AuditAction;
  performedBy?: string;
  targetType?: string;
  targetId?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  severity?: AuditSeverity;
}

// ─── Human-readable labels for each action ─────────────

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  user_login: "User Login",
  user_logout: "User Logout",
  user_login_failed: "Failed Login Attempt",
  password_changed: "Password Changed",
  mfa_enabled: "MFA Enabled",
  mfa_disabled: "MFA Disabled",
  incident_created: "Incident Created",
  incident_updated: "Incident Updated",
  incident_deleted: "Incident Deleted",
  incident_status_changed: "Status Changed",
  incident_assigned: "Incident Assigned",
  incident_escalated: "Incident Escalated",
  evidence_uploaded: "Evidence Uploaded",
  evidence_viewed: "Evidence Viewed",
  evidence_downloaded: "Evidence Downloaded",
  evidence_exported: "Evidence Exported",
  evidence_deleted: "Evidence Deleted",
  evidence_transferred: "Evidence Transferred",
  evidence_hash_verified: "Hash Verified",
  ai_analysis_requested: "AI Analysis Requested",
  ai_analysis_completed: "AI Analysis Completed",
  ai_analysis_failed: "AI Analysis Failed",
  ai_analysis_reviewed: "AI Analysis Reviewed",
  user_role_changed: "User Role Changed",
  user_created: "User Created",
  user_deactivated: "User Deactivated",
  user_activated: "User Activated",
  user_permissions_updated: "Permissions Updated",
  system_config_changed: "System Config Changed",
  settings_updated: "Settings Updated",
  report_generated: "Report Generated",
  audit_logs_exported: "Audit Logs Exported",
  database_maintenance_run: "DB Maintenance Run",
};

// ─── Severity mapping for each action ──────────────────

export function getDefaultSeverity(action: string): AuditSeverity {
  if (action.includes("failed") || action.includes("deleted") || action.includes("escalated")) return "warning";
  if (action.includes("password") || action.includes("role") || action.includes("mfa")) return "warning";
  if (action.includes("login_failed")) return "error";
  if (action.includes("config") || action.includes("deactivated")) return "warning";
  return "info";
}

// ─── Icon and color mapping (for UI display) ───────────

export const AUDIT_ACTION_ICONS: Record<string, string> = {
  user_login: "log-in",
  user_logout: "log-out",
  user_login_failed: "alert-triangle",
  password_changed: "lock",
  mfa_enabled: "shield",
  mfa_disabled: "shield-off",
  incident_created: "file-plus",
  incident_updated: "edit",
  incident_deleted: "trash-2",
  incident_status_changed: "activity",
  incident_assigned: "user-plus",
  incident_escalated: "arrow-up-circle",
  evidence_uploaded: "upload",
  evidence_viewed: "eye",
  evidence_downloaded: "download",
  evidence_exported: "file-down",
  evidence_deleted: "trash-2",
  evidence_transferred: "arrow-right",
  evidence_hash_verified: "hash",
  ai_analysis_requested: "brain",
  ai_analysis_completed: "brain",
  ai_analysis_failed: "alert-circle",
  ai_analysis_reviewed: "check-circle",
  user_role_changed: "shield",
  user_created: "user-plus",
  user_deactivated: "user-x",
  user_activated: "user-check",
  user_permissions_updated: "shield",
  system_config_changed: "settings",
  settings_updated: "settings",
  report_generated: "file-text",
  audit_logs_exported: "file-down",
  database_maintenance_run: "database",
};

export const AUDIT_ACTION_COLORS: Record<string, string> = {
  user_login: "bg-emerald-500",
  user_logout: "bg-slate-500",
  user_login_failed: "bg-red-500",
  password_changed: "bg-amber-500",
  mfa_enabled: "bg-emerald-500",
  mfa_disabled: "bg-orange-500",
  incident_created: "bg-blue-500",
  incident_updated: "bg-cyan-500",
  incident_deleted: "bg-red-500",
  incident_status_changed: "bg-amber-500",
  incident_assigned: "bg-indigo-500",
  incident_escalated: "bg-orange-500",
  evidence_uploaded: "bg-emerald-500",
  evidence_viewed: "bg-blue-500",
  evidence_downloaded: "bg-purple-500",
  evidence_exported: "bg-violet-500",
  evidence_deleted: "bg-red-500",
  evidence_transferred: "bg-amber-500",
  evidence_hash_verified: "bg-cyan-500",
  ai_analysis_requested: "bg-indigo-500",
  ai_analysis_completed: "bg-green-500",
  ai_analysis_failed: "bg-red-500",
  ai_analysis_reviewed: "bg-teal-500",
  user_role_changed: "bg-amber-500",
  user_created: "bg-green-500",
  user_deactivated: "bg-red-500",
  user_activated: "bg-emerald-500",
  user_permissions_updated: "bg-amber-500",
  system_config_changed: "bg-slate-500",
  settings_updated: "bg-slate-500",
  report_generated: "bg-primary",
  audit_logs_exported: "bg-purple-500",
  database_maintenance_run: "bg-slate-500",
};

// ─── Severity colors ──────────────────────────────────

export const SEVERITY_COLORS: Record<AuditSeverity, string> = {
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

// ─── Core Audit Function ───────────────────────────────

/**
 * Log an audit event to the database.
 * This is the single entry point for all audit logging.
 *
 * @example
 * ```ts
 * await logAuditEvent({
 *   action: AUDIT_ACTIONS.INCIDENT_CREATED,
 *   targetType: "incident",
 *   targetId: incident.id,
 *   description: `Incident ${incident.id} created by ${user.name}`,
 *   metadata: { severity: incident.severity },
 * });
 * ```
 */
export async function logAuditEvent(entry: AuditEntry): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("log_audit_event", {
      p_action: entry.action,
      p_performed_by: entry.performedBy || null,
      p_target_type: entry.targetType || null,
      p_target_id: entry.targetId || null,
      p_description: entry.description || null,
      p_ip_address: entry.ipAddress || null,
      p_user_agent: entry.userAgent || null,
      p_metadata: (entry.metadata || {}) as any,
      p_severity: entry.severity || getDefaultSeverity(entry.action),
    });

    if (error) {
      console.error("[Audit] Failed to log event:", error);
      return null;
    }
    return data as string;
  } catch (err) {
    console.error("[Audit] Failed to log event:", err);
    return null;
  }
}

// ─── Convenience wrappers ──────────────────────────────

export const audit = {
  /** Log a user login event */
  login: (userId: string, ip?: string) =>
    logAuditEvent({
      action: AUDIT_ACTIONS.USER_LOGIN,
      performedBy: userId,
      targetType: "user",
      targetId: userId,
      description: "User logged in successfully",
      ipAddress: ip,
      severity: "info",
    }),

  /** Log a failed login attempt */
  loginFailed: (email: string, ip?: string) =>
    logAuditEvent({
      action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
      targetType: "user",
      targetId: email,
      description: `Failed login attempt for ${email}`,
      ipAddress: ip,
      severity: "error",
    }),

  /** Log a user logout */
  logout: (userId: string) =>
    logAuditEvent({
      action: AUDIT_ACTIONS.USER_LOGOUT,
      performedBy: userId,
      targetType: "user",
      targetId: userId,
      description: "User logged out",
      severity: "info",
    }),

  /** Log incident creation */
  incidentCreated: (incidentId: string, userId: string, details?: Record<string, unknown>) =>
    logAuditEvent({
      action: AUDIT_ACTIONS.INCIDENT_CREATED,
      performedBy: userId,
      targetType: "incident",
      targetId: incidentId,
      description: `Incident ${incidentId} was created`,
      metadata: details,
      severity: "info",
    }),

  /** Log incident status change */
  incidentStatusChanged: (incidentId: string, userId: string, from: string, to: string) =>
    logAuditEvent({
      action: AUDIT_ACTIONS.INCIDENT_STATUS_CHANGED,
      performedBy: userId,
      targetType: "incident",
      targetId: incidentId,
      description: `Incident ${incidentId} status changed: ${from} → ${to}`,
      metadata: { from, to },
      severity: to === "escalated" ? "warning" : "info",
    }),

  /** Log incident assignment */
  incidentAssigned: (incidentId: string, assignedBy: string, assignedTo: string, role: string) =>
    logAuditEvent({
      action: AUDIT_ACTIONS.INCIDENT_ASSIGNED,
      performedBy: assignedBy,
      targetType: "incident",
      targetId: incidentId,
      description: `Incident ${incidentId} assigned to ${role}`,
      metadata: { assignedTo, role },
      severity: "info",
    }),

  /** Log incident escalation */
  incidentEscalated: (incidentId: string, userId: string, level: string, reason: string) =>
    logAuditEvent({
      action: AUDIT_ACTIONS.INCIDENT_ESCALATED,
      performedBy: userId,
      targetType: "incident",
      targetId: incidentId,
      description: `Incident ${incidentId} escalated to ${level}: ${reason}`,
      metadata: { level, reason },
      severity: "warning",
    }),

  /** Log evidence upload */
  evidenceUploaded: (evidenceId: string, incidentId: string, userId: string, fileType: string) =>
    logAuditEvent({
      action: AUDIT_ACTIONS.EVIDENCE_UPLOADED,
      performedBy: userId,
      targetType: "evidence",
      targetId: evidenceId,
      description: `Evidence ${evidenceId} uploaded to ${incidentId} (${fileType})`,
      metadata: { incidentId, fileType },
      severity: "info",
    }),

  /** Log evidence view */
  evidenceViewed: (evidenceId: string, userId: string) =>
    logAuditEvent({
      action: AUDIT_ACTIONS.EVIDENCE_VIEWED,
      performedBy: userId,
      targetType: "evidence",
      targetId: evidenceId,
      description: `Evidence ${evidenceId} viewed`,
      severity: "info",
    }),

  /** Log evidence download */
  evidenceDownloaded: (evidenceId: string, userId: string) =>
    logAuditEvent({
      action: AUDIT_ACTIONS.EVIDENCE_DOWNLOADED,
      performedBy: userId,
      targetType: "evidence",
      targetId: evidenceId,
      description: `Evidence ${evidenceId} downloaded`,
      severity: "info",
    }),

  /** Log AI analysis request */
  aiAnalysisRequested: (incidentId: string, userId: string) =>
    logAuditEvent({
      action: AUDIT_ACTIONS.AI_ANALYSIS_REQUESTED,
      performedBy: userId,
      targetType: "incident",
      targetId: incidentId,
      description: `AI analysis requested for ${incidentId}`,
      severity: "info",
    }),

  /** Log AI analysis completion */
  aiAnalysisCompleted: (incidentId: string, analysisId: string, confidence: number) =>
    logAuditEvent({
      action: AUDIT_ACTIONS.AI_ANALYSIS_COMPLETED,
      targetType: "incident",
      targetId: incidentId,
      description: `AI analysis completed for ${incidentId} (confidence: ${Math.round(confidence * 100)}%)`,
      metadata: { analysisId, confidence },
      severity: "info",
    }),

  /** Log AI analysis review (officer confirmed/rejected) */
  aiAnalysisReviewed: (analysisId: string, userId: string, confirmed: boolean) =>
    logAuditEvent({
      action: AUDIT_ACTIONS.AI_ANALYSIS_REVIEWED,
      performedBy: userId,
      targetType: "ai_analysis",
      targetId: analysisId,
      description: `AI analysis ${analysisId} ${confirmed ? "confirmed" : "rejected"} by officer`,
      metadata: { confirmed },
      severity: confirmed ? "info" : "warning",
    }),

  /** Log report generation */
  reportGenerated: (incidentId: string, userId: string, format: string, scope: string) =>
    logAuditEvent({
      action: AUDIT_ACTIONS.REPORT_GENERATED,
      performedBy: userId,
      targetType: "incident",
      targetId: incidentId,
      description: `Report generated for ${incidentId} (${format}, ${scope})`,
      metadata: { format, scope },
      severity: "info",
    }),
};

// ─── Querying audit logs ───────────────────────────────

export interface AuditLogQuery {
  limit?: number;
  offset?: number;
  actionFilter?: string;
  severityFilter?: AuditSeverity;
  targetTypeFilter?: string;
  userIdFilter?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  sortBy?: "created_at" | "action" | "severity";
  sortOrder?: "asc" | "desc";
}

export interface AuditLogResult {
  id: string;
  action: string;
  performed_by: string | null;
  performed_by_name: string | null;
  performed_by_role: string | null;
  target_type: string | null;
  target_id: string | null;
  description: string | null;
  ip_address: string | null;
  severity: AuditSeverity;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogResponse {
  results: AuditLogResult[];
  total: number;
}

/**
 * Query audit logs from the database with filters and pagination.
 */
export async function queryAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogResponse> {
  try {
    const { data, error } = await supabase.rpc("query_audit_logs", {
      p_limit: query.limit ?? 50,
      p_offset: query.offset ?? 0,
      p_action_filter: query.actionFilter || null,
      p_severity_filter: query.severityFilter || null,
      p_target_type_filter: query.targetTypeFilter || null,
      p_user_id_filter: query.userIdFilter || null,
      p_date_from: query.dateFrom || null,
      p_date_to: query.dateTo || null,
      p_search_term: query.searchTerm || null,
      p_sort_by: query.sortBy || "created_at",
      p_sort_order: query.sortOrder || "desc",
    });

    if (error) throw error;
    return (data as AuditLogResponse) || { results: [], total: 0 };
  } catch (err) {
    console.error("[Audit] Failed to query audit logs:", err);
    return { results: [], total: 0 };
  }
}

/**
 * Get audit statistics for the dashboard.
 */
export async function getAuditStats(days: number = 30): Promise<{
  total_events: number;
  critical_events: number;
  warning_events: number;
  error_events: number;
  info_events: number;
  unique_users: number;
  top_actions: { action: string; count: number }[];
  daily_counts: { date: string; count: number }[];
} | null> {
  try {
    const { data, error } = await supabase.rpc("get_audit_stats", {
      p_days: days,
    });
    if (error) throw error;
    return data as any;
  } catch (err) {
    console.error("[Audit] Failed to get audit stats:", err);
    return null;
  }
}
