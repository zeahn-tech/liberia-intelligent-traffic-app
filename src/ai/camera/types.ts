// ============================================================
// TrafficWatch AI — Camera Stream Architecture Types
//
// Future-proof types for supporting multiple camera sources:
// - RTSP (real-time streaming protocol)
// - HLS (HTTP live streaming)
// - WebRTC (peer-to-peer)
// - MPEG-DASH
// - USB cameras
// - Drone feeds
// - Body cameras
// - Mobile device cameras
// ============================================================

// ─── Camera Source Types ─────────────────────────────────

export type CameraSourceType =
  | "rtsp"          // Real-Time Streaming Protocol (IP cameras)
  | "hls"           // HTTP Live Streaming
  | "webrtc"        // WebRTC peer connection
  | "mpeg_dash"     // MPEG Dynamic Adaptive Streaming
  | "mjpeg"         // Motion JPEG stream
  | "usb"           // Direct USB camera
  | "file"          // Uploaded video file
  | "drone"         // Drone video feed
  | "body_cam"      // Body-worn camera
  | "mobile"        // Mobile device camera
  | "unknown";      // Future/unknown protocol

// ─── Camera Installation Types ──────────────────────────

export type CameraInstallationType =
  | "fixed"         // Permanently mounted traffic camera
  | "mobile"        // Mobile/portable camera unit
  | "cctv"          // CCTV security camera
  | "highway"       // Highway monitoring camera
  | "speed"         // Speed enforcement camera
  | "red_light"     // Red light enforcement camera
  | "anpr"          // Dedicated ANPR camera
  | "panoramic"     // Panoramic/360° camera
  | "drone"         // Aerial drone camera
  | "body"          // Body-worn camera
  | "dashcam"       // Vehicle dashcam
  | "other";        // Other types

// ─── Stream Connection Status ───────────────────────────

export type StreamStatus =
  | "disconnected"  // Not connected
  | "connecting"    // Attempting to connect
  | "connected"     // Stream is active
  | "streaming"     // Actively streaming data
  | "reconnecting"  // Reconnecting after drop
  | "error"         // Connection error
  | "offline";      // Camera is offline/disabled

// ─── Stream Protocol Configuration ──────────────────────

export interface RTSPConfig {
  url: string;
  username?: string;
  password?: string;
  port?: number;
  transport?: "tcp" | "udp" | "http";
}

export interface HLSConfig {
  playlistUrl: string;
  segmentDuration?: number;
  lowLatency?: boolean;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  mediaConstraints?: MediaStreamConstraints;
  sdpOffer?: string;
  peerIdentity?: string;
}

export interface MJPEGConfig {
  url: string;
  username?: string;
  password?: string;
  pollingIntervalMs?: number;
}

// ─── Unified Stream Configuration ──────────────────────

export interface StreamConfig {
  /** Primary stream URL */
  url: string;
  /** Stream protocol/type */
  sourceType: CameraSourceType;
  /** Protocol-specific configuration */
  protocolConfig?: RTSPConfig | HLSConfig | WebRTCConfig | MJPEGConfig;
  /** Authentication token or key for stream access */
  authToken?: string;
  /** Whether to record the stream */
  recordEnabled?: boolean;
  /** Maximum recording duration in seconds */
  maxRecordingDuration?: number;
  /** Stream quality profile */
  quality?: "low" | "medium" | "high" | "ultra";
  /** Frame processing interval for AI analysis (every N frames) */
  analysisFrameInterval?: number;
  /** Region of interest for AI analysis (x, y, width, height as % of frame) */
  analysisROI?: { x: number; y: number; width: number; height: number };
}

// ─── Camera Registration ────────────────────────────────

export interface CameraRegistration {
  /** Unique camera identifier */
  id: string;
  /** Human-readable name/label */
  name: string;
  /** Camera installation type */
  installationType: CameraInstallationType;
  /** Physical location */
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    county?: string;
    district?: string;
    road?: string;
  };
  /** Stream configuration */
  stream: StreamConfig;
  /** Camera status */
  status: StreamStatus;
  /** Whether this camera is currently active */
  isActive: boolean;
  /** Camera metadata */
  metadata?: {
    manufacturer?: string;
    model?: string;
    firmwareVersion?: string;
    ipAddress?: string;
    macAddress?: string;
    installationDate?: string;
    lastMaintenanceDate?: string;
    orientation?: string;
    fieldOfView?: number; // degrees
    maxFPS?: number;
    resolution?: string; // e.g. "1920x1080"
  };
  /** Assigned analysis profile */
  analysisProfile?: CameraAnalysisProfile;
  /** Created timestamp */
  createdAt: string;
  /** Updated timestamp */
  updatedAt: string;
}

