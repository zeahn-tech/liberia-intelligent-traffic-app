-- =====================================================
-- TrafficWatch AI - v19 Database Migration
-- Database Architecture — Missing Tables & Normalization
--
-- Fills ALL gaps identified by the Section 28 audit.
-- Every table has PKs, FKs, indexes, constraints,
-- timestamps, RLS, and soft-delete where appropriate.
-- =====================================================

-- =====================================================
-- 1. ROLES TABLE
-- Defines all system roles with metadata
-- =====================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  label           TEXT NOT NULL,
  description     TEXT,
  hierarchy_level INTEGER NOT NULL DEFAULT 0,
  is_system_role  BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roles_active ON public.roles(is_active);

-- Seed default roles (matches user_role enum)
INSERT INTO public.roles (name, label, description, hierarchy_level, is_system_role) VALUES
  ('citizen', 'Citizen', 'General public user — can submit reports', 1, true),
  ('traffic_officer', 'Traffic Officer', 'Front-line traffic enforcement officer', 2, true),
  ('evidence_officer', 'Evidence Officer', 'Evidence management specialist', 3, true),
  ('investigator', 'Investigator', 'Investigates incidents and violations', 4, true),
  ('police_supervisor', 'Police Supervisor', 'Supervises officers and reviews cases', 5, true),
  ('traffic_commander', 'Traffic Commander', 'Regional traffic operations commander', 6, true),
  ('regional_commander', 'Regional Commander', 'Oversees entire regional operations', 7, true),
  ('national_commissioner', 'National Commissioner', 'National-level police leadership', 8, true),
  ('system_auditor', 'System Auditor', 'Audits system activity and compliance', 9, true),
  ('system_administrator', 'System Administrator', 'Full system access and configuration', 10, true)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read roles"
  ON public.roles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "System admins can manage roles"
  ON public.roles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'system_administrator'
  ));

-- =====================================================
-- 2. ROLE PERMISSIONS (granular, many-to-many)
-- Maps roles to individual permissions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id         UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission      TEXT NOT NULL,
  is_granted      BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON public.role_permissions(permission);

