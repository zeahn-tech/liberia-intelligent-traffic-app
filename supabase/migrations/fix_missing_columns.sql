-- ============================================================
-- TrafficWatch AI — Missing Columns Fix
-- ============================================================
-- Run this BEFORE 00001_init.sql if you already have tables from
-- earlier individual migrations (v1-v20).
-- This adds columns that may be missing in existing tables.
-- ============================================================

-- vehicle_owners
ALTER TABLE public.vehicle_owners ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.vehicle_owners ADD COLUMN IF NOT EXISTS ownership_from TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.vehicle_owners ADD COLUMN IF NOT EXISTS ownership_to TIMESTAMPTZ;

-- profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS county_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reporting_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS division TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_count INTEGER NOT NULL DEFAULT 0;

-- incidents
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS county_code TEXT;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS vehicle_plate_confirmed BOOLEAN DEFAULT false;

-- evidence
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS evidence_status TEXT NOT NULL DEFAULT 'original' CHECK (evidence_status IN ('original','processed','reviewed','archived','expunged'));
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS original_file_url TEXT;
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS original_file_hash TEXT;
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'officer_upload';

-- citizens_reports
ALTER TABLE public.citizen_reports ADD COLUMN IF NOT EXISTS evidence_data JSONB DEFAULT '[]';
ALTER TABLE public.citizen_reports ADD COLUMN IF NOT EXISTS location_county TEXT;
ALTER TABLE public.citizen_reports ADD COLUMN IF NOT EXISTS reporter_email TEXT;
ALTER TABLE public.citizen_reports ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- stolen_vehicles
ALTER TABLE public.stolen_vehicles ADD COLUMN IF NOT EXISTS jurisdiction TEXT NOT NULL DEFAULT '';
ALTER TABLE public.stolen_vehicles ADD COLUMN IF NOT EXISTS case_number TEXT NOT NULL DEFAULT '';
ALTER TABLE public.stolen_vehicles ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE public.stolen_vehicles ADD COLUMN IF NOT EXISTS owner_contact TEXT;

-- notification_preferences
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS min_priority TEXT NOT NULL DEFAULT 'normal' CHECK (min_priority IN ('low','normal','high','urgent'));
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS channel_sms BOOLEAN NOT NULL DEFAULT false;

-- officer_notifications
ALTER TABLE public.officer_notifications ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.officer_notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE public.officer_notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.officer_notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- traffic_cameras
ALTER TABLE public.traffic_cameras ADD COLUMN IF NOT EXISTS manufacturer TEXT;
ALTER TABLE public.traffic_cameras ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE public.traffic_cameras ADD COLUMN IF NOT EXISTS orientation TEXT;
ALTER TABLE public.traffic_cameras ADD COLUMN IF NOT EXISTS field_of_view REAL;
ALTER TABLE public.traffic_cameras ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE public.traffic_cameras ADD COLUMN IF NOT EXISTS max_fps INTEGER;
ALTER TABLE public.traffic_cameras ADD COLUMN IF NOT EXISTS rtsp_username TEXT;
ALTER TABLE public.traffic_cameras ADD COLUMN IF NOT EXISTS rtsp_password_enc TEXT;
ALTER TABLE public.traffic_cameras ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.traffic_cameras ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ;

-- camera_events
ALTER TABLE public.camera_events ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.camera_events ADD COLUMN IF NOT EXISTS detected_plate TEXT;
ALTER TABLE public.camera_events ADD COLUMN IF NOT EXISTS detected_speed REAL;
ALTER TABLE public.camera_events ADD COLUMN IF NOT EXISTS evidence_id UUID REFERENCES public.evidence(id) ON DELETE SET NULL;
ALTER TABLE public.camera_events ADD COLUMN IF NOT EXISTS officer_notified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.camera_events ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- road_conditions
ALTER TABLE public.road_conditions ADD COLUMN IF NOT EXISTS from_location TEXT;
ALTER TABLE public.road_conditions ADD COLUMN IF NOT EXISTS to_location TEXT;
ALTER TABLE public.road_conditions ADD COLUMN IF NOT EXISTS road_name TEXT;
ALTER TABLE public.road_conditions ADD COLUMN IF NOT EXISTS county_code TEXT;
ALTER TABLE public.road_conditions ADD COLUMN IF NOT EXISTS reported_by_type TEXT DEFAULT 'officer' CHECK (reported_by_type IN ('officer','citizen','system','camera'));

-- push_subscriptions
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS device_type TEXT;
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- report_history
ALTER TABLE public.report_history ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.report_history ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE public.report_history ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}';

-- sync_queue
ALTER TABLE public.sync_queue ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.sync_queue ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

-- officers_assignments
ALTER TABLE public.officer_assignments ADD COLUMN IF NOT EXISTS county_code TEXT;

-- prediction_results
ALTER TABLE public.prediction_results ADD COLUMN IF NOT EXISTS from_location TEXT;
ALTER TABLE public.prediction_results ADD COLUMN IF NOT EXISTS to_location TEXT;
ALTER TABLE public.prediction_results ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ;
ALTER TABLE public.prediction_results ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;

-- ai_analyses
ALTER TABLE public.ai_analyses ADD COLUMN IF NOT EXISTS vehicle_make TEXT;
ALTER TABLE public.ai_analyses ADD COLUMN IF NOT EXISTS vehicle_model TEXT;

-- patrol_units
ALTER TABLE public.patrol_units ADD COLUMN IF NOT EXISTS county_code TEXT;

-- high_risk_roads
ALTER TABLE public.high_risk_roads ADD COLUMN IF NOT EXISTS county_code TEXT;

-- evidence_custody
ALTER TABLE public.evidence_custody ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.evidence_custody ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.evidence_custody ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';

-- evidence_versions
ALTER TABLE public.evidence_versions ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE public.evidence_versions ADD COLUMN IF NOT EXISTS processing_params JSONB DEFAULT '{}';

-- storage_files
ALTER TABLE public.storage_files ADD COLUMN IF NOT EXISTS is_signed_url BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.storage_files ADD COLUMN IF NOT EXISTS signed_url TEXT;
ALTER TABLE public.storage_files ADD COLUMN IF NOT EXISTS signed_url_expires_at TIMESTAMPTZ;

-- traffic_violations (if exists)
ALTER TABLE public.traffic_violations ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other';
ALTER TABLE public.traffic_violations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.traffic_violations ADD COLUMN IF NOT EXISTS fine_amount NUMERIC(10,2);
ALTER TABLE public.traffic_violations ADD COLUMN IF NOT EXISTS points INTEGER;

-- incident_logs (if exists)
ALTER TABLE public.incident_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