// ─── AI Analysis Profile for Cameras ────────────────────

export interface CameraAnalysisProfile {
  /** Enable license plate detection */
  detectPlates: boolean;
  /** Enable vehicle detection */
  detectVehicles: boolean;
  /** Enable traffic violation detection */
  detectViolations: boolean;
  /** Enable pedestrian detection */
  detectPedestrians: boolean;
  /** Enable speed detection */
  detectSpeed: boolean;
  /** Enable object tracking */
  enableTracking: boolean;
  /** Confidence threshold (0.0 - 1.0) */
  confidenceThreshold: number;
  /** Minimum object size to detect (as % of frame) */
  minObjectSize: number;
  /** Detection schedule (cron expression or null for always-on) */
  schedule?: string;
  /** Specific violation types to detect */
  violationTypes?: string[];
}

// ─── Detection Event from Camera ────────────────────────

export interface CameraDetectionEvent {
  id: string;
  cameraId: string;
  eventType: CameraEventType;
  timestamp: string;
  confidence: number;
  /** Bounding box of detected object (as % of frame) */
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Detected license plate text (if ANPR) */
  plateText?: string;
  /** Normalized plate text */
  normalizedPlate?: string;
  /** Detected vehicle info */
  vehicleInfo?: {
    type?: string;
    make?: string;
    model?: string;
    color?: string;
    speed?: number;
    speedUnit?: string;
  };
  /** Snapshot image URL (frame capture) */
  snapshotUrl?: string;
  /** Video clip URL (short clip around event) */
  clipUrl?: string;
  /** Linked incident ID (if event created an incident) */
  incidentId?: string;
  /** Raw AI analysis data */
  rawAnalysis?: Record<string, unknown>;
}

export type CameraEventType =
  | "vehicle_detected"
  | "license_plate_captured"
  | "speed_violation"
  | "red_light_violation"
  | "illegal_turn"
  | "pedestrian_detected"
  | "obstacle_detected"
  | "accident_detected"
  | "congestion_detected"
  | "camera_offline"
  | "camera_online"
  | "maintenance_alert";

// ─── Stream Gateway Interface ───────────────────────────

/**
 * Abstract interface for stream gateway implementations.
 * Each camera source type should implement this interface.
 */
export interface StreamGateway {
  /** Unique gateway type identifier */
  readonly type: CameraSourceType;
  /** Connect to a stream source */
  connect(config: StreamConfig): Promise<StreamConnection>;
  /** Disconnect from a stream */
  disconnect(connectionId: string): Promise<void>;
  /** Get stream status */
  getStatus(connectionId: string): StreamStatus;
  /** List available streams for this gateway type */
  listAvailableStreams(): Promise<StreamConfig[]>;
}

// ─── Stream Connection Handle ──────────────────────────

export interface StreamConnection {
  id: string;
  gatewayType: CameraSourceType;
  status: StreamStatus;
  /** HTML video element or media source for the browser to render */
  mediaSource?: MediaStream | string; // MediaStream for WebRTC, URL string for HLS/RTSP
  /** Error message if status === 'error' */
  error?: string;
  /** Promise that resolves when connection is established */
  onConnected?: Promise<void>;
  /** Callback for when connection drops */
  onDisconnected?: (reason: string) => void;
  /** Callback for when a frame is available for analysis */
  onFrame?: (frame: ImageData) => void;
  close: () => void;
}

// ─── Camera Stream Configuration ───────────────────────

/**
 * Stream configuration for a camera.
 * A camera can have multiple streams (main, sub, backup).
 */
export interface CameraStream {
  id: string;
  camera_id: string;
  stream_name: string;
  stream_url: string;
  stream_type: CameraSourceType;
  stream_profile: "main" | "sub" | "backup" | "mobile" | "archive";
  is_active: boolean;
  is_primary: boolean;
  username?: string;
  password_enc?: string;
  auth_token?: string;
  transport?: "tcp" | "udp" | "http";
  quality?: "low" | "medium" | "high" | "ultra";
  resolution?: string;
  max_fps?: number;
  bitrate_kbps?: number;
  record_enabled: boolean;
  max_recording_sec?: number;
  health_status: "unknown" | "healthy" | "degraded" | "offline" | "error";
  last_health_check?: string;
  last_connected_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Camera Detection (individual detection result) ────

/**
 * An individual detection result from camera AI analysis.
 * Each detection is a single object/event identified in a frame.
 */
export interface CameraDetection {
  id: string;
  camera_id: string;
  camera_event_id?: string;
  stream_id?: string;
  detection_type: CameraDetectionType;
  confidence: number;
  bounding_box?: { x: number; y: number; width: number; height: number };
  detected_at: string;
  frame_timestamp?: string;
  frame_number?: number;
  snapshot_url?: string;
  attributes: Record<string, unknown>;

