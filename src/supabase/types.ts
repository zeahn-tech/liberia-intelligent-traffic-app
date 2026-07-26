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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      incident_status: "draft" | "submitted" | "under_review" | "assigned" | "investigating" | "escalated" | "confirmed" | "resolved" | "closed" | "rejected" | "archived";
      violation_severity: "minor" | "moderate" | "serious" | "critical";
      evidence_type: "photo" | "video" | "document" | "audio" | "other";
      user_role: "officer" | "supervisor" | "admin" | "investigator";
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
  role: "officer" | "supervisor" | "admin" | "investigator";
  badge_number: string;
  station: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
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
  uploaded_at: string;
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
