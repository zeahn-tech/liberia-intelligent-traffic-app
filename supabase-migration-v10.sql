-- =====================================================
-- TrafficWatch AI - v10 Database Migration
-- Citizen Portal
--
-- Citizen reports table, review workflow,
-- road safety notices, anonymous reporting support.
-- =====================================================

-- =====================================================
-- 1. CITIZEN REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.citizen_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_anonymous      BOOLEAN NOT NULL DEFAULT false,
  anonymous_name    TEXT,
  
  -- Report type
  report_type       TEXT NOT NULL CHECK (report_type IN ('traffic_violation', 'accident', 'road_hazard', 'police_assistance', 'general_complaint', 'other')),
  
  -- Incident details
  violation_type    TEXT,
  description       TEXT NOT NULL,
  location_address  TEXT,
  location_lat      DECIMAL(10,7),
  location_lng      DECIMAL(10,7),
  location_county   TEXT,
  
  -- Vehicle info (optional)
  vehicle_plate     TEXT,
  vehicle_type      TEXT,
  vehicle_color     TEXT,
  
  -- Contact (optional if anonymous)
  reporter_name     TEXT,
  reporter_phone    TEXT,
  reporter_email    TEXT,
  
  -- Evidence (stored references)
  has_evidence      BOOLEAN NOT NULL DEFAULT false,
  evidence_count    INTEGER NOT NULL DEFAULT 0,
  evidence_data     JSONB DEFAULT '[]'::jsonb,
  
  -- Status & review workflow
  status            TEXT NOT NULL DEFAULT 'submitted'
                     CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected', 'converted_to_case', 'closed')),
  status_notes      TEXT,
  reviewed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  
  -- Converted to official incident
  converted_incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  converted_at      TIMESTAMPTZ,
  
  -- Tracking
  reference_number  TEXT NOT NULL,
  is_read           BOOLEAN NOT NULL DEFAULT false,
  is_archived       BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_citizen_reports_citizen_id ON public.citizen_reports(citizen_id);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_status ON public.citizen_reports(status);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_created_at ON public.citizen_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_reference ON public.citizen_reports(reference_number);

ALTER TABLE public.citizen_reports ENABLE ROW LEVEL SECURITY;

-- Citizens can view their own reports (or anonymous reports they created)
CREATE POLICY "Citizens view own reports"
  ON public.citizen_reports FOR SELECT
  USING (
    auth.uid() = citizen_id
    OR public.get_current_user_role() IN ('system_administrator', 'national_commissioner', 'regional_commander', 'traffic_commander', 'police_supervisor', 'traffic_officer', 'investigator', 'evidence_officer')
  );

-- Citizens can insert reports
CREATE POLICY "Citizens can create reports"
  ON public.citizen_reports FOR INSERT
  WITH CHECK (
    (auth.uid() = citizen_id AND public.get_current_user_role() = 'citizen')
    OR public.get_current_user_role() IN ('system_administrator', 'national_commissioner', 'regional_commander', 'traffic_commander', 'police_supervisor', 'traffic_officer', 'investigator')
    OR (is_anonymous = true AND citizen_id IS NULL)
  );

-- Police/authorized users can update reports
CREATE POLICY "Authorized users can update reports"
  ON public.citizen_reports FOR UPDATE
  USING (public.get_current_user_role() IN (
    'system_administrator', 'national_commissioner', 'regional_commander',
    'traffic_commander', 'police_supervisor', 'traffic_officer', 'investigator'
  ));

-- Citizens can update their own reports if still submitted
CREATE POLICY "Citizens can update own submitted reports"
  ON public.citizen_reports FOR UPDATE
  USING (auth.uid() = citizen_id AND status = 'submitted');