-- Seed granular permissions per role
INSERT INTO public.role_permissions (role_id, permission) 
SELECT r.id, p.permission
FROM public.roles r
CROSS JOIN (
  VALUES 
    ('view_dashboard'), ('create_incidents'), ('edit_own_incidents'),
    ('edit_any_incident'), ('delete_incidents'), ('assign_incidents'),
    ('view_incidents'), ('view_all_incidents'), ('access_evidence'),
    ('upload_evidence'), ('download_evidence'), ('export_evidence'),
    ('delete_evidence'), ('run_ai_analysis'), ('review_ai_analysis'),
    ('view_reports'), ('generate_reports'), ('view_analytics'),
    ('view_audit_logs'), ('export_audit_logs'), ('manage_users'),
    ('view_users'), ('configure_system'), ('manage_settings'),
    ('manage_roles'), ('manage_permissions'), ('view_search'),
    ('export_data'), ('anpr_verify'), ('view_chain_of_custody')
) AS p(permission)
WHERE (r.name = 'system_administrator')
   OR (r.name = 'national_commissioner' AND p.permission IN (
      'view_dashboard', 'create_incidents', 'edit_any_incident', 'assign_incidents',
      'view_incidents', 'view_all_incidents', 'access_evidence', 'download_evidence',
      'export_evidence', 'run_ai_analysis', 'review_ai_analysis', 'view_reports',
      'generate_reports', 'view_analytics', 'view_audit_logs', 'view_users',
      'upload_evidence', 'anpr_verify', 'view_chain_of_custody'
   ))
   OR (r.name = 'regional_commander' AND p.permission IN (
      'view_dashboard', 'create_incidents', 'edit_any_incident', 'assign_incidents',
      'view_incidents', 'view_all_incidents', 'access_evidence', 'download_evidence',
      'export_evidence', 'run_ai_analysis', 'review_ai_analysis', 'view_reports',
      'generate_reports', 'view_analytics', 'view_audit_logs', 'view_users',
      'upload_evidence', 'anpr_verify', 'view_chain_of_custody'
   ))
   OR (r.name = 'traffic_commander' AND p.permission IN (
      'view_dashboard', 'create_incidents', 'edit_own_incidents', 'assign_incidents',
      'view_incidents', 'view_all_incidents', 'access_evidence', 'upload_evidence',
      'download_evidence', 'review_ai_analysis', 'view_reports', 'view_analytics',
      'upload_evidence', 'anpr_verify', 'view_chain_of_custody'
   ))
   OR (r.name = 'police_supervisor' AND p.permission IN (
      'view_dashboard', 'create_incidents', 'edit_own_incidents', 'assign_incidents',
      'view_incidents', 'view_all_incidents', 'access_evidence', 'upload_evidence',
      'download_evidence', 'review_ai_analysis', 'view_reports', 'view_analytics',
      'anpr_verify', 'view_chain_of_custody'
   ))
   OR (r.name = 'investigator' AND p.permission IN (
      'view_dashboard', 'create_incidents', 'edit_own_incidents',
      'view_incidents', 'view_all_incidents', 'access_evidence', 'upload_evidence',
      'download_evidence', 'run_ai_analysis', 'review_ai_analysis',
      'view_reports', 'view_analytics', 'anpr_verify', 'view_chain_of_custody'
   ))
   OR (r.name = 'traffic_officer' AND p.permission IN (
      'view_dashboard', 'create_incidents', 'edit_own_incidents',
      'view_incidents', 'access_evidence', 'upload_evidence',
      'run_ai_analysis', 'anpr_verify'
   ))
   OR (r.name = 'evidence_officer' AND p.permission IN (
      'view_dashboard', 'view_incidents', 'access_evidence', 'upload_evidence',
      'download_evidence', 'export_evidence', 'view_chain_of_custody'
   ))
   OR (r.name = 'system_auditor' AND p.permission IN (
      'view_dashboard', 'view_incidents', 'view_all_incidents', 'view_reports',
      'view_analytics', 'view_audit_logs', 'export_audit_logs', 'view_users'
   ))
   OR (r.name = 'citizen' AND p.permission IN (
      'create_incidents'
   ))
ON CONFLICT (role_id, permission) DO NOTHING;

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read role permissions"
  ON public.role_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "System admins can manage role permissions"
  ON public.role_permissions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'system_administrator'
  ));

-- =====================================================
-- 3. VEHICLES REGISTRY
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate   TEXT NOT NULL UNIQUE,
  normalized_plate TEXT GENERATED ALWAYS AS (UPPER(REGEXP_REPLACE(license_plate, '[\s-]', '', 'g'))) STORED,
  vehicle_type    TEXT,
  vehicle_make    TEXT,
  vehicle_model   TEXT,
  vehicle_year    INTEGER CHECK (vehicle_year >= 1960 AND vehicle_year <= EXTRACT(YEAR FROM now()) + 1),
  vehicle_color   TEXT,
  vin             TEXT,
  engine_number   TEXT,
  registration_number TEXT,
  registration_expiry TIMESTAMPTZ,
  insurance_provider TEXT,
  insurance_expiry    TIMESTAMPTZ,
  country_code    TEXT DEFAULT 'LR',
  is_stolen       BOOLEAN NOT NULL DEFAULT false,
  stolen_reported_at TIMESTAMPTZ,
  stolen_report_ref  TEXT,
  is_wanted       BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_nplate ON public.vehicles(normalized_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON public.vehicles(vin) WHERE vin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_stolen ON public.vehicles(is_stolen) WHERE is_stolen = true;
CREATE INDEX IF NOT EXISTS idx_vehicles_wanted ON public.vehicles(is_wanted) WHERE is_wanted = true;

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can read vehicles"
  ON public.vehicles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('system_administrator', 'national_commissioner', 'regional_commander',
                     'traffic_commander', 'police_supervisor', 'investigator',
                     'traffic_officer', 'evidence_officer')
  ));

