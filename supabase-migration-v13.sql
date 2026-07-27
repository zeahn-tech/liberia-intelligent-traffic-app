-- =====================================================
-- TrafficWatch AI - v13 Database Migration
-- Notification System: Preferences, Push, Templates, Log
-- =====================================================

-- =====================================================
-- 1. NOTIFICATION PREFERENCES
-- Per-user channel preferences for each notification type.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'case_assigned', 'case_updated', 'evidence_added', 'ai_analysis_complete',
    'anpr_pending', 'citizen_report', 'report_reviewed', 'comment_added',
    'escalated', 'status_changed', 'system_alert', 'task_assigned',
    'wanted_vehicle', 'stolen_vehicle', 'major_accident', 'road_closure'
  )),

  -- Channel toggles (default: all on)
  channel_in_app     BOOLEAN NOT NULL DEFAULT true,
  channel_push       BOOLEAN NOT NULL DEFAULT true,
  channel_email      BOOLEAN NOT NULL DEFAULT false,
  channel_sms        BOOLEAN NOT NULL DEFAULT false,

  -- Priority threshold: only notify for this level or above
  min_priority       TEXT NOT NULL DEFAULT 'normal'
                     CHECK (min_priority IN ('low', 'normal', 'high', 'urgent')),

  -- Quiet hours (optional)
  quiet_hours_start  TIME,
  quiet_hours_end    TIME,

  -- Digest: aggregate instead of individual
  digest_frequency   TEXT NOT NULL DEFAULT 'none'
                     CHECK (digest_frequency IN ('none', 'hourly', 'daily', 'weekly')),

  -- Metadata
  is_paused          BOOLEAN NOT NULL DEFAULT false,
  paused_until       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One preference row per user per type
  UNIQUE (user_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_prefs_type ON public.notification_preferences(notification_type);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification preferences"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can read notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (true);

-- =====================================================
-- 2. PUSH SUBSCRIPTIONS
-- Web push notification subscription storage.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint          TEXT NOT NULL,
  p256dh_key        TEXT NOT NULL,
  auth_key          TEXT NOT NULL,
  user_agent        TEXT,
  device_type       TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ,

  -- Prevent duplicate subscriptions
  UNIQUE (endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id, is_active);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can read push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (true);

-- =====================================================
-- 3. NOTIFICATION LOG (Delivery Audit Trail)
-- Every notification dispatch is recorded here.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id   UUID REFERENCES public.officer_notifications(id) ON DELETE SET NULL,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel           TEXT NOT NULL CHECK (channel IN ('in_app', 'push', 'email', 'sms')),
  status            TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
  error_message     TEXT,
  provider_response JSONB,
  delivery_attempts INTEGER NOT NULL DEFAULT 1,
  opened_at         TIMESTAMPTZ,
  clicked_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_log_user ON public.notification_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_log_notification ON public.notification_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_notif_log_channel ON public.notification_log(channel, status);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notification log"
  ON public.notification_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notification log"
  ON public.notification_log FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 4. NOTIFICATION TEMPLATES
-- Editable message templates per type + channel combo.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'case_assigned', 'case_updated', 'evidence_added', 'ai_analysis_complete',
    'anpr_pending', 'citizen_report', 'report_reviewed', 'comment_added',
    'escalated', 'status_changed', 'system_alert', 'task_assigned',
    'wanted_vehicle', 'stolen_vehicle', 'major_accident', 'road_closure'
  )),
  channel           TEXT NOT NULL CHECK (channel IN ('in_app', 'push', 'email', 'sms')),

  -- Template text with {{variable}} placeholders
  title_template    TEXT NOT NULL,
  body_template     TEXT,
  priority          TEXT NOT NULL DEFAULT 'normal'
                     CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- For email: optional HTML template
  html_template     TEXT,

  -- For SMS: character limit aware
  sms_template      TEXT,

  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (notification_type, channel)
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read templates"
  ON public.notification_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage templates"
  ON public.notification_templates FOR ALL
  USING (public.get_current_user_role() = 'system_administrator')
  WITH CHECK (public.get_current_user_role() = 'system_administrator');

