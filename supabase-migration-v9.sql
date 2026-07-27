-- =====================================================
-- TrafficWatch AI - v9 Database Migration
-- Auto-Create Profile on Sign-Up
--
-- Creates a database trigger that automatically inserts
-- a profile row when a new auth.users row is created.
-- This avoids RLS session issues with client-side inserts.
-- =====================================================

-- =====================================================
-- 1. Function: auto-create profile on user sign-up
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_full_name TEXT;
  v_badge_number TEXT;
  v_station TEXT;
  v_phone TEXT;
  v_role user_role;
BEGIN
  -- Extract metadata from raw_user_meta_data (set via options.data in signUp)
  v_full_name   := COALESCE(NEW.raw_user_meta_data ->> 'full_name', '');
  v_badge_number := COALESCE(NEW.raw_user_meta_data ->> 'badge_number', '');
  v_station     := COALESCE(NEW.raw_user_meta_data ->> 'station', '');
  v_phone       := COALESCE(NEW.raw_user_meta_data ->> 'phone', '');
  v_role        := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::user_role,
    'traffic_officer'::user_role
  );

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    badge_number,
    station,
    phone,
    avatar_url,
    is_active,
    mfa_enabled,
    password_changed_at,
    last_login_at,
    login_count
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_full_name,
    v_role,
    v_badge_number,
    v_station,
    NULLIF(v_phone, ''),
    NULL,
    true,
    false,
    NOW(),
    NOW(),
    1
  );

  RETURN NEW;
END;
$$;

-- =====================================================
-- 2. Trigger: fire on auth.users insert
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