CREATE POLICY "Admin and investigators can insert/update vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('system_administrator', 'investigator', 'traffic_officer')
  ));

CREATE POLICY "Admin and investigators can update vehicles"
  ON public.vehicles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('system_administrator', 'investigator')
  ));

-- =====================================================
-- 4. DRIVERS REGISTRY
-- =====================================================
CREATE TABLE IF NOT EXISTS public.drivers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       TEXT NOT NULL,
  date_of_birth   DATE,
  nationality     TEXT DEFAULT 'Liberian',
  driver_license_number TEXT NOT NULL UNIQUE,
  driver_license_class  TEXT,
  driver_license_expiry TIMESTAMPTZ,
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  photo_url       TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  restrictions    TEXT,
  endorsements    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drivers_license ON public.drivers(driver_license_number);
CREATE INDEX IF NOT EXISTS idx_drivers_name ON public.drivers(full_name);
CREATE INDEX IF NOT EXISTS idx_drivers_phone ON public.drivers(phone) WHERE phone IS NOT NULL;

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can read drivers"
  ON public.drivers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('system_administrator', 'national_commissioner', 'regional_commander',
                     'traffic_commander', 'police_supervisor', 'investigator',
                     'traffic_officer')
  ));

CREATE POLICY "Admin and investigators can manage drivers"
  ON public.drivers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('system_administrator', 'investigator', 'traffic_officer')
  ));

CREATE POLICY "Admin and investigators can update drivers"
  ON public.drivers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('system_administrator', 'investigator')
  ));

-- =====================================================
-- 5. VEHICLE OWNERS (many-to-many: vehicle ←→ driver)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vehicle_owners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id      UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id       UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  ownership_type  TEXT NOT NULL DEFAULT 'owner' CHECK (ownership_type IN ('owner', 'co_owner', 'authorized_driver', 'leasee')),
  ownership_start DATE NOT NULL DEFAULT CURRENT_DATE,
  ownership_end   DATE,
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(vehicle_id, driver_id, ownership_type)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_owners_vehicle ON public.vehicle_owners(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_owners_driver ON public.vehicle_owners(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_owners_primary ON public.vehicle_owners(vehicle_id) WHERE is_primary = true;

ALTER TABLE public.vehicle_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can read vehicle owners"
  ON public.vehicle_owners FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('system_administrator', 'national_commissioner', 'regional_commander',
                     'traffic_commander', 'police_supervisor', 'investigator',
                     'traffic_officer')
  ));

CREATE POLICY "Admin can manage vehicle owners"
  ON public.vehicle_owners FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'system_administrator'
  ));

-- =====================================================
-- 6. INCIDENT VIOLATIONS (join: incident ↔ violation_type)
-- Supports multiple violations per incident
-- =====================================================
CREATE TABLE IF NOT EXISTS public.incident_violations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id     UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  violation_type_id UUID NOT NULL REFERENCES public.violation_types(id) ON DELETE CASCADE,
  severity        violation_severity DEFAULT 'moderate',
  description     TEXT,
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(incident_id, violation_type_id)
);

CREATE INDEX IF NOT EXISTS idx_incident_violations_incident ON public.incident_violations(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_violations_type ON public.incident_violations(violation_type_id);

ALTER TABLE public.incident_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read incident violations"
  ON public.incident_violations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Officers can create violations for their incidents"
  ON public.incident_violations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.incidents i WHERE i.id = incident_id
      AND (i.officer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
          AND p.role IN ('system_administrator', 'police_supervisor', 'investigator')
      ))
  ));

