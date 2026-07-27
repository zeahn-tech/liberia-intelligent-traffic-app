-- =====================================================
-- TrafficWatch AI - v15 Database Migration
-- Report Generator: report_history table + management
-- =====================================================

-- =====================================================
-- 1. REPORT HISTORY TABLE
-- Stores metadata about every generated report
-- =====================================================
CREATE TABLE IF NOT EXISTS public.report_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id     UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  generated_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type     TEXT NOT NULL CHECK (report_type IN ('full', 'summary', 'evidence', 'ai_analysis')),
  format          TEXT NOT NULL CHECK (format IN ('pdf', 'csv', 'json', 'summary')),
  title           TEXT NOT NULL,
  file_url        TEXT,
  file_size       BIGINT,
  sha256_hash     TEXT,
  include_evidence    BOOLEAN NOT NULL DEFAULT true,
  include_ai_analysis BOOLEAN NOT NULL DEFAULT true,
  include_signatures  BOOLEAN NOT NULL DEFAULT false,
  source_labeling     BOOLEAN NOT NULL DEFAULT true,
  officer_notes       TEXT,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for listing reports by incident and user
CREATE INDEX IF NOT EXISTS idx_report_history_incident ON public.report_history(incident_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_history_user ON public.report_history(generated_by, created_at DESC);

-- RLS
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

-- Officers and authorized roles can view report history for incidents they have access to
CREATE POLICY "View report history for accessible incidents"
  ON public.report_history FOR SELECT
  USING (
    auth.uid() = generated_by
    OR
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_id
        AND (
          i.officer_id = auth.uid()
          OR
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('system_administrator', 'national_commissioner', 'regional_commander', 'traffic_commander', 'police_supervisor', 'investigator', 'system_auditor')
          )
        )
    )
  );

-- Users can insert their own reports
CREATE POLICY "Insert own report history"
  ON public.report_history FOR INSERT
  WITH CHECK (auth.uid() = generated_by);

-- Users can delete their own reports; authorized roles can delete any
CREATE POLICY "Delete own report history"
  ON public.report_history FOR DELETE
  USING (
    auth.uid() = generated_by
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('system_administrator', 'national_commissioner')
    )
  );

-- =====================================================
-- 2. FUNCTION: get_incident_report_data
-- Fetches all data needed for a comprehensive report
-- Returns JSON with incident, evidence, AI, ANPR, etc.
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_incident_report_data(
  p_incident_id UUID
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
    'incident', row_to_json(i)::jsonb,
    'evidence', COALESCE(
      (SELECT jsonb_agg(row_to_json(e)::jsonb) FROM public.evidence e WHERE e.incident_id = p_incident_id),
      '[]'::jsonb
    ),
    'ai_analyses', COALESCE(
      (SELECT jsonb_agg(row_to_json(a)::jsonb) FROM public.ai_analyses a WHERE a.incident_id = p_incident_id),
      '[]'::jsonb
    ),
    'anpr_scans', COALESCE(
      (SELECT jsonb_agg(row_to_json(an)::jsonb) FROM public.anpr_scans an WHERE an.incident_id = p_incident_id),
      '[]'::jsonb
    ),
    'involved_persons', COALESCE(
      (SELECT jsonb_agg(row_to_json(ip)::jsonb) FROM public.involved_persons ip WHERE ip.incident_id = p_incident_id),
      '[]'::jsonb
    ),
    'assignments', COALESCE(
      (SELECT jsonb_agg(row_to_json(ia)::jsonb) FROM public.incident_assignments ia WHERE ia.incident_id = p_incident_id),
      '[]'::jsonb
    ),
    'logs', COALESCE(
      (SELECT jsonb_agg(sub) FROM (SELECT row_to_json(il)::jsonb AS data FROM public.incident_logs il WHERE il.incident_id = p_incident_id ORDER BY il.created_at DESC LIMIT 50) sub),
      '[]'::jsonb
    ),
    'officer', (
      SELECT row_to_json(p)::jsonb FROM public.profiles p WHERE p.id = i.officer_id
    ),
    'county_data', (
      SELECT jsonb_build_object('county', lc.name, 'code', lc.code)
      FROM public.liberia_counties lc
      WHERE i.location_address ILIKE '%' || lc.name || '%' OR i.location_address ILIKE '%' || lc.code || '%'
      LIMIT 1
    )
  ) INTO v_result
  FROM public.incidents i
  WHERE i.id = p_incident_id;

  RETURN COALESCE(v_result, jsonb_build_object('error', 'Incident not found'));
END;
$$;

-- =====================================================
-- 3. FUNCTION: save_report_to_history
-- Saves a generated report record
-- =====================================================
CREATE OR REPLACE FUNCTION public.save_report_history(
  p_incident_id UUID,
  p_generated_by UUID,
  p_report_type TEXT,
  p_format TEXT,
  p_title TEXT,
  p_file_url TEXT DEFAULT NULL,
  p_file_size BIGINT DEFAULT NULL,
  p_sha256_hash TEXT DEFAULT NULL,
  p_include_evidence BOOLEAN DEFAULT true,
  p_include_ai_analysis BOOLEAN DEFAULT true,
  p_include_signatures BOOLEAN DEFAULT false,
  p_source_labeling BOOLEAN DEFAULT true,
  p_officer_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.report_history (
    incident_id, generated_by, report_type, format, title,
    file_url, file_size, sha256_hash,
    include_evidence, include_ai_analysis, include_signatures,
    source_labeling, officer_notes, metadata
  ) VALUES (
    p_incident_id, p_generated_by, p_report_type, p_format, p_title,
    p_file_url, p_file_size, p_sha256_hash,
    p_include_evidence, p_include_ai_analysis, p_include_signatures,
    p_source_labeling, p_officer_notes, p_metadata
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
