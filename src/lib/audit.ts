/**
 * Audit Logger
 *
 * Direct audit log creation utility for recording security-sensitive actions.
 * Writes to the `audit_logs` table via Supabase with offline queue fallback.
 *
 * Audit logs are immutable — once created they should never be modified.
 * Authorization is enforced via Supabase RLS.
 *
 * Usage:
 *   import { createAuditLog } from "@/lib/audit";
 *
 *   await createAuditLog({
 *     action: "ai_review_confirmed",
 *     description: "Officer confirmed AI analysis for incident INC-001",
 *     targetType: "ai_analysis",
 *     targetId: "ai-abc123",
 *     severity: "info",
 *   });
 */

import { supabase } from "@/supabase/client";
import { addToSyncQueue } from "./offline";

// ===== Exported Constants (used by AuditLog, AuditDashboard, camera pipeline) =====

export type AuditSeverity = "info" | "warning" | "error" | "critical";

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  incident_created: "Incident Created",
  incident_status_changed: "Status Changed",
  incident_assigned: "Assigned",
  incident_escalated: "Escalated",
  incident_deleted: "Deleted",
  evidence_uploaded: "Evidence Uploaded",
  evidence_viewed: "Evidence Viewed",
  evidence_downloaded: "Evidence Downloaded",
  evidence_exported: "Evidence Exported",
  evidence_deleted: "Evidence Deleted",
  evidence_hash_verified: "Hash Verified",
  ai_analysis_requested: "AI Analysis Requested",
  ai_analysis_completed: "AI Analysis Completed",
  ai_analysis_reviewed: "AI Analysis Reviewed",
  ai_review_confirmed: "AI Review Confirmed",
  ai_review_rejected: "AI Review Rejected",
  ai_review_corrected: "AI Review Corrected",
  report_generated: "Report Generated",
  user_login: "User Login",
  user_login_failed: "Failed Login",
  user_logout: "User Logout",
  user_password_changed: "Password Changed",
  user_permission_changed: "Permission Changed",
  user_created: "User Created",
  user_deactivated: "User Deactivated",
  system_config_changed: "System Config Changed",
  mfa_enabled: "MFA Enabled",
  mfa_disabled: "MFA Disabled",
};

export const AUDIT_ACTION_ICONS: Record<string, string> = {
  incident_created: "file-plus",
  incident_status_changed: "arrow-right",
  incident_assigned: "user-check",
  incident_escalated: "arrow-up-circle",
  incident_deleted: "trash-2",
  evidence_uploaded: "upload",
  evidence_viewed: "eye",
  evidence_downloaded: "download",
  evidence_exported: "file-down",
  evidence_deleted: "trash-2",
  evidence_hash_verified: "hash",
  ai_analysis_requested: "brain",
  ai_analysis_completed: "brain",
  ai_analysis_reviewed: "check-circle",
  ai_review_confirmed: "check-circle",
  ai_review_rejected: "x-circle",
  ai_review_corrected: "edit",
  report_generated: "file-text",
  user_login: "log-in",
  user_login_failed: "alert-circle",
  user_logout: "log-out",
  user_password_changed: "lock",
  user_permission_changed: "shield-off",
  user_created: "user-plus",
  user_deactivated: "user-x",
  system_config_changed: "settings",
  mfa_enabled: "shield",
  mfa_disabled: "shield-off",
};

export const AUDIT_ACTION_COLORS: Record<string, string> = {
  incident_created: "bg-blue-500",
  incident_status_changed: "bg-amber-500",
  incident_assigned: "bg-emerald-500",
  incident_escalated: "bg-red-500",
  incident_deleted: "bg-destructive",
  evidence_uploaded: "bg-purple-500",
  evidence_viewed: "bg-sky-500",
  evidence_downloaded: "bg-fuchsia-500",
  evidence_exported: "bg-violet-500",
  evidence_deleted: "bg-destructive",
  evidence_hash_verified: "bg-teal-500",
  ai_analysis_requested: "bg-indigo-500",
  ai_analysis_completed: "bg-indigo-500",
  ai_analysis_reviewed: "bg-emerald-500",
  ai_review_confirmed: "bg-emerald-500",
  ai_review_rejected: "bg-red-500",
  ai_review_corrected: "bg-amber-500",
  report_generated: "bg-orange-500",
  user_login: "bg-green-500",
  user_login_failed: "bg-red-500",
  user_logout: "bg-gray-500",
  user_password_changed: "bg-yellow-500",
  user_permission_changed: "bg-red-500",
  user_created: "bg-emerald-500",
  user_deactivated: "bg-destructive",
  system_config_changed: "bg-slate-500",
  mfa_enabled: "bg-green-500",
  mfa_disabled: "bg-red-500",
};

export const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
  warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

