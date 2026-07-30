-- ============================================================
-- TrafficWatch AI — Missing Columns Fix (v2)
-- ============================================================
-- Run this BEFORE 00001_init.sql if you already have tables from
-- earlier individual migrations (v1-v20).
-- This adds columns that may be missing in existing tables.
-- Each ALTER is wrapped in a DO block so it skips tables that
-- haven't been created yet.
-- ============================================================

-- vehicle_owners
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='vehicle_owners') THEN
  ALTER TABLE public.vehicle_owners ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT true;
  ALTER TABLE public.vehicle_owners ADD COLUMN IF NOT EXISTS ownership_from TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE public.vehicle_owners ADD COLUMN IF NOT EXISTS ownership_to TIMESTAMPTZ;
END IF; END $$;

-- profiles
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='profiles') THEN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS county_code TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reporting_officer_id UUID;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS division TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_count INTEGER NOT NULL DEFAULT 0;
END IF; END $$;

-- incidents
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='incidents') THEN
  ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS county_code TEXT;
  ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS vehicle_plate_confirmed BOOLEAN DEFAULT false;
END IF; END $$;

-- evidence
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='evidence') THEN
  ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS evidence_status TEXT NOT NULL DEFAULT 'original' CHECK (evidence_status IN ('original','processed','reviewed','archived','expunged'));
  ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS original_file_url TEXT;
  ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS original_file_hash TEXT;
  ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'officer_upload';
END IF; END $$;

-- citizen_reports
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='citizen_reports') THEN
  ALTER TABLE public.citizen_reports ADD COLUMN IF NOT EXISTS evidence_data JSONB DEFAULT '[]';
  ALTER TABLE public.citizen_reports ADD COLUMN IF NOT EXISTS location_county TEXT;
  ALTER TABLE public.citizen_reports ADD COLUMN IF NOT EXISTS reporter_email TEXT;
  ALTER TABLE public.citizen_reports ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
END IF; END $$;

-- stolen_vehicles
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='stolen_vehicles') THEN
  ALTER TABLE public.stolen_vehicles ADD COLUMN IF NOT EXISTS jurisdiction TEXT NOT NULL DEFAULT '';
  ALTER TABLE public.stolen_vehicles ADD COLUMN IF NOT EXISTS case_number TEXT NOT NULL DEFAULT '';
  ALTER TABLE public.stolen_vehicles ADD COLUMN IF NOT EXISTS owner_name TEXT;
  ALTER TABLE public.stolen_vehicles ADD COLUMN IF NOT EXISTS owner_contact TEXT;
END IF; END $$;

-- notification_preferences
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='notification_preferences') THEN
  ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS min_priority TEXT NOT NULL DEFAULT 'normal' CHECK (min_priority IN ('low','normal','high','urgent'));
  ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS channel_sms BOOLEAN NOT NULL DEFAULT false;
END IF; END $$;

-- officer_notifications
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='officer_notifications') THEN
  ALTER TABLE public.officer_notifications ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE public.officer_notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
  ALTER TABLE public.officer_notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
  ALTER TABLE public.officer_notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
END IF; END $$;

-- traffic_cameras
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='traffic_cameras') THEN
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
END IF; END $$;

-- camera_events
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='camera_events') THEN
  ALTER TABLE public.camera_events ADD COLUMN IF NOT EXISTS media_url TEXT;
  ALTER TABLE public.camera_events ADD COLUMN IF NOT EXISTS detected_plate TEXT;
  ALTER TABLE public.camera_events ADD COLUMN IF NOT EXISTS detected_speed REAL;
  ALTER TABLE public.camera_events ADD COLUMN IF NOT EXISTS evidence_id UUID;
  ALTER TABLE public.camera_events ADD COLUMN IF NOT EXISTS officer_notified BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE public.camera_events ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;
END IF; END $$;

