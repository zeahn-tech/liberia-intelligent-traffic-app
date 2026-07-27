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