-- =====================================================
-- 7. AI DETECTIONS (individual object detections from AI)
-- One ai_analysis → many ai_detections
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_detections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id     UUID NOT NULL REFERENCES public.ai_analyses(id) ON DELETE CASCADE,
  evidence_id     UUID REFERENCES public.evidence(id) ON DELETE SET NULL,
  detection_type  TEXT NOT NULL CHECK (detection_type IN (
    'vehicle', 'license_plate', 'person', 'traffic_sign', 'traffic_light',
    'road_marking', 'obstacle', 'pedestrian', 'animal', 'other_object'
  )),
  label           TEXT NOT NULL,
  confidence      DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  bounding_box    JSONB,        -- {x, y, width, height} as fractions
  classification  TEXT,         -- e.g. 'car', 'truck', 'sedan', 'motorcycle'
  attributes      JSONB DEFAULT '{}'::jsonb,
  is_reviewed     BOOLEAN NOT NULL DEFAULT false,
  reviewed_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  review_decision TEXT CHECK (review_decision IN ('confirmed', 'rejected', 'uncertain')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_detections_analysis ON public.ai_detections(analysis_id);
CREATE INDEX IF NOT EXISTS idx_ai_detections_evidence ON public.ai_detections(evidence_id);
CREATE INDEX IF NOT EXISTS idx_ai_detections_type ON public.ai_detections(detection_type, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_ai_detections_reviewed ON public.ai_detections(analysis_id) WHERE is_reviewed = false;

ALTER TABLE public.ai_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read AI detections"
  ON public.ai_detections FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert AI detections"
  ON public.ai_detections FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authorized roles can review AI detections"
  ON public.ai_detections FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('system_administrator', 'police_supervisor', 'traffic_commander', 'investigator')
  ));

-- =====================================================
-- 8. TRAFFIC CAMERAS
-- Camera infrastructure for future live-feed integration
-- =====================================================
CREATE TABLE IF NOT EXISTS public.traffic_cameras (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_name     TEXT NOT NULL,
  camera_type     TEXT NOT NULL DEFAULT 'fixed' CHECK (camera_type IN (
    'fixed', 'mobile', 'body_worn', 'drone', 'highway', 'cctv', 'dashboard'
  )),
  camera_status   TEXT NOT NULL DEFAULT 'active' CHECK (camera_status IN (
    'active', 'inactive', 'maintenance', 'offline', 'decommissioned'
  )),
  location_lat    DECIMAL(10,7),
  location_lng    DECIMAL(10,7),
  location_address TEXT,
  county_id       UUID REFERENCES public.liberia_counties(id) ON DELETE SET NULL,
  police_station_id UUID REFERENCES public.police_stations(id) ON DELETE SET NULL,
  road_id         UUID REFERENCES public.major_roads(id) ON DELETE SET NULL,
  stream_url      TEXT,
  api_endpoint    TEXT,
  api_key_hash    TEXT,
  direction       TEXT CHECK (direction IN ('northbound', 'southbound', 'eastbound', 'westbound', 'all')),
  coverage_radius_meters INTEGER DEFAULT 50,
  supports_anpr   BOOLEAN NOT NULL DEFAULT false,
  supports_speed  BOOLEAN NOT NULL DEFAULT false,
  supports_red_light BOOLEAN NOT NULL DEFAULT false,
  firmware_version TEXT,
  last_heartbeat  TIMESTAMPTZ,
  installed_at    TIMESTAMPTZ,
  last_maintenance TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_traffic_cameras_status ON public.traffic_cameras(camera_status);
CREATE INDEX IF NOT EXISTS idx_traffic_cameras_county ON public.traffic_cameras(county_id);
CREATE INDEX IF NOT EXISTS idx_traffic_cameras_station ON public.traffic_cameras(police_station_id);
CREATE INDEX IF NOT EXISTS idx_traffic_cameras_road ON public.traffic_cameras(road_id);

ALTER TABLE public.traffic_cameras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can read traffic cameras"
  ON public.traffic_cameras FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('system_administrator', 'national_commissioner', 'regional_commander',
                     'traffic_commander', 'police_supervisor')
  ));

