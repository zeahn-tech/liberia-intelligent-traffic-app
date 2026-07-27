// ============================================================
// TrafficWatch AI — Camera Analysis Pipeline
//
// Orchestrates the full camera processing workflow:
// Camera → Stream Gateway → Video Processing → AI Engine
//   → Detection Events → TrafficWatch AI → Alerts/Incidents/Evidence
//
// This pipeline is designed to be:
// - Provider-agnostic (AI providers are swappable)
// - Source-agnostic (RTSP, HLS, WebRTC, file — all supported)
// - Scalable (supports multiple concurrent cameras)
// - Resilient (auto-reconnect, rate limiting, error handling)
// ============================================================

import type {
  CameraRegistration,
  CameraDetectionEvent,
  CameraAnalysisProfile,
  StreamConnection,
  StreamStatus,
} from "./types";
import { streamManager } from "./stream-gateway";
import { videoProcessor } from "./video-processing";
import { supabase } from "@/supabase/client";
import { logAuditEvent, AUDIT_ACTIONS } from "@/lib/audit";

// ─── Pipeline Status ───────────────────────────────────

export interface PipelineStatus {
  activeCameras: number;
  connections: Map<string, StreamConnection>;
  totalDetections: number;
  isRunning: boolean;
}

// ─── Event Handlers ────────────────────────────────────

export interface PipelineEventHandlers {
  /** Called when a detection event occurs */
  onDetection?: (event: CameraDetectionEvent) => void;
  /** Called when a stream connection status changes */
  onStatusChange?: (cameraId: string, status: StreamStatus) => void;
  /** Called when an error occurs */
  onError?: (cameraId: string, error: Error) => void;
}

// ─── Camera Analysis Pipeline ─────────────────────────--

/**
 * Camera analysis pipeline — the central orchestrator.
 *
 * Manages the lifecycle of camera → AI processing:
 *   1. Register camera in the system (DB)
 *   2. Connect to stream via appropriate gateway
 *   3. Start continuous video processing with AI analysis
 *   4. Handle detection events → create incidents/evidence
 *   5. Disconnect on removal or error
 */
class CameraAnalysisPipeline {
  private activeConnections = new Map<string, StreamConnection>();
  private handlers: PipelineEventHandlers = {};
  private isRunning = false;
  private detectionCount = 0;

  /** Get current pipeline status */
  getStatus(): PipelineStatus {
    return {
      activeCameras: this.activeConnections.size,
      connections: this.activeConnections,
      totalDetections: this.detectionCount,
      isRunning: this.isRunning,
    };
  }

  /** Register event handlers */
  setHandlers(handlers: PipelineEventHandlers): void {
    this.handlers = handlers;
  }

