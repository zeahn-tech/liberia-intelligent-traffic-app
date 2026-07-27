// ============================================================
// TrafficWatch AI — Cameras API Service
//
// Domain: Camera infrastructure management
// This service manages camera registrations and camera events.
// It does NOT implement live streaming — it provides the
// data layer for future stream integrations to plug into.
// ============================================================

import { supabase } from "@/supabase/client";
import type { CameraRegistration, CameraDetectionEvent } from "@/ai/camera/types";
import {
  executeQuery,
  executePaginatedQuery,
  success,
  failure,
  type ApiResponse,
  type PaginatedResponse,
} from "./base";

// ─── Camera Registration CRUD ────────────────────────────

const CAMERA_SELECT = [
  "id", "name", "installation_type", "stream_url", "stream_type",
  "latitude", "longitude", "location_address", "county_id",
  "status", "is_active",
  "manufacturer", "model", "orientation", "field_of_view",
  "resolution", "max_fps",
  "created_at", "updated_at",
] as const;

const EVENT_SELECT = [
  "id", "camera_id", "event_type", "event_data", "media_url",
  "detected_plate", "detected_speed", "confidence",
  "location_lat", "location_lng",
  "incident_id", "evidence_id",
  "officer_notified", "created_at",
] as const;

// ─── Camera Registration ─────────────────────────────---