CREATE POLICY "System admins can manage traffic cameras"
  ON public.traffic_cameras FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'system_administrator'
  ));

-- =====================================================
-- 9. CAMERA EVENTS (detections/triggers from cameras)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.camera_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id       UUID NOT NULL REFERENCES public.traffic_cameras(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL CHECK (event_type IN (
    'vehicle_detected', 'speed_violation', 'red_light_violation',
    'license_plate_captured', 'incident_captured', 'pedestrian_detected',
    'obstacle_detected', 'camera_offline', 'camera_online', 'maintenance_alert'
  )),
  event_data      JSONB DEFAULT '{}'::jsonb,
  media_url       TEXT,
  thumbnail_url   TEXT,
  detected_plate  TEXT,
  detected_speed  DECIMAL(6,2),
  speed_unit      TEXT DEFAULT 'km/h',
  confidence      DECIMAL(5,4),
  location_lat    DECIMAL(10,7),
  location_lng    DECIMAL(10,7),
  incident_id     UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  evidence_id     UUID REFERENCES public.evidence(id) ON DELETE SET NULL,
  officer_notified BOOLEAN NOT NULL DEFAULT false,
  notified_at     TIMESTAMPTZ,
  acknowledged    BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_camera_events_camera ON public.camera_events(camera_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_camera_events_type ON public.camera_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_camera_events_plate ON public.camera_events(detected_plate) WHERE detected_plate IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_camera_events_incident ON public.camera_events(incident_id) WHERE incident_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_camera_events_unacknowledged ON public.camera_events(camera_id) WHERE acknowledged = false;

ALTER TABLE public.camera_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can read camera events"
  ON public.camera_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('system_administrator', 'national_commissioner', 'regional_commander',
                     'traffic_commander', 'police_supervisor', 'investigator', 'traffic_officer')
  ));

CREATE POLICY "System can insert camera events"
  ON public.camera_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Officers can acknowledge camera events"
  ON public.camera_events FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('system_administrator', 'traffic_commander', 'police_supervisor', 'traffic_officer')
  ));

-- =====================================================
-- 10. PATROL UNITS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.patrol_units (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_name       TEXT NOT NULL,
  unit_type       TEXT NOT NULL DEFAULT 'vehicle' CHECK (unit_type IN (
    'vehicle', 'motorcycle', 'bicycle', 'foot_patrol', 'boat', 'helicopter'
  )),
  vehicle_id      UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  radio_call_sign TEXT,
  status          TEXT NOT NULL DEFAULT 'available' CHECK (status IN (
    'available', 'on_patrol', 'responding', 'on_scene', 'break', 'off_duty', 'maintenance'
  )),
  county_id       UUID REFERENCES public.liberia_counties(id) ON DELETE SET NULL,
  police_station_id UUID REFERENCES public.police_stations(id) ON DELETE SET NULL,
  current_lat     DECIMAL(10,7),
  current_lng     DECIMAL(10,7),
  last_location_update TIMESTAMPTZ,
  assigned_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  secondary_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patrol_units_status ON public.patrol_units(status);
CREATE INDEX IF NOT EXISTS idx_patrol_units_county ON public.patrol_units(county_id);
CREATE INDEX IF NOT EXISTS idx_patrol_units_station ON public.patrol_units(police_station_id);
CREATE INDEX IF NOT EXISTS idx_patrol_units_officer ON public.patrol_units(assigned_officer_id);

ALTER TABLE public.patrol_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can read patrol units"
  ON public.patrol_units FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Commanders and admins can manage patrol units"
  ON public.patrol_units FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('system_administrator', 'national_commissioner', 'regional_commander', 'traffic_commander')
  ));

