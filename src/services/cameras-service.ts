// ============================================================
// TrafficWatch AI — Cameras API Service
//
// Domain: Camera infrastructure management
// This service manages camera registrations, events, streams,
// detections, violations, and evidence from camera systems.
// ============================================================

import { supabase } from "@/supabase/client";
import type {
  CameraRegistration,
  CameraDetectionEvent,
  CameraStream,
  CameraDetection,
  CameraViolation,
  CameraEvidence,
  CameraDetectionType,
  CameraEvidenceType,
} from "@/ai/camera/types";
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

const STREAM_SELECT = [
  "id", "camera_id", "stream_name", "stream_url", "stream_type",
  "stream_profile", "is_active", "is_primary", "transport", "quality",
  "resolution", "max_fps", "bitrate_kbps", "record_enabled",
  "max_recording_sec", "health_status", "last_health_check",
  "last_connected_at", "metadata", "created_at", "updated_at",
] as const;

const DETECTION_SELECT = [
  "id", "camera_id", "camera_event_id", "stream_id", "detection_type",
  "confidence", "bounding_box", "detected_at", "frame_timestamp",
  "frame_number", "snapshot_url", "attributes", "vehicle_type",
  "vehicle_make", "vehicle_model", "vehicle_color", "vehicle_speed_kmh",
  "license_plate_text", "license_plate_conf",
  "incident_id", "anpr_scan_id", "officer_reviewed", "reviewed_by",
  "reviewed_at", "review_notes", "source", "ai_model_version",
  "processing_time_ms", "metadata", "created_at",
] as const;

const VIOLATION_SELECT = [
  "id", "camera_id", "camera_event_id", "camera_detection_id",
  "incident_id", "violation_type", "violation_code", "description",
  "snapshot_url", "clip_url", "evidence_id", "confidence",
  "detected_speed_kmh", "speed_limit_kmh", "location_lat", "location_lng",
  "detected_at", "stream_id", "clip_start_sec", "clip_end_sec",
  "frame_start", "frame_end", "status", "severity", "fine_amount",
  "points", "officer_reviewed", "reviewed_by", "reviewed_at",
  "review_decision", "officer_notes", "metadata", "created_at", "updated_at",
] as const;

const EVIDENCE_SELECT = [
  "id", "camera_id", "camera_event_id", "camera_detection_id",
  "camera_violation_id", "evidence_id", "incident_id", "evidence_type",
  "file_url", "file_size", "mime_type", "sha256_hash", "captured_at",
  "location_lat", "location_lng", "duration_seconds", "frame_count",
  "annotations", "metadata", "stream_id", "officer_id", "officer_notes",
  "status", "is_original", "processing_status", "created_at", "updated_at",
] as const;

