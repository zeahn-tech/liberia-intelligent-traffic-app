/**
 * AI Analysis Pipeline
 *
 * Orchestrates the end-to-end AI analysis workflow:
 *
 *   Evidence Upload → Media Validation → Provider Dispatch →
 *   Computer Vision → Object Detection → Violation Classification →
 *   License Plate Detection → OCR → Confidence Evaluation →
 *   Result Storage → Officer Review
 *
 * The pipeline is decoupled from providers and UI. Providers can be swapped
 * via the registry. Results are stored via a persistence adapter.
 */

import type {
  AIAnalysisResult,
  AIProviderId,
  AnalysisJob,
  DetectedObject,
  LicensePlateResult,
  MediaInput,
  PipelineEvent,
  PipelineEventType,
  VehicleDescription,
  ViolationDetection,
} from "./types";
import { providerRegistry } from "./registry";
import { generateId } from "./utils";
import type { AnalysisOptions } from "./provider";
import { addToSyncQueue, offlineSet, offlineGet } from "@/lib/offline";
import { supabase } from "@/supabase/client";
import { logAIReview } from "@/lib/audit";

// ===== Event System =====

type EventListener = (event: PipelineEvent) => void;
const eventListeners = new Map<PipelineEventType, EventListener[]>();

export function onPipelineEvent(
  type: PipelineEventType,
  listener: EventListener
): () => void {
  const listeners = eventListeners.get(type) || [];
  listeners.push(listener);
  eventListeners.set(type, listeners);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

function emitEvent(event: PipelineEvent): void {
  const listeners = eventListeners.get(event.type) || [];
  listeners.forEach((l) => l(event));
}

// ===== Job Queue =====

interface JobEntry {
  job: AnalysisJob;
  resolve: (result: AIAnalysisResult) => void;
  reject: (error: Error) => void;
}

const jobQueue: JobEntry[] = [];
let isProcessing = false;
let concurrencyLimit = 2;
let activeJobs = 0;

/**
 * Configure pipeline concurrency.
 */
export function configurePipeline(options: { concurrency?: number }): void {
  if (options.concurrency) concurrencyLimit = options.concurrency;
}

// ===== Media Validation =====

export interface MediaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
];

