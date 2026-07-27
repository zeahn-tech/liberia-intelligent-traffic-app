-- =====================================================
-- TrafficWatch AI - v17 Database Migration
-- Security Architecture — RLS Audit, Health Checks,
-- Security Events Table, Rate Limiting Functions
-- =====================================================

-- =====================================================
-- 1. SECURITY EVENTS TABLE
-- Tracks security-sensitive system events (auth failures,
-- suspicious activity, rate-limit triggers, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.security_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT NOT NULL CHECK (event_type IN (
    'auth_failure', 'auth_success', 'mfa_failure', 'mfa_success',
    'rate_limit_triggered', 'suspicious_ip', 'suspicious_ua',
    'brute_force_attempt', 'sql_injection_attempt', 'xss_attempt',
    'invalid_token', 'expired_token', 'revoked_token',
    'file_type_mismatch', 'file_upload_blocked',
    'permission_denied', 'unauthorized_access_attempt',
    'password_change', 'role_change', 'account_lockout',
    'session_hijack_attempt', 'csrf_validation_failed'
  )),
  severity        TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address      TEXT,
  user_agent      TEXT,
  path            TEXT,
  method          TEXT,
  details         JSONB DEFAULT '{}'::jsonb,
  resolved        BOOLEAN NOT NULL DEFAULT false,
  resolved_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON public.security_events(ip_address, created_at DESC);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only authorized roles can view security events"
  ON public.security_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('system_administrator', 'national_commissioner', 'system_auditor')
    )
  );

CREATE POLICY "Any authenticated user can insert security events"
  ON public.security_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 2. LOG SECURITY EVENT FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_severity TEXT DEFAULT 'warning',
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_path TEXT DEFAULT NULL,
  p_method TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.security_events (
    event_type, severity, user_id, ip_address, user_agent,
    path, method, details
  ) VALUES (
    p_event_type, p_severity, p_user_id, p_ip_address, p_user_agent,
    p_path, p_method, p_details
  )
  RETURNING id INTO v_id;

  -- Auto-resolve auth_success events that follow auth_failure
  IF p_event_type = 'auth_success' THEN
    UPDATE public.security_events
    SET resolved = true, resolved_at = now()
    WHERE event_type = 'auth_failure'
      AND user_id = p_user_id
      AND resolved = false;
  END IF;

  RETURN v_id;
END;
$$;

-- =====================================================
-- 3. SECURITY HEALTH CHECK FUNCTION
-- Returns a comprehensive security health report
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_security_health_report()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_report JSONB;
  v_total_events INTEGER;
  v_unresolved_critical INTEGER;
  v_recent_auth_failures INTEGER;
  v_tables_no_rls INTEGER;
  v_users_mfa_disabled INTEGER;
  v_users_inactive INTEGER;
BEGIN
  -- Total security events (last 30 days)
  SELECT COUNT(*) INTO v_total_events
  FROM public.security_events
  WHERE created_at > CURRENT_DATE - INTERVAL '30 days';

  -- Unresolved critical events
  SELECT COUNT(*) INTO v_unresolved_critical
  FROM public.security_events
  WHERE severity IN ('error', 'critical')
    AND resolved = false;

  -- Recent auth failures (last 24h)
  SELECT COUNT(*) INTO v_recent_auth_failures
  FROM public.security_events
  WHERE event_type = 'auth_failure'
    AND created_at > CURRENT_DATE - INTERVAL '24 hours';

  -- Tables without RLS (in public schema)
  SELECT COUNT(*) INTO v_tables_no_rls
  FROM (
    SELECT DISTINCT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = false
      AND c.relname NOT LIKE '_prisma_%'
      AND c.relname NOT LIKE '_dblink_%'
      AND c.relname NOT LIKE 'pg_%'
  ) t;

  -- Users without MFA
  SELECT COUNT(*) INTO v_users_mfa_disabled
  FROM public.profiles
  WHERE (mfa_enabled IS NULL OR mfa_enabled = false)
    AND (role IS NOT NULL AND role != 'citizen');

  -- Inactive users (no login in 90 days)
  SELECT COUNT(*) INTO v_users_inactive
  FROM public.profiles
  WHERE last_login_at IS NULL
    OR last_login_at < CURRENT_DATE - INTERVAL '90 days';

  v_report := jsonb_build_object(
    'total_events_30d', v_total_events,
    'unresolved_critical', v_unresolved_critical,
    'recent_auth_failures_24h', v_recent_auth_failures,
    'tables_without_rls', v_tables_no_rls,
    'non_citizen_users_without_mfa', v_users_mfa_disabled,
    'inactive_users_90d', v_users_inactive,
    'report_generated_at', NOW()::TEXT
  );

  RETURN v_report;
END;
$$;

