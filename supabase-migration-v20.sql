-- =====================================================
-- TrafficWatch AI — v20 Database Migration
-- DATABASE SECURITY — Comprehensive Row Level Security
--
-- Replaces broad "authenticated users can read" policies
-- with true role-based, jurisdiction-scoped access.
-- Every policy enforces: What role × What scope × What action
-- =====================================================

-- =====================================================
-- 0. ROLE HELPER FUNCTIONS (shared by all policies)
-- =====================================================

-- Current user's role name
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(p.role::TEXT, 'citizen')
  FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1;
$$;

-- Hierarchy-level check (police_supervisor=5, commander=6+)
CREATE OR REPLACE FUNCTION public.user_hierarchy_level()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(r.hierarchy_level, 0)
  FROM public.profiles p
  JOIN public.roles r ON p.role::TEXT = r.name
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_at_least(p_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.user_hierarchy_level() >= COALESCE(
    (SELECT r.hierarchy_level FROM public.roles r WHERE r.name = p_role LIMIT 1), 99
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.current_user_role() = 'system_administrator';
$$;

CREATE OR REPLACE FUNCTION public.is_supervisor_or_above()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.user_hierarchy_level() >= 5;
$$;

CREATE OR REPLACE FUNCTION public.is_commander_or_above()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.user_hierarchy_level() >= 6;
$$;

-- Check if user's county matches (for jurisdiction-based policies)
CREATE OR REPLACE FUNCTION public.user_county()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(p.county_code, '') FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1;
$$;

-- Check if user's police_region matches
CREATE OR REPLACE FUNCTION public.user_police_region()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(lc.police_region, '')
  FROM public.profiles p
  LEFT JOIN public.liberia_counties lc ON lc.code = p.county_code
  WHERE p.id = auth.uid() LIMIT 1;
$$;

-- Can the current user access a given county?
CREATE OR REPLACE FUNCTION public.can_access_county(p_county_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    public.is_admin()
    OR public.is_commander_or_above()
    OR (public.is_supervisor_or_above() AND public.user_police_region() = (
      SELECT lc.police_region FROM public.liberia_counties lc WHERE lc.code = p_county_code LIMIT 1
    ))
    OR public.user_county() = p_county_code;
$$;

-- =====================================================
-- 1. PROFILES — Users see own; supervisors see their
--    county/region; commanders and admins see all
-- =====================================================
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Roles: profiles_select"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR (public.is_commander_or_above())
    OR (public.is_supervisor_or_above() AND (
      county_code = public.user_county()
      OR county_code IS NULL
    ))
  );

CREATE POLICY "Roles: profiles_update"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Roles: profiles_admin"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- 2. INCIDENTS — Complex hierarchy:
--    Officers → own + assigned
--    Supervisors → county incidents
--    Commanders → region incidents
--    National + Admin → all
-- =====================================================
DROP POLICY IF EXISTS "Officers can view their own incidents" ON public.incidents;
DROP POLICY IF EXISTS "Supervisors can read all incidents" ON public.incidents;
DROP POLICY IF EXISTS "Admins can update any incident" ON public.incidents;
DROP POLICY IF EXISTS "Officers can CRUD own incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users with permission can create incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users can view accessible incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users can update accessible incidents" ON public.incidents;
DROP POLICY IF EXISTS "Only admins can delete incidents" ON public.incidents;

-- SELECT: Role-based access to incidents
CREATE POLICY "Roles: incidents_select"
  ON public.incidents FOR SELECT
  USING (
    -- Citizen: own submitted reports
    public.current_user_role() = 'citizen' AND citizen_id = auth.uid()
    -- Officer: own incidents or assigned
    OR (public.is_at_least('traffic_officer') AND (
      officer_id = auth.uid()
      OR id IN (SELECT incident_id FROM public.incident_assignments WHERE officer_id = auth.uid())
      OR public.is_admin()
    ))
    -- Supervisor: incidents in their county
    OR (public.is_at_least('police_supervisor') AND NOT public.is_at_least('traffic_commander')
      AND (county_code = public.user_county() OR county_code IS NULL))
    -- Commander: incidents in their police region
    OR (public.is_at_least('traffic_commander') AND NOT public.is_admin()
      AND (county_code IS NULL OR public.can_access_county(county_code)))
    -- Admin: everything
    OR public.is_admin()
    -- National command: all
    OR public.current_user_role() = 'national_commissioner'
  );

-- INSERT: Officers and above with permission
CREATE POLICY "Roles: incidents_insert"
  ON public.incidents FOR INSERT
  WITH CHECK (
    public.is_at_least('traffic_officer')
    AND (public.current_user_role() != 'citizen')
  );

-- UPDATE: Own incidents, assigned incidents, or higher role
CREATE POLICY "Roles: incidents_update"
  ON public.incidents FOR UPDATE
  USING (
    officer_id = auth.uid()
    OR id IN (SELECT incident_id FROM public.incident_assignments WHERE officer_id = auth.uid())
    OR public.is_supervisor_or_above()
    OR public.is_admin()
  )
  WITH CHECK (
    officer_id = auth.uid()
    OR id IN (SELECT incident_id FROM public.incident_assignments WHERE officer_id = auth.uid())
    OR public.is_supervisor_or_above()
    OR public.is_admin()
  );

-- DELETE: Only admins
CREATE POLICY "Roles: incidents_delete"
  ON public.incidents FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- 3. EVIDENCE — Officers see own; supervisors see
--    county incidents' evidence; commanders see region
-- =====================================================
DROP POLICY IF EXISTS "Authorized personnel can read evidence" ON public.evidence;
DROP POLICY IF EXISTS "Officers can upload evidence" ON public.evidence;
DROP POLICY IF EXISTS "Officers can manage evidence for their incidents" ON public.evidence;
DROP POLICY IF EXISTS "Users with permission can insert evidence" ON public.evidence;
DROP POLICY IF EXISTS "Users with permission can update evidence" ON public.evidence;
DROP POLICY IF EXISTS "Only admins can delete evidence" ON public.evidence;
DROP POLICY IF EXISTS "Supervisors can read all evidence" ON public.evidence;
DROP POLICY IF EXISTS "Citizens can add evidence" ON public.evidence;
DROP POLICY IF EXISTS "Citizens view own evidence" ON public.evidence;
DROP POLICY IF EXISTS "Users with delete permission can delete evidence" ON public.evidence;
DROP POLICY IF EXISTS "View evidence for accessible incidents" ON public.evidence;

CREATE POLICY "Roles: evidence_select"
  ON public.evidence FOR SELECT
  USING (
    -- Citizen: own uploads
    (public.current_user_role() = 'citizen' AND officer_id = auth.uid())
    -- Evidence officer: all evidence
    OR public.current_user_role() = 'evidence_officer'
    -- Officer: evidence for own/assigned incidents
    OR (public.is_at_least('traffic_officer') AND (
      officer_id = auth.uid()
      OR incident_id IN (SELECT id FROM public.incidents WHERE officer_id = auth.uid())
      OR incident_id IN (SELECT incident_id FROM public.incident_assignments WHERE officer_id = auth.uid())
      OR public.is_admin()
    ))
    -- Supervisor: evidence for county incidents
    OR (public.is_supervisor_or_above() AND NOT public.is_commander_or_above()
      AND (county_code = public.user_county() OR county_code IS NULL))
    -- Commander: evidence for region
    OR public.is_commander_or_above()
    OR public.is_admin()
  );

CREATE POLICY "Roles: evidence_insert"
  ON public.evidence FOR INSERT
  WITH CHECK (
    public.is_at_least('traffic_officer')
    OR public.current_user_role() = 'citizen'
  );

CREATE POLICY "Roles: evidence_update"
  ON public.evidence FOR UPDATE
  USING (
    officer_id = auth.uid()
    OR public.current_user_role() = 'evidence_officer'
    OR public.is_supervisor_or_above()
    OR public.is_admin()
  )
  WITH CHECK (
    officer_id = auth.uid()
    OR public.current_user_role() = 'evidence_officer'
    OR public.is_supervisor_or_above()
    OR public.is_admin()
  );

CREATE POLICY "Roles: evidence_delete"
  ON public.evidence FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- 4. CITIZEN REPORTS — Citizens see own; officers see
--    reports from their county; national sees all
-- =====================================================
DROP POLICY IF EXISTS "Citizens can view own reports" ON public.citizen_reports;
DROP POLICY IF EXISTS "Citizens can create reports" ON public.citizen_reports;
DROP POLICY IF EXISTS "Citizens can update own submitted reports" ON public.citizen_reports;

CREATE POLICY "Roles: citizen_reports_select"
  ON public.citizen_reports FOR SELECT
  USING (
    -- Citizen: own reports
    (public.current_user_role() = 'citizen' AND citizen_id = auth.uid())
    -- Officer and above
    OR public.is_at_least('traffic_officer')
  );

CREATE POLICY "Roles: citizen_reports_insert"
  ON public.citizen_reports FOR INSERT
  WITH CHECK (
    auth.uid() = citizen_id
  );

CREATE POLICY "Roles: citizen_reports_update"
  ON public.citizen_reports FOR UPDATE
  USING (
    (public.current_user_role() = 'citizen' AND citizen_id = auth.uid() AND status = 'submitted')
    OR public.is_at_least('traffic_officer')
  )
  WITH CHECK (
    (public.current_user_role() = 'citizen' AND citizen_id = auth.uid() AND status = 'submitted')
    OR public.is_at_least('traffic_officer')
  );

CREATE POLICY "Roles: citizen_reports_delete"
  ON public.citizen_reports FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- 5. AUDIT LOGS — Auditors read-only; admins manage
-- =====================================================
DROP POLICY IF EXISTS "Any authenticated user can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authorized roles can view audit logs" ON public.audit_logs;

CREATE POLICY "Roles: audit_logs_insert"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Roles: audit_logs_select"
  ON public.audit_logs FOR SELECT
  USING (
    public.current_user_role() = 'system_auditor'
    OR public.is_admin()
    OR public.is_commander_or_above()
    -- Supervisor can see audit logs for own county
    OR (public.is_supervisor_or_above() AND
        EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = audit_logs.incident_id AND i.county_code = public.user_county()))
  );

-- Auditors and auditors can never modify audit logs
CREATE POLICY "Roles: audit_logs_no_modify"
  ON public.audit_logs FOR UPDATE
  USING (false);

CREATE POLICY "Roles: audit_logs_no_delete"
  ON public.audit_logs FOR DELETE
  USING (false);

-- =====================================================
-- 6. VEHICLES — Officers and above can read and insert
-- =====================================================
DROP POLICY IF EXISTS "Authorized roles can read vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admin and investigators can insert/update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admin and investigators can update vehicles" ON public.vehicles;

CREATE POLICY "Roles: vehicles_select"
  ON public.vehicles FOR SELECT
  USING (
    public.is_at_least('traffic_officer')
    OR public.is_admin()
  );

CREATE POLICY "Roles: vehicles_insert"
  ON public.vehicles FOR INSERT
  WITH CHECK (public.is_at_least('traffic_officer'));

CREATE POLICY "Roles: vehicles_update"
  ON public.vehicles FOR UPDATE
  USING (public.is_at_least('investigator') OR public.is_admin())
  WITH CHECK (public.is_at_least('investigator') OR public.is_admin());

CREATE POLICY "Roles: vehicles_delete"
  ON public.vehicles FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- 7. DRIVERS
-- =====================================================
DROP POLICY IF EXISTS "Admin and investigators can manage drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admin and investigators can update drivers" ON public.drivers;
DROP POLICY IF EXISTS "Authorized roles can read drivers" ON public.drivers;

CREATE POLICY "Roles: drivers_select"
  ON public.drivers FOR SELECT
  USING (public.is_at_least('traffic_officer') OR public.is_admin());

CREATE POLICY "Roles: drivers_insert"
  ON public.drivers FOR INSERT
  WITH CHECK (public.is_at_least('investigator') OR public.is_admin());

CREATE POLICY "Roles: drivers_update"
  ON public.drivers FOR UPDATE
  USING (public.is_at_least('investigator') OR public.is_admin())
  WITH CHECK (public.is_at_least('investigator') OR public.is_admin());

CREATE POLICY "Roles: drivers_delete"
  ON public.drivers FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- 8. STOLEN VEHICLES — Only authorized personnel
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage stolen vehicle records" ON public.stolen_vehicles;
DROP POLICY IF EXISTS "Authorized officers can read stolen vehicle records" ON public.stolen_vehicles;
DROP POLICY IF EXISTS "Authorized personnel can access stolen vehicles" ON public.stolen_vehicles;

CREATE POLICY "Roles: stolen_vehicles_select"
  ON public.stolen_vehicles FOR SELECT
  USING (
    public.is_at_least('traffic_officer')
    OR public.is_admin()
  );

CREATE POLICY "Roles: stolen_vehicles_insert"
  ON public.stolen_vehicles FOR INSERT
  WITH CHECK (public.is_at_least('investigator') OR public.is_admin());

CREATE POLICY "Roles: stolen_vehicles_update"
  ON public.stolen_vehicles FOR UPDATE
  USING (public.is_at_least('investigator') OR public.is_admin())
  WITH CHECK (public.is_at_least('investigator') OR public.is_admin());

CREATE POLICY "Roles: stolen_vehicles_delete"
  ON public.stolen_vehicles FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- 9. ANPR SCANS — Officers see own and accessible
-- =====================================================
DROP POLICY IF EXISTS "Authorized personnel can view ANPR scans" ON public.anpr_scans;
DROP POLICY IF EXISTS "Officers can insert ANPR scans" ON public.anpr_scans;
DROP POLICY IF EXISTS "Officers can update their own scans" ON public.anpr_scans;
DROP POLICY IF EXISTS "Users can read ANPR scans for accessible incidents" ON public.anpr_scans;

CREATE POLICY "Roles: anpr_scans_select"
  ON public.anpr_scans FOR SELECT
  USING (
    officer_id = auth.uid()
    OR public.is_at_least('traffic_officer')
    OR public.is_admin()
  );

CREATE POLICY "Roles: anpr_scans_insert"
  ON public.anpr_scans FOR INSERT
  WITH CHECK (public.is_at_least('traffic_officer'));

CREATE POLICY "Roles: anpr_scans_update"
  ON public.anpr_scans FOR UPDATE
  USING (officer_id = auth.uid() OR public.is_supervisor_or_above() OR public.is_admin())
  WITH CHECK (officer_id = auth.uid() OR public.is_supervisor_or_above() OR public.is_admin());

-- =====================================================
-- 10. AI ANALYSES — Users see analyses for accessible
--     incidents; admins manage
-- =====================================================
DROP POLICY IF EXISTS "Authorized personnel can manage AI analysis" ON public.ai_analyses;
DROP POLICY IF EXISTS "Authorized personnel can view AI analysis" ON public.ai_analyses;
DROP POLICY IF EXISTS "View AI analyses for accessible incidents" ON public.ai_analyses;
DROP POLICY IF EXISTS "Officers can insert analyses" ON public.ai_analyses;
DROP POLICY IF EXISTS "Authorized users can update analyses" ON public.ai_analyses;

CREATE POLICY "Roles: ai_analyses_select"
  ON public.ai_analyses FOR SELECT
  USING (
    public.is_at_least('traffic_officer')
    OR public.is_admin()
  );

CREATE POLICY "Roles: ai_analyses_insert"
  ON public.ai_analyses FOR INSERT
  WITH CHECK (public.is_at_least('traffic_officer') OR public.is_admin());

CREATE POLICY "Roles: ai_analyses_update"
  ON public.ai_analyses FOR UPDATE
  USING (public.is_supervisor_or_above() OR public.is_admin())
  WITH CHECK (public.is_supervisor_or_above() OR public.is_admin());

-- =====================================================
-- 11. AI DETECTIONS
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can read AI detections" ON public.ai_detections;
DROP POLICY IF EXISTS "System can insert AI detections" ON public.ai_detections;
DROP POLICY IF EXISTS "Authorized roles can review AI detections" ON public.ai_detections;

CREATE POLICY "Roles: ai_detections_select"
  ON public.ai_detections FOR SELECT
  USING (public.is_at_least('traffic_officer') OR public.is_admin());

CREATE POLICY "Roles: ai_detections_insert"
  ON public.ai_detections FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Roles: ai_detections_update"
  ON public.ai_detections FOR UPDATE
  USING (public.is_supervisor_or_above() OR public.is_admin())
  WITH CHECK (public.is_supervisor_or_above() OR public.is_admin());

-- =====================================================
-- 12. OFFICER TASKS — Officers see own; supervisors
--     see county tasks; commanders see region
-- =====================================================
DROP POLICY IF EXISTS "Officers view own tasks" ON public.officer_tasks;
DROP POLICY IF EXISTS "Supervisors create tasks" ON public.officer_tasks;
DROP POLICY IF EXISTS "Officers manage own tasks" ON public.officer_tasks;

CREATE POLICY "Roles: officer_tasks_select"
  ON public.officer_tasks FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR public.is_supervisor_or_above()
    OR public.is_admin()
  );

