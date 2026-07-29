export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id">>;
      };
      incidents: {
        Row: Incident;
        Insert: Omit<Incident, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Incident, "id">>;
      };
      evidence: {
        Row: Evidence;
        Insert: Omit<Evidence, "id" | "uploaded_at">;
        Update: Partial<Omit<Evidence, "id">>;
      };
      ai_analyses: {
        Row: AIAnalysis;
        Insert: Omit<AIAnalysis, "id" | "created_at">;
        Update: Partial<Omit<AIAnalysis, "id">>;
      };
      ai_analysis_jobs: {
        Row: AIAnalysisJob;
        Insert: Omit<AIAnalysisJob, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<AIAnalysisJob, "id">>;
      };
      violation_types: {
        Row: ViolationType;
        Insert: Omit<ViolationType, "id" | "created_at">;
        Update: Partial<Omit<ViolationType, "id">>;
      };
      anpr_scans: {
        Row: ANPRScan;
        Insert: Omit<ANPRScan, "id" | "scanned_at">;
        Update: Partial<Omit<ANPRScan, "id">>;
      };
      stolen_vehicles: {
        Row: StolenVehicle;
        Insert: Omit<StolenVehicle, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<StolenVehicle, "id">>;
      };
      sync_queue: {
        Row: SyncQueueItem;
        Insert: Omit<SyncQueueItem, "id">;
        Update: Partial<Omit<SyncQueueItem, "id">>;
      };
      involved_persons: {
        Row: InvolvedPerson;
        Insert: Omit<InvolvedPerson, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<InvolvedPerson, "id">>;
      };
      witnesses: {
        Row: Witness;
        Insert: Omit<Witness, "id" | "created_at">;
        Update: Partial<Omit<Witness, "id">>;
      };
      incident_assignments: {
        Row: IncidentAssignment;
        Insert: Omit<IncidentAssignment, "id" | "assigned_at">;
        Update: Partial<Omit<IncidentAssignment, "id">>;
      };
      incident_logs: {
        Row: IncidentLog;
        Insert: Omit<IncidentLog, "id" | "created_at">;
        Update: never;
      };
      evidence_custody: {
        Row: EvidenceCustodyEvent;
        Insert: Omit<EvidenceCustodyEvent, "id" | "created_at">;
        Update: never;
      };
      evidence_versions: {
        Row: EvidenceVersion;
        Insert: Omit<EvidenceVersion, "id" | "created_at">;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      incident_status: "draft" | "submitted" | "under_review" | "assigned" | "investigating" | "escalated" | "confirmed" | "resolved" | "closed" | "rejected" | "archived";
      violation_severity: "minor" | "moderate" | "serious" | "critical";
      evidence_type: "photo" | "video" | "document" | "audio" | "other";
      user_role: "system_administrator" | "national_commissioner" | "regional_commander" | "traffic_commander" | "police_supervisor" | "traffic_officer" | "investigator" | "evidence_officer" | "system_auditor" | "citizen";
      analysis_status: "pending" | "queued" | "processing" | "completed" | "failed";
      ai_provider: "vly" | "gemini" | "openai" | "custom";
      stolen_status: "active" | "recovered" | "closed";
    };
  };
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  badge_number: string;
  station: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  mfa_enabled: boolean;
  password_changed_at: string | null;
  last_login_at: string | null;
  login_count: number;
  department: string | null;
  division: string | null;
  reporting_officer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  officer_id: string;
  violation_type_id: string | null;
  title: string;
  description: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  vehicle_plate: string | null;
  vehicle_plate_confirmed: boolean | null;
  vehicle_type: string | null;
  vehicle_color: string | null;
  severity: "minor" | "moderate" | "serious" | "critical";
  status: "draft" | "submitted" | "under_review" | "assigned" | "investigating" | "escalated" | "confirmed" | "resolved" | "closed" | "rejected" | "archived";
  is_synced: boolean;
  officer_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: string;
  incident_id: string;
  type: "photo" | "video" | "document" | "audio" | "other";
  file_url: string | null;
  file_path: string | null;
  description: string | null;
  file_size: number | null;
  mime_type: string | null;
  is_offline_capture: boolean;
  ai_analysis_requested: boolean;
  ai_analysis_completed: boolean;
  officer_id: string | null;
  captured_at: string | null;
  capture_lat: number | null;
  capture_lng: number | null;
  device_info: string | null;
  sha256_hash: string | null;
  officer_notes: string | null;
  evidence_status: "original" | "processed" | "reviewed" | "archived" | "expunged";
  original_file_url: string | null;
  original_file_hash: string | null;
  source: string;
  uploaded_at: string;
  updated_at: string;
}

export interface AIAnalysis {
  id: string;
  incident_id: string;
  evidence_id: string | null;
  provider_id: "vly" | "gemini" | "openai" | "custom";
  status: "pending" | "queued" | "processing" | "completed" | "failed";
  error_message: string | null;
  violation_type: string;
  confidence_score: number;
  detection_timestamp: string | null;
  vehicle_description: string | null;
  vehicle_type: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  license_plate: string | null;
  license_plate_confidence: number | null;
  detected_objects: any;
  violations: any;
  ai_summary: string | null;
  severity: string | null;
  processing_time_ms: number | null;
  recommended_review: boolean;
  is_confirmed: boolean | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  officer_notes: string | null;
  raw_provider_output: any;
  created_at: string;
}

