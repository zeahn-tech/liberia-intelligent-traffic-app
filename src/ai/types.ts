// ===== Detection & Violation Types =====

export type ViolationCategory =
  | "speeding"
  | "running_red_light"
  | "illegal_parking"
  | "driving_against_traffic"
  | "dangerous_overtaking"
  | "reckless_driving"
  | "illegal_u_turn"
  | "mobile_phone_use"
  | "no_seat_belt"
  | "no_helmet"
  | "overloaded_vehicle"
  | "blocking_emergency_route"
  | "expired_license"
  | "expired_registration"
  | "stolen_vehicle"
  | "custom";

export const VIOLATION_LABELS: Record<ViolationCategory, string> = {
  speeding: "Speeding",
  running_red_light: "Running Red Light",
  illegal_parking: "Illegal Parking",
  driving_against_traffic: "Driving Against Traffic",
  dangerous_overtaking: "Dangerous Overtaking",
  reckless_driving: "Reckless Driving",
  illegal_u_turn: "Illegal U-Turn",
  mobile_phone_use: "Mobile Phone Use While Driving",
  no_seat_belt: "Failure to Wear Seat Belt",
  no_helmet: "Motorcycle Rider Without Helmet",
  overloaded_vehicle: "Overloaded Vehicle",
  blocking_emergency_route: "Blocking Emergency Route",
  expired_license: "Expired License",
  expired_registration: "Expired Registration",
  stolen_vehicle: "Stolen Vehicle",
  custom: "Custom Violation",
};

// ===== Provider Abstraction =====

export type AIProviderId = "vly" | "gemini" | "openai" | "custom";

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  version: string;
  capabilities: AIProviderCapability[];
  apiEndpoint?: string;
  apiKey?: string;
  modelName?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

export type AIProviderCapability =
  | "image_analysis"
  | "video_analysis"
  | "license_plate_detection"
  | "object_detection"
  | "violation_classification"
  | "ocr"
  | "face_detection"
  | "motion_detection";

// ===== Media Input =====

export type MediaType = "photo" | "video" | "frame";

export interface MediaInput {
  type: MediaType;
  url: string;
  mimeType: string;
  fileSize?: number;
  fileName?: string;
  capturedAt?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

// ===== Detection Results =====

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox?: BoundingBox;
  category?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LicensePlateResult {
  plateText: string;
  normalizedPlate: string;
  confidence: number;
  region?: string;
  detectedAt?: string;
  boundingBox?: BoundingBox;
  isVerifiedByOfficer?: boolean;
  officerCorrectedText?: string;
}

export interface ViolationDetection {
  category: ViolationCategory;
  confidence: number;
  description: string;
  severity: "minor" | "moderate" | "serious" | "critical";
  regulation?: string;
  fineAmount?: number;
}

export interface VehicleDescription {
  type?: string;
  make?: string;
  model?: string;
  color?: string;
  year?: number;
  confidence: number;
}

// ===== Analysis Result =====

export interface AIAnalysisResult {
  id: string;
  incidentId: string;
  evidenceId: string | null;
  providerId: AIProviderId;
  providerName: string;

  status: "pending" | "processing" | "completed" | "failed";
  error?: string;

  // Core detections
  violations: ViolationDetection[];
  licensePlate: LicensePlateResult | null;
  vehicle: VehicleDescription | null;
  detectedObjects: DetectedObject[];

  // Confidence & scoring
  overallConfidence: number;
  processingTimeMs: number;

  // Summary
  summary: string;

  // Officer review
  isReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  officerNotes?: string;
  officerOverride?: {
    overturnedCategories?: ViolationCategory[];
    correctedPlate?: string;
    notes: string;
  };

  // Metadata
  timestamps: {
    submitted: string;
    processingStarted?: string;
    processingCompleted?: string;
  };

  // Raw provider output (for debugging/audit)
  rawProviderOutput?: Record<string, unknown>;
}

// ===== Processing Queue =====

export interface AnalysisJob {
  id: string;
  incidentId: string;
  evidenceIds: string[];
  mediaInputs: MediaInput[];
  providerId: AIProviderId;
  priority: "low" | "normal" | "high";
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: AIAnalysisResult;
  error?: string;
  retryCount: number;
}

// ===== Pipeline Events =====

export type PipelineEventType =
  | "job_queued"
  | "job_started"
  | "media_validated"
  | "analysis_started"
  | "analysis_progress"
  | "analysis_completed"
  | "analysis_failed"
  | "plate_detected"
  | "violation_detected"
  | "officer_reviewed"
  | "officer_overridden"
  | "provider_switched";

export interface PipelineEvent {
  type: PipelineEventType;
  timestamp: string;
  jobId: string;
  data?: Record<string, unknown>;
}

// ===== Provider Response (raw) =====

export interface ProviderAnalysisResponse {
  violations: Array<{
    type: string;
    confidence: number;
    description: string;
  }>;
  licensePlate?: {
    text: string;
    confidence: number;
    boundingBox?: BoundingBox;
  };
  vehicle?: {
    type?: string;
    make?: string;
    model?: string;
    color?: string;
  };
  objects: Array<{
    label: string;
    confidence: number;
    boundingBox?: BoundingBox;
  }>;
  summary: string;
  raw?: Record<string, unknown>;
}