-- =====================================================
-- 2. REPORT EVIDENCE TABLE (citizen-uploaded)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.citizen_report_evidence (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id         UUID NOT NULL REFERENCES public.citizen_reports(id) ON DELETE CASCADE,
  file_url          TEXT,
  file_path         TEXT,
  file_type         TEXT NOT NULL CHECK (file_type IN ('photo', 'video', 'document', 'audio', 'other')),
  mime_type         TEXT,
  file_size         INTEGER,
  sha256_hash       TEXT,
  description       TEXT,
  uploaded_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_citizen_evidence_report_id ON public.citizen_report_evidence(report_id);

ALTER TABLE public.citizen_report_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Citizens view own evidence"
  ON public.citizen_report_evidence FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.citizen_reports cr WHERE cr.id = report_id AND cr.citizen_id = auth.uid())
    OR public.get_current_user_role() IN ('system_administrator', 'national_commissioner', 'regional_commander', 'traffic_commander', 'police_supervisor', 'traffic_officer', 'investigator', 'evidence_officer')
  );

CREATE POLICY "Citizens can add evidence"
  ON public.citizen_report_evidence FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.citizen_reports cr WHERE cr.id = report_id AND (cr.citizen_id = auth.uid() OR cr.is_anonymous = true))
    OR public.get_current_user_role() IN ('system_administrator', 'national_commissioner', 'regional_commander', 'traffic_commander', 'police_supervisor', 'traffic_officer', 'investigator')
  );

-- =====================================================
-- 3. ROAD SAFETY NOTICES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.road_safety_notices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  content           TEXT NOT NULL,
  notice_type       TEXT NOT NULL CHECK (notice_type IN ('general', 'warning', 'road_closure', 'construction', 'weather', 'accident', 'police_operation', 'public_awareness')),
  severity          TEXT NOT NULL CHECK (severity IN ('info', 'caution', 'warning', 'critical')) DEFAULT 'info',
  county_code       TEXT REFERENCES public.liberia_counties(code) ON DELETE SET NULL,
  location          TEXT,
  latitude          DECIMAL(10,7),
  longitude         DECIMAL(10,7),
  is_published      BOOLEAN NOT NULL DEFAULT false,
  published_at      TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_safety_notices_published ON public.road_safety_notices(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_notices_county ON public.road_safety_notices(county_code);

ALTER TABLE public.road_safety_notices ENABLE ROW LEVEL SECURITY;

-- Everyone can read published notices
CREATE POLICY "Anyone can read published notices"
  ON public.road_safety_notices FOR SELECT
  USING (is_published = true OR public.get_current_user_role() IN (
    'system_administrator', 'national_commissioner', 'regional_commander',
    'traffic_commander', 'police_supervisor', 'traffic_officer'
  ));

-- Authorized roles can manage notices
CREATE POLICY "Authorized roles manage notices"
  ON public.road_safety_notices FOR ALL
  USING (public.get_current_user_role() IN (
    'system_administrator', 'national_commissioner', 'regional_commander',
    'traffic_commander', 'police_supervisor'
  ));

-- =====================================================
-- 4. CITIZEN REPORT COMMENTS (police-to-citizen comms)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.citizen_report_comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id         UUID NOT NULL REFERENCES public.citizen_reports(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_role       TEXT,
  message           TEXT NOT NULL,
  is_from_police    BOOLEAN NOT NULL DEFAULT false,
  is_read           BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_citizen_comments_report ON public.citizen_report_comments(report_id, created_at ASC);

ALTER TABLE public.citizen_report_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments visible to involved parties"
  ON public.citizen_report_comments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.citizen_reports cr WHERE cr.id = report_id AND cr.citizen_id = auth.uid())
    OR public.get_current_user_role() IN ('system_administrator', 'national_commissioner', 'regional_commander', 'traffic_commander', 'police_supervisor', 'traffic_officer', 'investigator')
  );

CREATE POLICY "Authorized users can comment"
  ON public.citizen_report_comments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.citizen_reports cr WHERE cr.id = report_id AND cr.citizen_id = auth.uid())
    OR public.get_current_user_role() IN ('system_administrator', 'national_commissioner', 'regional_commander', 'traffic_commander', 'police_supervisor', 'traffic_officer', 'investigator')
  );

-- =====================================================
-- 5. REFERENCE NUMBER GENERATION
-- =====================================================
CREATE SEQUENCE IF NOT EXISTS public.citizen_report_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_citizen_reference()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  seq_num TEXT;
  year_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  seq_num := LPAD(NEXTVAL('public.citizen_report_seq')::TEXT, 5, '0');
  RETURN 'CR-' || year_part || '-' || seq_num;
