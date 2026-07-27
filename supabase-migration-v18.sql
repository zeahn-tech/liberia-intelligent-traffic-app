-- =====================================================
-- TrafficWatch AI - v18 Database Migration
-- Data Privacy & Retention Architecture
-- =====================================================

-- =====================================================
-- 1. DATA RETENTION POLICIES
-- Configurable per-category retention rules
-- =====================================================
CREATE TABLE IF NOT EXISTS public.retention_policies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_category TEXT NOT NULL CHECK (data_category IN (
    'incidents', 'evidence', 'citizen_reports', 'anpr_scans',
    'ai_analyses', 'audit_logs', 'security_events', 'user_sessions',
    'notifications', 'reports', 'user_profiles'
  )),
  retention_days INTEGER NOT NULL DEFAULT 365,
  archival_strategy TEXT NOT NULL DEFAULT 'soft_delete' CHECK (archival_strategy IN (
    'soft_delete', 'hard_delete', 'anonymize', 'archive'
  )),
  auto_purge_enabled BOOLEAN NOT NULL DEFAULT false,
  requires_review_before_purge BOOLEAN NOT NULL DEFAULT true,
  exempt_critical BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(data_category)
);

-- Default retention policies seeded on creation
INSERT INTO public.retention_policies (data_category, retention_days, archival_strategy, auto_purge_enabled, requires_review_before_purge)
VALUES
  ('incidents', 2555, 'archive', false, true),      -- 7 years
  ('evidence', 2555, 'archive', false, true),        -- 7 years
  ('citizen_reports', 730, 'anonymize', false, true), -- 2 years then anonymize
  ('anpr_scans', 365, 'soft_delete', false, true),   -- 1 year
  ('ai_analyses', 1825, 'soft_delete', false, true), -- 5 years
  ('audit_logs', 1825, 'archive', false, true),      -- 5 years (critical preserved)
  ('security_events', 365, 'soft_delete', false, true), -- 1 year
  ('user_sessions', 90, 'hard_delete', true, false),  -- 90 days auto-purge
  ('notifications', 90, 'hard_delete', true, false),  -- 90 days auto-purge
  ('reports', 2555, 'archive', false, true),          -- 7 years
  ('user_profiles', 7300, 'soft_delete', false, true) -- 20 years after deactivation
ON CONFLICT (data_category) DO NOTHING;

ALTER TABLE public.retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System administrators manage retention policies"
  ON public.retention_policies
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'system_administrator')
  );

-- =====================================================
-- 2. DATA CLASSIFICATION REGISTRY
-- Tracks classification of each table/column containing PII
-- =====================================================
CREATE TABLE IF NOT EXISTS public.data_classification (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name    TEXT NOT NULL,
  column_name   TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN (
    'public', 'internal', 'confidential', 'restricted', 'pii', 'sensitive_pii'
  )),
  description   TEXT,
  masking_rule  TEXT, -- e.g. 'mask_email', 'mask_phone', 'truncate', 'hash'
  retention_category TEXT REFERENCES public.retention_policies(data_category),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(table_name, column_name)
);

ALTER TABLE public.data_classification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized personnel can view data classification"
  ON public.data_classification FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (
      'system_administrator', 'system_auditor', 'national_commissioner'
    ))
  );