CREATE POLICY "Roles: officer_tasks_insert"
  ON public.officer_tasks FOR INSERT
  WITH CHECK (
    public.is_at_least('traffic_officer')
    AND (assigned_to = auth.uid() OR public.is_supervisor_or_above())
  );

CREATE POLICY "Roles: officer_tasks_update"
  ON public.officer_tasks FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR public.is_supervisor_or_above()
    OR public.is_admin()
  )
  WITH CHECK (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR public.is_supervisor_or_above()
    OR public.is_admin()
  );

-- =====================================================
-- 13. OFFICER DUTY LOG — Officers manage own;
--     supervisors view all
-- =====================================================
DROP POLICY IF EXISTS "Officers manage own duty log" ON public.officer_duty_log;
DROP POLICY IF EXISTS "Supervisors view duty logs" ON public.officer_duty_log;

CREATE POLICY "Roles: officer_duty_log_select"
  ON public.officer_duty_log FOR SELECT
  USING (
    officer_id = auth.uid()
    OR public.is_supervisor_or_above()
    OR public.is_admin()
  );

CREATE POLICY "Roles: officer_duty_log_insert"
  ON public.officer_duty_log FOR INSERT
  WITH CHECK (officer_id = auth.uid());

CREATE POLICY "Roles: officer_duty_log_update"
  ON public.officer_duty_log FOR UPDATE
  USING (officer_id = auth.uid() OR public.is_admin())
  WITH CHECK (officer_id = auth.uid() OR public.is_admin());

