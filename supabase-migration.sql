-- =====================================================
-- TrafficWatch AI - Supabase Database Migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- 1. Create custom enums (if using PostgreSQL < 14, skip and use text + check constraints)
CREATE TYPE user_role AS ENUM ('officer', 'supervisor', 'admin', 'investigator');
CREATE TYPE incident_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'resolved');
CREATE TYPE violation_severity AS ENUM ('minor', 'moderate', 'serious', 'critical');
CREATE TYPE evidence_type AS ENUM ('photo', 'video', 'document', 'audio', 'other');
CREATE TYPE analysis_status AS ENUM ('pending', 'queued', 'processing', 'completed', 'failed');
CREATE TYPE ai_provider AS ENUM ('vly', 'gemini', 'openai', 'custom');
CREATE TYPE stolen_status AS ENUM ('active', 'recovered', 'closed');

-- =====================================================
-- PROFILES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'officer',
  badge_number  TEXT NOT NULL,
  station       TEXT NOT NULL DEFAULT '',
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- VIOLATION TYPES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.violation_types (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  fine_amount     NUMERIC(10,2),
  penalty_points  INTEGER,
  severity        violation_severity NOT NULL DEFAULT 'moderate',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.violation_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read violation types"
  ON public.violation_types FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage violation types"
  ON public.violation_types FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- INCIDENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.incidents (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  violation_type_id    UUID REFERENCES public.violation_types(id),
  title                TEXT NOT NULL,
  description          TEXT,
  location_lat         DOUBLE PRECISION,
  location_lng         DOUBLE PRECISION,
  location_address     TEXT,
  vehicle_plate        TEXT,
  vehicle_plate_confirmed BOOLEAN DEFAULT false,
  vehicle_type         TEXT,
  vehicle_color        TEXT,
  severity             violation_severity NOT NULL DEFAULT 'moderate',
  status               incident_status NOT NULL DEFAULT 'draft',
  is_synced            BOOLEAN NOT NULL DEFAULT false,
  officer_notes        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_incidents_officer ON public.incidents(officer_id);
CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incidents_severity ON public.incidents(severity);
CREATE INDEX idx_incidents_plate ON public.incidents(vehicle_plate);
CREATE INDEX idx_incidents_created ON public.incidents(created_at DESC);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers can CRUD own incidents"
  ON public.incidents FOR ALL
  USING (officer_id = auth.uid());

CREATE POLICY "Supervisors can read all incidents"
  ON public.incidents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin', 'investigator'))
  );

CREATE POLICY "Admins can update any incident"
  ON public.incidents FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- EVIDENCE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.evidence (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id           UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  type                  evidence_type NOT NULL DEFAULT 'photo',
  file_url              TEXT,
  file_path             TEXT,
  description           TEXT,
  file_size             BIGINT,
  mime_type             TEXT,
  is_offline_capture    BOOLEAN NOT NULL DEFAULT false,
  ai_analysis_requested BOOLEAN NOT NULL DEFAULT false,
  ai_analysis_completed BOOLEAN NOT NULL DEFAULT false,
  uploaded_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_evidence_incident ON public.evidence(incident_id);

ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers can manage evidence for their incidents"
  ON public.evidence FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.incidents WHERE id = evidence.incident_id AND officer_id = auth.uid())
  );

CREATE POLICY "Supervisors can read all evidence"
  ON public.evidence FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin', 'investigator'))
  );

-- =====================================================
-- AI ANALYSES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id             UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  evidence_id             UUID REFERENCES public.evidence(id) ON DELETE SET NULL,
  provider_id             ai_provider NOT NULL DEFAULT 'vly',
  status                  analysis_status NOT NULL DEFAULT 'pending',
  error_message           TEXT,
  violation_type          TEXT NOT NULL DEFAULT 'unknown',
  confidence_score        DOUBLE PRECISION NOT NULL DEFAULT 0,
  detection_timestamp     TIMESTAMPTZ,
  vehicle_description     TEXT,
  vehicle_type            TEXT,
  vehicle_make            TEXT,
  vehicle_model           TEXT,
  vehicle_color           TEXT,
  license_plate           TEXT,
  license_plate_confidence DOUBLE PRECISION,
  detected_objects        JSONB DEFAULT '[]'::jsonb,
  violations              JSONB DEFAULT '[]'::jsonb,
  ai_summary              TEXT,
  severity                TEXT,
  processing_time_ms      INTEGER,
  recommended_review      BOOLEAN NOT NULL DEFAULT true,
  is_confirmed            BOOLEAN DEFAULT false,
  reviewed_by             UUID REFERENCES public.profiles(id),
  reviewed_at             TIMESTAMPTZ,
  officer_notes           TEXT,
  raw_provider_output     JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_analyses_incident ON public.ai_analyses(incident_id);
