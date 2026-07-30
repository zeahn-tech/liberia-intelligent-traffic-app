// ============================================================
// TrafficWatch AI — API Service Barrel Export
//
// Central export point for all domain API services.
// Import services like:
//   import { listIncidents, getIncident } from "@/services";
//   import { getDashboardStats } from "@/services";
// ============================================================

export * from "./base";
export type { ApiResponse, PaginatedResponse, ApiError } from "./base";

// ─── Incident Service ───────────────────────────────────
export {
  listIncidents,
  getIncident,
  createIncident,
  updateIncident,
  deleteIncident,
  changeIncidentStatus,
  getMyIncidents,
  getRecentIncidents,
  getIncidentCounts,
} from "./incidents-service";
export type {
  IncidentStatus,
  IncidentSeverity,
  CreateIncidentInput,
  UpdateIncidentInput,
  IncidentFilter,
} from "./incidents-service";

// ─── User Service ───────────────────────────────────────
export {
  listUsers,
  getUser,
  updateUser,
  changeUserRole,
  setUserActiveStatus,
  getRoles,
  getOfficers,
  getOfficersByCounty,
  getUserStats,
} from "./users-service";
export type { UserFilter } from "./users-service";

// ─── Evidence Service ───────────────────────────────────
export {
  listEvidence,
  getEvidence,
  createEvidence,
  updateEvidence,
  deleteEvidence,
  getIncidentEvidence,
  getEvidenceCounts,
  getCustodyChain,
  logCustodyEvent,
  getStorageFiles,
  getPendingAIAnalysis,
} from "./evidence-service";
export type { CreateEvidenceInput, EvidenceFilter } from "./evidence-service";

// ─── Vehicle Service ────────────────────────────────────
export {
  lookupByPlate,
  searchVehicles,
  registerVehicle,
  upsertVehicle,
  createANPRScan,
  verifyANPRScan,
  listANPRScans,
  checkStolenVehicle,
  listStolenVehicles,
  reportStolenVehicle,
  recoverVehicle,
  getPlateIncidentCount,
  findRepeatOffenders,
} from "./vehicles-service";

// ─── Violation Service ──────────────────────────────────
export {
  listViolationTypes,
  getViolationType,
  createViolationType,
  updateViolationType,
  getIncidentViolations,
  addIncidentViolations,
  removeIncidentViolation,
  getViolationStats,
} from "./violations-service";

// ─── Analytics Service ──────────────────────────────────
export {
  getDashboardStats,
  getIncidentTrends,
  getCountyStats,
  getViolationBreakdown,
  getOfficerActivity,
  getMostDangerousRoads,
  getRepeatOffenderStats,
  getPredictedHotspots,
} from "./analytics-service";
export type {
  DashboardStats,
  TrendDataPoint,
  CountyStats,
  ViolationBreakdown,
  OfficerActivity,
} from "./analytics-service";

// ─── Notification Service ───────────────────────────────
export {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  getNotificationPreferences,
  updateNotificationPreference,
  getPushSubscriptions,
} from "./notifications-service";
export type { NotificationRecord, NotificationFilter } from "./notifications-service";

// ─── Report Service ─────────────────────────────────────
export {
  generateReport,
  listReports,
  getIncidentReports,
  deleteReport,
} from "./reports-service";
export type { ReportHistoryRecord, ReportFilter } from "./reports-service";

// ─── Geography Service ──────────────────────────────────
export {
  getCounties,
  getCounty,
  getDistricts,
  getPoliceRegions,
  getPoliceStations,
  getStationsByType,
  getMajorRoads,
  getCheckpoints,
  getIncidentGeoDistribution,
  getCountyIncidentCounts,
} from "./geography-service";
export type {
  County,
  District,
  PoliceStation,
  MajorRoad,
  Checkpoint,
} from "./geography-service";

// ─── Audit Service ──────────────────────────────────────
export {
  queryAuditLogs,
  getAuditEntry,
  getAuditStats,
  exportAuditLogs,
} from "./audit-service";
export type { AuditLogRecord, AuditFilter } from "./audit-service";

// ─── Camera Service ────────────────────────────────────
export {
  listCameras,
  getCamera,
  registerCamera,
  updateCamera,
  deleteCamera,
  recordCameraEvent,
  listCameraEvents,
  getPendingCameraAlerts,
  acknowledgeCameraAlert,
  getCameraStats,
  getCamerasNearLocation,
  getCamerasPendingAnalysis,
  // Camera Streams
  listCameraStreams,
  registerCameraStream,
  updateCameraStream,
  deleteCameraStream,
  getCameraStreamHealth,
  // Camera Detections
  recordCameraDetection,
  listCameraDetections,
  getCameraDetectionStats,
  // Camera Violations
  recordCameraViolation,
  listCameraViolations,
  updateCameraViolationStatus,
  // Camera Evidence
  recordCameraEvidence,
  listCameraEvidence,
  updateCameraEvidenceStatus,
} from "./cameras-service";
export type { CameraFilter } from "./cameras-service";

// ─── System Service ─────────────────────────────────────
export {
  getSetting,
  getSettingsByCategory,
  updateSetting,
  isFeatureEnabled,
  getFeatureFlags,
  getAppInfo,
} from "./system-service";
export type { SystemSetting } from "./system-service";
