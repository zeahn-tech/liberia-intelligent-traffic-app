-- =====================================================
-- TrafficWatch AI - v14 Database Migration
-- Global Search: search_history table, full-text search
-- =====================================================

-- =====================================================
-- 1. SEARCH HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.search_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query             TEXT NOT NULL,
  result_type       TEXT CHECK (result_type IN ('incident', 'evidence', 'anpr', 'citizen_report', 'person', 'vehicle')),
  result_id         TEXT,
  result_title      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON public.search_history(user_id, created_at DESC);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own search history"
  ON public.search_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 2. GLOBAL SEARCH FUNCTION
-- Searches across incidents, evidence, anpr_scans,
-- citizen_reports, involved_persons, profiles
-- =====================================================
CREATE OR REPLACE FUNCTION public.global_search(
  p_query TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_type_filter TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT NULL,
  p_severity_filter TEXT DEFAULT NULL,
  p_county_filter TEXT DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'relevance',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $func$
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
      i.status AS status,
      i.severity AS severity,
      i.vehicle_plate AS plate,
      i.location_address AS location,
      i.created_at AS created_at,
      NULL AS officer_name,
      NULL AS person_name,
      i.officer_id AS ref_id,
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
      AND (p_status_filter IS NULL OR i.status = p_status_filter)
      AND (p_severity_filter IS NULL OR i.severity = p_severity_filter)
      AND (p_date_from IS NULL OR i.created_at >= p_date_from)
      AND (p_date_to IS NULL OR i.created_at <= p_date_to)

    UNION ALL

    -- Evidence
    SELECT
      'evidence' AS result_type,
      e.id AS result_id,
      COALESCE(e.description, '') AS title,
      e.mime_type AS description,
      e.evidence_status AS status,
      NULL AS severity,
      NULL AS plate,
      NULL AS location,
      e.uploaded_at AS created_at,
      NULL AS officer_name,
      NULL AS person_name,
      e.officer_id AS ref_id,
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
      a.id AS result_id,
      a.plate_text AS title,
      'Confidence: ' || ROUND(a.plate_confidence::numeric, 0) || '%' AS description,
      CASE WHEN a.officer_verified THEN 'verified' ELSE 'pending' END AS status,
      NULL AS severity,
      a.normalized_plate AS plate,
      NULL AS location,
      a.scanned_at AS created_at,
      NULL AS officer_name,
      NULL AS person_name,
      a.officer_id AS ref_id,
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
      cr.id AS result_id,
      COALESCE(cr.violation_type, cr.report_type) AS title,
      cr.description AS description,
      cr.status AS status,
      NULL AS severity,
      cr.vehicle_plate AS plate,
      cr.location_address AS location,
      cr.created_at AS created_at,
      NULL AS officer_name,
      cr.reporter_name AS person_name,
      cr.citizen_id AS ref_id,
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

    UNION ALL

    -- Involved Persons
    SELECT
      'person' AS result_type,
      ip.id AS result_id,
      ip.full_name AS title,
      'Role: ' || ip.role || COALESCE(', ID: ' || ip.id_number, '') AS description,
      NULL AS status,
      NULL AS severity,
      NULL AS plate,
      ip.address AS location,
      ip.created_at AS created_at,
      NULL AS officer_name,
      ip.full_name AS person_name,
      ip.incident_id AS ref_id,
      CASE
        WHEN ip.full_name ILIKE v_search_term THEN 3
        WHEN ip.id_number ILIKE v_search_term THEN 2
        ELSE 0
      END AS relevance
    FROM public.involved_persons ip
    WHERE (p_query IS NULL OR p_query = '' OR
           ip.full_name ILIKE v_search_term OR
           ip.id_number ILIKE v_search_term OR
           ip.phone ILIKE v_search_term OR
           ip.email ILIKE v_search_term)
      AND (p_type_filter IS NULL OR p_type_filter = 'person' OR p_type_filter = 'all')
  ),
  counted AS (
    SELECT COUNT(*) AS total FROM search_results
  ),
  sorted AS (
    SELECT * FROM search_results
    ORDER BY
      CASE WHEN p_sort_by = 'date' AND p_sort_order = 'desc' THEN created_at END DESC,
      CASE WHEN p_sort_by = 'date' AND p_sort_order = 'asc' THEN created_at END ASC,
      CASE WHEN p_sort_by = 'relevance' THEN relevance END DESC,
      CASE WHEN p_sort_by = 'status' AND p_sort_order = 'desc' THEN status END DESC,
      CASE WHEN p_sort_by = 'status' AND p_sort_order = 'asc' THEN status END ASC,
      created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'result_type', s.result_type,
        'result_id', s.result_id,
        'title', s.title,
        'description', s.description,
        'status', s.status,
        'severity', s.severity,
        'plate', s.plate,
        'location', s.location,
        'created_at', s.created_at,
        'officer_name', s.officer_name,
        'person_name', s.person_name,
        'ref_id', s.ref_id,
        'relevance', s.relevance
      ) ORDER BY s.relevance DESC, s.created_at DESC
    ), '[]'::jsonb) AS results,
    (SELECT total FROM counted LIMIT 1) AS total
  INTO v_results
  FROM sorted s;

  -- Return as JSON with results array and total count
  IF v_results IS NULL THEN
    RETURN jsonb_build_object('results', '[]'::jsonb, 'total', 0);
  END IF;

  -- If the JSON only has the array, wrap it
  IF jsonb_typeof(v_results) = 'array' THEN
    RETURN jsonb_build_object('results', v_results, 'total', COALESCE((SELECT total FROM (SELECT COUNT(*) AS total FROM search_results) t), 0));
  END IF;

  RETURN v_results;
END;
$func$;

-- =====================================================
-- 3. FUNCTION: Save search history
-- =====================================================
CREATE OR REPLACE FUNCTION public.save_search_history(
  p_user_id UUID,
  p_query TEXT,
  p_result_type TEXT DEFAULT NULL,
  p_result_id TEXT DEFAULT NULL,
  p_result_title TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $func$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.search_history (user_id, query, result_type, result_id, result_title)
  VALUES (p_user_id, p_query, p_result_type, p_result_id, p_result_title)
  RETURNING id INTO v_id;

  -- Keep only last 50 searches per user
  DELETE FROM public.search_history
  WHERE user_id = p_user_id
    AND id NOT IN (
      SELECT id FROM public.search_history
      WHERE user_id = p_user_id
      ORDER BY created_at DESC
      LIMIT 50
    );

  RETURN v_id;
END;
$func$;

-- =====================================================
-- 4. FUNCTION: Get recent search history for a user
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_recent_searches(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $func$
DECLARE
  v_results JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', sh.id,
      'query', sh.query,
      'result_type', sh.result_type,
      'result_id', sh.result_id,
      'result_title', sh.result_title,
      'created_at', sh.created_at
    ) ORDER BY sh.created_at DESC
  ), '[]'::jsonb)
  INTO v_results
  FROM public.search_history sh
  WHERE sh.user_id = p_user_id
  LIMIT p_limit;

  RETURN v_results;
END;
$func$;
