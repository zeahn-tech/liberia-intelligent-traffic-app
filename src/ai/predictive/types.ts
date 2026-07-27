// ============================================================
// Predictive Analytics — Types & Interfaces
//
// All predictions are ESTIMATES generated from available data.
// NEVER present predictions as established facts.
// ============================================================

/** Confidence level for any prediction result */
export type ConfidenceLevel = "very_low" | "low" | "moderate" | "high" | "very_high";

/** Risk severity classification */
export type RiskSeverity = "low" | "medium" | "high" | "critical";

/** Prediction category type */
export type PredictionCategory =
  | "road_risk"
  | "hotspot_prediction"
  | "accident_risk"
  | "congestion_forecast"
  | "offender_risk"
  | "volume_forecast";

/** Model status in the database */
export type ModelStatus = "active" | "training" | "deprecated" | "error";

/** Base prediction interface — all predictions share these fields */
export interface BasePrediction {
  id: string;
  category: PredictionCategory;
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0–100
  generatedAt: string; // ISO 8601
  expiresAt: string; // ISO 8601 — when this prediction should be regenerated
  dataSources: string[]; // e.g. ["incidents_3months", "anpr_30days", "traffic_counts"]
  modelVersion: string;
  isEstimate: true; // Always true — prevents treating predictions as facts
}

/** High-risk road prediction */
export interface RoadRiskPrediction extends BasePrediction {
  category: "road_risk";
  roadName: string;
  county: string;
  district?: string;
  currentRisk: RiskSeverity;
  predictedRisk: RiskSeverity;
  trendDirection: "increasing" | "decreasing" | "stable";
  riskScore: number; // 0–100
  primaryViolationTypes: string[];
  incidentCount: number;
  periodDays: number;
  factors: string[]; // e.g. ["poor_lighting", "high_volume", "sharp_curve"]
  recommendation?: string;
}

/** Violation hotspot prediction */
export interface HotspotPrediction extends BasePrediction {
  category: "hotspot_prediction";
  locationName: string;
  latitude: number;
  longitude: number;
  county: string;
  district?: string;
  predictedViolationTypes: Array<{
    type: string;
    probability: number; // 0–100
    estimatedFrequency: string; // e.g. "12 per week"
  }>;
  peakTimes: string[]; // e.g. ["1600-1900", "0700-0900"]
  peakDays: string[]; // e.g. ["Friday", "Saturday"]
  estimatedImpact: "low" | "medium" | "high";
  radiusMeters: number;
}

/** Accident risk analysis */
export interface AccidentRiskPrediction extends BasePrediction {
  category: "accident_risk";
  roadName: string;
  locationDescription: string;
  latitude: number;
  longitude: number;
  riskLevel: RiskSeverity;
  probabilityScore: number; // 0–100
  contributingFactors: string[];
  historicalAccidents: number;
  weatherRisk?: {
    rain: RiskSeverity;
    visibility: RiskSeverity;
    roadCondition: RiskSeverity;
  };
  timeBasedRisk: Array<{
    timeRange: string;
    riskLevel: RiskSeverity;
    probability: number;
  }>;
}

/** Traffic congestion forecast */
export interface CongestionForecast extends BasePrediction {
  category: "congestion_forecast";
  roadName: string;
  segment: string;
  currentCongestion: "low" | "moderate" | "heavy" | "severe";
  predictedCongestion: "low" | "moderate" | "heavy" | "severe";
  peakForecast: Array<{
    day: string;
    timeRange: string;
    expectedLevel: "low" | "moderate" | "heavy" | "severe";
    delayMinutes: number;
  }>;
  averageSpeed: number; // km/h
  estimatedDelayMinutes: number;
  alternativeRoutes?: string[];
}