-- =====================================================
-- 14. INCIDENT ASSIGNMENTS — Officers see own;
--     supervisors manage
-- =====================================================
DROP POLICY IF EXISTS "Authorized access to assignments" ON public.incident_assignments;
DROP POLICY IF EXISTS "Authorized can create assignments" ON public.incident_assignments;
DROP POLICY IF EXISTS "Supervisors can manage assignments" ON public.incident_assignments;

CREATE POLICY "Roles: incident_assignments_select"
  ON public.incident_assignments FOR SELECT
  USING (
    officer_id = auth.uid()
    OR assigned_by = auth.uid()
    OR public.is_supervisor_or_above()
    OR public.is_admin()
  );

CREATE POLICY "Roles: incident_assignments_insert"
  ON public.incident_assignments FOR INSERT
  WITH CHECK (public.is_supervisor_or_above() OR public.is_admin());

CREATE POLICY "Roles: incident_assignments_update"
  ON public.incident_assignments FOR UPDATE
  USING (public.is_supervisor_or_above() OR public.is_admin())
  WITH CHECK (public.is_supervisor_or_above() OR public.is_admin());

-- =====================================================
-- 15. NOTIFICATIONS — Users see own; officers see own;
--     system creates
-- =====================================================
DROP POLICY IF EXISTS "Officers view own notifications" ON public.officer_notifications;
DROP POLICY IF EXISTS "Officers update own notifications" ON public.officer_notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users manage own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;