  // Vehicle-specific
  vehicle_type?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_speed_kmh?: number;
  license_plate_text?: string;
  license_plate_conf?: number;

  // Relationships
  incident_id?: string;
  anpr_scan_id?: string;
  officer_reviewed: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;

  // Metadata
  source: "camera" | "upload" | "body_cam" | "dashcam" | "drone" | "mobile" | "other";
  ai_model_version?: string;
  processing_time_ms?: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type CameraDetectionType =
  | "vehicle" | "license_plate" | "pedestrian" | "obstacle"
  | "accident" | "congestion" | "speed" | "red_light"
  | "illegal_turn" | "wrong_way" | "helmet" | "seatbelt"
  | "mobile_phone" | "lane_departure" | "fire" | "smoke"
  | "animal" | "unknown";

// ─── Camera Violation (violation from detection) ───────

/**
 * Violation-specific record derived from a camera detection.
 * One detection can produce multiple violation records.
 */
export interface CameraViolation {
  id: string;
  camera_id: string;
  camera_event_id?: string;
  camera_detection_id?: string;
  incident_id?: string;
  violation_type: string;
  violation_code?: string;
  description?: string;
  snapshot_url?: string;
  clip_url?: string;
  evidence_id?: string;
  confidence: number;
  detected_speed_kmh?: number;
  speed_limit_kmh?: number;
  location_lat?: number;
  location_lng?: number;
  detected_at: string;
  stream_id?: string;
  clip_start_sec?: number;
  clip_end_sec?: number;
  frame_start?: number;
  frame_end?: number;
  status: "pending" | "confirmed" | "rejected" | "citation_issued" | "escalated" | "closed";
  severity?: "minor" | "moderate" | "major" | "critical";
  fine_amount?: number;
  points?: number;
  officer_reviewed: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  review_decision?: "confirmed" | "rejected" | "modified" | "pending";
  officer_notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Camera Evidence (evidence from detection) ─────────

/**
 * Evidence artifact generated from a camera detection event.
 * Links to the evidence system for chain of custody.
 */
export interface CameraEvidence {
  id: string;
  camera_id: string;
  camera_event_id?: string;
  camera_detection_id?: string;
  camera_violation_id?: string;
  evidence_id?: string;
  incident_id?: string;
  evidence_type: CameraEvidenceType;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  sha256_hash?: string;
  captured_at: string;
  location_lat?: number;
  location_lng?: number;
  duration_seconds?: number;
  frame_count?: number;
  annotations?: Record<string, unknown>;
  metadata: Record<string, unknown>;
  stream_id?: string;
  officer_id?: string;
  officer_notes?: string;
  status: "pending" | "verified" | "flagged" | "archived" | "deleted";
  is_original: boolean;
  processing_status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}

export type CameraEvidenceType =
  | "snapshot" | "video_clip" | "timelapse" | "anpr_capture"
  | "speed_reading" | "red_light_capture" | "violation_sequence"
  | "ai_analysis_report" | "raw_frame" | "compilation";

// ─── Camera Stream Health Summary ──────────────────────

export interface CameraStreamHealth {
  total_streams: number;
  healthy_streams: number;
  degraded_streams: number;
  offline_streams: number;
  primary_stream: string | null;
}

// ─── Camera Detection Stats Summary ────────────────────

export interface CameraDetectionStats {
  total_detections: number;
  vehicle_detections: number;
  plate_detections: number;
  violations_detected: number;
  avg_confidence: number;
  top_detection_type: string | null;
}

// ─── Video Processing Service Interface ─────────────────

export interface VideoProcessingService {
  /** Process a single video frame */
  processFrame(frame: ImageData, profile: CameraAnalysisProfile): Promise<CameraDetectionEvent[]>;
  /** Process a video clip (batched frames) */
  processClip(
    videoSource: string | Blob,
    profile: CameraAnalysisProfile
  ): Promise<CameraDetectionEvent[]>;
  /** Start continuous processing of a stream connection */
  startContinuousProcessing(
    connection: StreamConnection,
    profile: CameraAnalysisProfile,
    onEvent: (event: CameraDetectionEvent) => void
  ): Promise<void>;
  /** Stop continuous processing */
  stopProcessing(): void;
}
