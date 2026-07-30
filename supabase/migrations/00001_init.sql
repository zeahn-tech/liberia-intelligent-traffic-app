-- ============================================================
-- TrafficWatch AI — Core Database Schema
-- ============================================================
-- Run order: 00001_init.sql → 00002_functions.sql → 00003_camera_entities.sql
-- Seed data: supabase/seed/*.sql (optional)
-- ============================================================

-- 1. CUSTOM ENUM TYPES
DO $$ BEGIN CREATE TYPE public.user_role AS ENUM ('system_administrator','national_commissioner','regional_commander','traffic_commander','police_supervisor','traffic_officer','investigator','evidence_officer','system_auditor','citizen'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.incident_status AS ENUM ('draft','submitted','under_review','assigned','investigating','escalated','confirmed','resolved','closed','rejected','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.violation_severity AS ENUM ('minor','moderate','serious','critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.evidence_type AS ENUM ('photo','video','document','audio','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.analysis_status AS ENUM ('pending','queued','processing','completed','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.ai_provider AS ENUM ('vly','gemini','openai','custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.stolen_status AS ENUM ('active','recovered','closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, email TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL DEFAULT '', role public.user_role NOT NULL DEFAULT 'traffic_officer', badge_number TEXT NOT NULL DEFAULT '', station TEXT NOT NULL DEFAULT '', phone TEXT, avatar_url TEXT, is_active BOOLEAN NOT NULL DEFAULT true, mfa_enabled BOOLEAN NOT NULL DEFAULT false, password_changed_at TIMESTAMPTZ, last_login_at TIMESTAMPTZ, login_count INTEGER NOT NULL DEFAULT 0, department TEXT, division TEXT, county_code TEXT, reporting_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_badge ON public.profiles(badge_number);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_county ON public.profiles(county_code);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. ROLES
CREATE TABLE IF NOT EXISTS public.roles (name public.user_role PRIMARY KEY, label TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', hierarchy_level INTEGER NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 4. VIOLATION TYPES
CREATE TABLE IF NOT EXISTS public.violation_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT, fine_amount NUMERIC(10,2), penalty_points INTEGER, severity public.violation_severity NOT NULL DEFAULT 'moderate', is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_violation_types_code ON public.violation_types(code);
CREATE INDEX IF NOT EXISTS idx_violation_types_severity ON public.violation_types(severity);
ALTER TABLE public.violation_types ENABLE ROW LEVEL SECURITY;

-- 5. VEHICLES
CREATE TABLE IF NOT EXISTS public.vehicles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), license_plate TEXT NOT NULL UNIQUE, vehicle_type TEXT, vehicle_make TEXT, vehicle_model TEXT, vehicle_year INTEGER, vehicle_color TEXT, vin TEXT, engine_number TEXT, registration_date TIMESTAMPTZ, registration_center TEXT, owner_name TEXT, owner_phone TEXT, owner_address TEXT, is_stolen BOOLEAN NOT NULL DEFAULT false, is_wanted BOOLEAN NOT NULL DEFAULT false, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON public.vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON public.vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_make ON public.vehicles(vehicle_make);
CREATE INDEX IF NOT EXISTS idx_vehicles_stolen ON public.vehicles(is_stolen);
CREATE INDEX IF NOT EXISTS idx_vehicles_wanted ON public.vehicles(is_wanted);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- 6. DRIVERS
CREATE TABLE IF NOT EXISTS public.drivers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), full_name TEXT NOT NULL, driver_license_number TEXT NOT NULL UNIQUE, driver_license_class TEXT, driver_license_expiry DATE, date_of_birth DATE, address TEXT, phone TEXT, email TEXT, photo_url TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_drivers_license ON public.drivers(driver_license_number);
CREATE INDEX IF NOT EXISTS idx_drivers_phone ON public.drivers(phone);
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- 7. VEHICLE OWNERS
CREATE TABLE IF NOT EXISTS public.vehicle_owners (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE, owner_name TEXT NOT NULL, owner_type TEXT NOT NULL DEFAULT 'individual' CHECK (owner_type IN ('individual','company','government','other')), id_type TEXT, id_number TEXT, phone TEXT, email TEXT, address TEXT, is_current BOOLEAN NOT NULL DEFAULT true, ownership_from TIMESTAMPTZ NOT NULL DEFAULT now(), ownership_to TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
-- Add columns if table already exists from earlier migration
ALTER TABLE public.vehicle_owners ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.vehicle_owners ADD COLUMN IF NOT EXISTS ownership_from TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.vehicle_owners ADD COLUMN IF NOT EXISTS ownership_to TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_vehicle_owners_vehicle ON public.vehicle_owners(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_owners_current ON public.vehicle_owners(is_current);
ALTER TABLE public.vehicle_owners ENABLE ROW LEVEL SECURITY;

-- 8. INCIDENTS
CREATE TABLE IF NOT EXISTS public.incidents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), officer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, violation_type_id UUID REFERENCES public.violation_types(id) ON DELETE SET NULL, title TEXT NOT NULL, description TEXT, location_lat DECIMAL(10,7), location_lng DECIMAL(10,7), location_address TEXT, county_code TEXT, vehicle_plate TEXT, vehicle_plate_confirmed BOOLEAN DEFAULT false, vehicle_type TEXT, vehicle_color TEXT, severity public.violation_severity NOT NULL DEFAULT 'moderate', status public.incident_status NOT NULL DEFAULT 'draft', is_synced BOOLEAN NOT NULL DEFAULT true, officer_notes TEXT, assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_incidents_officer ON public.incidents(officer_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_plate ON public.incidents(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_incidents_county ON public.incidents(county_code);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON public.incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_violation ON public.incidents(violation_type_id);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned ON public.incidents(assigned_to);
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- 9. INCIDENT LOGS
CREATE TABLE IF NOT EXISTS public.incident_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE, action TEXT NOT NULL, performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, details JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_incident_logs_incident ON public.incident_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_logs_action ON public.incident_logs(action);
CREATE INDEX IF NOT EXISTS idx_incident_logs_created ON public.incident_logs(created_at DESC);
ALTER TABLE public.incident_logs ENABLE ROW LEVEL SECURITY;

-- 10. INCIDENT VIOLATIONS
CREATE TABLE IF NOT EXISTS public.incident_violations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE, violation_type_id UUID NOT NULL REFERENCES public.violation_types(id) ON DELETE CASCADE, severity public.violation_severity, description TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS idx_incident_violations_unique ON public.incident_violations(incident_id, violation_type_id);
CREATE INDEX IF NOT EXISTS idx_incident_violations_incident ON public.incident_violations(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_violations_type ON public.incident_violations(violation_type_id);
ALTER TABLE public.incident_violations ENABLE ROW LEVEL SECURITY;

-- 11. INCIDENT ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.incident_assignments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE, assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role TEXT NOT NULL CHECK (role IN ('investigator','reviewer','supervisor')), notes TEXT, is_active BOOLEAN NOT NULL DEFAULT true, assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(), unassigned_at TIMESTAMPTZ);
CREATE INDEX IF NOT EXISTS idx_incident_assignments_incident ON public.incident_assignments(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_assignments_user ON public.incident_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_incident_assignments_active ON public.incident_assignments(is_active);
ALTER TABLE public.incident_assignments ENABLE ROW LEVEL SECURITY;

-- 12. INVOLVED PERSONS
CREATE TABLE IF NOT EXISTS public.involved_persons (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE, full_name TEXT NOT NULL, id_type TEXT NOT NULL DEFAULT 'other' CHECK (id_type IN ('drivers_license','national_id','passport','other')), id_number TEXT, address TEXT, phone TEXT, email TEXT, role TEXT NOT NULL CHECK (role IN ('driver','passenger','pedestrian','owner','other')), statement TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_involved_persons_incident ON public.involved_persons(incident_id);
CREATE INDEX IF NOT EXISTS idx_involved_persons_phone ON public.involved_persons(phone);
ALTER TABLE public.involved_persons ENABLE ROW LEVEL SECURITY;

-- 13. WITNESSES
CREATE TABLE IF NOT EXISTS public.witnesses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE, full_name TEXT NOT NULL, phone TEXT, email TEXT, address TEXT, statement TEXT, consent_given BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_witnesses_incident ON public.witnesses(incident_id);
ALTER TABLE public.witnesses ENABLE ROW LEVEL SECURITY;

-- 14. EVIDENCE
CREATE TABLE IF NOT EXISTS public.evidence (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE, type public.evidence_type NOT NULL DEFAULT 'photo', file_url TEXT, file_path TEXT, description TEXT, file_size BIGINT, mime_type TEXT, is_offline_capture BOOLEAN NOT NULL DEFAULT false, ai_analysis_requested BOOLEAN NOT NULL DEFAULT false, ai_analysis_completed BOOLEAN NOT NULL DEFAULT false, officer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, captured_at TIMESTAMPTZ, capture_lat DECIMAL(10,7), capture_lng DECIMAL(10,7), device_info TEXT, sha256_hash TEXT, officer_notes TEXT, evidence_status TEXT NOT NULL DEFAULT 'original' CHECK (evidence_status IN ('original','processed','reviewed','archived','expunged')), original_file_url TEXT, original_file_hash TEXT, source TEXT NOT NULL DEFAULT 'officer_upload', uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_evidence_incident ON public.evidence(incident_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON public.evidence(type);
CREATE INDEX IF NOT EXISTS idx_evidence_officer ON public.evidence(officer_id);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON public.evidence(evidence_status);
CREATE INDEX IF NOT EXISTS idx_evidence_hash ON public.evidence(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_evidence_uploaded ON public.evidence(uploaded_at DESC);
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

-- 15. EVIDENCE CUSTODY
CREATE TABLE IF NOT EXISTS public.evidence_custody (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE, action TEXT NOT NULL CHECK (action IN ('uploaded','viewed','downloaded','analyzed','transferred','reviewed','verified','exported','archived','restored','expunged','hash_verified','officer_notes_added')), performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, from_officer UUID REFERENCES auth.users(id) ON DELETE SET NULL, to_officer UUID REFERENCES auth.users(id) ON DELETE SET NULL, ip_address TEXT, user_agent TEXT, details JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_evidence_custody_evidence ON public.evidence_custody(evidence_id);
CREATE INDEX IF NOT EXISTS idx_evidence_custody_action ON public.evidence_custody(action);
CREATE INDEX IF NOT EXISTS idx_evidence_custody_created ON public.evidence_custody(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_custody_performer ON public.evidence_custody(performed_by);
ALTER TABLE public.evidence_custody ENABLE ROW LEVEL SECURITY;

-- 16. EVIDENCE VERSIONS
CREATE TABLE IF NOT EXISTS public.evidence_versions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE, version_number INTEGER NOT NULL, file_url TEXT NOT NULL, file_size BIGINT, mime_type TEXT, sha256_hash TEXT NOT NULL, processing_type TEXT NOT NULL CHECK (processing_type IN ('original','resized','cropped','compressed','converted','watermarked','redacted','ai_enhanced','export')), processing_params JSONB DEFAULT '{}', created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_evidence_versions_evidence ON public.evidence_versions(evidence_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_versions_version ON public.evidence_versions(evidence_id, version_number);
ALTER TABLE public.evidence_versions ENABLE ROW LEVEL SECURITY;

-- 17. STORAGE FILES
CREATE TABLE IF NOT EXISTS public.storage_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE, bucket_name TEXT NOT NULL, file_path TEXT NOT NULL, original_name TEXT NOT NULL, mime_type TEXT NOT NULL, file_size BIGINT NOT NULL DEFAULT 0, sha256_hash TEXT NOT NULL DEFAULT '', is_signed_url BOOLEAN NOT NULL DEFAULT false, signed_url TEXT, signed_url_expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_storage_files_evidence ON public.storage_files(evidence_id);
CREATE INDEX IF NOT EXISTS idx_storage_files_bucket ON public.storage_files(bucket_name);
ALTER TABLE public.storage_files ENABLE ROW LEVEL SECURITY;

-- 18. AI ANALYSES
CREATE TABLE IF NOT EXISTS public.ai_analyses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE, evidence_id UUID REFERENCES public.evidence(id) ON DELETE SET NULL, provider_id public.ai_provider NOT NULL DEFAULT 'vly', status public.analysis_status NOT NULL DEFAULT 'pending', error_message TEXT, violation_type TEXT NOT NULL DEFAULT 'unknown', confidence_score REAL NOT NULL DEFAULT 0.0 CHECK (confidence_score >=0 AND confidence_score <=1.0), detection_timestamp TIMESTAMPTZ, vehicle_description TEXT, vehicle_type TEXT, vehicle_make TEXT, vehicle_model TEXT, vehicle_color TEXT, license_plate TEXT, license_plate_confidence REAL CHECK (license_plate_confidence IS NULL OR (license_plate_confidence >=0 AND license_plate_confidence <=1.0)), detected_objects JSONB DEFAULT '[]', violations JSONB DEFAULT '[]', ai_summary TEXT, severity TEXT, processing_time_ms INTEGER, recommended_review BOOLEAN NOT NULL DEFAULT false, is_confirmed BOOLEAN, reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, reviewed_at TIMESTAMPTZ, officer_notes TEXT, raw_provider_output JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_ai_analyses_incident ON public.ai_analyses(incident_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_status ON public.ai_analyses(status);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_provider ON public.ai_analyses(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_confidence ON public.ai_analyses(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_violation ON public.ai_analyses(violation_type);
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

-- 19. AI ANALYSIS JOBS
CREATE TABLE IF NOT EXISTS public.ai_analysis_jobs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE, evidence_ids UUID[] NOT NULL DEFAULT '{}', provider_id public.ai_provider NOT NULL DEFAULT 'vly', priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')), status public.analysis_status NOT NULL DEFAULT 'pending', error_message TEXT, result_id UUID REFERENCES public.ai_analyses(id) ON DELETE SET NULL, retry_count INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_ai_analysis_jobs_incident ON public.ai_analysis_jobs(incident_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_jobs_status ON public.ai_analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_jobs_priority ON public.ai_analysis_jobs(priority);
ALTER TABLE public.ai_analysis_jobs ENABLE ROW LEVEL SECURITY;

-- 20. ANPR SCANS
CREATE TABLE IF NOT EXISTS public.anpr_scans (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE, plate_text TEXT NOT NULL, normalized_plate TEXT NOT NULL DEFAULT '', plate_confidence REAL NOT NULL DEFAULT 0.0 CHECK (plate_confidence >=0 AND plate_confidence <=1.0), officer_verified BOOLEAN NOT NULL DEFAULT false, officer_corrected_text TEXT, vehicle_type TEXT, vehicle_color TEXT, bounding_box JSONB, scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(), officer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_anpr_scans_incident ON public.anpr_scans(incident_id);
CREATE INDEX IF NOT EXISTS idx_anpr_scans_plate ON public.anpr_scans(normalized_plate);
CREATE INDEX IF NOT EXISTS idx_anpr_scans_confidence ON public.anpr_scans(plate_confidence DESC);
CREATE INDEX IF NOT EXISTS idx_anpr_scans_scanned ON public.anpr_scans(scanned_at DESC);
ALTER TABLE public.anpr_scans ENABLE ROW LEVEL SECURITY;

-- 21. STOLEN VEHICLES
CREATE TABLE IF NOT EXISTS public.stolen_vehicles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), plate_number TEXT NOT NULL, make TEXT, model TEXT, color TEXT, year INTEGER, vin TEXT, reported_at TIMESTAMPTZ NOT NULL DEFAULT now(), reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, status public.stolen_status NOT NULL DEFAULT 'active', jurisdiction TEXT NOT NULL DEFAULT '', case_number TEXT NOT NULL DEFAULT '', owner_name TEXT, owner_contact TEXT, notes TEXT, recovered_at TIMESTAMPTZ, recovered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_stolen_vehicles_plate ON public.stolen_vehicles(plate_number);
CREATE INDEX IF NOT EXISTS idx_stolen_vehicles_status ON public.stolen_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_stolen_vehicles_vin ON public.stolen_vehicles(vin);
ALTER TABLE public.stolen_vehicles ENABLE ROW LEVEL SECURITY;

-- 22. CITIZEN REPORTS
CREATE TABLE IF NOT EXISTS public.citizen_reports (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), citizen_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, is_anonymous BOOLEAN NOT NULL DEFAULT false, anonymous_name TEXT, report_type TEXT NOT NULL CHECK (report_type IN ('traffic_violation','accident','road_hazard','police_assistance','general_complaint','other')), violation_type TEXT, description TEXT NOT NULL, location_address TEXT, location_lat DECIMAL(10,7), location_lng DECIMAL(10,7), location_county TEXT, vehicle_plate TEXT, vehicle_type TEXT, vehicle_color TEXT, reporter_name TEXT, reporter_phone TEXT, reporter_email TEXT, has_evidence BOOLEAN NOT NULL DEFAULT false, evidence_count INTEGER NOT NULL DEFAULT 0, evidence_data JSONB DEFAULT '[]', status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','accepted','rejected','converted_to_case','closed')), status_notes TEXT, reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, reviewed_at TIMESTAMPTZ, rejection_reason TEXT, converted_incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL, converted_at TIMESTAMPTZ, reference_number TEXT NOT NULL UNIQUE, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_citizen_reports_status ON public.citizen_reports(status);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_reporter ON public.citizen_reports(citizen_id);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_reference ON public.citizen_reports(reference_number);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_created ON public.citizen_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_plate ON public.citizen_reports(vehicle_plate);
ALTER TABLE public.citizen_reports ENABLE ROW LEVEL SECURITY;

-- 23. OFFICER NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.officer_notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, type TEXT NOT NULL CHECK (type IN ('serious_violation','wanted_vehicle','stolen_vehicle','major_accident','road_closure','incident_escalation','assignment','investigation_update','evidence_update','ai_analysis_complete','system_alert','message')), title TEXT NOT NULL, message TEXT NOT NULL, reference_type TEXT, reference_id TEXT, priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')), is_read BOOLEAN NOT NULL DEFAULT false, is_dismissed BOOLEAN NOT NULL DEFAULT false, action_url TEXT, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), read_at TIMESTAMPTZ);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.officer_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.officer_notifications(user_id, is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.officer_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.officer_notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.officer_notifications(created_at DESC);
ALTER TABLE public.officer_notifications ENABLE ROW LEVEL SECURITY;

-- 24. NOTIFICATION PREFERENCES
CREATE TABLE IF NOT EXISTS public.notification_preferences (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, notification_type TEXT NOT NULL CHECK (notification_type IN ('serious_violation','wanted_vehicle','stolen_vehicle','major_accident','road_closure','incident_escalation','assignment','investigation_update','evidence_update','ai_analysis_complete','system_alert')), channel_in_app BOOLEAN NOT NULL DEFAULT true, channel_push BOOLEAN NOT NULL DEFAULT false, channel_email BOOLEAN NOT NULL DEFAULT false, channel_sms BOOLEAN NOT NULL DEFAULT false, min_priority TEXT NOT NULL DEFAULT 'normal' CHECK (min_priority IN ('low','normal','high','urgent')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_prefs_unique ON public.notification_preferences(user_id, notification_type);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- 25. PUSH SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.push_subscriptions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, endpoint TEXT NOT NULL UNIQUE, p256dh_key TEXT, auth_key TEXT, device_type TEXT, user_agent TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 26. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL DEFAULT 'null', category TEXT NOT NULL DEFAULT 'general', description TEXT, is_public BOOLEAN NOT NULL DEFAULT false, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 27. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), action TEXT NOT NULL, performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, target_type TEXT, target_id TEXT, description TEXT NOT NULL, severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','error','critical')), metadata JSONB DEFAULT '{}', ip_address TEXT, user_agent TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performer ON public.audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 28. REPORT HISTORY
CREATE TABLE IF NOT EXISTS public.report_history (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE, report_type TEXT NOT NULL CHECK (report_type IN ('case_summary','violation_report','evidence_report','investigation_report','analytics_export','custom')), format TEXT NOT NULL CHECK (format IN ('pdf','csv','json')), title TEXT NOT NULL, file_url TEXT, file_size BIGINT, generated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, parameters JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_report_history_incident ON public.report_history(incident_id);
CREATE INDEX IF NOT EXISTS idx_report_history_generator ON public.report_history(generated_by);
CREATE INDEX IF NOT EXISTS idx_report_history_type ON public.report_history(report_type);
CREATE INDEX IF NOT EXISTS idx_report_history_created ON public.report_history(created_at DESC);
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

-- 29. SYNC QUEUE
CREATE TABLE IF NOT EXISTS public.sync_queue (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), table_name TEXT NOT NULL, record_id TEXT NOT NULL, operation TEXT NOT NULL CHECK (operation IN ('create','update','delete')), payload JSONB NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','syncing','completed','failed')), error_message TEXT, retry_count INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON public.sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON public.sync_queue(created_at);
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

-- 30. COUNTIES
CREATE TABLE IF NOT EXISTS public.counties (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, capital TEXT NOT NULL, population INTEGER, area_km2 REAL, center_lat DECIMAL(10,7), center_lng DECIMAL(10,7), police_region TEXT NOT NULL, boundary_geojson JSONB, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_counties_code ON public.counties(code);
CREATE INDEX IF NOT EXISTS idx_counties_region ON public.counties(police_region);
ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;

-- 31. DISTRICTS
CREATE TABLE IF NOT EXISTS public.districts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), county_code TEXT NOT NULL REFERENCES public.counties(code) ON DELETE CASCADE, name TEXT NOT NULL, center_lat DECIMAL(10,7), center_lng DECIMAL(10,7), is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_districts_county ON public.districts(county_code);
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

-- 32. POLICE REGIONS
CREATE TABLE IF NOT EXISTS public.police_regions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, headquarters TEXT NOT NULL, commander TEXT, contact_phone TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.police_regions ENABLE ROW LEVEL SECURITY;

-- 33. POLICE STATIONS
CREATE TABLE IF NOT EXISTS public.police_stations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, county_code TEXT NOT NULL REFERENCES public.counties(code) ON DELETE CASCADE, address TEXT, latitude DECIMAL(10,7) NOT NULL DEFAULT 0, longitude DECIMAL(10,7) NOT NULL DEFAULT 0, phone TEXT, type TEXT NOT NULL DEFAULT 'station' CHECK (type IN ('station','substation','post','hq')), is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_police_stations_county ON public.police_stations(county_code);
CREATE INDEX IF NOT EXISTS idx_police_stations_type ON public.police_stations(type);
ALTER TABLE public.police_stations ENABLE ROW LEVEL SECURITY;

-- 34. ROADS
CREATE TABLE IF NOT EXISTS public.roads (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, road_number TEXT, road_type TEXT CHECK (road_type IN ('highway','primary','secondary','tertiary')), from_location TEXT, to_location TEXT, length_km REAL, counties TEXT[] NOT NULL DEFAULT '{}', route_geojson JSONB, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_roads_name ON public.roads(name);
CREATE INDEX IF NOT EXISTS idx_roads_counties ON public.roads USING GIN(counties);
ALTER TABLE public.roads ENABLE ROW LEVEL SECURITY;

-- 35. CHECKPOINTS
CREATE TABLE IF NOT EXISTS public.checkpoints (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, county_code TEXT NOT NULL REFERENCES public.counties(code) ON DELETE CASCADE, road_name TEXT, latitude DECIMAL(10,7) NOT NULL DEFAULT 0, longitude DECIMAL(10,7) NOT NULL DEFAULT 0, is_permanent BOOLEAN NOT NULL DEFAULT false, hours TEXT, unit TEXT, phone TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_checkpoints_county ON public.checkpoints(county_code);
CREATE INDEX IF NOT EXISTS idx_checkpoints_active ON public.checkpoints(is_active);
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;

-- 36. PREDICTION MODELS
CREATE TABLE IF NOT EXISTS public.prediction_models (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', version TEXT NOT NULL DEFAULT '1.0.0', category TEXT NOT NULL CHECK (category IN ('road_risk','hotspot_prediction','accident_risk','congestion_forecast','offender_risk','volume_forecast')), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','training','deprecated','error')), accuracy REAL NOT NULL DEFAULT 0.0 CHECK (accuracy >=0 AND accuracy <=100), parameters JSONB NOT NULL DEFAULT '{}', data_requirements TEXT[] NOT NULL DEFAULT '{}', last_trained_at TIMESTAMPTZ, next_training_due TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_prediction_models_category ON public.prediction_models(category);
CREATE INDEX IF NOT EXISTS idx_prediction_models_status ON public.prediction_models(status);
ALTER TABLE public.prediction_models ENABLE ROW LEVEL SECURITY;

-- 37. PREDICTION RESULTS
CREATE TABLE IF NOT EXISTS public.prediction_results (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), model_id UUID NOT NULL REFERENCES public.prediction_models(id) ON DELETE CASCADE, prediction_type TEXT NOT NULL, title TEXT NOT NULL, description TEXT, confidence REAL NOT NULL DEFAULT 0.0 CHECK (confidence >=0 AND confidence <=100), risk_level TEXT NOT NULL DEFAULT 'moderate' CHECK (risk_level IN ('low','moderate','high')), severity TEXT CHECK (severity IN ('low','moderate','high')), location_name TEXT, location_address TEXT, location_lat DECIMAL(10,7), location_lng DECIMAL(10,7), county_code TEXT, district_name TEXT, road_name TEXT, from_location TEXT, to_location TEXT, predicted_at TIMESTAMPTZ NOT NULL DEFAULT now(), valid_from TIMESTAMPTZ, valid_until TIMESTAMPTZ, factors TEXT[] NOT NULL DEFAULT '{}', data_sources TEXT[] NOT NULL DEFAULT '{}', metadata JSONB NOT NULL DEFAULT '{}', model_version TEXT NOT NULL DEFAULT '1.0.0', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT prediction_disclaimer CHECK (true));
CREATE INDEX IF NOT EXISTS idx_prediction_results_model ON public.prediction_results(model_id);
CREATE INDEX IF NOT EXISTS idx_prediction_results_type ON public.prediction_results(prediction_type);
CREATE INDEX IF NOT EXISTS idx_prediction_results_risk ON public.prediction_results(risk_level);
CREATE INDEX IF NOT EXISTS idx_prediction_results_county ON public.prediction_results(county_code);
CREATE INDEX IF NOT EXISTS idx_prediction_results_predicted ON public.prediction_results(predicted_at DESC);
ALTER TABLE public.prediction_results ENABLE ROW LEVEL SECURITY;

-- 38. VIOLATION HOTSPOTS
CREATE TABLE IF NOT EXISTS public.violation_hotspots (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), location_name TEXT NOT NULL, location_address TEXT, location_lat DECIMAL(10,7), location_lng DECIMAL(10,7), county_code TEXT, violation_type TEXT NOT NULL, incident_count INTEGER NOT NULL DEFAULT 0, severity_level TEXT CHECK (severity_level IN ('low','moderate','high','critical')), avg_confidence REAL, first_detected TIMESTAMPTZ, last_detected TIMESTAMPTZ, is_active BOOLEAN NOT NULL DEFAULT true, notes TEXT, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_hotspots_county ON public.violation_hotspots(county_code);
CREATE INDEX IF NOT EXISTS idx_hotspots_type ON public.violation_hotspots(violation_type);
CREATE INDEX IF NOT EXISTS idx_hotspots_severity ON public.violation_hotspots(severity_level);
ALTER TABLE public.violation_hotspots ENABLE ROW LEVEL SECURITY;

-- 39. HIGH RISK ROADS
CREATE TABLE IF NOT EXISTS public.high_risk_roads (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), road_name TEXT NOT NULL, road_type TEXT, county_code TEXT, incident_count INTEGER NOT NULL DEFAULT 0, fatality_count INTEGER NOT NULL DEFAULT 0, injury_count INTEGER NOT NULL DEFAULT 0, risk_score REAL NOT NULL DEFAULT 0.0 CHECK (risk_score >=0 AND risk_score <=100), risk_level TEXT NOT NULL DEFAULT 'moderate' CHECK (risk_level IN ('low','moderate','high','critical')), common_violations TEXT[] DEFAULT '{}', recommendations TEXT, assessed_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_risk_roads_score ON public.high_risk_roads(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_risk_roads_county ON public.high_risk_roads(county_code);
ALTER TABLE public.high_risk_roads ENABLE ROW LEVEL SECURITY;

-- 40. TRAFFIC CAMERAS
CREATE TABLE IF NOT EXISTS public.traffic_cameras (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, installation_type TEXT NOT NULL DEFAULT 'fixed' CHECK (installation_type IN ('fixed','mobile','cctv','highway','speed','red_light','anpr','panoramic','drone','body','dashcam','other')), stream_url TEXT, stream_type TEXT DEFAULT 'hls' CHECK (stream_type IN ('rtsp','hls','webrtc','mjpeg','usb','file','unknown')), latitude DECIMAL(10,7) NOT NULL DEFAULT 0, longitude DECIMAL(10,7) NOT NULL DEFAULT 0, location_address TEXT, county_id TEXT, status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected','connecting','connected','streaming','reconnecting','error','offline')), is_active BOOLEAN NOT NULL DEFAULT true, manufacturer TEXT, model TEXT, orientation TEXT, field_of_view REAL, resolution TEXT, max_fps INTEGER, rtsp_username TEXT, rtsp_password_enc TEXT, metadata JSONB DEFAULT '{}', last_heartbeat TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_traffic_cameras_county ON public.traffic_cameras(county_id);
CREATE INDEX IF NOT EXISTS idx_traffic_cameras_type ON public.traffic_cameras(installation_type);
CREATE INDEX IF NOT EXISTS idx_traffic_cameras_status ON public.traffic_cameras(status);
CREATE INDEX IF NOT EXISTS idx_traffic_cameras_active ON public.traffic_cameras(is_active);
CREATE INDEX IF NOT EXISTS idx_traffic_cameras_location ON public.traffic_cameras(latitude, longitude);
ALTER TABLE public.traffic_cameras ENABLE ROW LEVEL SECURITY;

-- 41. CAMERA EVENTS
CREATE TABLE IF NOT EXISTS public.camera_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), camera_id UUID NOT NULL REFERENCES public.traffic_cameras(id) ON DELETE CASCADE, event_type TEXT NOT NULL CHECK (event_type IN ('vehicle_detected','license_plate_captured','speed_violation','red_light_violation','illegal_turn','pedestrian_detected','obstacle_detected','accident_detected','congestion_detected','camera_offline','camera_online','maintenance_alert')), event_data JSONB DEFAULT '{}', media_url TEXT, detected_plate TEXT, detected_speed REAL, confidence REAL CHECK (confidence IS NULL OR (confidence >=0 AND confidence <=1.0)), location_lat DECIMAL(10,7), location_lng DECIMAL(10,7), incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL, evidence_id UUID REFERENCES public.evidence(id) ON DELETE SET NULL, officer_notified BOOLEAN NOT NULL DEFAULT false, notified_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_camera_events_camera ON public.camera_events(camera_id);
CREATE INDEX IF NOT EXISTS idx_camera_events_type ON public.camera_events(event_type);
CREATE INDEX IF NOT EXISTS idx_camera_events_incident ON public.camera_events(incident_id);
CREATE INDEX IF NOT EXISTS idx_camera_events_created ON public.camera_events(created_at DESC);
ALTER TABLE public.camera_events ENABLE ROW LEVEL SECURITY;

-- 42. ADDITIONAL TABLES
CREATE TABLE IF NOT EXISTS public.traffic_violations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE, violation_type TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'other', description TEXT, fine_amount NUMERIC(10,2), points INTEGER, severity public.violation_severity NOT NULL DEFAULT 'moderate', location_lat DECIMAL(10,7), location_lng DECIMAL(10,7), occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_traffic_violations_incident ON public.traffic_violations(incident_id);
CREATE INDEX IF NOT EXISTS idx_traffic_violations_type ON public.traffic_violations(violation_type);
ALTER TABLE public.traffic_violations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.officer_assignments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), officer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, assignment_type TEXT NOT NULL CHECK (assignment_type IN ('patrol','checkpoint','investigation','special_operation','administrative')), location_lat DECIMAL(10,7), location_lng DECIMAL(10,7), location_address TEXT, county_code TEXT, start_time TIMESTAMPTZ NOT NULL DEFAULT now(), end_time TIMESTAMPTZ, notes TEXT, created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_officer_assignments_officer ON public.officer_assignments(officer_id);
CREATE INDEX IF NOT EXISTS idx_officer_assignments_type ON public.officer_assignments(assignment_type);
ALTER TABLE public.officer_assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.patrol_units (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), unit_name TEXT NOT NULL, unit_type TEXT NOT NULL DEFAULT 'vehicle' CHECK (unit_type IN ('vehicle','motorcycle','foot','bicycle','water','air')), vehicle_plate TEXT, officer_ids UUID[] DEFAULT '{}', current_lat DECIMAL(10,7), current_lng DECIMAL(10,7), status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','on_patrol','responding','at_scene','off_duty','maintenance')), county_code TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_patrol_units_status ON public.patrol_units(status);
CREATE INDEX IF NOT EXISTS idx_patrol_units_county ON public.patrol_units(county_code);
ALTER TABLE public.patrol_units ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.road_conditions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), condition_type TEXT NOT NULL CHECK (condition_type IN ('construction','accident','flooding','road_closure','hazard','congestion','event','other')), severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('minor','moderate','major','critical')), description TEXT NOT NULL, location_lat DECIMAL(10,7), location_lng DECIMAL(10,7), from_location TEXT, to_location TEXT, road_name TEXT, county_code TEXT, reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, reported_by_type TEXT DEFAULT 'officer' CHECK (reported_by_type IN ('officer','citizen','system','camera')), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','confirmed','resolved','expired')), starts_at TIMESTAMPTZ NOT NULL DEFAULT now(), ends_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_road_conditions_type ON public.road_conditions(condition_type);
CREATE INDEX IF NOT EXISTS idx_road_conditions_county ON public.road_conditions(county_code);
CREATE INDEX IF NOT EXISTS idx_road_conditions_status ON public.road_conditions(status);
CREATE INDEX IF NOT EXISTS idx_road_conditions_active ON public.road_conditions(starts_at, ends_at);
ALTER TABLE public.road_conditions ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid()=id OR public.get_current_user_role() IN ('system_administrator','national_commissioner','regional_commander','traffic_commander','police_supervisor','system_auditor'));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid()=id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.get_current_user_role()='system_administrator');
CREATE POLICY "Authenticated users can read violation types" ON public.violation_types FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "Admins and commanders can manage violation types" ON public.violation_types FOR ALL USING (public.get_current_user_role() IN ('system_administrator','traffic_commander'));
CREATE POLICY "Authorized roles can read vehicles" ON public.vehicles FOR SELECT USING (public.get_current_user_role() IN ('system_administrator','national_commissioner','regional_commander','traffic_commander','police_supervisor','traffic_officer','investigator','evidence_officer','system_auditor'));
CREATE POLICY "Officers and investigators can manage vehicles" ON public.vehicles FOR ALL USING (public.get_current_user_role() IN ('system_administrator','traffic_officer','police_supervisor','investigator'));
CREATE POLICY "Officers can read own incidents, supervisors read all" ON public.incidents FOR SELECT USING (auth.uid()=officer_id OR auth.uid()=assigned_to OR public.get_current_user_role() IN ('system_administrator','national_commissioner','regional_commander','traffic_commander','police_supervisor','investigator','system_auditor'));
CREATE POLICY "Officers can create incidents" ON public.incidents FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "Officers can update own incidents" ON public.incidents FOR UPDATE USING (auth.uid()=officer_id OR public.get_current_user_role() IN ('system_administrator','police_supervisor','investigator'));
CREATE POLICY "Only admins can delete incidents" ON public.incidents FOR DELETE USING (public.get_current_user_role()='system_administrator');
CREATE POLICY "Authorized roles can read evidence" ON public.evidence FOR SELECT USING (public.get_current_user_role() IN ('system_administrator','national_commissioner','regional_commander','traffic_commander','police_supervisor','traffic_officer','investigator','evidence_officer','system_auditor'));
CREATE POLICY "Officers and investigators can create evidence" ON public.evidence FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "Evidence officers and investigators can update" ON public.evidence FOR UPDATE USING (public.get_current_user_role() IN ('system_administrator','evidence_officer','investigator','traffic_officer'));
CREATE POLICY "Only admins can delete evidence" ON public.evidence FOR DELETE USING (public.get_current_user_role()='system_administrator');
CREATE POLICY "Citizens can read own reports" ON public.citizen_reports FOR SELECT USING (citizen_id=auth.uid() OR public.get_current_user_role() IN ('system_administrator','national_commissioner','regional_commander','traffic_commander','police_supervisor','investigator','system_auditor'));
CREATE POLICY "Citizens can create reports" ON public.citizen_reports FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "Authorized police can update citizen reports" ON public.citizen_reports FOR UPDATE USING (public.get_current_user_role() IN ('system_administrator','police_supervisor','investigator','traffic_officer'));
CREATE POLICY "Users can read own notifications" ON public.officer_notifications FOR SELECT USING (user_id=auth.uid());
CREATE POLICY "Users can update own notifications" ON public.officer_notifications FOR UPDATE USING (user_id=auth.uid());
CREATE POLICY "Auditors and admins can read audit logs" ON public.audit_logs FOR SELECT USING (public.get_current_user_role() IN ('system_administrator','system_auditor'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "Anyone can read public settings" ON public.system_settings FOR SELECT USING (is_public=true OR public.get_current_user_role() IN ('system_administrator','national_commissioner','traffic_commander'));
CREATE POLICY "Only admins can manage settings" ON public.system_settings FOR ALL USING (public.get_current_user_role()='system_administrator');
CREATE POLICY "Authenticated users can read geography data" ON public.counties FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "Authenticated users can read districts" ON public.districts FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "Authenticated users can read police regions" ON public.police_regions FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "Authenticated users can read police stations" ON public.police_stations FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "Authenticated users can read roads" ON public.roads FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "Authenticated users can read checkpoints" ON public.checkpoints FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "Authorized roles can read traffic cameras" ON public.traffic_cameras FOR SELECT USING (auth.role()='authenticated' AND public.get_current_user_role() IN ('system_administrator','national_commissioner','regional_commander','traffic_commander','police_supervisor','traffic_officer','investigator','system_auditor'));
CREATE POLICY "Admins and commanders can manage cameras" ON public.traffic_cameras FOR ALL USING (public.get_current_user_role() IN ('system_administrator','traffic_commander'));
CREATE POLICY "Authorized roles can read camera events" ON public.camera_events FOR SELECT USING (public.get_current_user_role() IN ('system_administrator','national_commissioner','regional_commander','traffic_commander','police_supervisor','traffic_officer','investigator','system_auditor'));
CREATE POLICY "System can insert camera events" ON public.camera_events FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "Authorized roles can read predictions" ON public.prediction_models FOR SELECT USING (public.get_current_user_role() IN ('system_administrator','regional_commander','traffic_commander','police_supervisor','investigator') OR auth.uid() IS NOT NULL);
CREATE POLICY "Authorized roles can read prediction results" ON public.prediction_results FOR SELECT USING (public.get_current_user_role() IN ('system_administrator','regional_commander','traffic_commander','police_supervisor','investigator') OR auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage prediction models" ON public.prediction_models FOR ALL USING (public.get_current_user_role()='system_administrator');

-- UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_current_user_role() RETURNS public.user_role LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE v_role public.user_role; BEGIN SELECT role INTO v_role FROM public.profiles WHERE id=auth.uid(); RETURN v_role; END; $$;
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN INSERT INTO public.profiles(id,email,full_name,role) VALUES(NEW.id,COALESCE(NEW.email,''),COALESCE(NEW.raw_user_meta_data->>'full_name',''),'traffic_officer') ON CONFLICT(id) DO UPDATE SET email=EXCLUDED.email; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user_notification_prefs() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN INSERT INTO public.notification_preferences(user_id,notification_type) SELECT NEW.id,unnest(ARRAY['serious_violation','wanted_vehicle','stolen_vehicle','major_accident','road_closure','incident_escalation','assignment','investigation_update','evidence_update','ai_analysis_complete','system_alert']); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS on_profile_created_notification_prefs ON public.profiles; CREATE TRIGGER on_profile_created_notification_prefs AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_notification_prefs();