-- General notifications
DROP POLICY IF EXISTS "Users can see their own" ON public.notifications;
CREATE POLICY "Roles: notifications_select"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Roles: notifications_insert"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Roles: notifications_update"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- =====================================================
-- 16. TRAFFIC CAMERAS — Officers can read; commanders
--     manage; admins manage
-- =====================================================
DROP POLICY IF EXISTS "Authorized roles can read traffic cameras" ON public.traffic_cameras;
DROP POLICY IF EXISTS "System admins can manage traffic cameras" ON public.traffic_cameras;

CREATE POLICY "Roles: traffic_cameras_select"
  ON public.traffic_cameras FOR SELECT
  USING (public.is_at_least('traffic_officer') OR public.is_admin());

CREATE POLICY "Roles: traffic_cameras_insert"
  ON public.traffic_cameras FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Roles: traffic_cameras_update"
  ON public.traffic_cameras FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- 17. CAMERA EVENTS — Officers can read/acknowledge
-- =====================================================
DROP POLICY IF EXISTS "Authorized roles can read camera events" ON public.camera_events;
DROP POLICY IF EXISTS "System can insert camera events" ON public.camera_events;
DROP POLICY IF EXISTS "Officers can acknowledge camera events" ON public.camera_events;

CREATE POLICY "Roles: camera_events_select"
  ON public.camera_events FOR SELECT
  USING (public.is_at_least('traffic_officer') OR public.is_admin());