-- =====================================================
-- 4. RESOLVE SECURITY EVENT FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.resolve_security_event(
  p_event_id UUID,
  p_resolved_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.security_events
  SET resolved = true,
      resolved_by = COALESCE(p_resolved_by, auth.uid()),
      resolved_at = now()
  WHERE id = p_event_id;
  RETURN FOUND;
END;
$$;

-- =====================================================
-- 5. SECURITY RLS AUDIT — Ensure ALL major tables have RLS
-- =====================================================

-- incidents table RLS (if not already enabled)
ALTER TABLE IF EXISTS public.incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Officers can view their own incidents" ON public.incidents;
CREATE POLICY "Officers can view their own incidents"
  ON public.incidents FOR SELECT
  USING (
    officer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('system_administrator', 'national_commissioner', 'regional_commander',
                       'traffic_commander', 'police_supervisor', 'investigator', 'system_auditor')
    )
  );

DROP POLICY IF EXISTS "Officers can create incidents" ON public.incidents;
CREATE POLICY "Officers can create incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      officer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('system_administrator', 'national_commissioner', 'traffic_commander',
                         'police_supervisor', 'traffic_officer', 'investigator')
      )
    )
  );

DROP POLICY IF EXISTS "Authorized roles can update incidents" ON public.incidents;
CREATE POLICY "Authorized roles can update incidents"
  ON public.incidents FOR UPDATE
  USING (
    officer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('system_administrator', 'national_commissioner', 'regional_commander',
                       'traffic_commander', 'police_supervisor', 'investigator')
    )
  );

DROP POLICY IF EXISTS "Only admins can delete incidents" ON public.incidents;
CREATE POLICY "Only admins can delete incidents"
  ON public.incidents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('system_administrator', 'national_commissioner')
    )
  );

-- evidence table RLS
ALTER TABLE IF EXISTS public.evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View evidence for accessible incidents" ON public.evidence;
CREATE POLICY "View evidence for accessible incidents"
  ON public.evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = evidence.incident_id
        AND (
          i.officer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('system_administrator', 'national_commissioner', 'regional_commander',
                             'traffic_commander', 'police_supervisor', 'investigator', 'evidence_officer', 'system_auditor')
          )
        )
    )
  );

-- ai_analyses table RLS
ALTER TABLE IF EXISTS public.ai_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View AI analyses for accessible incidents" ON public.ai_analyses;
CREATE POLICY "View AI analyses for accessible incidents"
  ON public.ai_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = ai_analyses.incident_id
        AND (
          i.officer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('system_administrator', 'national_commissioner', 'regional_commander',
                             'traffic_commander', 'police_supervisor', 'investigator')
          )
        )
    )
  );

-- anpr_scans table RLS
ALTER TABLE IF EXISTS public.anpr_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View ANPR scans for accessible incidents" ON public.anpr_scans;
CREATE POLICY "View ANPR scans for accessible incidents"
  ON public.anpr_scans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = anpr_scans.incident_id
        AND (
          i.officer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('system_administrator', 'national_commissioner', 'regional_commander',
                             'traffic_commander', 'police_supervisor', 'investigator')
          )
        )
    )
  );

-- citizen_reports table RLS
ALTER TABLE IF EXISTS public.citizen_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Citizens can view own reports" ON public.citizen_reports;
CREATE POLICY "Citizens can view own reports"
  ON public.citizen_reports FOR SELECT
  USING (
    citizen_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('system_administrator', 'national_commissioner', 'regional_commander',
                       'traffic_commander', 'police_supervisor', 'investigator')
    )
  );

-- notification_preferences table RLS
ALTER TABLE IF EXISTS public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- report_history table RLS (ensure coverage)
ALTER TABLE IF EXISTS public.report_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. INPUT VALIDATION FUNCTION (server-side)
-- =====================================================
CREATE OR REPLACE FUNCTION public.sanitize_input(p_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Strip common XSS vectors
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(p_input, '<script[^>]*>.*?</script>', '', 'gi'),
      '<[^>]*on\\w+\\s*=\\s*[\"\\'][^\"\\']*[\"\\']', '', 'gi'
    ),
    '<iframe[^>]*>.*?</iframe>', '', 'gi'
  );
END;
$$;