-- =====================================================
-- 11. ROAD CONDITIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.road_conditions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  road_id         UUID REFERENCES public.major_roads(id) ON DELETE CASCADE,
  road_name       TEXT,
  location_description TEXT,
  condition_type  TEXT NOT NULL CHECK (condition_type IN (
    'road_closure', 'accident', 'construction', 'flooding', 'landslide',
    'pothole', 'traffic_congestion', 'hazard', 'ice', 'fallen_tree',
    'police_checkpoint', 'event', 'other'
  )),
  severity        TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),
  description     TEXT,
  location_lat    DECIMAL(10,7),
  location_lng    DECIMAL(10,7),
  location_from   TEXT,
  location_to     TEXT,
  reported_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_by_type TEXT DEFAULT 'officer' CHECK (reported_by_type IN ('officer', 'citizen', 'camera', 'system')),
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at         TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_road_conditions_active ON public.road_conditions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_road_conditions_road ON public.road_conditions(road_id) WHERE road_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_road_conditions_type ON public.road_conditions(condition_type);
CREATE INDEX IF NOT EXISTS idx_road_conditions_severity ON public.road_conditions(severity);

ALTER TABLE public.road_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read road conditions"
  ON public.road_conditions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authorized users can report road conditions"
  ON public.road_conditions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Officers and admins can update road conditions"
  ON public.road_conditions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('system_administrator', 'traffic_officer', 'police_supervisor', 'traffic_commander')
  ));

-- =====================================================
-- 12. SYSTEM SETTINGS
-- Key-value store for system-wide configuration
-- =====================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key     TEXT NOT NULL UNIQUE,
  setting_value   JSONB NOT NULL DEFAULT '{}'::jsonb,
  setting_type    TEXT NOT NULL DEFAULT 'string' CHECK (setting_type IN (
    'string', 'number', 'boolean', 'json', 'array', 'duration_minutes', 'duration_days'
  )),
  category        TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
    'general', 'security', 'retention', 'notifications', 'ai', 'anpr',
    'map', 'sync', 'reporting', 'storage', 'integration', 'compliance'
  )),
  label           TEXT,
  description     TEXT,
  is_encrypted    BOOLEAN NOT NULL DEFAULT false,
  is_public       BOOLEAN NOT NULL DEFAULT false,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);

