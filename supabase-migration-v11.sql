-- =====================================================
-- TrafficWatch AI - v11 Database Migration
-- Officer Portal: Notifications, Tasks, Duty Log
-- =====================================================

-- =====================================================
-- 1. OFFICER NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.officer_notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN (
    'case_assigned', 'case_updated', 'evidence_added', 'ai_analysis_complete',
    'anpr_pending', 'citizen_report', 'report_reviewed', 'comment_added',
    'escalated', 'status_changed', 'system_alert', 'task_assigned'
  )),
  title             TEXT NOT NULL,
  message           TEXT,
  reference_type    TEXT CHECK (reference_type IN ('incident', 'evidence', 'citizen_report', 'task', 'system')),
  reference_id      TEXT,
  priority          TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read           BOOLEAN NOT NULL DEFAULT false,
  is_dismissed      BOOLEAN NOT NULL DEFAULT false,
  action_url        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_officer_notifications_user ON public.officer_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_officer_notifications_type ON public.officer_notifications(type);

ALTER TABLE public.officer_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers view own notifications"
  ON public.officer_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Officers update own notifications"
  ON public.officer_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.officer_notifications FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR public.get_current_user_role() IN ('system_administrator', 'national_commissioner', 'regional_commander', 'traffic_commander', 'police_supervisor')
  );

-- =====================================================
-- 2. OFFICER TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.officer_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  task_type         TEXT NOT NULL CHECK (task_type IN (
    'investigation', 'evidence_review', 'report_filing', 'ai_review',
    'anpr_verify', 'citizen_followup', 'patrol', 'checkpoint', 'court',
    'training', 'admin', 'other'
  )),
  priority          TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
  due_at            TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  reference_type    TEXT CHECK (reference_type IN ('incident', 'evidence', 'citizen_report')),
  reference_id      TEXT,
  notes             TEXT,
  is_offline        BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_officer_tasks_officer ON public.officer_tasks(officer_id, status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_officer_tasks_due ON public.officer_tasks(due_at) WHERE status IN ('pending', 'in_progress');

ALTER TABLE public.officer_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers view own tasks"
  ON public.officer_tasks FOR SELECT
  USING (auth.uid() = officer_id OR auth.uid() = created_by OR public.get_current_user_role() IN ('system_administrator', 'police_supervisor'));

CREATE POLICY "Officers manage own tasks"
  ON public.officer_tasks FOR ALL
  USING (auth.uid() = officer_id);

CREATE POLICY "Supervisors create tasks"
  ON public.officer_tasks FOR INSERT
  WITH CHECK (
    auth.uid() = officer_id
    OR public.get_current_user_role() IN ('system_administrator', 'national_commissioner', 'regional_commander', 'traffic_commander', 'police_supervisor')
  );

-- =====================================================
-- 3. DUTY LOG (officer shift tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.officer_duty_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duty_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  shift_type        TEXT CHECK (shift_type IN ('morning', 'afternoon', 'night', 'full_day', 'custom')),
  clock_in          TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out         TIMESTAMPTZ,
  location_lat      DECIMAL(10,7),
  location_lng      DECIMAL(10,7),
  notes             TEXT,
  incident_count    INTEGER NOT NULL DEFAULT 0,
  citation_count    INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_officer_duty_officer ON public.officer_duty_log(officer_id, duty_date DESC);

ALTER TABLE public.officer_duty_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers manage own duty log"
  ON public.officer_duty_log FOR ALL
  USING (auth.uid() = officer_id);

CREATE POLICY "Supervisors view duty logs"
  ON public.officer_duty_log FOR SELECT
  USING (public.get_current_user_role() IN ('system_administrator', 'police_supervisor', 'national_commissioner', 'regional_commander', 'traffic_commander'));

-- =====================================================
-- 4. FUNCTION: create notification
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_officer_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal',
  p_action_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.officer_notifications (
    user_id, type, title, message, reference_type, reference_id, priority, action_url
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_reference_type, p_reference_id, p_priority, p_action_url
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- =====================================================
-- 5. FUNCTION: get unread notification count
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.officer_notifications
  WHERE user_id = auth.uid()
    AND is_read = false
    AND is_dismissed = false;
  RETURN v_count;
END;
$$;

-- =====================================================
-- 6. FUNCTION: mark notification as read
-- =====================================================
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.officer_notifications
  SET is_read = true, read_at = NOW()
  WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$;

-- =====================================================
-- 7. FUNCTION: get officer tasks for today
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_officer_today_tasks()
RETURNS SETOF public.officer_tasks
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.officer_tasks
  WHERE officer_id = auth.uid()
    AND status IN ('pending', 'in_progress')
  ORDER BY
    CASE priority
      WHEN 'urgent' THEN 0
      WHEN 'high' THEN 1
      WHEN 'normal' THEN 2
      WHEN 'low' THEN 3
    END,
    due_at ASC NULLS LAST,
    created_at DESC;
END;
$$;

-- =====================================================
-- 8. SEED NOTIFICATIONS (for demo/officer onboarding)
-- =====================================================
INSERT INTO public.officer_notifications (user_id, type, title, message, reference_type, reference_id, priority, action_url, created_at)
SELECT
  id AS user_id,
  'system_alert' AS type,
  'Welcome to TrafficWatch AI' AS title,
  'Your officer workspace is ready. Check your assigned cases and review queue.' AS message,
  'system' AS reference_type,
  NULL AS reference_id,
  'normal' AS priority,
  '/officer' AS action_url,
  NOW() - INTERVAL '1 hour' AS created_at
FROM auth.users
WHERE id IN (SELECT id FROM public.profiles WHERE role IN ('traffic_officer', 'investigator', 'police_supervisor'))
ON CONFLICT DO NOTHING;