-- =====================================================
-- 7. FILE UPLOAD SAFETY VALIDATION (server-side supplement)
-- =====================================================
CREATE OR REPLACE FUNCTION public.validate_evidence_upload(
  p_mime_type TEXT,
  p_file_size BIGINT,
  p_original_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_allowed_images TEXT[] := ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/heic', 'image/heif'];
  v_allowed_videos TEXT[] := ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
  v_allowed_docs TEXT[] := ARRAY['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'];
  v_allowed_audio TEXT[] := ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac'];
  v_max_size BIGINT;
  v_bucket TEXT;
  v_name_check BOOLEAN;
BEGIN
  -- Check file name for dangerous patterns
  v_name_check := p_original_name !~ '\.(exe|bat|cmd|com|msi|scr|vbs|ps1|sh|php|asp|aspx|jsp|cgi|pl|py)$';

  IF NOT v_name_check THEN
    RETURN jsonb_build_object('valid', false, 'error', 'File extension not allowed for security reasons');
  END IF;

  -- Determine bucket and max size
  IF p_mime_type = ANY(v_allowed_images) THEN
    v_bucket := 'evidence-images'; v_max_size := 50 * 1024 * 1024;
  ELSIF p_mime_type = ANY(v_allowed_videos) THEN
    v_bucket := 'evidence-videos'; v_max_size := 200 * 1024 * 1024;
  ELSIF p_mime_type = ANY(v_allowed_docs) THEN
    v_bucket := 'evidence-documents'; v_max_size := 25 * 1024 * 1024;
  ELSIF p_mime_type = ANY(v_allowed_audio) THEN
    v_bucket := 'evidence-audio'; v_max_size := 50 * 1024 * 1024;
  ELSE
    v_bucket := 'evidence-other'; v_max_size := 25 * 1024 * 1024;
  END IF;

  IF p_file_size > v_max_size THEN
    RETURN jsonb_build_object('valid', false, 'error', 'File exceeds maximum size of ' || (v_max_size / 1024 / 1024) || ' MB');
  END IF;

  RETURN jsonb_build_object('valid', true, 'bucket', v_bucket, 'max_size', v_max_size);
END;
$$;

-- =====================================================
-- 8. RATE LIMITING HELPERS (server-side)
-- Simple token-bucket implementation per user/IP
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rate_limiter (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key             TEXT NOT NULL,
  window_start    TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count   INTEGER NOT NULL DEFAULT 1,
  max_requests    INTEGER NOT NULL DEFAULT 60,
  window_seconds  INTEGER NOT NULL DEFAULT 60,
  blocked_until   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limiter_key_window ON public.rate_limiter(key, window_start);

ALTER TABLE public.rate_limiter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage rate limiter"
  ON public.rate_limiter FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max_requests INTEGER DEFAULT 60,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_window_start TIMESTAMPTZ;
  v_record RECORD;
  v_blocked_until TIMESTAMPTZ;
BEGIN
  v_window_start := date_trunc('second', v_now) - (p_window_seconds || ' seconds')::INTERVAL;

  -- Check if currently blocked
  SELECT blocked_until INTO v_blocked_until
  FROM public.rate_limiter
  WHERE key = p_key
    AND blocked_until > v_now
  ORDER BY blocked_until DESC
  LIMIT 1;

  IF v_blocked_until IS NOT NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked_until', v_blocked_until,
      'retry_after', EXTRACT(EPOCH FROM (v_blocked_until - v_now))
    );
  END IF;

  -- Upsert rate limit counter
  INSERT INTO public.rate_limiter (key, window_start, request_count, max_requests, window_seconds)
  VALUES (p_key, v_window_start, 1, p_max_requests, p_window_seconds)
  ON CONFLICT (key, window_start) DO UPDATE
    SET request_count = rate_limiter.request_count + 1;

  -- Read back
  SELECT * INTO v_record
  FROM public.rate_limiter
  WHERE key = p_key AND window_start = v_window_start;

  -- Block if over limit
  IF v_record.request_count > p_max_requests THEN
    UPDATE public.rate_limiter
    SET blocked_until = v_now + INTERVAL '30 seconds'
    WHERE key = p_key AND window_start = v_window_start;

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limit_exceeded',
      'limit', p_max_requests,
      'window_seconds', p_window_seconds,
      'retry_after', 30
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', p_max_requests - v_record.request_count,
    'limit', p_max_requests
  );
END;
$$;

-- =====================================================
-- 9. CLEANUP: Archive old resolved security events
-- =====================================================
CREATE OR REPLACE FUNCTION public.purge_resolved_security_events(
  p_retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.security_events
  WHERE resolved = true
    AND resolved_at < CURRENT_DATE - (p_retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- =====================================================
-- 10. AUDIT: Verify all expected tables have RLS enabled
-- =====================================================
CREATE OR REPLACE FUNCTION public.verify_table_rls()
RETURNS TABLE (
  table_name TEXT,
  has_rls BOOLEAN,
  policy_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.relname::TEXT AS table_name,
    c.relrowsecurity AS has_rls,
    COUNT(p.policyname)::INTEGER AS policy_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_policies p ON p.tablename = c.relname AND p.schemaname = n.nspname
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname NOT LIKE '_prisma_%'
    AND c.relname NOT LIKE 'pg_%'
  GROUP BY c.relname, c.relrowsecurity
  ORDER BY c.relname;
END;
$$;

-- =====================================================
-- DONE! Security Architecture migration complete.
-- Run in Supabase SQL Editor.
-- =====================================================
