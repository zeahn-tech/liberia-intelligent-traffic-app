-- ============================================================
-- TrafficWatch AI — Database Functions & Stored Procedures
-- ============================================================
-- This migration creates all helper functions, stored procedures,
-- and triggers used by the application.
--
-- Depends on: 00001_init.sql (core tables and enums)
-- ============================================================

-- ============================================================
-- 1. INCIDENT STATISTICS
-- ============================================================

-- ─── 1.1 Get incident counts by status ──────────────
CREATE OR REPLACE FUNCTION public.get_incident_counts()
RETURNS TABLE(status TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT i.status::TEXT, COUNT(*)::BIGINT
  FROM public.incidents i
  GROUP BY i.status
  ORDER BY i.status;
END;
$$;

-- ─── 1.2 Get daily incident trends ──────────────────
CREATE OR REPLACE FUNCTION public.get_daily_trends(p_since TIMESTAMPTZ DEFAULT (now() - interval '30 days'))
RETURNS TABLE(date TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT to_char(i.created_at, 'YYYY-MM-DD') AS date, COUNT(*)::BIGINT AS count
  FROM public.incidents i
  WHERE i.created_at >= p_since
  GROUP BY to_char(i.created_at, 'YYYY-MM-DD')
  ORDER BY date;
END;
$$;

-- ─── 1.3 Get weekly incident trends ─────────────────
CREATE OR REPLACE FUNCTION public.get_weekly_trends(p_since TIMESTAMPTZ DEFAULT (now() - interval '90 days'))
RETURNS TABLE(date TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT to_char(date_trunc('week', i.created_at), 'YYYY-MM-DD') AS date, COUNT(*)::BIGINT AS count
  FROM public.incidents i
  WHERE i.created_at >= p_since
  GROUP BY date_trunc('week', i.created_at)
  ORDER BY date;
END;
$$;

-- ============================================================
-- 2. COUNTY & GEOGRAPHY STATISTICS
-- ============================================================

-- ─── 2.1 Get county incident statistics ──────────────
CREATE OR REPLACE FUNCTION public.get_county_stats()
RETURNS TABLE(
  county_code TEXT,
  county_name TEXT,
  incident_count BIGINT,
  resolved_count BIGINT,
  most_common_violation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(i.county_code, 'UNKNOWN') AS county_code,
    COALESCE(c.name, 'Unknown') AS county_name,
    COUNT(*)::BIGINT AS incident_count,
    COUNT(*) FILTER (WHERE i.status IN ('resolved', 'closed'))::BIGINT AS resolved_count,
    (SELECT vt.name FROM public.incident_violations iv
     JOIN public.violation_types vt ON vt.id = iv.violation_type_id
     JOIN public.incidents i2 ON i2.id = iv.incident_id
     WHERE COALESCE(i2.county_code, 'UNKNOWN') = COALESCE(i.county_code, 'UNKNOWN')
     GROUP BY vt.name ORDER BY COUNT(*) DESC LIMIT 1) AS most_common_violation
  FROM public.incidents i
  LEFT JOIN public.counties c ON c.code = i.county_code
  GROUP BY i.county_code, c.name
  ORDER BY incident_count DESC;
END;
$$;

-- ─── 2.2 Get incident geo distribution ───────────────
CREATE OR REPLACE FUNCTION public.get_incident_geo_distribution()
RETURNS TABLE(
  county_code TEXT,
  county_name TEXT,
  count BIGINT,
  lat DECIMAL,
  lng DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(i.county_code, 'UNKNOWN') AS county_code,
    COALESCE(c.name, 'Unknown') AS county_name,
    COUNT(*)::BIGINT AS count,
    COALESCE(c.center_lat, 0::DECIMAL) AS lat,
    COALESCE(c.center_lng, 0::DECIMAL) AS lng
  FROM public.incidents i
  LEFT JOIN public.counties c ON c.code = i.county_code
  GROUP BY i.county_code, c.name, c.center_lat, c.center_lng
  ORDER BY count DESC;
END;
$$;

-- ─── 2.3 Get county incident counts ─────────────────
CREATE OR REPLACE FUNCTION public.get_county_incident_counts()
RETURNS TABLE(county_code TEXT, county_name TEXT, incident_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(i.county_code, 'UNKNOWN') AS county_code,
    COALESCE(c.name, 'Unknown') AS county_name,
    COUNT(*)::BIGINT AS incident_count
  FROM public.incidents i
  LEFT JOIN public.counties c ON c.code = i.county_code
  GROUP BY i.county_code, c.name
  ORDER BY incident_count DESC;
END;
$$;

-- ============================================================
-- 3. OFFICER & ANALYTICS FUNCTIONS
-- ============================================================

-- ─── 3.1 Get officer activity in time range ──────────
CREATE OR REPLACE FUNCTION public.get_officer_activity(p_since TIMESTAMPTZ DEFAULT (now() - interval '30 days'))
RETURNS TABLE(
  officer_id UUID,
  officer_name TEXT,
  incidents_created BIGINT,
  incidents_resolved BIGINT,
  evidence_uploaded BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS officer_id,
    p.full_name AS officer_name,
    COALESCE(ic.incident_count, 0)::BIGINT AS incidents_created,
    COALESCE(ir.resolved_count, 0)::BIGINT AS incidents_resolved,
    COALESCE(ev.evidence_count, 0)::BIGINT AS evidence_uploaded
  FROM public.profiles p
  LEFT JOIN (
    SELECT officer_id, COUNT(*) AS incident_count
    FROM public.incidents WHERE created_at >= p_since
    GROUP BY officer_id
  ) ic ON ic.officer_id = p.id
  LEFT JOIN (
    SELECT officer_id, COUNT(*) AS resolved_count
    FROM public.incidents WHERE created_at >= p_since AND status IN ('resolved', 'closed')
    GROUP BY officer_id
  ) ir ON ir.officer_id = p.id
  LEFT JOIN (
    SELECT officer_id, COUNT(*) AS evidence_count
    FROM public.evidence WHERE uploaded_at >= p_since
    GROUP BY officer_id
  ) ev ON ev.officer_id = p.id
  WHERE p.role != 'citizen'
  ORDER BY incidents_created DESC;
END;
$$;

-- ============================================================
-- 4. DANGEROUS ROADS & REPEAT OFFENDERS
-- ============================================================

-- ─── 4.1 Get most dangerous roads ─────────────────────
CREATE OR REPLACE FUNCTION public.get_dangerous_roads(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(road TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(i.location_address, 'Unknown') AS road,
    COUNT(*)::BIGINT AS count
  FROM public.incidents i
  WHERE i.location_address IS NOT NULL AND i.location_address != ''
  GROUP BY i.location_address
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$;

-- ─── 4.2 Get repeat offenders by license plate ──────
CREATE OR REPLACE FUNCTION public.get_repeat_offenders(p_threshold INTEGER DEFAULT 3)
RETURNS TABLE(plate TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.vehicle_plate AS plate,
    COUNT(*)::BIGINT AS count
  FROM public.incidents i
  WHERE i.vehicle_plate IS NOT NULL AND i.vehicle_plate != ''
  GROUP BY i.vehicle_plate
  HAVING COUNT(*) >= p_threshold
  ORDER BY count DESC;
END;
$$;

-- ============================================================
-- 5. PREDICTIVE ANALYTICS
-- ============================================================

-- ─── 5.1 Get predicted hotspots for a time horizon ───
CREATE OR REPLACE FUNCTION public.get_predicted_hotspots(p_days INTEGER DEFAULT 7)
RETURNS TABLE(
  location_address TEXT,
  risk_level TEXT,
  confidence REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.location_address,
    CASE
      WHEN COUNT(*) >= 10 THEN 'high'
      WHEN COUNT(*) >= 5 THEN 'moderate'
      ELSE 'low'
    END AS risk_level,
    LEAST(COUNT(*)::REAL / 10.0, 1.0) AS confidence
  FROM public.incidents i
  WHERE i.created_at >= now() - interval '30 days'
    AND i.location_address IS NOT NULL AND i.location_address != ''
  GROUP BY i.location_address
  ORDER BY COUNT(*) DESC
  LIMIT 20;
END;
$$;

-- ============================================================
-- 6. SYSTEM SETTINGS
-- ============================================================

-- ─── 6.1 Upsert a system setting ────────────────────
CREATE OR REPLACE FUNCTION public.set_system_setting(
  p_key TEXT,
  p_value JSONB,
  p_category TEXT DEFAULT 'general',
  p_description TEXT DEFAULT NULL,
  p_is_public BOOLEAN DEFAULT false
)
RETURNS public.system_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result public.system_settings;
BEGIN
  INSERT INTO public.system_settings (key, value, category, description, is_public, updated_by)
  VALUES (p_key, p_value, p_category, p_description, p_is_public, auth.uid())
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    category = COALESCE(EXCLUDED.category, public.system_settings.category),
    description = COALESCE(EXCLUDED.description, public.system_settings.description),
    is_public = COALESCE(EXCLUDED.is_public, public.system_settings.is_public),
    updated_by = EXCLUDED.updated_by,
    updated_at = now()
  RETURNING * INTO v_result;
  RETURN v_result;
END;
$$;

-- ============================================================
-- 7. AUDIT FUNCTIONS
-- ============================================================

-- ─── 7.1 Get audit statistics ────────────────────────
CREATE OR REPLACE FUNCTION public.get_audit_stats(
  p_from TIMESTAMPTZ DEFAULT (now() - interval '30 days'),
  p_to TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE(
  total_events BIGINT,
  critical_events BIGINT,
  warning_events BIGINT,
  error_events BIGINT,
  info_events BIGINT,
  unique_users BIGINT,
  top_actions JSONB,
  daily_counts JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_events,
    COUNT(*) FILTER (WHERE severity = 'critical')::BIGINT AS critical_events,
    COUNT(*) FILTER (WHERE severity = 'warning')::BIGINT AS warning_events,
    COUNT(*) FILTER (WHERE severity = 'error')::BIGINT AS error_events,
    COUNT(*) FILTER (WHERE severity = 'info')::BIGINT AS info_events,
    COUNT(DISTINCT performed_by)::BIGINT AS unique_users,
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('action', a.action, 'count', a.cnt)), '[]'::jsonb)
      FROM (
        SELECT action, COUNT(*) AS cnt
        FROM public.audit_logs
        WHERE created_at BETWEEN p_from AND p_to
        GROUP BY action
        ORDER BY cnt DESC
        LIMIT 10
      ) a
    ) AS top_actions,
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('date', d.date, 'count', d.cnt)), '[]'::jsonb)
      FROM (
        SELECT to_char(created_at, 'YYYY-MM-DD') AS date, COUNT(*) AS cnt
        FROM public.audit_logs
        WHERE created_at BETWEEN p_from AND p_to
        GROUP BY date
        ORDER BY date
      ) d
    ) AS daily_counts
  FROM public.audit_logs
  WHERE created_at BETWEEN p_from AND p_to;
END;
$$;

-- ============================================================
-- 8. AUDIT LOG HELPER — Create audit log entries
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT '',
  p_severity TEXT DEFAULT 'info',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_logs (action, performed_by, target_type, target_id, description, severity, metadata)
  VALUES (p_action, auth.uid(), p_target_type, p_target_id, p_description, p_severity, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ============================================================
-- 9. GLOBAL SEARCH FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.global_search(
  p_query TEXT DEFAULT '',
  p_type_filter TEXT DEFAULT 'all',
  p_status_filter TEXT DEFAULT NULL,
  p_severity_filter TEXT DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_results JSONB;
  v_total INTEGER;
  v_search_term TEXT := '%' || COALESCE(p_query, '') || '%';
  v_tsquery TSQUERY;
BEGIN
  -- Build tsquery for full-text if query is long enough
  IF LENGTH(COALESCE(p_query, '')) >= 2 THEN
    BEGIN
      v_tsquery := plainto_tsquery('english', p_query);
    EXCEPTION WHEN OTHERS THEN
      v_tsquery := NULL;
    END;
  ELSE
    v_tsquery := NULL;
  END IF;

  -- Build JSON results array with UNION ALL across all searchable tables
  WITH search_results AS (
    -- Incidents
    SELECT
      'incident' AS result_type,
      i.id AS result_id,
      i.title AS title,
      COALESCE(i.description, '') AS description,
      i.status::TEXT AS status,
      i.severity::TEXT AS severity,
      i.vehicle_plate AS plate,
      i.location_address AS location,
      i.created_at::TEXT AS created_at,
      NULL::TEXT AS person_name,
      i.officer_id::TEXT AS ref_id,
      CASE
        WHEN v_tsquery IS NOT NULL AND i.title ILIKE v_search_term THEN 3
        WHEN v_tsquery IS NOT NULL AND i.description ILIKE v_search_term THEN 2
        WHEN v_tsquery IS NOT NULL AND i.vehicle_plate ILIKE v_search_term THEN 4
        WHEN i.title ILIKE v_search_term THEN 2
        WHEN i.description ILIKE v_search_term THEN 1
        WHEN i.vehicle_plate ILIKE v_search_term THEN 3
        ELSE 0
      END AS relevance
    FROM public.incidents i
    WHERE (p_query IS NULL OR p_query = '' OR
           i.title ILIKE v_search_term OR
           i.description ILIKE v_search_term OR
           i.vehicle_plate ILIKE v_search_term OR
           i.location_address ILIKE v_search_term OR
           i.id::text ILIKE v_search_term OR
           i.officer_notes ILIKE v_search_term)
      AND (p_type_filter IS NULL OR p_type_filter = 'incident' OR p_type_filter = 'all')
      AND (p_status_filter IS NULL OR i.status::TEXT = p_status_filter::TEXT)
      AND (p_severity_filter IS NULL OR i.severity::TEXT = p_severity_filter::TEXT)
      AND (p_date_from IS NULL OR i.created_at >= p_date_from)
      AND (p_date_to IS NULL OR i.created_at <= p_date_to)

    UNION ALL

    -- Evidence
    SELECT
      'evidence' AS result_type,
      e.id::TEXT AS result_id,
      COALESCE(e.description, '') AS title,
      e.mime_type AS description,
      e.evidence_status AS status,
      NULL::TEXT AS severity,
      NULL::TEXT AS plate,
      NULL::TEXT AS location,
      e.uploaded_at::TEXT AS created_at,
      NULL::TEXT AS person_name,
      e.officer_id::TEXT AS ref_id,
      CASE
        WHEN e.description ILIKE v_search_term THEN 2
        WHEN e.mime_type ILIKE v_search_term THEN 1
        ELSE 0
      END AS relevance
    FROM public.evidence e
    WHERE (p_query IS NULL OR p_query = '' OR
           e.description ILIKE v_search_term OR
           e.mime_type ILIKE v_search_term OR
           e.officer_notes ILIKE v_search_term OR
           e.id::text ILIKE v_search_term)
      AND (p_type_filter IS NULL OR p_type_filter = 'evidence' OR p_type_filter = 'all')

    UNION ALL

    -- ANPR Scans
    SELECT
      'anpr' AS result_type,
      a.id::TEXT AS result_id,
      a.plate_text AS title,
      'Confidence: ' || ROUND(a.plate_confidence::numeric * 100, 0) || '%' AS description,
      CASE WHEN a.officer_verified THEN 'verified' ELSE 'pending' END AS status,
      NULL::TEXT AS severity,
      a.normalized_plate AS plate,
      NULL::TEXT AS location,
      a.scanned_at::TEXT AS created_at,
      NULL::TEXT AS person_name,
      a.officer_id::TEXT AS ref_id,
      CASE
        WHEN a.plate_text ILIKE v_search_term THEN 5
        WHEN a.normalized_plate ILIKE v_search_term THEN 4
        ELSE 0
      END AS relevance
    FROM public.anpr_scans a
    WHERE (p_query IS NULL OR p_query = '' OR
           a.plate_text ILIKE v_search_term OR
           a.normalized_plate ILIKE v_search_term)
      AND (p_type_filter IS NULL OR p_type_filter = 'anpr' OR p_type_filter = 'all')

    UNION ALL

    -- Citizen Reports
    SELECT
      'citizen_report' AS result_type,
      cr.id::TEXT AS result_id,
      COALESCE(cr.violation_type, cr.report_type) AS title,
      cr.description AS description,
      cr.status AS status,
      NULL::TEXT AS severity,
      cr.vehicle_plate AS plate,
      cr.location_address AS location,
      cr.created_at::TEXT AS created_at,
      cr.reporter_name AS person_name,
      cr.citizen_id::TEXT AS ref_id,
      CASE
        WHEN cr.description ILIKE v_search_term THEN 2
        WHEN cr.violation_type ILIKE v_search_term THEN 2
        WHEN cr.vehicle_plate ILIKE v_search_term THEN 3
        WHEN cr.reporter_name ILIKE v_search_term THEN 2
        WHEN cr.reference_number ILIKE v_search_term THEN 3
        ELSE 0
      END AS relevance
    FROM public.citizen_reports cr
    WHERE (p_query IS NULL OR p_query = '' OR
           cr.description ILIKE v_search_term OR
           cr.violation_type ILIKE v_search_term OR
           cr.vehicle_plate ILIKE v_search_term OR
           cr.reporter_name ILIKE v_search_term OR
           cr.reference_number ILIKE v_search_term OR
           cr.location_address ILIKE v_search_term)
      AND (p_type_filter IS NULL OR p_type_filter = 'citizen_report' OR p_type_filter = 'all')
      AND (p_status_filter IS NULL OR cr.status = p_status_filter)
      AND (p_date_from IS NULL OR cr.created_at >= p_date_from)
      AND (p_date_to IS NULL OR cr.created_at <= p_date_to)
  )
  SELECT
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'result_type', sr.result_type,
        'result_id', sr.result_id,
        'title', sr.title,
        'description', sr.description,
        'status', sr.status,
        'severity', sr.severity,
        'plate', sr.plate,
        'location', sr.location,
        'created_at', sr.created_at,
        'person_name', sr.person_name,
        'ref_id', sr.ref_id,
        'relevance', sr.relevance
      ) ORDER BY sr.relevance DESC, sr.created_at DESC
    ), '[]'::jsonb) INTO v_results
  FROM search_results sr;

  v_total := jsonb_array_length(v_results);

  -- Apply pagination
  v_results := jsonb_agg(v_results ORDER BY 1) FILTER (WHERE true)
    OVER ();

  IF v_results IS NULL THEN
    v_results := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'results', COALESCE(v_results, '[]'::jsonb),
    'total', COALESCE(v_total, 0),
    'limit', p_limit,
    'offset', p_offset
  );
END;
$$;

-- ============================================================
-- 10. AUTO-UPDATE TRIGGERS FOR updated_at COLUMNS
-- ============================================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evidence_updated_at
  BEFORE UPDATE ON public.evidence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sync_queue_updated_at
  BEFORE UPDATE ON public.sync_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