-- =====================================================
-- 5. SEED: Default notification templates
-- =====================================================
INSERT INTO public.notification_templates (notification_type, channel, title_template, body_template, priority, sms_template) VALUES
  ('case_assigned', 'in_app', 'Case Assigned: {{title}}', 'You have been assigned to investigate {{reference_number}}. {{description}}', 'normal', NULL),
  ('case_assigned', 'push', 'New Case: {{title}}', 'Case {{reference_number}} has been assigned to you.', 'normal', 'Case {{reference_number}} assigned to you. Pls investigate.'),
  ('case_assigned', 'email', 'Case Assignment: {{reference_number}}', 'You have been assigned to case {{reference_number}} ({{title}}). Log in to TrafficWatch AI for details.', 'normal', NULL),
  ('evidence_added', 'in_app', 'Evidence Added: {{title}}', 'New {{evidence_type}} evidence has been added to {{reference_number}}.', 'normal', NULL),
  ('evidence_added', 'push', 'New Evidence: {{title}}', '{{officer_name}} added {{evidence_type}} evidence to {{reference_number}}.', 'normal', 'Evidence added to {{reference_number}}.'),
  ('ai_analysis_complete', 'in_app', 'AI Analysis Complete: {{reference_number}}', 'AI analysis of {{evidence_type}} for {{reference_number}} is ready for review. Confidence: {{confidence}}%.', 'normal', NULL),
  ('ai_analysis_complete', 'push', 'AI Ready: {{reference_number}}', 'AI analysis complete for {{reference_number}}. Confidence: {{confidence}}%.', 'normal', 'AI analysis ready for {{reference_number}}.'),
  ('anpr_pending', 'in_app', 'ANPR Scan Pending Review', 'License plate {{plate_text}} detected. Confidence: {{confidence}}%. Please verify.', 'normal', NULL),
  ('anpr_pending', 'push', 'ANPR: {{plate_text}}', 'Plate {{plate_text}} detected at {{location}}. Verify the scan.', 'high', 'Plate {{plate_text}} detected. Verify.'),
  ('citizen_report', 'in_app', 'Citizen Report: {{reference_number}}', 'A new citizen report ({{report_type}}) has been submitted. Review pending.', 'normal', NULL),
  ('citizen_report', 'push', 'Citizen Report: {{report_type}}', 'New citizen report submitted. {{description}}', 'normal', NULL),
  ('escalated', 'in_app', 'Case Escalated: {{reference_number}}', 'Case {{reference_number}} has been escalated by {{officer_name}}. Priority: {{priority}}.', 'high', NULL),
  ('escalated', 'push', 'Escalation: {{reference_number}}', '{{officer_name}} escalated {{reference_number}}. Immediate attention required.', 'urgent', 'Case {{reference_number}} escalated. Immediate attention.'),
  ('escalated', 'email', 'Escalation Notice: {{reference_number}}', 'Case {{reference_number}} has been escalated by {{officer_name}} with priority {{priority}}. Please review immediately.', 'high', NULL),
  ('system_alert', 'in_app', 'System Alert: {{title}}', '{{description}}', 'high', NULL),
  ('system_alert', 'push', '🚨 System Alert', '{{description}}', 'urgent', NULL),
  ('system_alert', 'sms', 'Alert: {{title}}', NULL, 'urgent', 'TW AI Alert: {{description}}'),
  ('task_assigned', 'in_app', 'Task Assigned: {{title}}', '{{description}} Due: {{due_date}}', 'normal', NULL),
  ('task_assigned', 'push', 'New Task: {{title}}', '{{description}}', 'normal', 'Task: {{title}}. {{description}}'),
  ('wanted_vehicle', 'in_app', 'WANTED Vehicle Alert!', 'Wanted vehicle {{plate_text}} ({{make}} {{model}}) detected at {{location}}. Approach with caution.', 'urgent', NULL),
  ('wanted_vehicle', 'push', '🚨 WANTED: {{plate_text}}', 'Wanted vehicle {{plate_text}} detected! Take immediate action.', 'urgent', 'WANTED: {{plate_text}} at {{location}}.'),
  ('wanted_vehicle', 'sms', 'WANTED Vehicle Alert', NULL, 'urgent', 'TW AI WANTED: {{plate_text}} at {{location}}.'),
  ('stolen_vehicle', 'in_app', 'STOLEN Vehicle Alert!', 'Stolen vehicle {{plate_text}} ({{make}} {{model}}) detected at {{location}}.', 'urgent', NULL),
  ('stolen_vehicle', 'push', '🚨 STOLEN: {{plate_text}}', 'Stolen vehicle {{plate_text}} detected! Verify and detain.', 'urgent', 'STOLEN: {{plate_text}} at {{location}}.'),
  ('stolen_vehicle', 'sms', 'STOLEN Vehicle Alert', NULL, 'urgent', 'TW AI STOLEN: {{plate_text}} at {{location}}.'),
  ('major_accident', 'in_app', 'Major Accident Reported: {{location}}', 'A {{severity}} accident has been reported at {{location}}. Dispatch emergency response.', 'high', NULL),
  ('major_accident', 'push', '🚑 Accident: {{location}}', 'Major accident at {{location}}. Respond immediately.', 'urgent', 'Accident at {{location}}. Respond.'),
  ('major_accident', 'sms', 'Accident Alert', NULL, 'urgent', 'TW AI: Accident at {{location}}.'),
  ('road_closure', 'in_app', 'Road Closure: {{title}}', '{{description}} at {{location}}. Expected duration: {{duration}}.', 'normal', NULL),
  ('road_closure', 'push', 'Road Closed: {{title}}', '{{location}} is closed due to {{reason}}. Find alternate routes.', 'normal', 'Road closed at {{location}} due to {{reason}}.')