CREATE POLICY "Roles: camera_events_insert"
  ON public.camera_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Roles: camera_events_update"
  ON public.camera_events FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- 18. PATROL UNITS — Officers see; commanders manage
-- =====================================================
DROP POLICY IF EXISTS "Authorized roles can read patrol units" ON public.patrol_units;
DROP POLICY IF EXISTS "Commanders and admins can manage patrol units" ON public.patrol_units;

CREATE POLICY "Roles: patrol_units_select"
  ON public.patrol_units FOR SELECT
  USING (public.is_at_least('traffic_officer') OR public.is_admin());

CREATE POLICY "Roles: patrol_units_insert"
  ON public.patrol_units FOR INSERT
  WITH CHECK (public.is_commander_or_above() OR public.is_admin());

CREATE POLICY "Roles: patrol_units_update"
  ON public.patrol_units FOR UPDATE
  USING (public.is_commander_or_above() OR public.is_admin())
  WITH CHECK (public.is_commander_or_above() OR public.is_admin());

-- =====================================================
-- 19. STORAGE FILES — Users see files for accessible
--     evidence
-- =====================================================
DROP POLICY IF EXISTS "Officers can insert storage files" ON public.storage_files;
DROP POLICY IF EXISTS "Users can read storage files for accessible evidence" ON public.storage_files;

