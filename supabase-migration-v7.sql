-- =====================================================
-- TrafficWatch AI - v7 Database Migration
-- User Roles & Permissions
-- =====================================================

-- =====================================================
-- 1. CREATE ENHANCED ROLE ENUM (10 roles)
-- =====================================================
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

ALTER TYPE user_role RENAME TO user_role_old;

CREATE TYPE user_role AS ENUM (
  'system_administrator',
  'national_commissioner',
  'regional_commander',
  'traffic_commander',
  'police_supervisor',
  'traffic_officer',
  'investigator',
  'evidence_officer',
  'system_auditor',
  'citizen'
);

ALTER TABLE public.profiles 
  ALTER COLUMN role TYPE user_role 
  USING (
    CASE role::text
      WHEN 'admin' THEN 'system_administrator'::user_role
      WHEN 'supervisor' THEN 'police_supervisor'::user_role
      WHEN 'investigator' THEN 'investigator'::user_role
      WHEN 'officer' THEN 'traffic_officer'::user_role
      ELSE 'traffic_officer'::user_role
    END
  );

ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'traffic_officer'::user_role;

DROP TYPE IF EXISTS user_role_old;

-- =====================================================
-- 2. PERMISSIONS MATRIX TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.permissions_matrix (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role            user_role NOT NULL UNIQUE,
  can_view_dashboard       BOOLEAN NOT NULL DEFAULT false,
  can_create_incidents     BOOLEAN NOT NULL DEFAULT false,
  can_edit_incidents       BOOLEAN NOT NULL DEFAULT false,
  can_assign_incidents     BOOLEAN NOT NULL DEFAULT false,
  can_delete_incidents     BOOLEAN NOT NULL DEFAULT false,
  can_view_all_incidents   BOOLEAN NOT NULL DEFAULT false,
  can_access_evidence      BOOLEAN NOT NULL DEFAULT false,
  can_download_evidence    BOOLEAN NOT NULL DEFAULT false,
  can_export_evidence      BOOLEAN NOT NULL DEFAULT false,
  can_delete_evidence      BOOLEAN NOT NULL DEFAULT false,
  can_manage_users         BOOLEAN NOT NULL DEFAULT false,
  can_view_users           BOOLEAN NOT NULL DEFAULT false,
  can_run_ai_analysis      BOOLEAN NOT NULL DEFAULT false,
  can_review_ai_analysis   BOOLEAN NOT NULL DEFAULT false,
  can_view_reports         BOOLEAN NOT NULL DEFAULT false,
  can_generate_reports     BOOLEAN NOT NULL DEFAULT false,
  can_view_analytics       BOOLEAN NOT NULL DEFAULT false,
  can_view_audit_logs      BOOLEAN NOT NULL DEFAULT false,
  can_export_audit_logs    BOOLEAN NOT NULL DEFAULT false,
  can_configure_system     BOOLEAN NOT NULL DEFAULT false,
  can_manage_settings      BOOLEAN NOT NULL DEFAULT false,
  can_manage_roles         BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.permissions_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage permissions matrix"
  ON public.permissions_matrix FOR ALL
  USING (public.get_current_user_role() = 'system_administrator');

CREATE POLICY "Authenticated users can read permissions"
  ON public.permissions_matrix FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seed the full permission matrix
INSERT INTO public.permissions_matrix (role,
  can_view_dashboard,
  can_create_incidents, can_edit_incidents, can_assign_incidents, can_delete_incidents, can_view_all_incidents,
  can_access_evidence, can_download_evidence, can_export_evidence, can_delete_evidence,
  can_manage_users, can_view_users,
  can_run_ai_analysis, can_review_ai_analysis,
  can_view_reports, can_generate_reports, can_view_analytics,
  can_view_audit_logs, can_export_audit_logs,
  can_configure_system, can_manage_settings, can_manage_roles
) VALUES
('system_administrator', true,
 true, true, true, true, true,
 true, true, true, true,
 true, true, true, true,
 true, true, true, true, true,
 true, true, true),

('national_commissioner', true,
 true, true, true, false, true,
 true, true, true, false,
 false, true, true, true,
 true, true, true, true, true,
 false, false, false),

('regional_commander', true,
 true, true, true, false, false,
 true, true, true, false,
 false, true, true, true,
 true, true, true, false, false,
 false, false, false),

('traffic_commander', true,
 true, true, true, false, true,
 true, true, true, false,
 false, true, true, true,
 true, true, true, false, false,
 false, false, false),

('police_supervisor', true,
 true, true, true, false, true,
 true, true, false, false,
 false, false, true, true,
 true, true, true, false, false,
 false, false, false),

('traffic_officer', true,
 true, true, false, false, false,
 true, true, false, false,
 false, false, true, false,
 true, false, true, false, false,
 false, false, false),

('investigator', true,
 true, true, false, false, true,
 true, true, true, false,
 false, false, true, true,
 true, true, true, true, false,
 false, false, false),

('evidence_officer', false,
 false, false, false, false, false,
 true, true, true, true,
 false, false, false, false,
 false, false, false, false, false,
 false, false, false),

('system_auditor', true,
 false, false, false, false, true,
 true, true, true, false,
 false, true, false, false,
 true, true, true, true, true,
 false, false, false),

('citizen', false,
 true, false, false, false, false,
 false, false, false, false,
 false, false, false, false,
 false, false, false, false, false,
 false, false, false)
ON CONFLICT (role) DO UPDATE SET
  can_view_dashboard = EXCLUDED.can_view_dashboard,
  can_create_incidents = EXCLUDED.can_create_incidents,
  can_edit_incidents = EXCLUDED.can_edit_incidents,
  can_assign_incidents = EXCLUDED.can_assign_incidents,
  can_delete_incidents = EXCLUDED.can_delete_incidents,
  can_view_all_incidents = EXCLUDED.can_view_all_incidents,
  can_access_evidence = EXCLUDED.can_access_evidence,
  can_download_evidence = EXCLUDED.can_download_evidence,
  can_export_evidence = EXCLUDED.can_export_evidence,
  can_delete_evidence = EXCLUDED.can_delete_evidence,
  can_manage_users = EXCLUDED.can_manage_users,
  can_view_users = EXCLUDED.can_view_users,
  can_run_ai_analysis = EXCLUDED.can_run_ai_analysis,
  can_review_ai_analysis = EXCLUDED.can_review_ai_analysis,
  can_view_reports = EXCLUDED.can_view_reports,
  can_generate_reports = EXCLUDED.can_generate_reports,
  can_view_analytics = EXCLUDED.can_view_analytics,
  can_view_audit_logs = EXCLUDED.can_view_audit_logs,
  can_export_audit_logs = EXCLUDED.can_export_audit_logs,
  can_configure_system = EXCLUDED.can_configure_system,
  can_manage_settings = EXCLUDED.can_manage_settings,
  can_manage_roles = EXCLUDED.can_manage_roles;

-- =====================================================
-- 3. HELPER FUNCTIONS FOR RLS POLICIES
-- =====================================================
-- NOTE: citizen_role() must be defined before RLS policies
--       in section 4 that reference it.

CREATE OR REPLACE FUNCTION public.citizen_role()
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN public.get_current_user_role() = 'citizen';
END;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(p_permission TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_role user_role;
  v_has_perm BOOLEAN;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS NULL THEN RETURN false; END IF;
  EXECUTE format('SELECT %I FROM public.permissions_matrix WHERE role = $1', p_permission)
    INTO v_has_perm USING v_role;
  RETURN COALESCE(v_has_perm, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE v_role TEXT;
BEGIN
  SELECT role::text INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_incident(p_incident_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE v_role user_role; v_officer_id UUID;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IN ('system_administrator', 'national_commissioner', 'system_auditor') THEN RETURN true; END IF;
  SELECT officer_id INTO v_officer_id FROM public.incidents WHERE id = p_incident_id;
  IF v_officer_id = auth.uid() THEN RETURN true; END IF;
  IF v_role IN ('regional_commander', 'traffic_commander', 'police_supervisor', 'investigator') THEN RETURN true; END IF;
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_evidence_item(p_evidence_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE v_role user_role; v_incident_id UUID;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IN ('system_administrator', 'evidence_officer', 'national_commissioner',
                'regional_commander', 'traffic_commander', 'police_supervisor',
                'investigator', 'system_auditor') THEN RETURN true; END IF;
  SELECT incident_id INTO v_incident_id FROM public.evidence WHERE id = p_evidence_id;
  IF EXISTS (SELECT 1 FROM public.incidents WHERE id = v_incident_id AND officer_id = auth.uid()) THEN RETURN true; END IF;
  RETURN false;
END;
$$;

-- =====================================================
-- 4. UPDATE RLS POLICIES ON ALL EXISTING TABLES
-- =====================================================

-- Profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR has_permission('can_view_users'));
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin can manage all profiles"
  ON public.profiles FOR ALL
  USING (has_permission('can_manage_users'));

-- Incidents
DROP POLICY IF EXISTS "Officers can create incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users can view accessible incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users can update accessible incidents" ON public.incidents;
DROP POLICY IF EXISTS "Admins can delete incidents" ON public.incidents;
CREATE POLICY "Users with permission can create incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (has_permission('can_create_incidents'));
CREATE POLICY "Users can view accessible incidents"
  ON public.incidents FOR SELECT
  USING (can_access_incident(id));
CREATE POLICY "Users can update accessible incidents"
  ON public.incidents FOR UPDATE
  USING (can_access_incident(id) AND has_permission('can_edit_incidents'))
  WITH CHECK (can_access_incident(id) AND has_permission('can_edit_incidents'));
CREATE POLICY "Users with delete permission can delete"
  ON public.incidents FOR DELETE
  USING (has_permission('can_delete_incidents'));

-- Evidence
DROP POLICY IF EXISTS "Authorized personnel can access evidence" ON public.evidence;
DROP POLICY IF EXISTS "Officers can insert evidence" ON public.evidence;
DROP POLICY IF EXISTS "Users can update accessible evidence" ON public.evidence;
CREATE POLICY "Authorized personnel can access evidence"
  ON public.evidence FOR SELECT
  USING (can_access_evidence_item(id));
CREATE POLICY "Users with permission can insert evidence"
  ON public.evidence FOR INSERT
  WITH CHECK (has_permission('can_access_evidence'));
CREATE POLICY "Users with permission can update evidence"
  ON public.evidence FOR UPDATE
  USING (can_access_evidence_item(id) AND has_permission('can_access_evidence'));
CREATE POLICY "Users with delete permission can delete evidence"
  ON public.evidence FOR DELETE
  USING (has_permission('can_delete_evidence'));

-- AI analysis
DROP POLICY IF EXISTS "Authorized personnel can view AI analysis" ON public.ai_analyses;
CREATE POLICY "Authorized personnel can view AI analysis"
  ON public.ai_analyses FOR SELECT
  USING (has_permission('can_run_ai_analysis') OR has_permission('can_review_ai_analysis'));
CREATE POLICY "Authorized personnel can manage AI analysis"
  ON public.ai_analyses FOR INSERT
  WITH CHECK (has_permission('can_run_ai_analysis'));

-- ANPR scans
DROP POLICY IF EXISTS "Authorized personnel can view ANPR scans" ON public.anpr_scans;
CREATE POLICY "Authorized personnel can view ANPR scans"
  ON public.anpr_scans FOR SELECT
  USING (has_permission('can_run_ai_analysis') OR citizen_role());

-- Stolen vehicles
DROP POLICY IF EXISTS "Authorized personnel can access stolen vehicles" ON public.stolen_vehicles;
CREATE POLICY "Authorized personnel can access stolen vehicles"
  ON public.stolen_vehicles FOR SELECT
  USING (public.get_current_user_role() IN (
    'system_administrator', 'national_commissioner', 'regional_commander',
    'traffic_commander', 'police_supervisor', 'investigator'
  ));

-- Involved persons
DROP POLICY IF EXISTS "Authorized access to involved persons" ON public.involved_persons;
CREATE POLICY "Authorized access to involved persons"
  ON public.involved_persons FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.incidents WHERE id = involved_persons.incident_id AND can_access_incident(id)
  ));

-- Witnesses
CREATE POLICY "Authorized access to witnesses"
  ON public.witnesses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.incidents WHERE id = witnesses.incident_id AND can_access_incident(id)
  ));

-- Incident assignments
DROP POLICY IF EXISTS "Authorized access to assignments" ON public.incident_assignments;
CREATE POLICY "Authorized access to assignments"
  ON public.incident_assignments FOR SELECT
  USING (has_permission('can_assign_incidents'));
CREATE POLICY "Authorized can create assignments"
  ON public.incident_assignments FOR INSERT
  WITH CHECK (has_permission('can_assign_incidents'));

-- Incident logs
DROP POLICY IF EXISTS "Auditor access to incident logs" ON public.incident_logs;
CREATE POLICY "Auditor access to incident logs"
  ON public.incident_logs FOR SELECT
  USING (has_permission('can_view_audit_logs') OR has_permission('can_view_all_incidents'));

-- Evidence custody
DROP POLICY IF EXISTS "Authorized access to custody" ON public.evidence_custody;
CREATE POLICY "Authorized access to custody"
  ON public.evidence_custody FOR SELECT
  USING (has_permission('can_access_evidence') OR has_permission('can_view_audit_logs'));
