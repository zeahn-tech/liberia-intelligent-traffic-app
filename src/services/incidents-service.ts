// ============================================================
// TrafficWatch AI — Incidents API Service
//
// Domain: Incident management
// ============================================================

import { supabase } from "@/supabase/client";
import type { Incident } from "@/supabase/types";
import {
  executeQuery,
  executePaginatedQuery,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  success,
  failure,
  buildSelect,
  FIELD_SETS,
  validateRequired,
  validateEnum,
  type ApiResponse,
  type PaginatedResponse,
  type ValidationResult,
} from "./base";

// ─── Constants ───────────────────────────────────────────

const INCIDENT_STATUSES = [
  "draft", "submitted", "under_review", "assigned", "investigating",
  "escalated", "confirmed", "resolved", "closed", "rejected", "archived",
] as const;

const INCIDENT_SEVERITIES = ["minor", "moderate", "serious", "critical"] as const;

const SELECT_FIELDS = buildSelect([...FIELD_SETS.incident]);

// ─── Types ───────────────────────────────────────────────

export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export interface CreateIncidentInput {
  officer_id: string;
  title: string;
  description?: string;
  severity?: IncidentSeverity;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  vehicle_plate?: string;
  vehicle_type?: string;
  vehicle_color?: string;
  violation_type_id?: string;
  county_code?: string;
}

export interface UpdateIncidentInput {
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  vehicle_plate?: string;
  vehicle_type?: string;
  vehicle_color?: string;
  violation_type_id?: string;
  officer_notes?: string;
  county_code?: string;
}

export interface IncidentFilter {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  officer_id?: string;
  county_code?: string;
  vehicle_plate?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ─── Validation ──────────────────────────────────────────

export function validateCreateIncident(input: CreateIncidentInput): ValidationResult {
  const errors: { field: string; message: string }[] = [];

  const titleErr = validateRequired(input.title, "Title");
  if (titleErr) errors.push({ field: "title", message: titleErr });

  if (input.severity) {
    const sevErr = validateEnum(input.severity, INCIDENT_SEVERITIES, "Severity");
    if (sevErr) errors.push({ field: "severity", message: sevErr });
  }

  return { valid: errors.length === 0, errors };
}

export function validateUpdateIncident(input: UpdateIncidentInput): ValidationResult {
  const errors: { field: string; message: string }[] = [];

  if (input.severity) {
    const sevErr = validateEnum(input.severity, INCIDENT_SEVERITIES, "Severity");
    if (sevErr) errors.push({ field: "severity", message: sevErr });
  }
  if (input.status) {
    const statErr = validateEnum(input.status, INCIDENT_STATUSES, "Status");
    if (statErr) errors.push({ field: "status", message: statErr });
  }

  return { valid: errors.length === 0, errors };
}

// ─── CRUD Operations ─────────────────────────────────────

/**
 * List incidents with optional filters and pagination.
 */
export async function listIncidents(
  filter: IncidentFilter = {}
): Promise<PaginatedResponse<Incident>> {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 20;

  return executePaginatedQuery<Incident>(
    "incidents",
    (q) => {
      let query = q.select(SELECT_FIELDS);

      if (filter.status) query = query.eq("status", filter.status);
      if (filter.severity) query = query.eq("severity", filter.severity);
      if (filter.officer_id) query = query.eq("officer_id", filter.officer_id);
      if (filter.county_code) query = query.eq("county_code", filter.county_code);
      if (filter.vehicle_plate) query = query.ilike("vehicle_plate", `%${filter.vehicle_plate}%`);
      if (filter.date_from) query = query.gte("created_at", filter.date_from);
      if (filter.date_to) query = query.lte("created_at", filter.date_to);
      if (filter.search) {
        query = query.or(
          `title.ilike.%${filter.search}%,description.ilike.%${filter.search}%,vehicle_plate.ilike.%${filter.search}%`
        );
      }

      return query.order("created_at", { ascending: false });
    },
    page,
    pageSize,
    { label: "incidents.list" }
  );
}

/**
 * Get a single incident by ID.
 */
export async function getIncident(id: string): Promise<ApiResponse<Incident>> {
  return executeQuery(
    supabase.from("incidents").select(SELECT_FIELDS).eq("id", id).maybeSingle(),
    { label: "incidents.get" }
  );
}

/**
 * Create a new incident with validation.
 */
export async function createIncident(input: CreateIncidentInput): Promise<ApiResponse<Incident>> {
  const validation = validateCreateIncident(input);
  if (!validation.valid) {
    return failure("VALIDATION_ERROR", validation.errors.map((e) => e.message).join("; "));
  }

  return executeQuery(
    supabase.from("incidents").insert([input]).select(SELECT_FIELDS).single(),
    { label: "incidents.create" }
  );
}

/**
 * Update an existing incident.
 */
export async function updateIncident(id: string, input: UpdateIncidentInput): Promise<ApiResponse<Incident>> {
  const validation = validateUpdateIncident(input);
  if (!validation.valid) {
    return failure("VALIDATION_ERROR", validation.errors.map((e) => e.message).join("; "));
  }

  return executeQuery(
    supabase.from("incidents").update(input).eq("id", id).select(SELECT_FIELDS).single(),
    { label: "incidents.update" }
  );
}

/**
 * Delete an incident (admin only — enforced by RLS).
 */
export async function deleteIncident(id: string): Promise<ApiResponse<null>> {
  return executeQuery(
    supabase.from("incidents").delete().eq("id", id),
    { label: "incidents.delete" }
  );
}

/**
 * Change incident status with audit logging.
 */
export async function changeIncidentStatus(
  id: string,
  newStatus: IncidentStatus,
  officerNotes?: string
): Promise<ApiResponse<Incident>> {
  const updates: Record<string, unknown> = { status: newStatus };
  if (officerNotes) updates.officer_notes = officerNotes;

  return executeQuery(
    supabase.from("incidents").update(updates).eq("id", id).select(SELECT_FIELDS).single(),
    { label: "incidents.status_change" }
  );
}

/**
 * Get incidents for the current user's dashboard.
 */
export async function getMyIncidents(
  officerId: string,
  status?: IncidentStatus,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Incident>> {
  return listIncidents({ officer_id: officerId, status, page, pageSize });
}

/**
 * Get recent incidents (for dashboard widgets).
 */
export async function getRecentIncidents(limit: number = 5): Promise<ApiResponse<Incident[]>> {
  return executeQuery(
    supabase.from("incidents")
      .select(SELECT_FIELDS)
      .order("created_at", { ascending: false })
      .limit(limit),
    { label: "incidents.recent" }
  );
}

/**
 * Get incidents count by status (for dashboard KPIs).
 */
export async function getIncidentCounts(): Promise<
  ApiResponse<{ status: string; count: number }[]>
> {
  return executeQuery(
    supabase.rpc("get_incident_counts"),
    { label: "incidents.counts" }
  );
}