ON CONFLICT (notification_type, channel) DO NOTHING;

-- =====================================================
-- 6. Functions: Preference management
-- =====================================================

-- Auto-create default preferences when a user is created
CREATE OR REPLACE FUNCTION public.auto_create_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  notif_types TEXT[] := ARRAY[
    'case_assigned', 'case_updated', 'evidence_added', 'ai_analysis_complete',
    'anpr_pending', 'citizen_report', 'report_reviewed', 'comment_added',
    'escalated', 'status_changed', 'system_alert', 'task_assigned',
    'wanted_vehicle', 'stolen_vehicle', 'major_accident', 'road_closure'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY notif_types
  LOOP
    INSERT INTO public.notification_preferences (user_id, notification_type)
    VALUES (NEW.id, t)
    ON CONFLICT (user_id, notification_type) DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Trigger: auto-create notification preferences on user creation
DROP TRIGGER IF EXISTS on_user_created_notif_prefs ON auth.users;
CREATE TRIGGER on_user_created_notif_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_notification_preferences();

-- Function: get user's active channels for a notification type
CREATE OR REPLACE FUNCTION public.get_active_channels_for_type(
  p_user_id UUID,
  p_notification_type TEXT
)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_prefs public.notification_preferences;
  v_channels TEXT[] := '{}';
  v_now TIME := CURRENT_TIME;
BEGIN
  SELECT * INTO v_prefs
  FROM public.notification_preferences
  WHERE user_id = p_user_id
    AND notification_type = p_notification_type;

  IF NOT FOUND THEN
    RETURN ARRAY['in_app']; -- default fallback
  END IF;

  -- Check pause status
  IF v_prefs.is_paused AND (v_prefs.paused_until IS NULL OR v_prefs.paused_until > NOW()) THEN
    RETURN '{}';
  END IF;

  -- Check quiet hours
  IF v_prefs.quiet_hours_start IS NOT NULL
     AND v_prefs.quiet_hours_end IS NOT NULL
     AND v_now BETWEEN v_prefs.quiet_hours_start AND v_prefs.quiet_hours_end THEN
    RETURN ARRAY['in_app']; -- only in-app during quiet hours
  END IF;

  -- Build active channels array
  IF v_prefs.channel_in_app THEN
    v_channels := array_append(v_channels, 'in_app');
  END IF;
  IF v_prefs.channel_push AND p_notification_type NOT IN ('case_updated', 'comment_added', 'status_changed') THEN
    v_channels := array_append(v_channels, 'push');
  END IF;
  IF v_prefs.channel_email AND p_notification_type IN ('case_assigned', 'escalated', 'system_alert', 'wanted_vehicle', 'stolen_vehicle', 'major_accident') THEN
    v_channels := array_append(v_channels, 'email');
  END IF;
  IF v_prefs.channel_sms AND p_notification_type IN ('wanted_vehicle', 'stolen_vehicle', 'major_accident', 'system_alert') THEN
    v_channels := array_append(v_channels, 'sms');
  END IF;

  RETURN v_channels;
END;
$$;

-- Function: log a notification delivery attempt
CREATE OR REPLACE FUNCTION public.log_notification_delivery(
  p_notification_id UUID,
  p_user_id UUID,
  p_channel TEXT,
  p_status TEXT DEFAULT 'sent',
  p_error_message TEXT DEFAULT NULL,
  p_provider_response JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.notification_log (notification_id, user_id, channel, status, error_message, provider_response)
  VALUES (p_notification_id, p_user_id, p_channel, p_status, p_error_message, p_provider_response)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;
