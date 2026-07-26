-- =====================================================
-- TrafficWatch AI - v2 Database Migration
-- New statuses, tables for incident management
-- =====================================================

-- 1. Extend incident_status enum with new states
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'investigating';
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'escalated';
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'closed';
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'archived';

-- Note: If you get "cannot add value to enum after usage" error,
-- run this instead (uncomment):
-- ALTER TABLE public.incidents ALTER COLUMN status TYPE TEXT;
-- DROP TYPE incident_status;
-- CREATE TYPE incident_status AS ENUM ('draft','submitted','under_review','assigned','investigating','escalated','confirmed','resolved','closed','rejected','archived');
-- ALTER TABLE public.incidents ALTER COLUMN status TYPE incident_status USING status::incident_status;

-- =====================================================
-- INVOLVED PERSONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.involved_persons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id     UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  id_type         TEXT NOT NULL DEFAULT 'drivers_license' CHECK (id_type IN ('drivers_license', 'national_id', 'passport', 'other')),
  id_number       TEXT,
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  role            TEXT NOT NULL CHECK (role IN ('driver', 'passenger', 'pedestrian', 'owner', 'other')),
  statement       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_persons_incident ON public.involved_persons(incident_id);
CREATE INDEX idx_persons_role ON public.involved_persons(role);

ALTER TABLE public.involved_persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read persons for accessible incidents"
  ON public.involved_persons FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.incidents WHERE id = involved_persons.incident_id AND (officer_id = auth.uid() OR public.get_current_user_role() IN ('supervisor', 'admin', 'investigator')))
  );

CREATE POLICY "Users can manage persons for their incidents"
  ON public.involved_persons FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.incidents WHERE id = involved_persons.incident_id AND officer_id = auth.uid())
  );

CREATE POLICY "Officers can update persons"
  ON public.involved_persons FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.incidents WHERE id = involved_persons.incident_id AND officer_id = auth.uid())
  );

-- =====================================================
-- WITNESSES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.witnesses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id     UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  statement       TEXT,
  consent_given   BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_witnesses_incident ON public.witnesses(incident_id);

ALTER TABLE public.witnesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read witnesses for accessible incidents"
  ON public.witnesses FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.incidents WHERE id = witnesses.incident_id AND (officer_id = auth.uid() OR public.get_current_user_role() IN ('supervisor', 'admin', 'investigator')))
  );

CREATE POLICY "Users can manage witnesses for their incidents"
  ON public.witnesses FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.incidents WHERE id = witnesses.incident_id AND officer_id = auth.uid())
  );

-- =====================================================
-- INCIDENT ASSIGNMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.incident_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id     UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  assigned_to     UUID NOT NULL REFERENCES public.profiles(id),
  assigned_by     UUID NOT NULL REFERENCES public.profiles(id),
  role            TEXT NOT NULL CHECK (role IN ('investigator', 'reviewer', 'supervisor')),
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  unassigned_at   TIMESTAMPTZ
);

CREATE INDEX idx_assignments_incident ON public.incident_assignments(incident_id);
CREATE INDEX idx_assignments_officer ON public.incident_assignments(assigned_to);
CREATE INDEX idx_assignments_active ON public.incident_assignments(is_active);

ALTER TABLE public.incident_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read assignments for accessible incidents"
  ON public.incident_assignments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.incidents WHERE id = incident_assignments.incident_id AND (officer_id = auth.uid() OR assigned_to = auth.uid() OR public.get_current_user_role() IN ('supervisor', 'admin', 'investigator')))
  );

CREATE POLICY "Supervisors can manage assignments"
  ON public.incident_assignments FOR ALL
  USING (public.get_current_user_role() IN ('supervisor', 'admin'));

-- =====================================================
-- INCIDENT LOGS (audit trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.incident_logs (
  id              BIGSERIAL PRIMARY KEY,
  incident_id     UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,
  performed_by    UUID NOT NULL REFERENCES public.profiles(id),
  details         JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_logs_incident ON public.incident_logs(incident_id);
CREATE INDEX idx_logs_created ON public.incident_logs(created_at DESC);

ALTER TABLE public.incident_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read logs for accessible incidents"
  ON public.incident_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.incidents WHERE id = incident_logs.incident_id AND (officer_id = auth.uid() OR public.get_current_user_role() IN ('supervisor', 'admin', 'investigator')))
  );

CREATE POLICY "Users can insert logs"
  ON public.incident_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- TRIGGER for involved_persons and witnesses updated_at
-- =====================================================
CREATE TRIGGER update_persons_updated_at
  BEFORE UPDATE ON public.involved_persons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
