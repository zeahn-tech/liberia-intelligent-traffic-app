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
      violation_types: {
        Row: ViolationType;
        Insert: Omit<ViolationType, "id" | "created_at">;
        Update: Partial<Omit<ViolationType, "id">>;
      };
      sync_queue: {
        Row: SyncQueueItem;
        Insert: Omit<SyncQueueItem, "id">;
        Update: Partial<Omit<SyncQueueItem, "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      incident_status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "resolved";
      violation_severity: "minor" | "moderate" | "serious" | "critical";
      evidence_type: "photo" | "video" | "document" | "audio" | "other";
      user_role: "officer" | "supervisor" | "admin" | "investigator";
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
  vehicle_type: string | null;
  vehicle_color: string | null;
  severity: "minor" | "moderate" | "serious" | "critical";
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "resolved";
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
  uploaded_at: string;
}

export interface AIAnalysis {
  id: string;
  incident_id: string;
  evidence_id: string | null;
  violation_type: string;
  confidence_score: number;
  detection_timestamp: string | null;
  vehicle_description: string | null;
  vehicle_type: string | null;
  vehicle_color: string | null;
  license_plate: string | null;
  detected_objects: any;
  ai_summary: string | null;
  severity: string | null;
  recommended_review: boolean;
  is_confirmed: boolean | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
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
