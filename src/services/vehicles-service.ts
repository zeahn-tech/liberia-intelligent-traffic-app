// ============================================================
// TrafficWatch AI — Vehicles API Service
//
// Domain: Vehicle registry, drivers, ANPR, stolen vehicle checks
// ============================================================

import { supabase } from "@/supabase/client";
import type { ANPRScan, StolenVehicle } from "@/supabase/types";
import {
  executeQuery,
  executePaginatedQuery,
  success,
  failure,
  buildSelect,
  FIELD_SETS,
  type ApiResponse,
  type PaginatedResponse,
} from "./base";

// ─── Constants ───────────────────────────────────────────

const VEHICLE_FIELDS = buildSelect([...FIELD_SETS.vehicle]);

// ─── Vehicle Registry ────────────────────────────────────

export interface VehicleRecord {
  id: string;
  license_plate: string;
  normalized_plate: string;
  vehicle_type: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  vin: string | null;
  is_stolen: boolean;
  is_wanted: boolean;
}

/**
 * Look up a vehicle by license plate (with normalization).
 */
export async function lookupByPlate(plate: string): Promise<ApiResponse<VehicleRecord | null>> {
  const normalized = plate.toUpperCase().replace(/[\s-]/g, "");

  const { data, error } = await supabase
    .from("vehicles")
    .select(VEHICLE_FIELDS)
    .or(`license_plate.ilike.${normalized},normalized_plate.eq.${normalized}`)
    .maybeSingle();

  if (error) return { success: false, data: null, error: { code: "QUERY_FAILED", message: error.message } };
  return success(data as VehicleRecord | null);
}

/**
 * Search vehicles by partial plate.
 */