  /**
   * Start processing for a camera.
   *
   * Steps:
   * 1. Resolve the stream gateway for the camera's stream type
   * 2. Connect to the stream
   * 3. Start continuous AI analysis
   * 4. Handle detection events
   *
   * This is the main entry point when a real stream is available.
   */
  async startCamera(camera: CameraRegistration): Promise<void> {
    try {
      // 1. Connect to the camera stream
      const connection = await streamManager.connect({
        id: camera.id,
        stream: {
          url: camera.stream.url,
          sourceType: camera.stream.sourceType,
        },
      });

      this.activeConnections.set(camera.id, connection);
      this.handlers.onStatusChange?.(camera.id, "connected");

      // 2. Update camera status in database
      await supabase
        .from("traffic_cameras")
        .update({ status: "streaming", updated_at: new Date().toISOString() })
        .eq("id", camera.id);

      // 3. Start continuous processing
      const profile = camera.analysisProfile || this.getDefaultProfile();
      await videoProcessor.startContinuousProcessing(
        connection,
        profile,
        async (event: CameraDetectionEvent) => {
          await this.handleDetection(event, camera.id);
        }
      );

      console.debug(`[CameraPipeline] Started camera: ${camera.id} (${camera.name})`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown camera start error");
      this.handlers.onError?.(camera.id, error);
      console.error(`[CameraPipeline] Failed to start camera ${camera.id}:`, error);
    }
  }

  /**
   * Stop processing for a camera.
   */
  async stopCamera(cameraId: string): Promise<void> {
    const connection = this.activeConnections.get(cameraId);
    if (!connection) return;

    try {
      // Stop continuous processing
      videoProcessor.stopProcessing();

      // Disconnect stream
      connection.close();
      this.activeConnections.delete(cameraId);

      // Update camera status in database
      await supabase
        .from("traffic_cameras")
        .update({ status: "disconnected", updated_at: new Date().toISOString() })
        .eq("id", cameraId);

      this.handlers.onStatusChange?.(cameraId, "disconnected");
      console.debug(`[CameraPipeline] Stopped camera: ${cameraId}`);
    } catch (err) {
      console.error(`[CameraPipeline] Failed to stop camera ${cameraId}:`, err);
    }
  }

  /**
   * Start all active cameras.
   */
  async startAll(cameras: CameraRegistration[]): Promise<void> {
    this.isRunning = true;
    const activeCameras = cameras.filter((c) => c.isActive);
    console.debug(`[CameraPipeline] Starting ${activeCameras.length} cameras`);

    await Promise.allSettled(
      activeCameras.map((camera) => this.startCamera(camera))
    );
  }

  /**
   * Stop all active cameras.
   */
  async stopAll(): Promise<void> {
    this.isRunning = false;
    const ids = Array.from(this.activeConnections.keys());
    await Promise.allSettled(ids.map((id) => this.stopCamera(id)));
  }

  // ─── Detection Event Handling ─────────────────────────

  /**
   * Handle a detection event from the video processor.
   * Creates audit trail and links to incidents if warranted.
   */
  private async handleDetection(
    event: CameraDetectionEvent,
    cameraId: string
  ): Promise<void> {
    this.detectionCount++;

    // Notify handler
    this.handlers.onDetection?.(event);

    // Log to audit
    await logAuditEvent({
      action: "ai_analysis_completed" as any,
      targetType: "camera",
      targetId: cameraId,
      description: `Camera ${cameraId} detected: ${event.eventType} (confidence: ${event.confidence})`,
      metadata: { event } as any,
      severity: event.confidence > 0.9 ? "info" : "info",
    });

    // ─── Future Implementation ─────────────────────────
    // For high-confidence detections, automatically:
    // 1. Create an incident:
    //    if (event.confidence > 0.85) {
    //      const incident = await createIncident({ ... });
    //      event.incidentId = incident.id;
    //    }
    //
    // 2. Create evidence from snapshot:
    //    const evidence = await createEvidence({ ... });
    //    event.evidenceId = evidence.id;
    //
    // 3. Notify relevant officers:
    //    await createNotification({ ... });
    //
    // 4. Update camera_events table with links:
    //    await supabase.from("camera_events").update({
    //      incident_id: incident.id,
    //    }).eq("id", event.id);

    // Save event to database
    try {
      await supabase.from("camera_events").insert({
        camera_id: cameraId,
        event_type: event.eventType,
        event_data: event.rawAnalysis || {},
        media_url: event.snapshotUrl || null,
        detected_plate: event.normalizedPlate || null,
        detected_speed: event.vehicleInfo?.speed || null,
        confidence: event.confidence,
        location_lat: null,
        location_lng: null,
        incident_id: event.incidentId || null,
        officer_notified: false,
      });
    } catch (err) {
      console.error("[CameraPipeline] Failed to save detection event:", err);
    }
  }

  // ─── Default Analysis Profile ─────────────────────────

  private getDefaultProfile(): CameraAnalysisProfile {
    return {
      detectPlates: true,
      detectVehicles: true,
      detectViolations: false,
      detectPedestrians: false,
      detectSpeed: false,
      enableTracking: false,
      confidenceThreshold: 0.7,
      minObjectSize: 0.01,
      violationTypes: ["speeding", "red_light", "illegal_turn"],
    };
  }
}

/** Singleton camera analysis pipeline */
export const cameraPipeline = new CameraAnalysisPipeline();