CREATE INDEX idx_ai_analyses_status ON public.ai_analyses(status);

ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read analyses for accessible incidents"
  ON public.ai_analyses FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.incidents WHERE id = ai_analyses.incident_id AND (officer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin', 'investigator'))))
  );

CREATE POLICY "Officers can insert analyses"
  ON public.ai_analyses FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authorized users can update analyses"
  ON public.ai_analyses FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer', 'supervisor', 'admin', 'investigator'))
  );

-- =====================================================
-- AI ANALYSIS JOBS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_analysis_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id     UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  evidence_ids    UUID[] DEFAULT '{}',
  provider_id     ai_provider NOT NULL DEFAULT 'vly',
  priority        TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status          analysis_status NOT NULL DEFAULT 'pending',
  error_message   TEXT,
  result_id       UUID,
  retry_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_jobs_incident ON public.ai_analysis_jobs(incident_id);
CREATE INDEX idx_ai_jobs_status ON public.ai_analysis_jobs(status);

ALTER TABLE public.ai_analysis_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read jobs for accessible incidents"
  ON public.ai_analysis_jobs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.incidents WHERE id = ai_analysis_jobs.incident_id AND (officer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin', 'investigator'))))
  );

CREATE POLICY "Users can create jobs"
  ON public.ai_analysis_jobs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- ANPR SCANS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.anpr_scans (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id             UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  plate_text              TEXT NOT NULL,
  normalized_plate        TEXT NOT NULL,
  plate_confidence        DOUBLE PRECISION NOT NULL DEFAULT 0,
  officer_verified        BOOLEAN NOT NULL DEFAULT false,
  officer_corrected_text  TEXT,
  vehicle_type            TEXT,
  vehicle_color           TEXT,
  bounding_box            JSONB,
  scanned_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  officer_id              UUID NOT NULL REFERENCES public.profiles(id)
);

CREATE INDEX idx_anpr_plate ON public.anpr_scans(normalized_plate);
CREATE INDEX idx_anpr_incident ON public.anpr_scans(incident_id);
CREATE INDEX idx_anpr_officer ON public.anpr_scans(officer_id);

ALTER TABLE public.anpr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read ANPR scans for accessible incidents"
  ON public.anpr_scans FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.incidents WHERE id = anpr_scans.incident_id AND (officer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin', 'investigator'))))
  );

CREATE POLICY "Officers can insert ANPR scans"
  ON public.anpr_scans FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Officers can update their own scans"
  ON public.anpr_scans FOR UPDATE
  USING (officer_id = auth.uid());

-- =====================================================
-- STOLEN VEHICLES (Authorized database only)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.stolen_vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number    TEXT NOT NULL,
  make            TEXT,
  model           TEXT,
  color           TEXT,
  year            INTEGER,
  vin             TEXT,
  reported_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  reported_by     UUID NOT NULL REFERENCES public.profiles(id),
  status          stolen_status NOT NULL DEFAULT 'active',
  jurisdiction    TEXT NOT NULL DEFAULT '',
  case_number     TEXT NOT NULL,
  owner_name      TEXT,
  owner_contact   TEXT,
  notes           TEXT,
  recovered_at    TIMESTAMPTZ,
  recovered_by    UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stolen_plate ON public.stolen_vehicles(plate_number);
CREATE INDEX idx_stolen_status ON public.stolen_vehicles(status);

ALTER TABLE public.stolen_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized officers can read stolen vehicle records"
  ON public.stolen_vehicles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer', 'supervisor', 'admin', 'investigator'))
  );