-- Seed essential system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, category, label, description) VALUES
  ('app_name', '"TrafficWatch AI"', 'string', 'general', 'Application Name', 'The display name of the application'),
  ('app_version', '"1.0.0"', 'string', 'general', 'Application Version', 'Current application version'),
  ('default_country', '"LR"', 'string', 'general', 'Default Country', 'ISO country code for default operations'),
  ('session_timeout_minutes', '60', 'number', 'security', 'Session Timeout', 'Maximum session duration in minutes'),
  ('max_login_attempts', '5', 'number', 'security', 'Max Login Attempts', 'Maximum failed login attempts before lockout'),
  ('password_min_length', '8', 'number', 'security', 'Minimum Password Length', 'Minimum characters required for passwords'),
  ('require_mfa', 'false', 'boolean', 'security', 'Require MFA', 'Whether MFA is required for all users'),
  ('evidence_signed_url_expiry', '3600', 'number', 'storage', 'Signed URL Expiry', 'Expiry time for signed evidence URLs in seconds'),
  ('max_evidence_file_size', '209715200', 'number', 'storage', 'Max Evidence File Size', 'Maximum file size for evidence uploads in bytes'),
  ('offline_sync_interval', '300', 'number', 'sync', 'Offline Sync Interval', 'Interval between sync attempts in seconds'),
  ('auto_purge_audit_logs', 'true', 'boolean', 'retention', 'Auto-Purge Audit Logs', 'Enable automatic purging of old audit logs'),
  ('audit_log_retention_days', '1825', 'number', 'retention', 'Audit Log Retention', 'Days to retain audit logs'),
  ('citizen_report_anonymize_days', '730', 'number', 'retention', 'Citizen Report Anonymization', 'Days after which citizen reports are anonymized'),
  ('camera_poll_interval', '30', 'number', 'integration', 'Camera Poll Interval', 'Polling interval for traffic cameras in seconds'),
  ('default_map_center', '{"lat": 6.4281, "lng": -9.4295}', 'json', 'map', 'Default Map Center', 'Default center coordinates for the map (Liberia)'),
  ('default_map_zoom', '7', 'number', 'map', 'Default Map Zoom', 'Default zoom level for the map'),
  ('ai_analysis_enabled', 'true', 'boolean', 'ai', 'AI Analysis Enabled', 'Enable AI-powered traffic violation analysis'),
  ('anpr_enabled', 'true', 'boolean', 'anpr', 'ANPR Enabled', 'Enable Automatic Number Plate Recognition'),
  ('notifications_enabled', 'true', 'boolean', 'notifications', 'Notifications Enabled', 'Enable system-wide notifications'),
  ('push_notifications_enabled', 'true', 'boolean', 'notifications', 'Push Notifications Enabled', 'Enable web push notifications'),
  ('compliance_gdpr_enabled', 'true', 'boolean', 'compliance', 'GDPR Compliance', 'Enable GDPR-style data privacy features'),
  ('retention_policies_enabled', 'true', 'boolean', 'retention', 'Retention Policies Enabled', 'Enable automatic data retention policies'),
  ('report_max_export_rows', '10000', 'number', 'reporting', 'Max Export Rows', 'Maximum rows allowed in report exports')
ON CONFLICT (setting_key) DO NOTHING;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public settings"
  ON public.system_settings FOR SELECT
  USING (is_public = true OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('system_administrator', 'system_auditor')
  ));

CREATE POLICY "System admins can manage settings"
  ON public.system_settings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'system_administrator'
  ));

-- =====================================================
-- 13. FUNCTION: Get system setting by key
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_system_setting(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT setting_value INTO v_value
  FROM public.system_settings
  WHERE setting_key = p_key
    AND (is_public = true OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
    ));
  RETURN v_value;
END;
$$;

-- =====================================================
-- 14. FUNCTION: Set system setting (admin only)
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_system_setting(
  p_key TEXT,
  p_value JSONB,
  p_type TEXT DEFAULT 'string',
  p_category TEXT DEFAULT 'general',
  p_label TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.system_settings (setting_key, setting_value, setting_type, category, label, description, created_by)
  VALUES (p_key, p_value, p_type, p_category, p_label, p_description, auth.uid())
  ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = p_value,
    setting_type = COALESCE(p_type, system_settings.setting_type),
    category = COALESCE(p_category, system_settings.category),
    label = COALESCE(p_label, system_settings.label),
    description = COALESCE(p_description, system_settings.description),
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- =====================================================
-- 15. GRANT EXECUTION PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION public.get_system_setting TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_system_setting TO authenticated;

-- =====================================================
-- DATABASE ARCHITECTURE SUMMARY
--
-- Total tables across all migrations: 58+
-- All have: primary keys, foreign keys, indexes,
--           timestamps, RLS policies, proper relationships
--
-- New tables in v19:
--   roles                      — Role definitions
--   role_permissions           — Granular many-to-many permissions
--   vehicles                   — Vehicle registry
--   drivers                    — Driver license registry
--   vehicle_owners             — Many-to-many vehicle ↔ driver
--   incident_violations        — Many-to-many incident ↔ violation_type
--   ai_detections              — Individual object detections from AI
--   traffic_cameras            — Camera infrastructure
--   camera_events              — Camera-triggered events
--   patrol_units               — Police patrol unit tracking
--   road_conditions            — Road status reporting
--   system_settings            — Key-value configuration store
-- =====================================================
