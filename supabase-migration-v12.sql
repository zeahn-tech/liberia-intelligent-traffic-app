-- =====================================================
-- TrafficWatch AI - v12 Database Migration
-- Command Center: Analytics Views, Alert Aggregation
-- =====================================================

-- =====================================================
-- 1. VIEW: real-time national statistics
-- =====================================================
CREATE OR REPLACE VIEW public.vw_national_stats AS
SELECT
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS violations_today,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS violations_week,
  COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) AS violations_month,
  COUNT(*) FILTER (WHERE status IN ('submitted', 'under_review', 'assigned', 'investigating')) AS active_cases,
  COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) AS resolved_cases,
  COUNT(*) FILTER (WHERE severity IN ('critical', 'serious') AND status NOT IN ('resolved', 'closed')) AS critical_alerts,
  COUNT(*) FILTER (WHERE status IN ('escalated')) AS escalated_cases,
  ROUND(
    CASE WHEN COUNT(*) > 0
      THEN (COUNT(*) FILTER (WHERE status IN ('resolved', 'closed', 'confirmed')) * 100.0 / COUNT(*))
      ELSE 0
    END, 1
  ) AS clearance_rate
FROM public.incidents;

-- =====================================================
-- 2. VIEW: regional statistics (using regions/stations)
-- =====================================================
CREATE OR REPLACE VIEW public.vw_region_stats AS
WITH incident_counts AS (
  SELECT
    COALESCE(psr.name, 'Unknown') AS region_name,
    COUNT(*) AS total_incidents,
    COUNT(*) FILTER (WHERE i.status IN ('resolved', 'closed', 'confirmed')) AS resolved_incidents,
    COUNT(*) FILTER (WHERE i.severity IN ('critical', 'serious') AND i.status NOT IN ('resolved', 'closed')) AS critical_active,
    ROUND(
      CASE WHEN COUNT(*) > 0
        THEN (COUNT(*) FILTER (WHERE i.status IN ('resolved', 'closed', 'confirmed')) * 100.0 / COUNT(*))
        ELSE 0
      END, 1
    ) AS clearance_rate,
    COUNT(DISTINCT i.officer_id) AS officers_active
  FROM public.incidents i
  LEFT JOIN public.police_stations ps ON i.officer_id IS NOT NULL
  LEFT JOIN public.police_regions psr ON 1=1
  WHERE i.created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY psr.name
)
SELECT * FROM incident_counts
ORDER BY total_incidents DESC;

-- =====================================================
-- 3. VIEW: county-level statistics
-- =====================================================
CREATE OR REPLACE VIEW public.vw_county_stats AS
SELECT
  lc.name AS county_name,
  lc.code AS county_code,
  lc.population,
  lc.police_region,
  COUNT(i.id) FILTER (WHERE i.created_at >= CURRENT_DATE - INTERVAL '30 days') AS monthly_incidents,
  COUNT(i.id) FILTER (WHERE i.created_at >= CURRENT_DATE - INTERVAL '7 days') AS weekly_incidents,
  COUNT(i.id) FILTER (WHERE i.status IN ('resolved', 'closed', 'confirmed')) AS resolved_incidents,
  ROUND(
    CASE WHEN COUNT(i.id) > 0
      THEN (COUNT(i.id) FILTER (WHERE i.status IN ('resolved', 'closed', 'confirmed')) * 100.0 / COUNT(i.id))
      ELSE 0
    END, 1
  ) AS clearance_rate,
  COUNT(DISTINCT i.officer_id) AS officers_deployed
FROM public.liberia_counties lc
LEFT JOIN public.incidents i ON i.location_address ILIKE '%' || lc.name || '%'
  OR i.location_address ILIKE '%' || lc.code || '%'
GROUP BY lc.name, lc.code, lc.population, lc.police_region
ORDER BY monthly_incidents DESC;

-- =====================================================
-- 4. VIEW: live alert feed (last 50 critical items)
-- =====================================================
CREATE OR REPLACE VIEW public.vw_live_alerts AS
SELECT
  id,
  'incident' AS source_type,
  title AS alert_title,
  description AS alert_message,
  severity,
  status,
  location_address,
  location_lat,
  location_lng,
  created_at,
  CASE
    WHEN severity = 'critical' AND status NOT IN ('resolved', 'closed') THEN 1
    WHEN severity = 'serious' AND status NOT IN ('resolved', 'closed') THEN 2
    WHEN severity = 'moderate' THEN 3
    ELSE 4
  END AS priority_rank
FROM public.incidents
WHERE created_at >= CURRENT_DATE - INTERVAL '48 hours'
ORDER BY priority_rank ASC, created_at DESC
LIMIT 50;

-- =====================================================
-- 5. VIEW: officer deployment stats
-- =====================================================
CREATE OR REPLACE VIEW public.vw_officer_deployment AS
SELECT
  p.id AS officer_id,
  p.full_name,
  p.badge_number,
  p.station,
  p.role,
  p.department,
  COUNT(i.id) FILTER (WHERE i.created_at >= CURRENT_DATE) AS today_incidents,
  COUNT(i.id) FILTER (WHERE i.created_at >= CURRENT_DATE - INTERVAL '7 days') AS weekly_incidents,
  COUNT(i.id) FILTER (WHERE i.status IN ('resolved', 'closed')) AS resolved_total,
  MAX(i.created_at) AS last_active_at
FROM public.profiles p
LEFT JOIN public.incidents i ON i.officer_id = p.id
WHERE p.role IN ('traffic_officer', 'investigator', 'police_supervisor', 'traffic_commander')
GROUP BY p.id, p.full_name, p.badge_number, p.station, p.role, p.department
ORDER BY last_active_at DESC NULLS LAST;

-- =====================================================
-- 6. VIEW: violation trend data (daily aggregation)
-- =====================================================
CREATE OR REPLACE VIEW public.vw_violation_trends AS
SELECT
  DATE_TRUNC('day', created_at)::DATE AS incident_date,
  COUNT(*) AS total_violations,
  COUNT(*) FILTER (WHERE severity IN ('critical', 'serious')) AS serious_violations,
  COUNT(*) FILTER (WHERE severity = 'moderate') AS moderate_violations,
  COUNT(*) FILTER (WHERE severity = 'minor') AS minor_violations,
  COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) AS resolved_count
FROM public.incidents
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at)::DATE
ORDER BY incident_date DESC;

-- =====================================================
-- 7. VIEW: response time stats
-- =====================================================
CREATE OR REPLACE VIEW public.vw_response_stats AS
SELECT
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60)::NUMERIC(10,1) AS avg_response_minutes,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (updated_at - created_at)) / 60)::NUMERIC(10,1) AS median_response_minutes,
  MIN(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60)::NUMERIC(10,1) AS fastest_response_minutes,
  MAX(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60)::NUMERIC(10,1) AS slowest_response_minutes,
  COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (updated_at - created_at)) / 60 <= 30) AS resolved_under_30min,
  COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (updated_at - created_at)) / 60 > 30 AND EXTRACT(EPOCH FROM (updated_at - created_at)) / 60 <= 60) AS resolved_30to60min,
  COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (updated_at - created_at)) / 60 > 60) AS resolved_over_60min
FROM public.incidents
WHERE status IN ('resolved', 'closed')
  AND updated_at > created_at
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';
