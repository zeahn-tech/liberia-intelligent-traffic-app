-- =====================================================
-- TrafficWatch AI - v8 Database Migration
-- Authentication Enhancement
--
-- MFA tracking, session management, auth audit logging,
-- password reset tracking, account status management.
-- =====================================================

-- =====================================================
-- 1. MFA METHODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_mfa_methods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type     TEXT NOT NULL CHECK (method_type IN ('totp', 'phone_sms', 'recovery_code', 'backup_code')),
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  is_verified     BOOLEAN NOT NULL DEFAULT false,
  verified_at     TIMESTAMPTZ,
  method_data     JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_mfa_methods_user_id ON public.user_mfa_methods(user_id);

ALTER TABLE public.user_mfa_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own MFA methods"
  ON public.user_mfa_methods FOR ALL
  USING (auth.uid() = user_id OR public.get_current_user_role() = 'system_administrator');

-- =====================================================
-- 2. ACTIVE SESSIONS TABLE (mirrors auth.sessions for visibility)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id      TEXT,
  ip_address      TEXT,
  user_agent      TEXT,
  device_type     TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser_name    TEXT,
  os_name         TEXT,
  location_city   TEXT,
  location_country TEXT,
  is_current      BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_active_at  TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(user_id, is_active);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id OR public.get_current_user_role() = 'system_administrator');

CREATE POLICY "Users can revoke their own sessions"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id OR public.get_current_user_role() = 'system_administrator');

-- =====================================================
-- 3. AUTH AUDIT LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL CHECK (action IN (
    'login', 'login_failed', 'logout', 'password_reset_requested',
    'password_reset_completed', 'password_changed', 'mfa_enrolled',
    'mfa_verified', 'mfa_disabled', 'recovery_code_used',
    'session_expired', 'session_revoked', 'account_locked',
    'account_unlocked', 'account_deactivated', 'account_activated',
    'role_changed', 'email_changed', 'profile_updated'
  )),
  ip_address       TEXT,
  user_agent       TEXT,
  details          JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_log_user_id ON public.auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_action ON public.auth_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created_at ON public.auth_audit_log(created_at DESC);

ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auditors and admins can view auth audit log"
  ON public.auth_audit_log FOR SELECT
  USING (
    public.has_permission('can_view_audit_logs')
    OR auth.uid() = user_id
  );

-- =====================================================
-- 4. PASSWORD RESET TOKENS TABLE (for tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  used_at         TIMESTAMPTZ,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON public.password_reset_tokens(expires_at);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view password reset tokens"
  ON public.password_reset_tokens FOR SELECT
  USING (public.has_permission('can_configure_system'));

-- =====================================================
-- 5. ACCOUNT STATUS HELPER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_account_status(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_mfa_count INTEGER;
  v_active_sessions INTEGER;
  v_recent_failures INTEGER;
  v_result JSONB;
BEGIN
  -- Get profile
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;

  -- Get MFA count
  SELECT COUNT(*) INTO v_mfa_count
  FROM public.user_mfa_methods
  WHERE user_id = p_user_id AND is_verified = true;

  -- Get active session count
  SELECT COUNT(*) INTO v_active_sessions
  FROM public.user_sessions
  WHERE user_id = p_user_id AND is_active = true AND revoked_at IS NULL;

  -- Get recent login failures (last 24 hours)
  SELECT COUNT(*) INTO v_recent_failures
  FROM public.auth_audit_log
  WHERE user_id = p_user_id AND action = 'login_failed' AND created_at > now() - INTERVAL '24 hours';

  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'is_active', COALESCE(v_profile.is_active, false),
    'role', v_profile.role::TEXT,
    'mfa_enabled', v_mfa_count > 0,
    'mfa_method_count', v_mfa_count,
    'active_sessions', v_active_sessions,
    'recent_login_failures', v_recent_failures,
    'is_locked', v_recent_failures >= 5,
    'password_last_changed', null,
    'account_created_at', v_profile.created_at,
    'account_updated_at', v_profile.updated_at
  );

  RETURN v_result;
END;
$$;

-- =====================================================
-- 6. LOG AUTH AUDIT EVENT FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_user_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.auth_audit_log (user_id, action, ip_address, user_agent, details)
  VALUES (
    p_user_id,
    p_action,
    current_setting('request.headers')::jsonb ->> 'x-forwarded-for',
    current_setting('request.headers')::jsonb ->> 'user-agent',
    p_details
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- =====================================================
-- 7. ADD EXTRA COLUMNS TO PROFILES (if not exist)
-- =====================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_ip TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lock_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS division TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reporting_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- =====================================================
-- 8. UPDATED get_current_user_role (with MFA check)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_role user_role;
  v_is_active BOOLEAN;
  v_locked_until TIMESTAMPTZ;
BEGIN
  SELECT p.role, p.is_active, p.account_locked_until
  INTO v_role, v_is_active, v_locked_until
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF v_role IS NULL THEN
    RETURN 'citizen'::user_role;
  END IF;

  -- Check if account is locked
  IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
    RETURN 'citizen'::user_role;
  END IF;

  RETURN v_role;
END;
$$;
