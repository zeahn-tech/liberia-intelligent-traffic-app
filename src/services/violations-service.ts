// ============================================================
// TrafficWatch AI — Violations API Service
//
// Domain: Violation types, incident-violation associations
// ============================================================

import { supabase } from "@/supabase/client";
import type { ViolationType } from "@/supabase/types";
import {
  executeQuery,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  executePaginatedQuery,
  success,
  failure,
  type ApiResponse,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  type PaginatedResponse,
} from "./base";

// ─── Violation Types ─────────────────────────────────────

/**
 * Get all active violation types.
 */
export async function listViolationTypes(): Promise<ApiResponse<ViolationType[]>> {
  return executeQuery(
    supabase.from("violation_types")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    { label: "violations.types" }
  );
}

/**
 * Get a single violation type by ID.
 */
export async function getViolationType(id: string): Promise<ApiResponse<ViolationType>> {
  return executeQuery(
    supabase.from("violation_types").select("*").eq("id", id).maybeSingle(),
    { label: "violations.type" }
  );
}

/**
 * Create a new violation type (admin only).
 */
export async function createViolationType(
  input: Omit<ViolationType, "id" | "created_at" | "is_active"> & { is_active?: boolean }
): Promise<ApiResponse<ViolationType>> {
  return executeQuery(
    supabase.from("violation_types").insert([input]).select("*").single(),
    { label: "violations.create" }
  );
}

/**
 * Update a violation type.
 */
export async function updateViolationType(
  id: string,
  updates: Partial<Omit<ViolationType, "id" | "created_at">>
): Promise<ApiResponse<ViolationType>> {
  return executeQuery(
    supabase.from("violation_types").update(updates).eq("id", id).select("*").single(),
    { label: "violations.update" }
  );
}

// ─── Incident-Violation Associations ─────────────────────

/**
 * Get all violations associated with an incident.
 */
export async function getIncidentViolations(incidentId: string): Promise<
  ApiResponse<{ id: string; violation_type_id: string; severity: string; name: string; code: string }[]>
> {
  const { data, error } = await supabase
    .from("incident_violations")
    .select(`
      id,
      violation_type_id,
      severity,
      violation_types!inner(name, code)
    `)
    .eq("incident_id", incidentId);

  if (error) return failure("QUERY_FAILED", error.message);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  return success((data || []).map((iv: any) => ({
    id: iv.id,
    violation_type_id: iv.violation_type_id,
    severity: iv.severity,
    name: iv.violation_types?.name || "",
    code: iv.violation_types?.code || "",
  })));
}

/**
 * Assign violations to an incident.
 */
export async function addIncidentViolations(
  incidentId: string,
  violations: { violation_type_id: string; severity?: string; description?: string }[]
): Promise<ApiResponse<null>> {
  const rows = violations.map((v) => ({
    incident_id: incidentId,
    violation_type_id: v.violation_type_id,
    severity: v.severity || "moderate",
    description: v.description || null,
  }));

  return executeQuery(
    supabase.from("incident_violations").insert(rows),
    { label: "violations.assign" }
  );
}

/**
 * Remove a violation from an incident.
 */
export async function removeIncidentViolation(id: string): Promise<ApiResponse<null>> {
  return executeQuery(
    supabase.from("incident_violations").delete().eq("id", id),
    { label: "violations.remove" }
  );
}

// ─── Statistics ──────────────────────────────────────────

/**
 * Get violation statistics (most common violations).
 */
export async function getViolationStats(
  limit: number = 10
): Promise<ApiResponse<{ name: string; code: string; count: number }[]>> {
  const { data, error } = await supabase
    .from("incident_violations")
    .select("violation_type_id");

  if (error) return failure("QUERY_FAILED", error.message);

  // Fetch all violation types for name mapping
  const { data: types } = await supabase.from("violation_types").select("id, name, code");

  const typeMap = new Map(types?.map((t) => [t.id, t]) || []);

  // Count by type
  const counts = new Map<string, number>();
  data?.forEach((iv) => {
    counts.set(iv.violation_type_id, (counts.get(iv.violation_type_id) || 0) + 1);
  });

  const sorted = Array.from(counts.entries())
    .map(([id, count]) => ({
      name: typeMap.get(id)?.name || "Unknown",
      code: typeMap.get(id)?.code || id,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return success(sorted);
}
