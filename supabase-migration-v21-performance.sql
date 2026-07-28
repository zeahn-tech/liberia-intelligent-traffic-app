-- ============================================================
-- TrafficWatch AI — Performance Indexes Migration (v21)
--
-- Adds database indexes for common query patterns to prevent
-- full table scans on large datasets.
-- ============================================================

-- ─── Incidents ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_incidents_officer_id ON public.incidents (officer_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents (severity);
CREATE INDEX IF NOT EXISTS idx_incidents_county_code ON public.incidents (county_code);
CREATE INDEX IF NOT EXISTS idx_incidents_vehicle_plate ON public.incidents (vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_violation_type_id ON public.incidents (violation_type_id);

-- Composite indexes for common filtered queries
CREATE INDEX IF NOT EXISTS idx_incidents_officer_status ON public.incidents (officer_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_status_severity ON public.incidents (status, severity);

-- Full-text search index on title and description
CREATE INDEX IF NOT EXISTS idx_incidents_title_trgm ON public.incidents USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_incidents_description_trgm ON public.incidents USING gin (description gin_trgm_ops);

-- ─── Evidence ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_evidence_incident_id ON public.evidence (incident_id);
CREATE INDEX IF NOT EXISTS idx_evidence_officer_id ON public.evidence (officer_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON public.evidence (type);
CREATE INDEX IF NOT EXISTS idx_evidence_evidence_status ON public.evidence (evidence_status);
CREATE INDEX IF NOT EXISTS idx_evidence_uploaded_at ON public.evidence (uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_sha256 ON public.evidence (sha256_hash);

-- ─── Citizen Reports ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_citizen_reports_status ON public.citizen_reports (status);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_citizen_id ON public.citizen_reports (citizen_id);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_vehicle_plate ON public.citizen_reports (vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_created_at ON public.citizen_reports (created_at DESC);

-- ─── ANPR Scans ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_anpr_scans_incident_id ON public.anpr_scans (incident_id);
CREATE INDEX IF NOT EXISTS idx_anpr_scans_normalized_plate ON public.anpr_scans (normalized_plate);
CREATE INDEX IF NOT EXISTS idx_anpr_scans_officer_id ON public.anpr_scans (officer_id);
CREATE INDEX IF NOT EXISTS idx_anpr_scans_scanned_at ON public.anpr_scans (scanned_at DESC);

-- ─── AI Analysis ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_analyses_incident_id ON public.ai_analyses (incident_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_provider ON public.ai_analyses (provider);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_jobs_incident_id ON public.ai_analysis_jobs (incident_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_jobs_status ON public.ai_analysis_jobs (status);

-- ─── Notifications ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.officer_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.officer_notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.officer_notifications (user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.officer_notifications (created_at DESC);

-- ─── Audit Logs ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON public.audit_logs (performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs (target_type, target_id);

-- ─── Vehicle Information ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON public.vehicles (license_plate);
CREATE INDEX IF NOT EXISTS idx_stolen_vehicles_plate ON public.stolen_vehicles (plate_text);

-- ─── Profile / Users ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_station ON public.profiles (station);
CREATE INDEX IF NOT EXISTS idx_profiles_county_code ON public.profiles (county_code);

-- ─── Geographic Data ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_counties_code ON public.counties (code);
CREATE INDEX IF NOT EXISTS idx_districts_county_code ON public.districts (county_code);
CREATE INDEX IF NOT EXISTS idx_police_regions_code ON public.police_regions (code);
CREATE INDEX IF NOT EXISTS idx_police_stations_region ON public.police_stations (region_code);
CREATE INDEX IF NOT EXISTS idx_roads_county ON public.roads (county_code);

-- ─── Camera Events ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_camera_events_camera_id ON public.camera_events (camera_id);
CREATE INDEX IF NOT EXISTS idx_camera_events_event_type ON public.camera_events (event_type);
CREATE INDEX IF NOT EXISTS idx_camera_events_created_at ON public.camera_events (created_at DESC);

-- ─── Traffic Violations ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_violations_code ON public.traffic_violations (code);
CREATE INDEX IF NOT EXISTS idx_violations_category ON public.traffic_violations (category);

-- ─── Involved Persons / Witnesses ──────────────────────
CREATE INDEX IF NOT EXISTS idx_involved_persons_incident_id ON public.involved_persons (incident_id);
CREATE INDEX IF NOT EXISTS idx_witnesses_incident_id ON public.witnesses (incident_id);

-- ─── Incident Assignments ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_incident_assignments_incident_id ON public.incident_assignments (incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_assignments_assigned_to ON public.incident_assignments (assigned_to);
CREATE INDEX IF NOT EXISTS idx_incident_assignments_active ON public.incident_assignments (is_active) WHERE is_active = true;

-- ─── Predictive Analytics ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_type ON public.predictive_analytics (analysis_type);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_county ON public.predictive_analytics (county_code);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_created ON public.predictive_analytics (created_at DESC);

-- ─── System Settings ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings (key);

-- ─── Enable pg_trgm extension for fuzzy text search (if not enabled) ──
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Materialized view for dashboard KPI counts ────────
-- Refreshed periodically to avoid expensive COUNT queries on large tables
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_kpis AS
SELECT
  (SELECT COUNT(*) FROM public.incidents WHERE created_at >= CURRENT_DATE) AS violations_today,
  (SELECT COUNT(*) FROM public.incidents WHERE created_at >= date_trunc('week', CURRENT_DATE)) AS violations_this_week,
  (SELECT COUNT(*) FROM public.incidents WHERE created_at >= date_trunc('month', CURRENT_DATE)) AS violations_this_month,
  (SELECT COUNT(*) FROM public.incidents WHERE status IN ('submitted', 'under_review', 'assigning', 'investigating', 'escalated')) AS open_cases,
  (SELECT COUNT(*) FROM public.incidents WHERE status IN ('resolved', 'closed')) AS resolved_cases,
  (SELECT COUNT(*) FROM public.incidents WHERE created_at >= CURRENT_DATE AND status IN ('resolved', 'closed')) AS resolved_today,
  (SELECT COUNT(*) FROM public.incidents WHERE severity = 'critical' AND status NOT IN ('resolved', 'closed')) AS critical_alerts,
  (SELECT COUNT(*) FROM public.camera_events WHERE created_at >= CURRENT_DATE) AS camera_events_today,
  (SELECT COUNT(*) FROM public.evidence WHERE uploaded_at >= CURRENT_DATE) AS evidence_uploaded_today,
  (SELECT COUNT(*) FROM public.ai_analyses WHERE created_at >= CURRENT_DATE) AS ai_analyses_today;

COMMENT ON MATERIALIZED VIEW mv_dashboard_kpis IS 'Pre-computed KPI counts for dashboard. Refresh periodically via: REFRESH MATERIALIZED VIEW mv_dashboard_kpis;';