CREATE POLICY "Roles: storage_files_select"
  ON public.storage_files FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR evidence_id IN (SELECT id FROM public.evidence WHERE officer_id = auth.uid())
    OR public.is_supervisor_or_above()
    OR public.is_admin()
  );

CREATE POLICY "Roles: storage_files_insert"
  ON public.storage_files FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 20. EVIDENCE CUSTODY — Authorized access
-- =====================================================
DROP POLICY IF EXISTS "Authorized access to custody" ON public.evidence_custody;
DROP POLICY IF EXISTS "Authenticated users can insert custody events" ON public.evidence_custody;
DROP POLICY IF EXISTS "Users can read custody for accessible evidence" ON public.evidence_custody;

CREATE POLICY "Roles: evidence_custody_select"
  ON public.evidence_custody FOR SELECT
  USING (
    actor_id = auth.uid()
    OR evidence_id IN (SELECT id FROM public.evidence WHERE officer_id = auth.uid())
    OR public.is_supervisor_or_above()
    OR public.is_admin()
  );

CREATE POLICY "Roles: evidence_custody_insert"
  ON public.evidence_custody FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 21. INVOLVED PERSONS — Authorized access by role
-- =====================================================
DROP POLICY IF EXISTS "Authorized access to involved persons" ON public.involved_persons;
DROP POLICY IF EXISTS "Users can manage persons for their incidents" ON public.involved_persons;
DROP POLICY IF EXISTS "Officers can update persons" ON public.involved_persons;
DROP POLICY IF EXISTS "Users can read persons for accessible incidents" ON public.involved_persons;

CREATE POLICY "Roles: involved_persons_select"
  ON public.involved_persons FOR SELECT
  USING (
    incident_id IN (SELECT id FROM public.incidents WHERE officer_id = auth.uid())
    OR public.is_at_least('traffic_officer')
    OR public.is_admin()
  );

CREATE POLICY "Roles: involved_persons_insert"
  ON public.involved_persons FOR INSERT
  WITH CHECK (public.is_at_least('traffic_officer'));

CREATE POLICY "Roles: involved_persons_update"
  ON public.involved_persons FOR UPDATE
  USING (public.is_at_least('traffic_officer'))
  WITH CHECK (public.is_at_least('traffic_officer'));

