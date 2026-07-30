const EVIDENCE_STATUSES = ["pending", "verified", "rejected", "archived"] as const;
// ============================================================
// TrafficWatch AI — Evidence API Service
//
// Domain: Digital evidence management
// ============================================================

import { supabase } from "@/supabase/client";
import type { Evidence, EvidenceCustodyEvent, StorageFile } from "@/supabase/types";
import {
  executeQuery,
  executePaginatedQuery,
  success,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  failure,
  buildSelect,
  FIELD_SETS,
  type ApiResponse,
  type PaginatedResponse,
} from "./base";

// ─── Constants ───────────────────────────────────────────

const EVIDENCE_TYPES = ["photo", "video", "document", "audio", "other"] as const;

const SELECT_FIELDS = buildSelect([...FIELD_SETS.evidence]);

// ─── Types ───────────────────────────────────────────────

export interface CreateEvidenceInput {
  incident_id: string;
  type: (typeof EVIDENCE_TYPES)[number];
  description?: string;
  file_url?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  officer_id?: string;
  captured_at?: string;
  capture_lat?: number;
  capture_lng?: number;
  device_info?: string;
  sha256_hash?: string;
  is_offline_capture?: boolean;
}

export interface EvidenceFilter {
  incident_id?: string;
  type?: (typeof EVIDENCE_TYPES)[number];
  officer_id?: string;
  evidence_status?: (typeof EVIDENCE_STATUSES)[number];
  date_from?: string;
  date_to?: string;
  page?: number;
  pageSize?: number;
}

// ─── CRUD Operations ─────────────────────────────────────

/**
 * List evidence with optional filters and pagination.
 */
export async function listEvidence(
  filter: EvidenceFilter = {}
): Promise<PaginatedResponse<Evidence>> {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 20;

  return executePaginatedQuery<Evidence>(
    "evidence",
    (q) => {
      let query = q.select(SELECT_FIELDS);

      if (filter.incident_id) query = query.eq("incident_id", filter.incident_id);
      if (filter.type) query = query.eq("type", filter.type);
      if (filter.officer_id) query = query.eq("officer_id", filter.officer_id);
      if (filter.evidence_status) query = query.eq("evidence_status", filter.evidence_status);
      if (filter.date_from) query = query.gte("uploaded_at", filter.date_from);
      if (filter.date_to) query = query.lte("uploaded_at", filter.date_to);

      return query.order("uploaded_at", { ascending: false });
    },
    page,
    pageSize,
    { label: "evidence.list" }
  );
}

/**
 * Get a single evidence item by ID.
 */
export async function getEvidence(id: string): Promise<ApiResponse<Evidence>> {
  return executeQuery(
    supabase.from("evidence").select(SELECT_FIELDS).eq("id", id).maybeSingle(),
    { label: "evidence.get" }
  );
}

/**
 * Create a new evidence record.
 */
export async function createEvidence(input: CreateEvidenceInput): Promise<ApiResponse<Evidence>> {
  return executeQuery(
    supabase.from("evidence").insert([input]).select(SELECT_FIELDS).single(),
    { label: "evidence.create" }
  );
}

/**
 * Update evidence metadata.
 */
export async function updateEvidence(
  id: string,
  updates: Partial<Pick<Evidence, "description" | "evidence_status" | "officer_notes">>
): Promise<ApiResponse<Evidence>> {
  return executeQuery(
    supabase.from("evidence").update(updates).eq("id", id).select(SELECT_FIELDS).single(),
    { label: "evidence.update" }
  );
}

/**
 * Delete an evidence record (admin only — enforced by RLS).
 */
export async function deleteEvidence(id: string): Promise<ApiResponse<null>> {
  return executeQuery(
    supabase.from("evidence").delete().eq("id", id),
    { label: "evidence.delete" }
  );
}

// ─── Evidence for Incident ───────────────────────────────

/**
 * Get all evidence attached to a specific incident.
 */
export async function getIncidentEvidence(incidentId: string): Promise<ApiResponse<Evidence[]>> {
  return executeQuery(
    supabase.from("evidence")
      .select(SELECT_FIELDS)
      .eq("incident_id", incidentId)
      .order("uploaded_at", { ascending: false }),
    { label: "evidence.by_incident" }
  );
}

// ─── Evidence Counts ─────────────────────────────────────

/**
 * Get evidence counts (for dashboard KPIs).
 */
export async function getEvidenceCounts(
  officerId?: string
): Promise<ApiResponse<{ total: number; photos: number; videos: number; documents: number }>> {
  let query = supabase.from("evidence").select("*", { count: "exact", head: true });
  if (officerId) query = query.eq("officer_id", officerId);

  const typeQueries = EVIDENCE_TYPES.slice(0, 3).map(async (type) => {
    let q = supabase.from("evidence").select("*", { count: "exact", head: true }).eq("type", type);
    if (officerId) q = q.eq("officer_id", officerId);
    const { count } = await q;
    return { type, count: count || 0 };
  });

  const { count: total } = await query;
  const typeCounts = await Promise.all(typeQueries);

  return success({
    total: total || 0,
    photos: typeCounts.find((t) => t.type === "photo")?.count || 0,
    videos: typeCounts.find((t) => t.type === "video")?.count || 0,
    documents: typeCounts.find((t) => t.type === "document")?.count || 0,
  });
}

// ─── Custody Chain ──────────────────────────────────────

/**
 * Get the chain-of-custody for an evidence item.
 */
export async function getCustodyChain(evidenceId: string): Promise<ApiResponse<EvidenceCustodyEvent[]>> {
  return executeQuery(
    supabase.from("evidence_custody")
      .select("*")
      .eq("evidence_id", evidenceId)
      .order("created_at", { ascending: true }),
    { label: "evidence.custody" }
  );
}

/**
 * Log a custody event.
 */
export async function logCustodyEvent(
  event: Omit<EvidenceCustodyEvent, "id" | "created_at">
): Promise<ApiResponse<null>> {
  return executeQuery(
    supabase.from("evidence_custody").insert([event]),
    { label: "evidence.custody_log" }
  );
}

// ─── Storage Files ──────────────────────────────────────

/**
 * Get storage files for an evidence item.
 */
export async function getStorageFiles(evidenceId: string): Promise<ApiResponse<StorageFile[]>> {
  return executeQuery(
    supabase.from("storage_files")
      .select("*")
      .eq("evidence_id", evidenceId),
    { label: "evidence.storage_files" }
  );
}

/**
 * Get evidence requiring AI analysis (for queuing).
 */
export async function getPendingAIAnalysis(): Promise<ApiResponse<Evidence[]>> {
  return executeQuery(
    supabase.from("evidence")
      .select(SELECT_FIELDS)
      .eq("ai_analysis_requested", true)
      .eq("ai_analysis_completed", false),
    { label: "evidence.pending_ai" }
  );
}
