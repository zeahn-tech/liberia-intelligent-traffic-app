// ============================================================
// TrafficWatch AI — Audit API Service
//
// Domain: Audit log querying, exporting, statistics
// ============================================================

import { supabase } from "@/supabase/client";
import {
  executeQuery,
  executePaginatedQuery,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  success,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  failure,
  buildSelect,
  FIELD_SETS,
  type ApiResponse,
  type PaginatedResponse,
} from "./base";

// ─── Constants ───────────────────────────────────────────

const AUDIT_FIELDS = buildSelect([...FIELD_SETS.audit]);

// ─── Types ───────────────────────────────────────────────

export interface AuditLogRecord {
  id: string;
  action: string;
  performed_by: string | null;
  target_type: string | null;
  target_id: string | null;
  description: string | null;
  severity: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditFilter {
  action?: string;
  severity?: string;
  target_type?: string;
  performed_by?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ─── Query Audit Logs ───────────────────────────────────

/**
 * Query audit logs with filters and pagination.
 */
export async function queryAuditLogs(
  filter: AuditFilter = {}
): Promise<PaginatedResponse<AuditLogRecord>> {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 50;

  return executePaginatedQuery<AuditLogRecord>(
    "audit_logs",
    (q) => {
      let query = q.select(AUDIT_FIELDS);

      if (filter.action) query = query.eq("action", filter.action);
      if (filter.severity) query = query.eq("severity", filter.severity);
      if (filter.target_type) query = query.eq("target_type", filter.target_type);
      if (filter.performed_by) query = query.eq("performed_by", filter.performed_by);
      if (filter.date_from) query = query.gte("created_at", filter.date_from);
      if (filter.date_to) query = query.lte("created_at", filter.date_to);
      if (filter.search) {
        query = query.or(
          `action.ilike.%${filter.search}%,description.ilike.%${filter.search}%,target_type.ilike.%${filter.search}%`
        );
      }

      return query.order("created_at", { ascending: false });
    },
    page,
    pageSize,
    { label: "audit.query" }
  );
}

/**
 * Get a single audit log entry by ID.
 */
export async function getAuditEntry(id: string): Promise<ApiResponse<AuditLogRecord>> {
  return executeQuery(
    supabase.from("audit_logs").select("*").eq("id", id).maybeSingle(),
    { label: "audit.get" }
  );
}

// ─── Audit Statistics ────────────────────────────────────

/**
 * Get audit log statistics for dashboard.
 */
export async function getAuditStats(
  days: number = 30
): Promise<ApiResponse<{
  total_events: number;
  critical_events: number;
  warning_events: number;
  error_events: number;
  info_events: number;
  unique_users: number;
  top_actions: { action: string; count: number }[];
  daily_counts: { date: string; count: number }[];
} | null>> {
  return executeQuery(
    supabase.rpc("get_audit_stats", { p_days: days }),
    { label: "audit.stats" }
  );
}

// ─── Export ──────────────────────────────────────────────

/**
 * Get audit logs for export (larger limit, all fields).
 */
export async function exportAuditLogs(
  filter: AuditFilter & { format: "json" | "csv" }
): Promise<ApiResponse<AuditLogRecord[]>> {
  let query = supabase.from("audit_logs").select("*");

  if (filter.action) query = query.eq("action", filter.action);
  if (filter.severity) query = query.eq("severity", filter.severity);
  if (filter.target_type) query = query.eq("target_type", filter.target_type);
  if (filter.performed_by) query = query.eq("performed_by", filter.performed_by);
  if (filter.date_from) query = query.gte("created_at", filter.date_from);
  if (filter.date_to) query = query.lte("created_at", filter.date_to);

  query = query.order("created_at", { ascending: false }).limit(10000); // Max export

  return executeQuery(query, { label: "audit.export" });
}