export async function searchVehicles(
  query: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<VehicleRecord>> {
  return executePaginatedQuery<VehicleRecord>(
    "vehicles",
    (q) =>
      q.select(VEHICLE_FIELDS)
        .ilike("license_plate", `%${query}%`)
        .order("license_plate", { ascending: true }),
    page,
    pageSize,
    { label: "vehicles.search" }
  );
}

/**
 * Register a new vehicle.
 */
export async function registerVehicle(
  vehicle: Omit<VehicleRecord, "id" | "normalized_plate" | "is_stolen" | "is_wanted">
): Promise<ApiResponse<VehicleRecord>> {
  return executeQuery(
    supabase.from("vehicles").insert([vehicle]).select(VEHICLE_FIELDS).single(),
    { label: "vehicles.register" }
  );
}

/**
 * Create or update a vehicle record (upsert by plate).
 */
export async function upsertVehicle(
  vehicle: Partial<VehicleRecord> & { license_plate: string }
): Promise<ApiResponse<VehicleRecord>> {
  return executeQuery(
    supabase.from("vehicles").upsert([vehicle], { onConflict: "license_plate" }).select(VEHICLE_FIELDS).single(),
    { label: "vehicles.upsert" }
  );
}

// ─── ANPR (Automatic Number Plate Recognition) ────────────

export interface ANPRScanResult {
  id: string;
  incident_id: string;
  plate_text: string;
  normalized_plate: string;
  plate_confidence: number;
  officer_verified: boolean;
  vehicle_type: string | null;
  vehicle_color: string | null;
  officer_id: string;
  scanned_at: string;
}

/**
 * Record a new ANPR scan result.
 */
export async function createANPRScan(
  scan: Omit<ANPRScan, "id" | "scanned_at" | "normalized_plate"> & { normalized_plate?: string }
): Promise<ApiResponse<ANPRScanResult>> {
  const normalized = scan.normalized_plate || scan.plate_text.toUpperCase().replace(/[\s-]/g, "");

  return executeQuery(
    supabase.from("anpr_scans")
      .insert([{ ...scan, normalized_plate: normalized }])
      .select("*")
      .single(),
    { label: "anpr.create" }
  );
}

/**
 * Confirm/reject an ANPR scan result (officer verification).
 */
export async function verifyANPRScan(
  scanId: string,
  verified: boolean,
  correctedText?: string
): Promise<ApiResponse<ANPRScanResult>> {
  const updates: Record<string, unknown> = { officer_verified: verified };
  if (correctedText) updates.officer_corrected_text = correctedText;

  return executeQuery(
    supabase.from("anpr_scans").update(updates).eq("id", scanId).select("*").single(),
    { label: "anpr.verify" }
  );
}

/**
 * Get ANPR scan history with pagination.
 */
export async function listANPRScans(
  filter: { officer_id?: string; incident_id?: string; verified?: boolean; page?: number; pageSize?: number } = {}
): Promise<PaginatedResponse<ANPRScanResult>> {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 20;

  return executePaginatedQuery<ANPRScanResult>(
    "anpr_scans",
    (q) => {
      let query = q.select("*");
      if (filter.officer_id) query = query.eq("officer_id", filter.officer_id);
      if (filter.incident_id) query = query.eq("incident_id", filter.incident_id);
      if (filter.verified !== undefined) query = query.eq("officer_verified", filter.verified);
      return query.order("scanned_at", { ascending: false });
    },
    page,
    pageSize,
    { label: "anpr.list" }
  );
}

// ─── Stolen / Wanted Vehicles ────────────────────────────

/**
 * Check if a vehicle plate is flagged as stolen or wanted.
 * Returns the matching record or null.
 */
export async function checkStolenVehicle(plate: string): Promise<ApiResponse<StolenVehicle | null>> {
  return executeQuery(
    supabase.from("stolen_vehicles")
      .select("*")
      .eq("plate_number", plate.toUpperCase().replace(/[\s-]/g, ""))
      .eq("status", "active")
      .maybeSingle(),
    { label: "vehicles.stolen_check" }
  );
}

/**
 * Get all active stolen/wanted vehicle records.
 */
export async function listStolenVehicles(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<StolenVehicle>> {
  return executePaginatedQuery<StolenVehicle>(
    "stolen_vehicles",
    (q) => q.select("*").eq("status", "active").order("reported_at", { ascending: false }),
    page,
    pageSize,
    { label: "vehicles.stolen_list" }
  );
}

/**
 * Register a stolen/wanted vehicle report.
 */
export async function reportStolenVehicle(
  report: Omit<StolenVehicle, "id" | "created_at" | "updated_at" | "recovered_at" | "recovered_by">
): Promise<ApiResponse<StolenVehicle>> {
  return executeQuery(
    supabase.from("stolen_vehicles").insert([report]).select("*").single(),
    { label: "vehicles.stolen_report" }
  );
}

/**
 * Mark a stolen vehicle as recovered.
 */
export async function recoverVehicle(
  id: string,
  recoveredBy: string
): Promise<ApiResponse<StolenVehicle>> {
  return executeQuery(
    supabase.from("stolen_vehicles")
      .update({ status: "recovered", recovered_at: new Date().toISOString(), recovered_by: recoveredBy })
      .eq("id", id)
      .select("*")
      .single(),
    { label: "vehicles.recover" }
  );
}

// ─── Repeat Offender Detection ────────────────────────────

/**
 * Get the number of incidents associated with a given plate.
 */
export async function getPlateIncidentCount(plate: string): Promise<ApiResponse<number>> {
  const { count, error } = await supabase
    .from("incidents")
    .select("*", { count: "exact", head: true })
    .ilike("vehicle_plate", `%${plate}%`);

  if (error) return failure("QUERY_FAILED", error.message);
  return success(count || 0);
}

/**
 * Find repeat offenders by plate (multiple incidents).
 */
export async function findRepeatOffenders(
  threshold: number = 3,
  limit: number = 20
): Promise<ApiResponse<{ plate: string; incident_count: number; last_seen: string }[]>> {
  const { data, error } = await supabase
    .from("incidents")
    .select("vehicle_plate, created_at")
    .not("vehicle_plate", "is", null)
    .order("created_at", { ascending: false });

  if (error) return failure("QUERY_FAILED", error.message);

  // Aggregate by plate client-side (in production, use a DB function)
  const plateMap = new Map<string, { count: number; last_seen: string }>();
  data?.forEach((inc) => {
    const plate = inc.vehicle_plate?.toUpperCase().replace(/[\s-]/g, "");
    if (!plate) return;
    const existing = plateMap.get(plate);
    if (existing) {
      existing.count++;
      if (inc.created_at > existing.last_seen) existing.last_seen = inc.created_at;
    } else {
      plateMap.set(plate, { count: 1, last_seen: inc.created_at });
    }
  });

  const repeatOffenders = Array.from(plateMap.entries())
    .filter(([, v]) => v.count >= threshold)
    .map(([plate, v]) => ({ plate, incident_count: v.count, last_seen: v.last_seen }))
    .sort((a, b) => b.incident_count - a.incident_count)
    .slice(0, limit);

  return success(repeatOffenders);
}