-- Seed default data classification for known PII columns
INSERT INTO public.data_classification (table_name, column_name, classification, masking_rule, retention_category) VALUES
  ('profiles', 'full_name', 'pii', 'mask_name', 'user_profiles'),
  ('profiles', 'email', 'pii', 'mask_email', 'user_profiles'),
  ('profiles', 'phone', 'sensitive_pii', 'mask_phone', 'user_profiles'),
  ('profiles', 'badge_number', 'internal', NULL, 'user_profiles'),
  ('profiles', 'station', 'internal', NULL, 'user_profiles'),
  ('incidents', 'vehicle_plate', 'confidential', 'mask_plate', 'incidents'),
  ('incidents', 'location_address', 'internal', NULL, 'incidents'),
  ('incidents', 'officer_notes', 'confidential', NULL, 'incidents'),
  ('evidence', 'description', 'internal', NULL, 'evidence'),
  ('evidence', 'officer_notes', 'confidential', NULL, 'evidence'),
  ('citizen_reports', 'reporter_name', 'pii', 'mask_name', 'citizen_reports'),
  ('citizen_reports', 'reporter_contact', 'sensitive_pii', 'mask_phone', 'citizen_reports'),
  ('citizen_reports', 'vehicle_plate', 'confidential', 'mask_plate', 'citizen_reports'),
  ('citizen_reports', 'location_address', 'internal', NULL, 'citizen_reports'),
  ('citizen_reports', 'description', 'internal', NULL, 'citizen_reports'),
  ('anpr_scans', 'plate_text', 'confidential', 'mask_plate', 'anpr_scans'),
  ('anpr_scans', 'normalized_plate', 'confidential', NULL, 'anpr_scans'),
  ('ai_analyses', 'ai_summary', 'internal', NULL, 'ai_analyses'),
  ('user_sessions', 'ip_address', 'pii', 'mask_ip', 'user_sessions'),
  ('user_sessions', 'user_agent', 'internal', NULL, 'user_sessions'),
  ('audit_logs', 'ip_address', 'pii', 'mask_ip', 'audit_logs'),
  ('audit_logs', 'user_agent', 'internal', NULL, 'audit_logs'),
  ('audit_logs', 'description', 'internal', NULL, 'audit_logs')
ON CONFLICT (table_name, column_name) DO NOTHING;

-- =====================================================
-- 3. DATA SUBJECT REQUEST LOG
-- GDPR-style data access/deletion request tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS public.data_subject_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type    TEXT NOT NULL CHECK (request_type IN (
    'access', 'rectification', 'erasure', 'restrict_processing',
    'data_portability', 'object_to_processing'
  )),
  requested_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_id      TEXT,  -- user ID, evidence ID, incident ID, etc.
  subject_type    TEXT,  -- 'user', 'incident', 'evidence', 'citizen_report'
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_review', 'approved', 'completed', 'rejected', 'expired'
  )),
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  reviewed_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes    TEXT,
  response_data   JSONB,
  expires_at      TIMESTAMPTZ DEFAULT now() + INTERVAL '30 days',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_subject_requests_type ON public.data_subject_requests(request_type, status);
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_subject ON public.data_subject_requests(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_requested ON public.data_subject_requests(requested_by);

ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own requests"
  ON public.data_subject_requests FOR SELECT
  USING (requested_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (
      'system_administrator', 'system_auditor'
    )
  ));

CREATE POLICY "Authenticated users can submit requests"
  ON public.data_subject_requests FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 4. CONSENT RECORDS
-- Tracks user consent for data processing activities
-- =====================================================
CREATE TABLE IF NOT EXISTS public.consent_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type    TEXT NOT NULL CHECK (consent_type IN (
    'data_processing', 'data_sharing', 'marketing', 'analytics',
    'ai_analysis', 'biometrics', 'third_party_sharing', 'research'
  )),
  granted         BOOLEAN NOT NULL DEFAULT true,
  ip_address      TEXT,
  user_agent      TEXT,
  consent_version TEXT,
  granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at      TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_records_user ON public.consent_records(user_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_records_active ON public.consent_records(user_id) WHERE revoked_at IS NULL;

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own consent records"
  ON public.consent_records FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (
      'system_administrator', 'system_auditor'
    )
  ));

CREATE POLICY "Users can update their own consent"
  ON public.consent_records FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 5. ANONYMIZATION FUNCTIONS
-- =====================================================