CREATE POLICY "Admins can manage stolen vehicle records"
  ON public.stolen_vehicles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- SYNC QUEUE (for offline sync tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sync_queue (
  id              BIGSERIAL PRIMARY KEY,
  table_name      TEXT NOT NULL,
  record_id       TEXT NOT NULL,
  operation       TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  payload         JSONB,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'completed', 'failed')),
  error_message   TEXT,
  retry_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sync_status ON public.sync_queue(status);
CREATE INDEX idx_sync_created ON public.sync_queue(created_at);

ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage sync queue"
  ON public.sync_queue FOR ALL
  USING (auth.role() = 'authenticated');

-- =====================================================
-- TRIGGER: Auto-update updated_at columns
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_jobs_updated_at
  BEFORE UPDATE ON public.ai_analysis_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stolen_vehicles_updated_at
  BEFORE UPDATE ON public.stolen_vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_queue_updated_at
  BEFORE UPDATE ON public.sync_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA: Violation Types
-- =====================================================
INSERT INTO public.violation_types (code, name, description, fine_amount, penalty_points, severity) VALUES
  ('SPEEDING', 'Speeding', 'Exceeding the posted speed limit', 150.00, 3, 'serious'),
  ('RED_LIGHT', 'Running Red Light', 'Failing to stop at a red traffic signal', 200.00, 4, 'critical'),
  ('ILLEGAL_PARKING', 'Illegal Parking', 'Parking in a restricted or prohibited zone', 50.00, 1, 'minor'),
  ('WRONG_WAY', 'Driving Against Traffic', 'Operating a vehicle in the wrong direction of traffic', 250.00, 5, 'critical'),
  ('DANGEROUS_OVERTAKING', 'Dangerous Overtaking', 'Overtaking in an unsafe manner or location', 180.00, 3, 'serious'),
  ('RECKLESS_DRIVING', 'Reckless Driving', 'Operating a vehicle with willful disregard for safety', 500.00, 6, 'critical'),
  ('ILLEGAL_UTURN', 'Illegal U-Turn', 'Making a U-turn in a prohibited area', 100.00, 2, 'moderate'),
  ('MOBILE_PHONE', 'Mobile Phone Use While Driving', 'Using a handheld mobile device while driving', 75.00, 2, 'moderate'),
  ('NO_SEAT_BELT', 'Failure to Wear Seat Belt', 'Driver or passenger not wearing a seat belt', 50.00, 1, 'moderate'),
  ('NO_HELMET', 'Motorcycle Without Helmet', 'Motorcycle rider or passenger without a helmet', 75.00, 2, 'moderate'),
  ('OVERLOADED', 'Overloaded Vehicle', 'Vehicle carrying load exceeding legal limits', 200.00, 3, 'serious'),
  ('BLOCKING_EMERGENCY', 'Blocking Emergency Route', 'Obstructing an emergency vehicle or route', 300.00, 5, 'critical'),
  ('EXPIRED_LICENSE', 'Expired License', 'Operating a vehicle with an expired driver''s license', 100.00, 2, 'moderate'),
  ('EXPIRED_REGISTRATION', 'Expired Registration', 'Operating a vehicle with expired registration', 75.00, 1, 'minor'),
  ('CUSTOM', 'Custom Violation', 'Other traffic violation not listed above', NULL, NULL, 'moderate')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get incidents with AI analysis status
CREATE OR REPLACE FUNCTION get_incident_with_analysis(p_incident_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'incident', row_to_json(i.*),
    'evidence', (SELECT jsonb_agg(row_to_json(e.*)) FROM public.evidence e WHERE e.incident_id = i.id),
    'ai_analyses', (SELECT jsonb_agg(row_to_json(a.*)) FROM public.ai_analyses a WHERE a.incident_id = i.id)
  )
  INTO result
  FROM public.incidents i
  WHERE i.id = p_incident_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search ANPR scans by plate
CREATE OR REPLACE FUNCTION search_anpr_by_plate(p_plate_text TEXT, p_limit INTEGER DEFAULT 20)
RETURNS SETOF public.anpr_scans AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.anpr_scans
  WHERE normalized_plate ILIKE '%' || p_plate_text || '%'
  ORDER BY scanned_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
