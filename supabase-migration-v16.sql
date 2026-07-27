-- =====================================================
-- TrafficWatch AI - v16 Database Migration
-- Comprehensive Audit Logging
-- =====================================================

-- =====================================================
-- 1. AUDIT LOGS TABLE
-- Immutable log of all security-sensitive actions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action          TEXT NOT NULL,
  performed_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type     TEXT,
  target_id       TEXT,
  description     TEXT,
  ip_address      TEXT,
  user_agent      TEXT,
  metadata        JSONB DEFAULT '{}'::jsonb,
  severity        TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON public.audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);

-- Partition by month for performance (optional, can be enabled later)
-- CREATE TABLE public.audit_logs_y2026m07 PARTITION OF public.audit_logs
--   FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- =====================================================
-- 2. ROW LEVEL SECURITY
-- Audit logs are immutable — only INSERT and SELECT allowed
-- =====================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can INSERT audit entries (system-wide logging)
CREATE POLICY "Any authenticated user can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only authorized roles can SELECT audit logs
CREATE POLICY "Authorized roles can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN (
          'system_administrator',
          'national_commissioner',
          'regional_commander',
          'traffic_commander',
          'police_supervisor',
          'investigator',
          'system_auditor'
        )
    )
  );

-- NO UPDATE or DELETE policies — audit logs are IMMUTABLE
-- Only superadmins can clean up via maintenance window

-- =====================================================
-- 3. FUNCTION: Log an audit event
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_performed_by UUID DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id UUID;
  v_effective_user UUID;