export function validateMedia(input: MediaInput): MediaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input.url && !input.fileName) {
    errors.push("Media URL or file name is required");
  }

  if (input.type === "photo") {
    if (input.fileSize && input.fileSize > MAX_IMAGE_SIZE) {
      errors.push(`Image exceeds maximum size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
    }
    if (input.mimeType && !ALLOWED_IMAGE_TYPES.includes(input.mimeType)) {
      warnings.push(`Image type ${input.mimeType} may not be fully supported`);
    }
  }

  if (input.type === "video") {
    if (input.fileSize && input.fileSize > MAX_VIDEO_SIZE) {
      errors.push(`Video exceeds maximum size of ${MAX_VIDEO_SIZE / 1024 / 1024}MB`);
    }
    if (input.mimeType && !ALLOWED_VIDEO_TYPES.includes(input.mimeType)) {
      warnings.push(`Video type ${input.mimeType} may not be fully supported`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ===== Pipeline Orchestration =====

/**
 * Submit media for AI analysis.
 * Returns a promise that resolves with the analysis result.
 */
export async function submitForAnalysis(
  incidentId: string,
  mediaInputs: MediaInput[],
  evidenceIds: string[],
  options: {
    providerId?: AIProviderId;
    priority?: "low" | "normal" | "high";
  } = {}
): Promise<AIAnalysisResult> {
  const provider = providerRegistry.getActiveProvider();
  if (!provider) {
    throw new Error("No AI provider configured. Please configure an AI provider in Settings.");
  }

  // Validate all media
  for (const media of mediaInputs) {
    const validation = validateMedia(media);
    if (!validation.valid) {
      throw new Error(
        `Media validation failed: ${validation.errors.join(", ")}`
      );
    }
  }

  const jobId = generateId("ajob");

  const job: AnalysisJob = {
    id: jobId,
    incidentId,
    evidenceIds,
    mediaInputs,
    providerId: (options.providerId || provider.id) as AIProviderId,
    priority: options.priority || "normal",
    status: "queued",
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  return new Promise<AIAnalysisResult>((resolve, reject) => {
    jobQueue.push({ job, resolve, reject });
    emitEvent({ type: "job_queued", timestamp: job.createdAt, jobId, data: { incidentId } });
    processQueue();
  });
}

async function processQueue(): Promise<void> {
  if (isProcessing) return;
  if (jobQueue.length === 0 || activeJobs >= concurrencyLimit) return;

  isProcessing = true;

  while (jobQueue.length > 0 && activeJobs < concurrencyLimit) {
    const entry = jobQueue.shift();
    if (!entry) continue;

    activeJobs++;
    processJob(entry.job)
      .then((result) => {
        entry.resolve(result);
      })
      .catch((err) => {
        entry.reject(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        activeJobs--;
        processQueue();
      });
  }

  isProcessing = false;
}

async function processJob(job: AnalysisJob): Promise<AIAnalysisResult> {
  const provider = providerRegistry.getProvider(job.providerId);
  if (!provider) {
    throw new Error(`Provider ${job.providerId} is not initialized`);
  }

  job.status = "processing";
  job.startedAt = new Date().toISOString();
  emitEvent({ type: "job_started", timestamp: job.startedAt, jobId: job.id });

  const allViolations: ViolationDetection[] = [];
  const allObjects: DetectedObject[] = [];
  let licensePlate: LicensePlateResult | null = null;
  let vehicle: VehicleDescription | null = null;
  let totalConfidence = 0;
  let analysisCount = 0;
  const processingStart = performance.now();

  try {
    for (const media of job.mediaInputs) {
      emitEvent({
        type: "media_validated",
        timestamp: new Date().toISOString(),
        jobId: job.id,
        data: { mediaType: media.type },
      });

      let providerResponse;
      const options: AnalysisOptions = {
        incidentId: job.incidentId,
        evidenceId: job.evidenceIds[0],
      };

      if (media.type === "video") {
        providerResponse = await provider.analyzeVideo(media, options);
      } else {
        providerResponse = await provider.analyzeImage(media, options);
      }

      // Extract violations
      if (providerResponse.violations) {
        for (const v of providerResponse.violations) {
          allViolations.push({
            category: mapViolationType(v.type),
            confidence: v.confidence,
            description: v.description,
            severity: scoreSeverity(v.confidence, v.type),
          });
        }
      }

      // Extract license plate
      if (providerResponse.licensePlate) {
        licensePlate = {
          plateText: providerResponse.licensePlate.text,
          normalizedPlate: providerResponse.licensePlate.text.replace(/[^A-Za-z0-9]/g, "").toUpperCase(),
          confidence: providerResponse.licensePlate.confidence,
          boundingBox: providerResponse.licensePlate.boundingBox,
        };
        emitEvent({
          type: "plate_detected",
          timestamp: new Date().toISOString(),
          jobId: job.id,
          data: { plate: licensePlate.normalizedPlate, confidence: licensePlate.confidence },
        });
      }

      // Extract objects
      if (providerResponse.objects) {
        for (const obj of providerResponse.objects) {
          allObjects.push({
            label: obj.label,
            confidence: obj.confidence,
            boundingBox: obj.boundingBox,
          });
          // Check if it's a vehicle description
          if (
            ["car", "truck", "bus", "motorcycle", "van", "suv"].includes(
              obj.label.toLowerCase()
            )
          ) {
            vehicle = {
              type: obj.label,
              confidence: obj.confidence,
            };
          }
        }
      }

      // Vehicle details from provider
      if (providerResponse.vehicle) {
        const vehicleObj = providerResponse.vehicle;
        vehicle = {
          ...vehicle,
          type: vehicleObj.type || vehicle?.type,
          make: vehicleObj.make,
          model: vehicleObj.model,
          color: vehicleObj.color,
          confidence: "confidence" in vehicleObj ? (vehicleObj as any).confidence ?? vehicle?.confidence ?? 0.5 : vehicle?.confidence ?? 0.5,
        };
      }

      if (providerResponse.violations.length > 0) {
        for (const v of providerResponse.violations) {
          emitEvent({
            type: "violation_detected",
            timestamp: new Date().toISOString(),
            jobId: job.id,
            data: { type: v.type, confidence: v.confidence },
          });
        }
      }

      // Track confidence for averaging
      const confidences = [
        ...providerResponse.violations.map((v) => v.confidence),
        ...(providerResponse.licensePlate?.confidence != null
          ? [providerResponse.licensePlate.confidence]
          : []),
        ...providerResponse.objects.map((o) => o.confidence),
      ];
      if (confidences.length > 0) {
        totalConfidence +=
          confidences.reduce((a, b) => a + b, 0) / confidences.length;
        analysisCount++;
      }
    }

    const processingEnd = performance.now();
    const overallConfidence =
      analysisCount > 0
        ? Math.round((totalConfidence / analysisCount) * 100) / 100
        : 0;

    // Determine primary violation for summary
    const topViolation =
      allViolations.length > 0
        ? allViolations.reduce((a, b) => (a.confidence > b.confidence ? a : b))
        : null;

    const result: AIAnalysisResult = {
      id: generateId("ai"),
      incidentId: job.incidentId,
      evidenceId: job.evidenceIds[0] || null,
      providerId: provider.id as AIProviderId,
      providerName: provider.name,
      status: "completed",
      violations: allViolations,
      licensePlate,
      vehicle,
      detectedObjects: allObjects,
      overallConfidence,
      processingTimeMs: Math.round(processingEnd - processingStart),
      summary: topViolation
        ? `AI detected ${topViolation.description.toLowerCase()} (${Math.round(topViolation.confidence * 100)}% confidence).${licensePlate ? ` License plate: ${licensePlate.normalizedPlate}.` : ""}`
        : "AI analysis completed. No traffic violations detected in the provided evidence.",
      isReviewed: false,
      timestamps: {
        submitted: job.createdAt,
        processingStarted: job.startedAt,
        processingCompleted: new Date().toISOString(),
      },
    };

    // Persist the result
    await persistAnalysisResult(result);

    job.status = "completed";
    job.completedAt = result.timestamps.processingCompleted;
    job.result = result;
    emitEvent({
      type: "analysis_completed",
      timestamp: job.completedAt || new Date().toISOString(),
      jobId: job.id,
      data: { confidence: overallConfidence },
    });

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Analysis failed";
    job.status = "failed";
    job.error = errorMessage;

    emitEvent({
      type: "analysis_failed",
      timestamp: new Date().toISOString(),
      jobId: job.id,
      data: { error: errorMessage },
    });

    // Create a partial/failed result
    const failedResult: AIAnalysisResult = {
      id: generateId("ai"),
      incidentId: job.incidentId,
      evidenceId: job.evidenceIds[0] || null,
      providerId: provider.id as AIProviderId,
      providerName: provider.name,
      status: "failed",
      error: errorMessage,
      violations: allViolations,
      licensePlate,
      vehicle,
      detectedObjects: allObjects,
      overallConfidence: 0,
      processingTimeMs: Math.round(performance.now() - processingStart),
      summary: `AI analysis failed: ${errorMessage}`,
      isReviewed: false,
      timestamps: {
        submitted: job.createdAt,
        processingStarted: job.startedAt,
        processingCompleted: new Date().toISOString(),
      },
    };

    await persistAnalysisResult(failedResult);
    throw err;
  }
}

// ===== Persistence =====

async function persistAnalysisResult(
  result: AIAnalysisResult
): Promise<void> {
  // Store locally for offline access
  await offlineSet("ai_analyses", result.id, result);

  // Queue for sync to Supabase
  await addToSyncQueue({
    tableName: "ai_analyses",
    recordId: result.id,
    operation: "create",
    payload: {
      id: result.id,
      incident_id: result.incidentId,
      evidence_id: result.evidenceId,
      violation_type: result.violations[0]?.category || "unknown",
      confidence_score: result.overallConfidence,
      detection_timestamp: result.timestamps.processingCompleted,
      vehicle_description: result.vehicle
        ? (`${result.vehicle.color || ""} ${result.vehicle.make || ""} ${result.vehicle.model || ""} ${result.vehicle.type || ""}`.trim() || null)
        : null,
      vehicle_type: result.vehicle?.type || null,
      vehicle_color: result.vehicle?.color || null,
      license_plate: result.licensePlate?.normalizedPlate || null,
      detected_objects: result.detectedObjects,
      ai_summary: result.summary,
      severity: result.violations[0]?.severity || null,
      recommended_review: result.overallConfidence < 0.85,
      is_confirmed: false,
    } as any,
  });
}

/**
 * Mark an analysis result as reviewed by an officer.
 *
 * WORKFLOW:
 *   AI Detection → Confidence Score → Officer Review →
 *   Confirm / Reject / Correct → Audit Trail → Official Case Record
 *
 * AI analysis NEVER automatically becomes an enforcement decision.
 * Every result requires officer review before it can be used as evidence.
 * All confirmations, rejections, and corrections are recorded in the audit log.
 */
export async function reviewAnalysisResult(
  analysisId: string,
  review: {
    confirmed: boolean;
    officerId: string;
    notes?: string;
    correctedPlate?: string;
    overturnedViolations?: string[];
  }
): Promise<void> {
  const local = await offlineGet<AIAnalysisResult>("ai_analyses", analysisId);
  if (!local) {
    throw new Error("Analysis result not found locally");
  }

  // Determine the review action type
  const actionType = !review.confirmed
    ? "rejected"
    : review.correctedPlate || (review.overturnedViolations && review.overturnedViolations.length > 0)
      ? "corrected"
      : "confirmed";

  const updated: AIAnalysisResult = {
    ...local,
    isReviewed: true,
    reviewedBy: review.officerId,
    reviewedAt: new Date().toISOString(),
    officerNotes: review.notes || "",
    officerOverride:
      actionType === "corrected"
        ? {
            correctedPlate: review.correctedPlate,
            overturnedCategories: review.overturnedViolations as any,
            notes: review.notes || "",
          }
        : undefined,
  };

  // Update local
  await offlineSet("ai_analyses", analysisId, updated);

  // Queue sync for review status
  const reviewPayload: any = {
    is_confirmed: review.confirmed,
    reviewed_by: review.officerId,
    reviewed_at: updated.reviewedAt,
    license_plate: review.correctedPlate || local.licensePlate?.normalizedPlate || null,
    officer_notes: review.notes || null,
  };
  await addToSyncQueue({
    tableName: "ai_analyses",
    recordId: analysisId,
    operation: "update",
    payload: reviewPayload,
  });

  // Emit pipeline event for real-time UI updates
  emitEvent({
    type: review.confirmed ? "officer_reviewed" : "officer_overridden",
    timestamp: updated.reviewedAt!,
    jobId: analysisId,
    data: { officerId: review.officerId },
  });

  // ── Record in immutable audit trail ─────────────────────────
  // Every review action is logged regardless of connectivity
  await logAIReview(
    analysisId,
    local.incidentId,
    review.officerId,
    actionType,
    {
      notes: review.notes,
      correctedPlate: review.correctedPlate,
      overturnedViolations: review.overturnedViolations,
    }
  );
}

/**
 * Get all AI analysis results for a given incident.
 */
export async function getAnalysisResultsForIncident(
  incidentId: string
): Promise<AIAnalysisResult[]> {
  const { offlineGetAll } = await import("@/lib/offline");
  const all = await offlineGetAll<any>("ai_analyses");
  return all.filter((a: any) => a.incidentId === incidentId);
}

// ===== Helpers =====

function mapViolationType(type: string): import("./types").ViolationCategory {
  const lower = type.toLowerCase();
  if (lower.includes("speed")) return "speeding";
  if (lower.includes("red light") || lower.includes("traffic light"))
    return "running_red_light";
  if (lower.includes("park")) return "illegal_parking";
  if (lower.includes("wrong way") || lower.includes("against traffic"))
    return "driving_against_traffic";
  if (lower.includes("overtak")) return "dangerous_overtaking";
  if (lower.includes("reckless") || lower.includes("dangerous driving"))
    return "reckless_driving";
  if (lower.includes("u-turn") || lower.includes("uturn"))
    return "illegal_u_turn";
  if (lower.includes("phone") || lower.includes("mobile"))
    return "mobile_phone_use";
  if (lower.includes("seat belt") || lower.includes("seatbelt"))
    return "no_seat_belt";
  if (lower.includes("helmet")) return "no_helmet";
  if (lower.includes("overload") || lower.includes("overweight"))
    return "overloaded_vehicle";
  if (lower.includes("emergency")) return "blocking_emergency_route";
  if (lower.includes("stolen")) return "stolen_vehicle";
  return "custom";
}

function scoreSeverity(
  _confidence: number,
  type: string
): "minor" | "moderate" | "serious" | "critical" {
  const lower = type.toLowerCase();
  if (
    lower.includes("reckless") ||
    lower.includes("stolen") ||
    lower.includes("emergency")
  )
    return "critical";
  if (lower.includes("speed") || lower.includes("red light"))
    return "serious";
  if (lower.includes("helmet") || lower.includes("seat belt"))
    return "moderate";
  return "minor";
}