-- road_conditions
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='road_conditions') THEN
  ALTER TABLE public.road_conditions ADD COLUMN IF NOT EXISTS from_location TEXT;
  ALTER TABLE public.road_conditions ADD COLUMN IF NOT EXISTS to_location TEXT;
  ALTER TABLE public.road_conditions ADD COLUMN IF NOT EXISTS road_name TEXT;
  ALTER TABLE public.road_conditions ADD COLUMN IF NOT EXISTS county_code TEXT;
  ALTER TABLE public.road_conditions ADD COLUMN IF NOT EXISTS reported_by_type TEXT DEFAULT 'officer' CHECK (reported_by_type IN ('officer','citizen','system','camera'));
END IF; END $$;

-- push_subscriptions
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='push_subscriptions') THEN
  ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS device_type TEXT;
  ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS user_agent TEXT;
END IF; END $$;

-- audit_logs
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs') THEN
  ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
  ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
END IF; END $$;

-- report_history
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='report_history') THEN
  ALTER TABLE public.report_history ADD COLUMN IF NOT EXISTS file_url TEXT;
  ALTER TABLE public.report_history ADD COLUMN IF NOT EXISTS file_size BIGINT;
  ALTER TABLE public.report_history ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}';
END IF; END $$;

-- sync_queue
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='sync_queue') THEN
  ALTER TABLE public.sync_queue ADD COLUMN IF NOT EXISTS error_message TEXT;
  ALTER TABLE public.sync_queue ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
END IF; END $$;

-- officer_assignments
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='officer_assignments') THEN
  ALTER TABLE public.officer_assignments ADD COLUMN IF NOT EXISTS county_code TEXT;
END IF; END $$;

-- prediction_results
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='prediction_results') THEN
  ALTER TABLE public.prediction_results ADD COLUMN IF NOT EXISTS from_location TEXT;
  ALTER TABLE public.prediction_results ADD COLUMN IF NOT EXISTS to_location TEXT;
  ALTER TABLE public.prediction_results ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ;
  ALTER TABLE public.prediction_results ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
END IF; END $$;

-- ai_analyses
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='ai_analyses') THEN
  ALTER TABLE public.ai_analyses ADD COLUMN IF NOT EXISTS vehicle_make TEXT;
  ALTER TABLE public.ai_analyses ADD COLUMN IF NOT EXISTS vehicle_model TEXT;
END IF; END $$;

-- patrol_units
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='patrol_units') THEN
  ALTER TABLE public.patrol_units ADD COLUMN IF NOT EXISTS county_code TEXT;
END IF; END $$;

-- high_risk_roads
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='high_risk_roads') THEN
  ALTER TABLE public.high_risk_roads ADD COLUMN IF NOT EXISTS county_code TEXT;
END IF; END $$;

-- evidence_custody
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='evidence_custody') THEN
  ALTER TABLE public.evidence_custody ADD COLUMN IF NOT EXISTS ip_address TEXT;
  ALTER TABLE public.evidence_custody ADD COLUMN IF NOT EXISTS user_agent TEXT;
  ALTER TABLE public.evidence_custody ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
END IF; END $$;

-- evidence_versions
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='evidence_versions') THEN
  ALTER TABLE public.evidence_versions ADD COLUMN IF NOT EXISTS mime_type TEXT;
  ALTER TABLE public.evidence_versions ADD COLUMN IF NOT EXISTS processing_params JSONB DEFAULT '{}';
END IF; END $$;

-- storage_files
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='storage_files') THEN
  ALTER TABLE public.storage_files ADD COLUMN IF NOT EXISTS is_signed_url BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE public.storage_files ADD COLUMN IF NOT EXISTS signed_url TEXT;
  ALTER TABLE public.storage_files ADD COLUMN IF NOT EXISTS signed_url_expires_at TIMESTAMPTZ;
END IF; END $$;

-- traffic_violations
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='traffic_violations') THEN
  ALTER TABLE public.traffic_violations ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other';
  ALTER TABLE public.traffic_violations ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE public.traffic_violations ADD COLUMN IF NOT EXISTS fine_amount NUMERIC(10,2);
  ALTER TABLE public.traffic_violations ADD COLUMN IF NOT EXISTS points INTEGER;
END IF; END $$;

-- incident_logs
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='incident_logs') THEN
  ALTER TABLE public.incident_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
END IF; END $$;