export interface AIAnalysisJob {
  id: string;
  incident_id: string;
  evidence_ids: string[];
  provider_id: "vly" | "gemini" | "openai" | "custom";
  priority: "low" | "normal" | "high";
  status: "pending" | "queued" | "processing" | "completed" | "failed";
  error_message: string | null;
  result_id: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface ANPRScan {
  id: string;
  incident_id: string;
  plate_text: string;
  normalized_plate: string;
  plate_confidence: number;
  officer_verified: boolean;
  officer_corrected_text: string | null;
  vehicle_type: string | null;
  vehicle_color: string | null;
  bounding_box: any;
  scanned_at: string;
  officer_id: string;
}

export interface StolenVehicle {
  id: string;
  plate_number: string;
  make: string | null;
  model: string | null;
  color: string | null;
  year: number | null;
  vin: string | null;
  reported_at: string;
  reported_by: string;
  status: "active" | "recovered" | "closed";
  jurisdiction: string;
  case_number: string;
  owner_name: string | null;
  owner_contact: string | null;
  notes: string | null;
  recovered_at: string | null;
  recovered_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ViolationType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  fine_amount: number | null;
  penalty_points: number | null;
  severity: "minor" | "moderate" | "serious" | "critical";
  is_active: boolean;
  created_at: string;
}

export interface InvolvedPerson {
  id: string;
  incident_id: string;
  full_name: string;
  id_type: "drivers_license" | "national_id" | "passport" | "other";
  id_number: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  role: "driver" | "passenger" | "pedestrian" | "owner" | "other";
  statement: string | null;
  created_at: string;
  updated_at: string;
}

export interface Witness {
  id: string;
  incident_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  statement: string | null;
  consent_given: boolean;
  created_at: string;
}

export interface IncidentAssignment {
  id: string;
  incident_id: string;
  assigned_to: string;
  assigned_by: string;
  role: "investigator" | "reviewer" | "supervisor";
  notes: string | null;
  is_active: boolean;
  assigned_at: string;
  unassigned_at: string | null;
}

export interface IncidentLog {
  id: string;
  incident_id: string;
  action: string;
  performed_by: string;
  details: any;
  created_at: string;
}

export interface EvidenceCustodyEvent {
  id: string;
  evidence_id: string;
  action: "uploaded" | "viewed" | "downloaded" | "analyzed" | "transferred" | "reviewed" | "verified" | "exported" | "archived" | "restored" | "expunged" | "hash_verified" | "officer_notes_added";
  performed_by: string;
  from_officer: string | null;
  to_officer: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: any;
  created_at: string;
}

export interface EvidenceVersion {
  id: string;
  evidence_id: string;
  version_number: number;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  sha256_hash: string;
  processing_type: "original" | "resized" | "cropped" | "compressed" | "converted" | "watermarked" | "redacted" | "ai_enhanced" | "export";
  processing_params: any;
  created_by: string;
  created_at: string;
}

// ─── Storage / Media Security Types ─────────────────────

export interface StorageFile {
  id: string;
  evidence_id: string;
  bucket_name: string;
  file_path: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  sha256_hash: string;
  is_signed_url: boolean;
  signed_url: string | null;
  signed_url_expires_at: string | null;
  created_at: string;
}

export interface UploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  generateSignedUrl: boolean;
  computeHash: boolean;
  offlineQueue: boolean;
}

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  /** Image dimensions (for image types) */
  width?: number;
  height?: number;
  /** Video/audio duration in seconds (estimated) */
  duration?: number;
  /** Extracted capture timestamp */
  captureTimestamp?: string;
  /** Whether this is a supported type */
  isSupported: boolean;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  signedUrl?: string | null;
  bucket?: string;
  filePath?: string;
  sha256Hash?: string;
  isOffline?: boolean;
  message?: string;
  error?: string;
  /** Upload verification status */
  verificationStatus?: "verified" | "warning" | "unverified";
  /** Extracted file metadata */
  metadata?: FileMetadata;
}

export interface SignedUrlRequest {
  bucket: string;
  filePath: string;
  expiresIn?: number;
}

// ─── Liberia Geographic Types ───────────────────────

export interface LiberiaCounty {
  id: string;
  code: string;
  name: string;
  capital: string;
  population: number | null;
  area_km2: number | null;
  center_lat: number | null;
  center_lng: number | null;
  police_region: string;
  boundary_geojson: any;
  is_active: boolean;
  created_at: string;
}

export interface LiberiaDistrict {
  id: string;
  county_code: string;
  name: string;
  center_lat: number | null;
  center_lng: number | null;
  is_active: boolean;
  created_at: string;
}

export interface PoliceRegion {
  id: string;
  name: string;
  headquarters: string;
  commander: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PoliceStation {
  id: string;
  name: string;
  county_code: string;
  address: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  type: "station" | "substation" | "post" | "hq";
  is_active: boolean;
  created_at: string;
}

export interface MajorRoad {
  id: string;
  name: string;
  road_number: string | null;
  road_type: "highway" | "primary" | "secondary" | "tertiary" | null;
  from_location: string | null;
  to_location: string | null;
  length_km: number | null;
  counties: string[];
  route_geojson: any;
  is_active: boolean;
  created_at: string;
}

export interface Checkpoint {
  id: string;
  name: string;
  county_code: string;
  road_name: string | null;
  latitude: number;
  longitude: number;
  is_permanent: boolean;
  hours: string | null;
  unit: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CountyIncidentCount {
  county_code: string;
  county_name: string;
  incident_count: number;
}

export interface GeoFilterState {
  county_code: string;
  district_id: string;
  police_region: string;
  road_name: string;
  checkpoint_id: string;
  police_station_id: string;
  date_from: string;
  date_to: string;
}

export interface SyncQueueItem {
  id: string;
  table_name: string;
  record_id: string;
  operation: "create" | "update" | "delete";
  payload: any;
  status: "pending" | "syncing" | "completed" | "failed";
  error_message: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
}