/** Repeat offender risk analysis */
export interface OffenderRiskPrediction extends BasePrediction {
  category: "offender_risk";
  licensePlate: string;
  riskLevel: RiskSeverity;
  riskScore: number; // 0–100
  totalViolations: number;
  violationsByType: Array<{
    type: string;
    count: number;
    trend: "increasing" | "stable" | "decreasing";
  }>;
  escalationProbability: number; // 0–100 — likelihood of committing more serious violation
  firstViolationDate: string;
  lastViolationDate: string;
  averageFrequencyDays: number;
  recommendation?: string;
}

/** Incident volume forecast */
export interface VolumeForecast extends BasePrediction {
  category: "volume_forecast";
  forecastType: "daily" | "weekly" | "monthly";
  period: string; // e.g. "2024-08", "2024-W32"
  estimatedVolume: number;
  lowerBound: number; // confidence interval lower
  upperBound: number; // confidence interval upper
  confidenceInterval: number; // e.g. 95
  comparisonToPrevious: number; // percentage change
  trend: "increasing" | "decreasing" | "stable";
  seasonalFactors?: string[];
}

/** Union of all prediction types */
export type PredictionResult =
  | RoadRiskPrediction
  | HotspotPrediction
  | AccidentRiskPrediction
  | CongestionForecast
  | OffenderRiskPrediction
  | VolumeForecast;

/** Configuration for a registered prediction model */
export interface PredictionModel {
  id: string;
  name: string;
  description: string;
  version: string;
  category: PredictionCategory;
  status: ModelStatus;
  accuracy: number; // 0–100 — estimated model accuracy based on historical validation
  lastTrainedAt: string | null;
  nextTrainingDue: string | null;
  dataRequirements: string[];
  parameters: Record<string, unknown>;
}

/** Input data for generating a prediction */
export interface PredictionInput {
  category: PredictionCategory;
  parameters: Record<string, unknown>;
  historicalData?: Record<string, unknown>;
  forceRefresh?: boolean;
}

/** A registered prediction model in the system */
export interface DBModelRecord {
  id: string;
  name: string;
  description: string;
  version: string;
  category: PredictionCategory;
  status: ModelStatus;
  accuracy: number;
  parameters: Record<string, unknown>;
  data_requirements: string[];
  last_trained_at: string | null;
  next_training_due: string | null;
  created_at: string;
  updated_at: string;
}

/** A stored prediction result in the database */
export interface DBPredictionRecord {
  id: string;
  model_id: string;
  category: PredictionCategory;
  title: string;
  summary: string;
  confidence_score: number;
  confidence_level: ConfidenceLevel;
  risk_severity: RiskSeverity | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  county: string | null;
  district: string | null;
  road_name: string | null;
  license_plate: string | null;
  predicted_value: number | null;
  lower_bound: number | null;
  upper_bound: number | null;
  details_json: Record<string, unknown>;
  data_sources: string[];
  model_version: string;
  expires_at: string;
  created_at: string;
  created_by: string | null;
}

/** Represents a violation hotspot stored in the database */
export interface DBHotspotRecord {
  id: string;
  county: string;
  district: string | null;
  location_name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  risk_level: RiskSeverity;
  predominant_violation_types: string[];
  peak_times: string[];
  peak_days: string[];
  incident_count: number;
  last_updated: string;
}

/** Represents a high-risk road stored in the database */
export interface DBRiskRoadRecord {
  id: string;
  road_name: string;
  county: string;
  district: string | null;
  risk_level: RiskSeverity;
  risk_score: number;
  incident_count: number;
  predominant_violation_types: string[];
  factors: string[];
  recommendation: string | null;
  last_updated: string;
}

/** Options for generating a prediction request */
export interface PredictionRequest {
  category: PredictionCategory;
  forceRefresh?: boolean;
  location?: { lat: number; lng: number; name?: string };
  licensePlate?: string;
  roadName?: string;
  county?: string;
  period?: string;
}

/** Summary statistics from the prediction engine */
export interface PredictionSummary {
  totalActivePredictions: number;
  categoriesBreakdown: Record<PredictionCategory, number>;
  highRiskAlerts: number;
  lastUpdated: string;
  modelsOnline: number;
  modelsTraining: number;
}
