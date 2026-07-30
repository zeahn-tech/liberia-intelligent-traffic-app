// ============================================================
// TrafficWatch AI — Reports API Service
//
// Domain: Report generation, history, exports
// ============================================================

import { supabase } from "@/supabase/client";
import {
  executeQuery,
  executePaginatedQuery,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  success,
  type ApiResponse,
  type PaginatedResponse,
} from "./base";

// ─── Types ───────────────────────────────────────────────

export interface ReportHistoryRecord {
  id: string;
  incident_id: string;
  generated_by: string;
  report_type: "full" | "summary" | "evidence" | "ai_analysis";
  format: "pdf" | "csv" | "json" | "summary";
  title: string;
  file_url: string | null;
  file_size: number | null;
  sha256_hash: string | null;
  include_evidence: boolean;
  include_ai_analysis: boolean;
  include_signatures: boolean;
  source_labeling: boolean;
  officer_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ReportFilter {
  incident_id?: string;
  generated_by?: string;
  report_type?: string;
  format?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  pageSize?: number;
}

// ─── Generate Report ─────────────────────────────────────

/**
 * Generate an incident report (records intent — actual PDF generation
 * is handled by the report-generator lib).
 */
export async function generateReport(
  incidentId: string,
  userId: string,
  options: {
    reportType?: "full" | "summary" | "evidence" | "ai_analysis";
    format?: "pdf" | "csv" | "json" | "summary";
    title?: string;
    includeEvidence?: boolean;
    includeAIAnalysis?: boolean;
    includeSignatures?: boolean;
    sourceLabeling?: boolean;
    officerNotes?: string;
  }
): Promise<ApiResponse<ReportHistoryRecord>> {
  const title = options.title || `Incident Report - ${incidentId}`;

  return executeQuery(
    supabase.from("report_history").insert([{
      incident_id: incidentId,
      generated_by: userId,
      report_type: options.reportType || "full",
      format: options.format || "pdf",
      title,
      include_evidence: options.includeEvidence ?? true,
      include_ai_analysis: options.includeAIAnalysis ?? true,
      include_signatures: options.includeSignatures ?? false,
      source_labeling: options.sourceLabeling ?? true,
      officer_notes: options.officerNotes || null,
      metadata: {},
    }]).select("*").single(),
    { label: "reports.generate" }
  );
}

// ─── Report History ─────────────────────────────────────

/**
 * List report history with pagination.
 */
export async function listReports(filter: ReportFilter = {}): Promise<PaginatedResponse<ReportHistoryRecord>> {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 20;

  return executePaginatedQuery<ReportHistoryRecord>(
    "report_history",
    (q) => {
      let query = q.select("*");

      if (filter.incident_id) query = query.eq("incident_id", filter.incident_id);
      if (filter.generated_by) query = query.eq("generated_by", filter.generated_by);
      if (filter.report_type) query = query.eq("report_type", filter.report_type);
      if (filter.format) query = query.eq("format", filter.format);
      if (filter.date_from) query = query.gte("created_at", filter.date_from);
      if (filter.date_to) query = query.lte("created_at", filter.date_to);

      return query.order("created_at", { ascending: false });
    },
    page,
    pageSize,
    { label: "reports.list" }
  );
}

/**
 * Get reports for a specific incident.
 */
export async function getIncidentReports(incidentId: string): Promise<ApiResponse<ReportHistoryRecord[]>> {
  return executeQuery(
    supabase.from("report_history")
      .select("*")
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: false }),
    { label: "reports.by_incident" }
  );
}

/**
 * Delete a report record.
 */
export async function deleteReport(id: string): Promise<ApiResponse<null>> {
  return executeQuery(
    supabase.from("report_history").delete().eq("id", id),
    { label: "reports.delete" }
  );
}