-- Mask an email: j***@example.com
CREATE OR REPLACE FUNCTION public.mask_email(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN regexp_replace(p_email, '^(.)(.*)(@.*)$', '\1***\3');
END;
$$;

-- Mask a phone: ***-***-1234
CREATE OR REPLACE FUNCTION public.mask_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN regexp_replace(p_phone, '[\d]', '*', 'g');
END;
$$;

-- Mask a name: J*** D***
CREATE OR REPLACE FUNCTION public.mask_name(p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_name IS NULL OR p_name = '' THEN RETURN p_name; END IF;
  RETURN regexp_replace(p_name, '(\S)(\S+)', '\1***', 'g');
END;
$$;

-- Mask a license plate: ***-1234
CREATE OR REPLACE FUNCTION public.mask_plate(p_plate TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_plate IS NULL OR p_plate = '' THEN RETURN p_plate; END IF;
  RETURN regexp_replace(p_plate, '[A-Za-z0-9]', '*', 'g');
END;
$$;

-- Mask an IP: 192.168.***.***
CREATE OR REPLACE FUNCTION public.mask_ip(p_ip TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_ip IS NULL OR p_ip = '' THEN RETURN p_ip; END IF;
  RETURN regexp_replace(p_ip, '(\d+)\.(\d+)\.\d+\.\d+', '\1.\2.***.***');
END;
$$;

-- =====================================================
-- 6. DATA DELETION / ANONYMIZATION WORKFLOW
-- =====================================================

-- Soft-delete or anonymize stale records for a given category
CREATE OR REPLACE FUNCTION public.apply_retention_policy(
  p_category TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_policy public.retention_policies%ROWTYPE;
  v_cutoff_date TIMESTAMPTZ;
  v_deleted INTEGER := 0;
  v_anonymized INTEGER := 0;
  v_archived INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Get policy for this category
  SELECT * INTO v_policy FROM public.retention_policies
  WHERE data_category = p_category AND auto_purge_enabled = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('category', p_category, 'status', 'skipped', 'reason', 'No auto-purge policy configured');
  END IF;

  v_cutoff_date := CURRENT_DATE - (v_policy.retention_days || ' days')::INTERVAL;

  CASE p_category
    WHEN 'incidents' THEN
      UPDATE public.incidents SET status = 'archived', archived_at = now()
      WHERE created_at < v_cutoff_date AND status NOT IN ('closed', 'archived');
      GET DIAGNOSTICS v_archived = ROW_COUNT;

    WHEN 'evidence' THEN
      UPDATE public.evidence SET evidence_status = 'archived'
      WHERE uploaded_at < v_cutoff_date AND evidence_status NOT IN ('archived', 'expunged');
      GET DIAGNOSTICS v_archived = ROW_COUNT;

    WHEN 'citizen_reports' THEN
      -- Anonymize: clear reporter PII but keep violation data
      UPDATE public.citizen_reports SET
        reporter_name = '[ANONYMIZED]',
        reporter_contact = NULL,
        anonymous_token = NULL
      WHERE created_at < v_cutoff_date AND reporter_name != '[ANONYMIZED]';
      GET DIAGNOSTICS v_anonymized = ROW_COUNT;

    WHEN 'anpr_scans' THEN
      UPDATE public.anpr_scans SET is_deleted = true, deleted_at = now()
      WHERE scanned_at < v_cutoff_date AND is_deleted = false;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;

    WHEN 'ai_analyses' THEN
      UPDATE public.ai_analyses SET is_deleted = true
      WHERE created_at < v_cutoff_date AND is_deleted = false;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;

    WHEN 'user_sessions' THEN
      DELETE FROM public.user_sessions
      WHERE last_active_at < v_cutoff_date;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;

    WHEN 'notifications' THEN
      DELETE FROM public.notifications
      WHERE created_at < v_cutoff_date;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;

    ELSE
      RETURN jsonb_build_object('category', p_category, 'status', 'skipped', 'reason', 'No retention action defined for this category');
  END CASE;

  v_result := jsonb_build_object(
    'category', p_category,
    'policy_id', v_policy.id,
    'retention_days', v_policy.retention_days,
    'archived', v_archived,
    'anonymized', v_anonymized,
    'deleted', v_deleted,
    'cutoff_date', v_cutoff_date
  );

  RETURN v_result;
END;
$$;

-- =====================================================
-- 7. PRIVACY IMPACT ASSESSMENT
-- =====================================================
CREATE TABLE IF NOT EXISTS public.privacy_impact_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT NOT NULL CHECK (event_type IN (
    'pii_accessed', 'pii_exported', 'pii_shared', 'data_breach_notification',
    'consent_change', 'retention_applied', 'data_deletion_request',
    'anonymization_run', 'policy_change'
  )),
  description   TEXT,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details       JSONB DEFAULT '{}'::jsonb,
  risk_level    TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_privacy_impact_log_type ON public.privacy_impact_log(event_type, created_at DESC);

ALTER TABLE public.privacy_impact_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only authorized personnel view privacy impact log"
  ON public.privacy_impact_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (
      'system_administrator', 'system_auditor'
    )
  ));

CREATE POLICY "Authenticated users can insert privacy events"
  ON public.privacy_impact_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 8. PRIVACY SUMMARY REPORT
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_privacy_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_total_pii_columns INTEGER;
  v_total_retention_policies INTEGER;
  v_policies_with_auto_purge INTEGER;
  v_active_consents INTEGER;
  v_pending_requests INTEGER;
  v_pii_access_events_30d INTEGER;
  v_result JSONB;
BEGIN
  SELECT COUNT(*) INTO v_total_pii_columns FROM public.data_classification
  WHERE classification IN ('pii', 'sensitive_pii');

  SELECT COUNT(*) INTO v_total_retention_policies FROM public.retention_policies;
  SELECT COUNT(*) INTO v_policies_with_auto_purge FROM public.retention_policies WHERE auto_purge_enabled = true;

  SELECT COUNT(*) INTO v_active_consents FROM public.consent_records
  WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now());

  SELECT COUNT(*) INTO v_pending_requests FROM public.data_subject_requests
  WHERE status IN ('pending', 'in_review');

  SELECT COUNT(*) INTO v_pii_access_events_30d FROM public.privacy_impact_log
  WHERE event_type = 'pii_accessed' AND created_at > now() - INTERVAL '30 days';

  v_result := jsonb_build_object(
    'total_pii_columns', v_total_pii_columns,
    'total_retention_policies', v_total_retention_policies,
    'auto_purge_enabled', v_policies_with_auto_purge,
    'active_consents', v_active_consents,
    'pending_data_requests', v_pending_requests,
    'pii_access_events_30d', v_pii_access_events_30d
  );

  RETURN v_result;
END;
$$;

-- =====================================================
-- 9. COMPLETE DATA ERASURE FOR A USER (Right to Erasure)
-- =====================================================
CREATE OR REPLACE FUNCTION public.erasure_user_data(
  p_user_id UUID,
  p_request_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profiles_anonymized INTEGER;
  v_incidents_anonymized INTEGER;
  v_evidence_anonymized INTEGER;
  v_citizen_anonymized INTEGER;
  v_sessions_deleted INTEGER;
  v_consents_revoked INTEGER;
  v_result JSONB;
BEGIN
  -- Anonymize profile (keep minimal system data)
  UPDATE public.profiles SET
    full_name = '[DELETED]',
    email = '[DELETED]',
    phone = NULL,
    badge_number = '[DELETED]',
    avatar_url = NULL,
    station = NULL,
    is_active = false
  WHERE id = p_user_id;
  GET DIAGNOSTICS v_profiles_anonymized = ROW_COUNT;

  -- Anonymize officer references in incidents
  UPDATE public.incidents SET
    officer_notes = '[DELETED UPON USER REQUEST]'
  WHERE officer_id = p_user_id;
  GET DIAGNOSTICS v_incidents_anonymized = ROW_COUNT;

  -- Anonymize evidence references
  UPDATE public.evidence SET
    description = '[DELETED UPON USER REQUEST]',
    officer_notes = NULL
  WHERE officer_id = p_user_id;
  GET DIAGNOSTICS v_evidence_anonymized = ROW_COUNT;

  -- Anonymize citizen reports
  UPDATE public.citizen_reports SET
    reporter_name = '[DELETED]',
    reporter_contact = NULL,
    anonymous_token = NULL
  WHERE citizen_id = p_user_id;
  GET DIAGNOSTICS v_citizen_anonymized = ROW_COUNT;

  -- Delete sessions
  DELETE FROM public.user_sessions WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_sessions_deleted = ROW_COUNT;

  -- Revoke all consents
  UPDATE public.consent_records SET
    revoked_at = now(),
    granted = false
  WHERE user_id = p_user_id AND revoked_at IS NULL;
  GET DIAGNOSTICS v_consents_revoked = ROW_COUNT;

  -- Update the request status if provided
  IF p_request_id IS NOT NULL THEN
    UPDATE public.data_subject_requests SET
      status = 'completed',
      completed_at = now()
    WHERE id = p_request_id;
  END IF;

  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'profile_anonymized', v_profiles_anonymized,
    'incident_notes_anonymized', v_incidents_anonymized,
    'evidence_anonymized', v_evidence_anonymized,
    'citizen_reports_anonymized', v_citizen_anonymized,
    'sessions_deleted', v_sessions_deleted,
    'consents_revoked', v_consents_revoked
  );

  RETURN v_result;
END;
$$;

-- =====================================================
-- 10. GET USER EXPORT DATA (Right to Data Portability)
-- =====================================================
CREATE OR REPLACE FUNCTION public.export_user_data(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile JSONB;
  v_incidents JSONB;
  v_evidence JSONB;
  v_citizen_reports JSONB;
  v_consents JSONB;
  v_result JSONB;
BEGIN
  -- Get profile (exclude sensitive internal fields)
  SELECT jsonb_agg(to_jsonb(r)) INTO v_profile FROM (
    SELECT id, full_name, email, role, station, created_at, updated_at
    FROM public.profiles WHERE id = p_user_id
  ) r;

  -- Get incidents
  SELECT jsonb_agg(to_jsonb(r)) INTO v_incidents FROM (
    SELECT id, title, description, violation_type, severity, status,
           vehicle_plate, location_address, created_at, updated_at
    FROM public.incidents WHERE officer_id = p_user_id
    ORDER BY created_at DESC
  ) r;

  -- Get evidence
  SELECT jsonb_agg(to_jsonb(r)) INTO v_evidence FROM (
    SELECT id, incident_id, mime_type, description, uploaded_at
    FROM public.evidence WHERE officer_id = p_user_id
    ORDER BY uploaded_at DESC
  ) r;

  -- Get citizen reports
  SELECT jsonb_agg(to_jsonb(r)) INTO v_citizen_reports FROM (
    SELECT id, reference_number, report_type, violation_type, status,
           created_at
    FROM public.citizen_reports WHERE citizen_id = p_user_id
    ORDER BY created_at DESC
  ) r;

  -- Get consent records
  SELECT jsonb_agg(to_jsonb(r)) INTO v_consents FROM (
    SELECT id, consent_type, granted, granted_at, revoked_at
    FROM public.consent_records WHERE user_id = p_user_id
    ORDER BY granted_at DESC
  ) r;

  v_result := jsonb_build_object(
    'exported_at', now(),
    'user_id', p_user_id,
    'profile', COALESCE(v_profile, '[]'::jsonb),
    'incidents', COALESCE(v_incidents, '[]'::jsonb),
    'evidence', COALESCE(v_evidence, '[]'::jsonb),
    'citizen_reports', COALESCE(v_citizen_reports, '[]'::jsonb),
    'consent_records', COALESCE(v_consents, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

-- =====================================================
-- 11. GRANT EXECUTION PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION public.mask_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.mask_phone TO authenticated;
GRANT EXECUTE ON FUNCTION public.mask_name TO authenticated;
GRANT EXECUTE ON FUNCTION public.mask_plate TO authenticated;
GRANT EXECUTE ON FUNCTION public.mask_ip TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_retention_policy TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_privacy_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.erasure_user_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_user_data TO authenticated;

-- =====================================================
-- DONE! Data Privacy migration complete.
-- =====================================================
