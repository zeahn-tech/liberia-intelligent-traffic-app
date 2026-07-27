// ============================================================
// Predictive Analytics Module
// ============================================================

export {
  predictiveEngine,
  modelRegistry,
  analyzeRoadRisk,
  analyzeHotspot,
  analyzeAccidentRisk,
  analyzeCongestion,
  analyzeOffenderRisk,
  analyzeVolume,
  DISCLAIMER,
} from "./engine";

export type {
  // Base
  BasePrediction,
  PredictionResult,
  PredictionModel,
  PredictionInput,
  PredictionRequest,
  PredictionSummary,
  // Category enums
  PredictionCategory,
  ConfidenceLevel,
  RiskSeverity,
  ModelStatus,
  // Prediction types
  RoadRiskPrediction,
  HotspotPrediction,
  AccidentRiskPrediction,
  CongestionForecast,
  OffenderRiskPrediction,
  VolumeForecast,
  // DB records
  DBModelRecord,
  DBPredictionRecord,
  DBHotspotRecord,
  DBRiskRoadRecord,
} from "./types";
