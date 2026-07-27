// ============================================================
// TrafficWatch AI — Video Processing Service Architecture
//
// Abstract video processing service that prepares frames for
// AI computer vision analysis.
//
// This is the connector between:
//   Stream Gateway → Frames → AI Analysis → Detection Events
//
// Future implementations can plug in:
// - ffmpeg.wasm (browser-side processing)
// - WebCodecs API (hardware-accelerated decoding)
// - Server-side processing (Convex actions with FFmpeg)
// - GPU-accelerated processing (WebGL, TensorFlow.js, ONNX)
// ============================================================

import type {
  CameraDetectionEvent,
  CameraAnalysisProfile,
  StreamConnection,
  VideoProcessingService,
} from "./types";

// ─── Frame Extraction ──────────────────────────────────

/**
 * Extract a single frame from a video element as ImageData.
 * Used to feed frames to the AI analysis pipeline.
 *
 * Future optimization: Use OffscreenCanvas for Web Worker
 * processing to avoid blocking the main thread.
 */
export function extractFrame(
  videoElement: HTMLVideoElement,
  width?: number,
  height?: number
): ImageData | null {
  try {
    const canvas = document.createElement("canvas");
    const targetWidth = width || videoElement.videoWidth;
    const targetHeight = height || videoElement.videoHeight;

    if (targetWidth === 0 || targetHeight === 0) return null;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(videoElement, 0, 0, targetWidth, targetHeight);
    return ctx.getImageData(0, 0, targetWidth, targetHeight);
  } catch {
    return null;
  }
}

/**
 * Extract frames at a given interval (every N seconds).
 * Returns an array of base64-encoded JPEG images for sending
 * to the AI analysis pipeline.
 *
 * @param videoElement - The video element to extract from
 * @param intervalSeconds - Extract one frame every N seconds
 * @param maxFrames - Maximum number of frames to extract
 * @param quality - JPEG quality 0.0 - 1.0
 */
export function extractFramesAtInterval(
  videoElement: HTMLVideoElement,
  intervalSeconds: number = 2,
  maxFrames: number = 30,
  quality: number = 0.8
): string[] {
  const frames: string[] = [];
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return frames;

  const fps = 30; // Assume 30fps for frame counting
  const frameInterval = Math.floor(fps * intervalSeconds);
  let frameCount = 0;

  // Simulate frame extraction at video time intervals
  const duration = videoElement.duration || 30;
  for (let t = 0; t < duration && frames.length < maxFrames; t += intervalSeconds) {
    videoElement.currentTime = t;
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;

    try {
      ctx.drawImage(videoElement, 0, 0);
      frames.push(canvas.toDataURL("image/jpeg", quality));
    } catch {
      // Frame extraction may fail if video isn't seekable
    }
    frameCount += frameInterval;
  }

  return frames;
}

// ─── Video Processing Service Implementation ──────────

/**
 * Default video processing service.
 *
 * In production, this would:
 * 1. Receive frames from the stream gateway
 * 2. Pass them to the AI analysis pipeline
 * 3. Return detection events
 * 4. Optionally persist recordings to storage
 *
 * The actual AI analysis is delegated to the AI provider pipeline
 * (src/ai/pipeline.ts) which supports pluggable providers.
 */
export class DefaultVideoProcessingService implements VideoProcessingService {
  private isProcessing = false;
  private frameInterval: ReturnType<typeof setInterval> | null = null;
  private onEventCallback: ((event: CameraDetectionEvent) => void) | null = null;

  /**
   * Process a single video frame through the AI pipeline.
   * Delegates to the AI provider system for actual analysis.
   */
  async processFrame(
    _frame: ImageData,
    _profile: CameraAnalysisProfile
  ): Promise<CameraDetectionEvent[]> {
    // ─── Future Implementation ─────────────────────────
    // This is where the frame gets sent to the AI provider:
    //
    // 1. Convert ImageData to a format the AI provider accepts
    //    const blob = await canvasToBlob(frame);
    //
    // 2. Send to the AI analysis pipeline
    //    const result = await submitForAnalysis({
    //      media: blob,
    //      analysisType: 'traffic',
    //      options: { detectPlates, detectVehicles, ... }
    //    });
    //
    // 3. Parse results into CameraDetectionEvent[]
    //    return parseDetections(result);
    //
    // For now, this is a no-op placeholder awaiting real integration.
    return [];
  }

  /**
   * Process a video clip (e.g., uploaded body cam footage).
   * Extracts frames and analyzes them in batches.
   */
  async processClip(
    _videoSource: string | Blob,
    _profile: CameraAnalysisProfile
  ): Promise<CameraDetectionEvent[]> {
    // ─── Future Implementation ─────────────────────────
    // 1. Load the video source into a hidden <video> element
    // 2. Extract frames at regular intervals
    // 3. Batch-send frames to the AI pipeline
    // 4. Merge results into deduplicated detection events
    return [];
  }

  /**
   * Start continuous frame processing for a live stream.
   * Captures frames at the configured interval and sends
   * them to the AI pipeline.
   */
  async startContinuousProcessing(
    connection: StreamConnection,
    profile: CameraAnalysisProfile,
    onEvent: (event: CameraDetectionEvent) => void
  ): Promise<void> {
    if (this.isProcessing) {
      console.warn("[VideoProcessing] Already processing a stream");
      return;
    }

    this.isProcessing = true;
    this.onEventCallback = onEvent;

    const interval = profile.confidenceThreshold > 0.9 ? 1000 : 2000; // ms between frames

    this.frameInterval = setInterval(async () => {
      if (!this.isProcessing) return;

      try {
        // ─── Future Implementation ─────────────────────
        // 1. Get the current frame from the video element
        // 2. Check if frame has changed significantly (motion detection)
        // 3. If motion detected, send to AI analysis
        // 4. If detection event returned, call onEvent callback
        //
        // For efficiency:
        // - Use Web Workers for frame processing
        // - Implement frame-differencing to skip static frames
        // - Batch frames when analysis is slower than frame rate
        // - Rate-limit to max 5 FPS for AI analysis
      } catch (err) {
        console.warn("[VideoProcessing] Frame processing error:", err);
      }
    }, interval);

    console.debug("[VideoProcessing] Continuous processing started");
  }

  /** Stop continuous frame processing */
  stopProcessing(): void {
    this.isProcessing = false;
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
    this.onEventCallback = null;
    console.debug("[VideoProcessing] Continuous processing stopped");
  }
}

/** Singleton video processing service */
export const videoProcessor = new DefaultVideoProcessingService();