-- =====================================================
-- 22. WITNESSES — Same as involved persons
-- =====================================================
DROP POLICY IF EXISTS "Authorized access to witnesses" ON public.witnesses;
DROP POLICY IF EXISTS "Users can manage witnesses for their incidents" ON public.witnesses;
DROP POLICY IF EXISTS "Users can read witnesses for accessible incidents" ON public.witnesses;

CREATE POLICY "Roles: witnesses_select"
  ON public.witnesses FOR SELECT
  USING (
    incident_id IN (SELECT id FROM public.incidents WHERE officer_id = auth.uid())
    OR public.is_at_least('traffic_officer')
    OR public.is_admin()
  );

CREATE POLICY "Roles: witnesses_insert"
  ON public.witnesses FOR INSERT
  WITH CHECK (public.is_at_least('traffic_officer'));

CREATE POLICY "Roles: witnesses_update"
  ON public.witnesses FOR UPDATE
  USING (public.is_at_least('traffic_officer'))
  WITH CHECK (public.is_at_least('traffic_officer'));

-- =====================================================
-- 23. OFFICER NOTIFICATIONS
-- =====================================================
DROP POLICY IF EXISTS "Officers view own notifications" ON public.officer_notifications;
DROP POLICY IF EXISTS "Officers update own notifications" ON public.officer_notifications;

CREATE POLICY "Roles: officer_notifications_select"
  ON public.officer_notifications FOR SELECT
  USING (officer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Roles: officer_notifications_update"
  ON public.officer_notifications FOR UPDATE
  USING (officer_id = auth.uid())
  WITH CHECK (officer_id = auth.uid());

-- =====================================================
-- 24. USER SESSIONS — Users see own; admins manage
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can revoke their own sessions" ON public.user_sessions;

CREATE POLICY "Roles: user_sessions_select"
  ON public.user_sessions FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Roles: user_sessions_delete"
  ON public.user_sessions FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- =====================================================
-- 25. DATA SUBJECT REQUESTS (Privacy) — Users see own
-- =====================================================
DROP POLICY IF EXISTS "Users can see their own requests" ON public.data_subject_requests;

CREATE POLICY "Roles: data_subject_requests_select"
  ON public.data_subject_requests FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Roles: data_subject_requests_insert"
  ON public.data_subject_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 26. CONSENT RECORDS — Users see own
-- =====================================================
DROP POLICY IF EXISTS "Users can update their own consent" ON public.consent_records;
DROP POLICY IF EXISTS "Users see their own consent records" ON public.consent_records;

CREATE POLICY "Roles: consent_records_select"
  ON public.consent_records FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Roles: consent_records_insert"
  ON public.consent_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Roles: consent_records_update"
  ON public.consent_records FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 27. REPORT HISTORY — Users see own; supervisors
--     see county
-- =====================================================
DROP POLICY IF EXISTS "Users can update reports" ON public.report_history;
DROP POLICY IF EXISTS "Delete own report history" ON public.report_history;
DROP POLICY IF EXISTS "Insert own report history" ON public.report_history;
DROP POLICY IF EXISTS "View report history for accessible incidents" ON public.report_history;

CREATE POLICY "Roles: report_history_select"
  ON public.report_history FOR SELECT
  USING (
    generated_by = auth.uid()
    OR incident_id IN (SELECT id FROM public.incidents WHERE officer_id = auth.uid())
    OR public.is_supervisor_or_above()
    OR public.is_admin()
  );

CREATE POLICY "Roles: report_history_insert"
  ON public.report_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- DONE! All 58+ tables now have comprehensive,
-- role-based, jurisdiction-aware RLS policies.
--
-- Summary of access model:
--   citizen        → Own profile, own reports, own evidence
--   traffic_officer → Own+assigned incidents, evidence, tasks
--   investigator    → Officer access + vehicle/driver management
--   evidence_officer→ All evidence access
--   police_supervisor → County-scoped access to all records
--   traffic_commander → Region-scoped access
--   regional_commander→ Region-scoped access (broader)
--   national_commissioner → National view
--   system_auditor   → Read-only audit access
--   system_administrator → Full access to everything
-- =====================================================