export interface CameraFilter {
  installation_type?: string;
  status?: string;
  county_id?: string;
  is_active?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * List all registered cameras with pagination.
 */
export async function listCameras(
  filter: CameraFilter = {}
): Promise<PaginatedResponse<any>> {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 20;

  return executePaginatedQuery(
    "traffic_cameras",
    (q) => {
      let query = q.select(CAMERA_SELECT.join(","));
      if (filter.installation_type) query = query.eq("installation_type", filter.installation_type);
      if (filter.status) query = query.eq("status", filter.status);
      if (filter.county_id) query = query.eq("county_id", filter.county_id);
      if (filter.is_active !== undefined) query = query.eq("is_active", filter.is_active);
      return query.order("name", { ascending: true });
    },
    page,
    pageSize,
    { label: "cameras.list" }
  );
}

/**
 * Get a single camera by ID.
 */
export async function getCamera(id: string): Promise<ApiResponse<any>> {
  return executeQuery(
    supabase.from("traffic_cameras").select(CAMERA_SELECT.join(",")).eq("id", id).maybeSingle(),
    { label: "cameras.get" }
  );
}

/**
 * Register a new camera in the system.
 */
export async function registerCamera(input: {
  name: string;
  installation_type: string;
  stream_url: string;
  stream_type: string;
  latitude: number;
  longitude: number;
  county_id?: string;
  location_address?: string;
  manufacturer?: string;
  model?: string;
  orientation?: string;
  field_of_view?: number;
  resolution?: string;
  max_fps?: number;
}): Promise<ApiResponse<any>> {
  return executeQuery(
    supabase.from("traffic_cameras").insert([{
      ...input,
      status: "disconnected",
      is_active: true,
    }]).select(CAMERA_SELECT.join(",")).single(),
    { label: "cameras.register" }
  );
}

/**
 * Update camera details.
 */
export async function updateCamera(
  id: string,
  updates: Partial<{
    name: string;
    installation_type: string;
    stream_url: string;
    stream_type: string;
    latitude: number;
    longitude: number;
    status: string;
    is_active: boolean;
    orientation: string;
    field_of_view: number;
  }>
): Promise<ApiResponse<any>> {
  return executeQuery(
    supabase.from("traffic_cameras").update(updates).eq("id", id).select(CAMERA_SELECT.join(",")).single(),
    { label: "cameras.update" }
  );
}

/**
 * Remove a camera from the system.
 */
export async function deleteCamera(id: string): Promise<ApiResponse<null>> {
  return executeQuery(
    supabase.from("traffic_cameras").delete().eq("id", id),
    { label: "cameras.delete" }
  );
}

// ─── Camera Events ──────────────────────────────────────

/**
 * Record a camera detection event.
 */
export async function recordCameraEvent(
  event: {
    camera_id: string;
    event_type: string;
    event_data?: Record<string, unknown>;
    media_url?: string;
    detected_plate?: string;
    detected_speed?: number;
    confidence?: number;
    incident_id?: string;
    evidence_id?: string;
  }
): Promise<ApiResponse<any>> {
  return executeQuery(
    supabase.from("camera_events").insert([event]).select(EVENT_SELECT.join(",")).single(),
    { label: "cameras.events.create" }
  );
}

/**
 * Get camera events with pagination.
 */
export async function listCameraEvents(
  filter: {
    camera_id?: string;
    event_type?: string;
    incident_id?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PaginatedResponse<any>> {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 20;

  return executePaginatedQuery(
    "camera_events",
    (q) => {
      let query = q.select(EVENT_SELECT.join(","));
      if (filter.camera_id) query = query.eq("camera_id", filter.camera_id);
      if (filter.event_type) query = query.eq("event_type", filter.event_type);
      if (filter.incident_id) query = query.eq("incident_id", filter.incident_id);
      if (filter.date_from) query = query.gte("created_at", filter.date_from);
      if (filter.date_to) query = query.lte("created_at", filter.date_to);
      return query.order("created_at", { ascending: false });
    },
    page,
    pageSize,
    { label: "cameras.events.list" }
  );
}

/**
 * Get recent events requiring officer attention.
 */
export async function getPendingCameraAlerts(
  limit: number = 20
): Promise<ApiResponse<any[]>> {
  return executeQuery(
    supabase.from("camera_events")
      .select(EVENT_SELECT.join(","))
      .eq("officer_notified", false)
      .in("event_type", ["speed_violation", "red_light_violation", "accident_detected"])
      .order("created_at", { ascending: false })
      .limit(limit),
    { label: "cameras.events.pending" }
  );
}

/**
 * Acknowledge a camera alert (mark officer as notified).
 */
export async function acknowledgeCameraAlert(eventId: string): Promise<ApiResponse<null>> {
  return executeQuery(
    supabase.from("camera_events")
      .update({ officer_notified: true, notified_at: new Date().toISOString() })
      .eq("id", eventId),
    { label: "cameras.events.acknowledge" }
  );
}

// ─── Camera Statistics ──────────────────────────────────

/**
 * Get camera infrastructure statistics.
 */
export async function getCameraStats(): Promise<
  ApiResponse<{
    total: number;
    active: number;
    offline: number;
    by_type: Record<string, number>;
    events_last_24h: number;
  }>
> {
  try {
    const [totalRes, activeRes, offlineRes, typeRes, eventsRes] = await Promise.all([
      supabase.from("traffic_cameras").select("*", { count: "exact", head: true }),
      supabase.from("traffic_cameras").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("traffic_cameras").select("*", { count: "exact", head: true }).in("status", ["disconnected", "error", "offline"]),
      supabase.from("traffic_cameras").select("installation_type"),
      supabase.from("camera_events").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
    ]);

    const byType: Record<string, number> = {};
    (typeRes.data || []).forEach((c: any) => {
      const t = c.installation_type || "unknown";
      byType[t] = (byType[t] || 0) + 1;
    });

    return success({
      total: totalRes.count || 0,
      active: activeRes.count || 0,
      offline: offlineRes.count || 0,
      by_type: byType,
      events_last_24h: eventsRes.count || 0,
    });
  } catch (err) {
    return failure("STATS_FAILED", err instanceof Error ? err.message : "Failed to get camera stats");
  }
}

/**
 * Get cameras near a specific location (for map display).
 */
export async function getCamerasNearLocation(
  lat: number,
  lng: number,
  radiusKm: number = 10
): Promise<ApiResponse<any[]>> {
  // Approximate bounding box (1° lat ≈ 111km, 1° lng ≈ 111*cos(lat) km)
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  return executeQuery(
    supabase.from("traffic_cameras")
      .select(CAMERA_SELECT.join(","))
      .gte("latitude", lat - latDelta)
      .lte("latitude", lat + latDelta)
      .gte("longitude", lng - lngDelta)
      .lte("longitude", lng + lngDelta)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    { label: "cameras.near_location" }
  );
}

// ─── AI Analysis Queue ─────────────────────────────────

/**
 * Get cameras that have pending AI analysis jobs.
 */
export async function getCamerasPendingAnalysis(): Promise<ApiResponse<any[]>> {
  return executeQuery(
    supabase.from("camera_events")
      .select("camera_id")
      .is("incident_id", null)
      .in("event_type", ["vehicle_detected", "license_plate_captured", "speed_violation"])
      .order("created_at", { ascending: false }),
    { label: "cameras.pending_analysis" }
  );
}