BEGIN
  v_effective_user := COALESCE(p_performed_by, auth.uid());

  INSERT INTO public.audit_logs (
    action, performed_by, target_type, target_id, description,
    ip_address, user_agent, metadata, severity
  ) VALUES (
    p_action, v_effective_user, p_target_type, p_target_id, p_description,
    COALESCE(p_ip_address, current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for'),
    COALESCE(p_user_agent, current_setting('request.headers', true)::jsonb ->> 'user-agent'),
    p_metadata, p_severity
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- =====================================================
-- 4. FUNCTION: Query audit logs with filtering
-- =====================================================
CREATE OR REPLACE FUNCTION public.query_audit_logs(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_action_filter TEXT DEFAULT NULL,
  p_severity_filter TEXT DEFAULT NULL,
  p_target_type_filter TEXT DEFAULT NULL,
  p_user_id_filter UUID DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_results JSONB;
  v_total INTEGER;
  v_search_term TEXT;
BEGIN
  v_search_term := '%' || COALESCE(p_search_term, '') || '%';

  -- Get total count
  SELECT COUNT(*) INTO v_total
  FROM public.audit_logs al
  WHERE (p_action_filter IS NULL OR al.action = p_action_filter)
    AND (p_severity_filter IS NULL OR al.severity = p_severity_filter)
    AND (p_target_type_filter IS NULL OR al.target_type = p_target_type_filter)
    AND (p_user_id_filter IS NULL OR al.performed_by = p_user_id_filter)
    AND (p_date_from IS NULL OR al.created_at >= p_date_from)
    AND (p_date_to IS NULL OR al.created_at <= p_date_to)
    AND (p_search_term IS NULL OR p_search_term = ''
         OR al.description ILIKE v_search_term
         OR al.action ILIKE v_search_term
         OR al.target_id ILIKE v_search_term);

  -- Get paginated results
  WITH sorted AS (
    SELECT al.*, p.full_name AS performed_by_name, p.role AS performed_by_role
    FROM public.audit_logs al
    LEFT JOIN public.profiles p ON p.id = al.performed_by
    WHERE (p_action_filter IS NULL OR al.action = p_action_filter)
      AND (p_severity_filter IS NULL OR al.severity = p_severity_filter)
      AND (p_target_type_filter IS NULL OR al.target_type = p_target_type_filter)
      AND (p_user_id_filter IS NULL OR al.performed_by = p_user_id_filter)
      AND (p_date_from IS NULL OR al.created_at >= p_date_from)
      AND (p_date_to IS NULL OR al.created_at <= p_date_to)
      AND (p_search_term IS NULL OR p_search_term = ''
           OR al.description ILIKE v_search_term
           OR al.action ILIKE v_search_term
           OR al.target_id ILIKE v_search_term)
    ORDER BY
      CASE WHEN p_sort_by = 'action' AND p_sort_order = 'asc' THEN al.action END ASC,
      CASE WHEN p_sort_by = 'action' AND p_sort_order = 'desc' THEN al.action END DESC,
      CASE WHEN p_sort_by = 'severity' AND p_sort_order = 'asc' THEN al.severity END ASC,
      CASE WHEN p_sort_by = 'severity' AND p_sort_order = 'desc' THEN al.severity END DESC,
      CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN al.created_at END ASC,
      CASE WHEN p_sort_by != 'action' AND p_sort_by != 'severity' THEN al.created_at END DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT jsonb_build_object(
    'results', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'action', s.action,
        'performed_by', s.performed_by,
        'performed_by_name', s.performed_by_name,
        'performed_by_role', s.performed_by_role,
        'target_type', s.target_type,
        'target_id', s.target_id,
        'description', s.description,
        'ip_address', s.ip_address,
        'severity', s.severity,
        'metadata', s.metadata,
        'created_at', s.created_at
      ) ORDER BY s.created_at DESC
    ), '[]'::jsonb),
    'total', v_total
  )
  INTO v_results
  FROM sorted s;

  RETURN COALESCE(v_results, jsonb_build_object('results', '[]'::jsonb, 'total', 0));
END;
$$;

-- =====================================================
-- 5. FUNCTION: Get audit log statistics (for dashboard)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_audit_stats(
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_events', COUNT(*),
    'critical_events', COUNT(*) FILTER (WHERE severity = 'critical'),
    'warning_events', COUNT(*) FILTER (WHERE severity = 'warning'),
    'error_events', COUNT(*) FILTER (WHERE severity = 'error'),
    'info_events', COUNT(*) FILTER (WHERE severity = 'info'),
    'unique_users', COUNT(DISTINCT performed_by),
    'top_actions', COALESCE(
      (SELECT jsonb_agg(sub) FROM (
        SELECT action, COUNT(*) AS count
        FROM public.audit_logs
        WHERE created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
        GROUP BY action
        ORDER BY count DESC
        LIMIT 10
      ) sub),
      '[]'::jsonb
    ),
    'daily_counts', COALESCE(
      (SELECT jsonb_agg(sub) FROM (
        SELECT DATE(created_at) AS date, COUNT(*) AS count
        FROM public.audit_logs
        WHERE created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
        GROUP BY DATE(created_at)
        ORDER BY date
      ) sub),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM public.audit_logs
  WHERE created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL;

  RETURN COALESCE(v_result, jsonb_build_object(
    'total_events', 0, 'critical_events', 0, 'warning_events', 0,
    'error_events', 0, 'info_events', 0, 'unique_users', 0,
    'top_actions', '[]'::jsonb, 'daily_counts', '[]'::jsonb
  ));
END;
$$;

-- =====================================================
-- 6. CLEANUP: Purge audit logs older than retention period
-- =====================================================
CREATE OR REPLACE FUNCTION public.purge_old_audit_logs(
  p_retention_days INTEGER DEFAULT 365
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < CURRENT_DATE - (p_retention_days || ' days')::INTERVAL
    AND severity != 'critical';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- =====================================================
-- 7. SEED DATA: Common audit action types reference
-- (This is documentation only — actions are defined in the app layer)
-- =====================================================
-- Action types used by the application:
--
-- AUTHENTICATION:
--   user_login, user_logout, user_login_failed,
--   password_changed, mfa_enabled, mfa_disabled
--
-- INCIDENTS:
--   incident_created, incident_updated, incident_deleted,
--   incident_status_changed, incident_assigned, incident_escalated
--
-- EVIDENCE:
--   evidence_uploaded, evidence_viewed, evidence_downloaded,
--   evidence_exported, evidence_deleted, evidence_transferred,
--   evidence_hash_verified
--
-- AI:
--   ai_analysis_requested, ai_analysis_completed, ai_analysis_failed,
--   ai_analysis_reviewed
--
-- USERS:
--   user_role_changed, user_created, user_deactivated,
--   user_activated, user_permissions_updated
--
-- ADMIN:
--   system_config_changed, settings_updated, report_generated,
--   audit_logs_exported, database_maintenance_run