END;
$$;

-- =====================================================
-- 6. TRIGGER: auto-set reference number
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_citizen_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := public.generate_citizen_reference();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_citizen_reference ON public.citizen_reports;
CREATE TRIGGER trg_set_citizen_reference
  BEFORE INSERT ON public.citizen_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_citizen_reference();

-- =====================================================
-- 7. FUNCTION: convert citizen report to incident
-- =====================================================
CREATE OR REPLACE FUNCTION public.convert_citizen_report_to_incident(
  p_report_id UUID,
  p_officer_id UUID,
  p_title TEXT DEFAULT NULL,
  p_severity violation_severity DEFAULT 'moderate'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cr public.citizen_reports;
  v_incident_id UUID;
  v_title TEXT;
BEGIN
  -- Get the citizen report
  SELECT * INTO v_cr FROM public.citizen_reports WHERE id = p_report_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Citizen report not found';
  END IF;

  -- Title
  IF p_title IS NULL THEN
    v_title := 'Citizen Report: ' || COALESCE(v_cr.violation_type, v_cr.report_type);
  ELSE
    v_title := p_title;
  END IF;

  -- Create incident
  INSERT INTO public.incidents (
    officer_id,
    title,
    description,
    location_lat,
    location_lng,
    location_address,
    vehicle_plate,
    vehicle_type,
    vehicle_color,
    severity,
    status,
    officer_notes,
    violation_type_id
  ) VALUES (
    p_officer_id,
    v_title,
    v_cr.description,
    v_cr.location_lat,
    v_cr.location_lng,
    v_cr.location_address,
    v_cr.vehicle_plate,
    v_cr.vehicle_type,
    v_cr.vehicle_color,
    p_severity,
    'submitted',
    'Converted from citizen report ' || v_cr.reference_number || E'\n' || COALESCE(v_cr.status_notes, ''),
    (SELECT id FROM public.violation_types WHERE name = v_cr.violation_type LIMIT 1)
  ) RETURNING id INTO v_incident_id;

  -- Update citizen report
  UPDATE public.citizen_reports
  SET status = 'converted_to_case',
      converted_incident_id = v_incident_id,
      converted_at = NOW(),
      reviewed_by = p_officer_id,
      reviewed_at = NOW()
  WHERE id = p_report_id;

  RETURN v_incident_id;
END;
$$;

-- =====================================================
-- 8. FUNCTION: get citizen reports for review
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_pending_citizen_reports()
RETURNS SETOF public.citizen_reports
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF public.get_current_user_role() IN (
    'system_administrator', 'national_commissioner', 'regional_commander',
    'traffic_commander', 'police_supervisor', 'traffic_officer', 'investigator'
  ) THEN
    RETURN QUERY SELECT * FROM public.citizen_reports
      WHERE status IN ('submitted', 'under_review')
      ORDER BY created_at DESC;
  END IF;
  RETURN;
END;
$$;

-- =====================================================
-- 9. SEED ROAD SAFETY NOTICES
-- =====================================================
INSERT INTO public.road_safety_notices (title, content, notice_type, severity, is_published, published_at) VALUES
  ('National Road Safety Alert', 'Exercise caution on all major highways during the rainy season. Road conditions may deteriorate rapidly. Report any hazards immediately.', 'general', 'caution', true, NOW()),
  ('Speed Limit Enforcement', 'Enhanced speed limit enforcement operations are active on the Monrovia to Gbarnga highway. All motorists are advised to observe posted speed limits.', 'police_operation', 'warning', true, NOW()),
  ('Road Construction Warning', 'Road construction ongoing on UN Drive near the Ministerial Complex. Expect delays and follow detour signs.', 'construction', 'caution', true, NOW()),
  ('Motorcycle Helmet Requirement', 'All motorcycle riders and passengers are reminded that helmet use is mandatory by law. Non-compliance will result in fines.', 'public_awareness', 'info', true, NOW()),
  ('Checkpoint Operations', 'Regular police checkpoint operations are being conducted across Montserrado County. Please have your documents ready.', 'police_operation', 'info', true, NOW())
ON CONFLICT DO NOTHING;