/** @deprecated Use createAuditLog() instead. Kept for backward compatibility. */
export const AUDIT_ACTIONS = {
  AI_ANALYSIS_REQUESTED: "ai_analysis_requested",
  AI_ANALYSIS_COMPLETED: "ai_analysis_completed",
  AI_ANALYSIS_REVIEWED: "ai_analysis_reviewed",
  EVIDENCE_UPLOADED: "evidence_uploaded",
  EVIDENCE_VIEWED: "evidence_viewed",
  EVIDENCE_DOWNLOADED: "evidence_downloaded",
  INCIDENT_CREATED: "incident_created",
  INCIDENT_STATUS_CHANGED: "incident_status_changed",
  INCIDENT_ASSIGNED: "incident_assigned",
  USER_LOGIN: "user_login",
  USER_LOGIN_FAILED: "user_login_failed",
  USER_LOGOUT: "user_logout",
} as const;

/** @deprecated Use createAuditLog() directly instead. */
export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  return createAuditLog(entry);
}

export interface AuditEntry {
  /** Action identifier (e.g., "ai_review_confirmed", "evidence_uploaded") */
  action: string;
  /** Human-readable description of the event */
  description: string;
  /** Type of target record (e.g., "ai_analysis", "incident", "evidence") */
  targetType?: string;
  /** ID of the target record */
  targetId?: string;
  /** Severity level */
  severity?: "info" | "warning" | "error" | "critical";
  /** Additional structured metadata */
  metadata?: Record<string, unknown>;
}

const DEFAULT_SEVERITY = "info" as const;

/**
 * Create an audit log entry.
 * Writes directly to Supabase if online, or queues for sync if offline.
 * Never throws — logs errors to console and returns silently on failure.
 */
export async function createAuditLog(entry: AuditEntry): Promise<void> {
  const payload = {
    action: entry.action,
    description: entry.description,
    target_type: entry.targetType || null,
    target_id: entry.targetId || null,
    severity: entry.severity || DEFAULT_SEVERITY,
    metadata: entry.metadata || {},
  };

  try {
    const { error } = await supabase.from("audit_logs").insert(payload);

    if (error) {
      // If online insert fails, queue for retry
      if (error.code === "PGRST116" || error.code === "23505") {
        // Unique violation or similar — skip
        return;
      }
      await queueAuditForSync(payload);
    }
  } catch {
    // Offline — queue for sync
    await queueAuditForSync(payload);
  }
}

/**
 * Queue an audit log entry for sync when connectivity returns.
 */
async function queueAuditForSync(
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await addToSyncQueue({
      tableName: "audit_logs",
      recordId: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      operation: "create",
      payload,
    });
  } catch {
    // Silently fail — audit logs should never crash the app
    console.warn("[Audit] Failed to queue audit entry for sync");
  }
}

// ===== Convenience helpers for common audit actions =====

/**
 * Log an AI analysis review event.
 */
export async function logAIReview(
  analysisId: string,
  incidentId: string,
  officerId: string,
  action: "confirmed" | "rejected" | "corrected",
  details: {
    notes?: string;
    correctedPlate?: string;
    overturnedViolations?: string[];
  }
): Promise<void> {
  await createAuditLog({
    action: `ai_review_${action}`,
    description: `Officer ${officerId.slice(0, 8)} ${action} AI analysis for incident ${incidentId.slice(0, 8)}`,
    targetType: "ai_analysis",
    targetId: analysisId,
    severity: action === "confirmed" ? "info" : "warning",
    metadata: {
      analysisId,
      incidentId,
      officerId,
      ...details,
    },
  });
}

/**
 * Log an evidence upload/view/download event.
 */
export async function logEvidenceAction(
  evidenceId: string,
  incidentId: string,
  officerId: string,
  action: "uploaded" | "viewed" | "downloaded" | "exported" | "deleted"
): Promise<void> {
  await createAuditLog({
    action: `evidence_${action}`,
    description: `Evidence ${evidenceId.slice(0, 8)} ${action} by officer ${officerId.slice(0, 8)}`,
    targetType: "evidence",
    targetId: evidenceId,
    severity: action === "deleted" ? "warning" : "info",
    metadata: { evidenceId, incidentId, officerId },
  });
}

/**
 * Log an incident lifecycle event.
 */
export async function logIncidentAction(
  incidentId: string,
  officerId: string,
  action: string,
  details?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    action: `incident_${action}`,
    description: `Incident ${incidentId.slice(0, 8)} — ${action.replace(/_/g, " ")}`,
    targetType: "incident",
    targetId: incidentId,
    severity: action === "deleted" || action === "escalated" ? "warning" : "info",
    metadata: { incidentId, officerId, ...details },
  });
}

/**
 * Log a security-sensitive event (login, permission change, etc.).
 */
export async function logSecurityEvent(
  action: string,
  description: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    action,
    description,
    targetType,
    targetId,
    severity: "warning",
    metadata,
  });
}