// ─── Camera Registration ─────────────────────────────---─

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
): Promise<PaginatedResponse<Record<string, unknown>>> {
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
export async function getCamera(id: string): Promise<ApiResponse<Record<string, unknown>>> {
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
}): Promise<ApiResponse<Record<string, unknown>>> {
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
): Promise<ApiResponse<Record<string, unknown>>> {
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
): Promise<ApiResponse<Record<string, unknown>>> {
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
): Promise<PaginatedResponse<Record<string, unknown>>> {
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
): Promise<ApiResponse<Record<string, unknown>[]>> {
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

// ─── Camera Streams ─────────────────────────────────────

/**
 * List streams for a camera.
 */
export async function listCameraStreams(
  cameraId: string
): Promise<ApiResponse<Record<string, unknown>[]>> {
  return executeQuery(
    supabase.from("camera_streams")
      .select(STREAM_SELECT.join(","))
      .eq("camera_id", cameraId)
      .order("is_primary", { ascending: false }),
    { label: "cameras.streams.list" }
  );
}

/**
 * Register a new stream configuration for a camera.
 */
export async function registerCameraStream(input: {
  camera_id: string;
  stream_name?: string;
  stream_url: string;
  stream_type: string;
  stream_profile?: string;
  is_primary?: boolean;
  transport?: string;
  quality?: string;
  resolution?: string;
  max_fps?: number;
  bitrate_kbps?: number;
  record_enabled?: boolean;
}): Promise<ApiResponse<Record<string, unknown>>> {
  return executeQuery(
    supabase.from("camera_streams").insert([{
      ...input,
      stream_name: input.stream_name || "main",
      stream_profile: input.stream_profile || "main",
      is_primary: input.is_primary ?? false,
      record_enabled: input.record_enabled ?? false,
      health_status: "unknown",
      is_active: true,
    }]).select(STREAM_SELECT.join(",")).single(),
    { label: "cameras.streams.register" }
  );
}

/**
 * Update a camera stream configuration.
 */
export async function updateCameraStream(
  id: string,
  updates: Record<string, unknown>
): Promise<ApiResponse<Record<string, unknown>>> {
  return executeQuery(
    supabase.from("camera_streams").update(updates).eq("id", id).select(STREAM_SELECT.join(",")).single(),
    { label: "cameras.streams.update" }
  );
}

/**
 * Delete a camera stream.
 */
export async function deleteCameraStream(id: string): Promise<ApiResponse<null>> {
  return executeQuery(
    supabase.from("camera_streams").delete().eq("id", id),
    { label: "cameras.streams.delete" }
  );
}

/**
 * Get stream health summary for a camera.
 */
export async function getCameraStreamHealth(
  cameraId: string
): Promise<ApiResponse<Record<string, unknown>>> {
  return executeQuery(
    supabase.rpc("get_camera_stream_health", { p_camera_id: cameraId }),
    { label: "cameras.streams.health" }
  );
}

// ─── Camera Detections ──────────────────────────────────

/**
 * Record a camera detection result.
 */
export async function recordCameraDetection(input: {
  camera_id: string;
  camera_event_id?: string;
  stream_id?: string;
  detection_type: string;
  confidence: number;
  bounding_box?: Record<string, unknown>;
  snapshot_url?: string;
  vehicle_type?: string;
  vehicle_speed_kmh?: number;
  license_plate_text?: string;
  license_plate_conf?: number;
  incident_id?: string;
  source?: string;
}): Promise<ApiResponse<Record<string, unknown>>> {
  return executeQuery(
    supabase.from("camera_detections").insert([{
      ...input,
      source: input.source || "camera",
      officer_reviewed: false,
      attributes: {},
      metadata: {},
      detected_at: new Date().toISOString(),
    }]).select(DETECTION_SELECT.join(",")).single(),
    { label: "cameras.detections.create" }
  );
}

/**
 * List camera detections with pagination and filtering.
 */
export async function listCameraDetections(
  filter: {
    camera_id?: string;
    detection_type?: string;
    incident_id?: string;
    plate_text?: string;
    officer_reviewed?: boolean;
    date_from?: string;
    date_to?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PaginatedResponse<Record<string, unknown>>> {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 20;

  return executePaginatedQuery(
    "camera_detections",
    (q) => {
      let query = q.select(DETECTION_SELECT.join(","));
      if (filter.camera_id) query = query.eq("camera_id", filter.camera_id);
      if (filter.detection_type) query = query.eq("detection_type", filter.detection_type);
      if (filter.incident_id) query = query.eq("incident_id", filter.incident_id);
      if (filter.plate_text) query = query.ilike("license_plate_text", `%${filter.plate_text}%`);
      if (filter.officer_reviewed !== undefined) query = query.eq("officer_reviewed", filter.officer_reviewed);
      if (filter.date_from) query = query.gte("detected_at", filter.date_from);
      if (filter.date_to) query = query.lte("detected_at", filter.date_to);
      return query.order("detected_at", { ascending: false });
    },
    page,
    pageSize,
    { label: "cameras.detections.list" }
  );
}

/**
 * Get detection stats for a camera in a time range.
 */
export async function getCameraDetectionStats(
  cameraId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<ApiResponse<Record<string, unknown>>> {
  return executeQuery(
    supabase.rpc("get_camera_detection_stats", {
      p_camera_id: cameraId,
      p_from: dateFrom || new Date(Date.now() - 86400000).toISOString(),
      p_to: dateTo || new Date().toISOString(),
    }),
    { label: "cameras.detections.stats" }
  );
}

// ─── Camera Violations ──────────────────────────────────

/**
 * Record a camera violation derived from a detection.
 */
export async function recordCameraViolation(input: {
  camera_id: string;
  camera_event_id?: string;
  camera_detection_id?: string;
  incident_id?: string;
  violation_type: string;
  violation_code?: string;
  description?: string;
  snapshot_url?: string;
  clip_url?: string;
  confidence: number;
  detected_speed_kmh?: number;
  speed_limit_kmh?: number;
  location_lat?: number;
  location_lng?: number;
  severity?: string;
}): Promise<ApiResponse<Record<string, unknown>>> {
  return executeQuery(
    supabase.from("camera_violations").insert([{
      ...input,
      status: "pending",
      officer_reviewed: false,
      metadata: {},
      detected_at: new Date().toISOString(),
    }]).select(VIOLATION_SELECT.join(",")).single(),
    { label: "cameras.violations.create" }
  );
}

/**
 * List camera violations with pagination and filtering.
 */
export async function listCameraViolations(
  filter: {
    camera_id?: string;
    status?: string;
    violation_type?: string;
    incident_id?: string;
    severity?: string;
    officer_reviewed?: boolean;
    date_from?: string;
    date_to?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PaginatedResponse<Record<string, unknown>>> {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 20;

  return executePaginatedQuery(
    "camera_violations",
    (q) => {
      let query = q.select(VIOLATION_SELECT.join(","));
      if (filter.camera_id) query = query.eq("camera_id", filter.camera_id);
      if (filter.status) query = query.eq("status", filter.status);
      if (filter.violation_type) query = query.eq("violation_type", filter.violation_type);
      if (filter.incident_id) query = query.eq("incident_id", filter.incident_id);
      if (filter.severity) query = query.eq("severity", filter.severity);
      if (filter.officer_reviewed !== undefined) query = query.eq("officer_reviewed", filter.officer_reviewed);
      if (filter.date_from) query = query.gte("detected_at", filter.date_from);
      if (filter.date_to) query = query.lte("detected_at", filter.date_to);
      return query.order("detected_at", { ascending: false });
    },
    page,
    pageSize,
    { label: "cameras.violations.list" }
  );
}

/**
 * Update camera violation status (confirm/reject/issue citation).
 */
export async function updateCameraViolationStatus(
  id: string,
  updates: {
    status?: string;
    officer_reviewed?: boolean;
    reviewed_by?: string;
    review_decision?: string;
    officer_notes?: string;
    fine_amount?: number;
    points?: number;
  }
): Promise<ApiResponse<Record<string, unknown>>> {
  return executeQuery(
    supabase.from("camera_violations")
      .update({
        ...updates,
        reviewed_by: updates.reviewed_by || undefined,
        reviewed_at: updates.review_decision ? new Date().toISOString() : undefined,
      })
      .eq("id", id)
      .select(VIOLATION_SELECT.join(","))
      .single(),
    { label: "cameras.violations.update" }
  );
}

// ─── Camera Evidence ────────────────────────────────────

/**
 * Record camera-generated evidence.
 */
export async function recordCameraEvidence(input: {
  camera_id: string;
  camera_event_id?: string;
  camera_detection_id?: string;
  camera_violation_id?: string;
  evidence_id?: string;
  incident_id?: string;
  evidence_type: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  sha256_hash?: string;
  location_lat?: number;
  location_lng?: number;
  duration_seconds?: number;
  frame_count?: number;
  stream_id?: string;
  officer_id?: string;
  officer_notes?: string;
}): Promise<ApiResponse<Record<string, unknown>>> {
  return executeQuery(
    supabase.from("camera_evidence").insert([{
      ...input,
      status: "pending",
      is_original: true,
      processing_status: "completed",
      metadata: {},
      captured_at: new Date().toISOString(),
    }]).select(EVIDENCE_SELECT.join(",")).single(),
    { label: "cameras.evidence.create" }
  );
}

/**
 * List camera evidence with pagination.
 */
export async function listCameraEvidence(
  filter: {
    camera_id?: string;
    evidence_type?: string;
    incident_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PaginatedResponse<Record<string, unknown>>> {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 20;

  return executePaginatedQuery(
    "camera_evidence",
    (q) => {
      let query = q.select(EVIDENCE_SELECT.join(","));
      if (filter.camera_id) query = query.eq("camera_id", filter.camera_id);
      if (filter.evidence_type) query = query.eq("evidence_type", filter.evidence_type);
      if (filter.incident_id) query = query.eq("incident_id", filter.incident_id);
      if (filter.status) query = query.eq("status", filter.status);
      if (filter.date_from) query = query.gte("captured_at", filter.date_from);
      if (filter.date_to) query = query.lte("captured_at", filter.date_to);
      return query.order("captured_at", { ascending: false });
    },
    page,
    pageSize,
    { label: "cameras.evidence.list" }
  );
}

/**
 * Update camera evidence status.
 */
export async function updateCameraEvidenceStatus(
  id: string,
  updates: {
    status?: string;
    officer_notes?: string;
    processing_status?: string;
  }
): Promise<ApiResponse<Record<string, unknown>>> {
  return executeQuery(
    supabase.from("camera_evidence").update(updates).eq("id", id).select(EVIDENCE_SELECT.join(",")).single(),
    { label: "cameras.evidence.update" }
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
): Promise<ApiResponse<Record<string, unknown>[]>> {
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
export async function getCamerasPendingAnalysis(): Promise<ApiResponse<Record<string, unknown>[]>> {
  return executeQuery(
    supabase.from("camera_events")
      .select("camera_id")
      .is("incident_id", null)
      .in("event_type", ["vehicle_detected", "license_plate_captured", "speed_violation"])
      .order("created_at", { ascending: false }),
    { label: "cameras.pending_analysis" }
  );
}
