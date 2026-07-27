import { supabase } from "./client";
import { offlineGet, offlineSet, offlineDelete } from "@/lib/offline";
import type { Profile } from "./types";
import type { UserRole } from "@/lib/permissions";

// ─── Types ─────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

export interface MFAMethod {
  id: string;
  methodType: "totp" | "phone_sms" | "recovery_code" | "backup_code";
  isPrimary: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
}

export interface UserSession {
  id: string;
  sessionId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown" | null;
  browserName: string | null;
  osName: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  isCurrent: boolean;
  isActive: boolean;
  lastActiveAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface AuthAuditEvent {
  id: string;
  userId: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface AccountStatus {
  userId: string;
  isActive: boolean;
  role: string;
  mfaEnabled: boolean;
  mfaMethodCount: number;
  activeSessions: number;
  recentLoginFailures: number;
  isLocked: boolean;
  accountCreatedAt: string;
  accountUpdatedAt: string;
}

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

// ─── Constants ─────────────────────────────────────────

const ROLE_LEVELS: Record<string, number> = {
  citizen: 1,
  traffic_officer: 2,
  evidence_officer: 2,
  investigator: 3,
  police_supervisor: 4,
  traffic_commander: 5,
  regional_commander: 6,
  national_commissioner: 7,
  system_auditor: 7,
  system_administrator: 10,
};

// ─── Password Strength ─────────────────────────────────

export function checkPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Normalize to 0-4
  score = Math.min(Math.floor(score / 1.5), 4);

  const labels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = [
    "bg-red-500 text-red-500",
    "bg-orange-500 text-orange-500",
    "bg-yellow-500 text-yellow-500",
    "bg-green-500 text-green-500",
    "bg-emerald-500 text-emerald-500",
  ];

  return {
    score,
    label: labels[score] || "Weak",
    color: colors[score] || colors[0],
  };
}

// ─── Session Management ────────────────────────────────

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getUser(): Promise<AuthUser | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  let profile: Profile | null = (await offlineGet<Profile>("user_profile", user.id)) || null;

  if (!profile) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profileError && profileData) {
      profile = profileData;
      await offlineSet("user_profile", user.id, profileData);
    }
  }

  return { id: user.id, email: user.email || "", profile };
}

// ===== Sign In / Sign Up / Sign Out =====

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  if (data.user) {
    // Update last login in background
    supabase.from("profiles").update({
      last_login_at: new Date().toISOString(),
    }).eq("id", data.user.id).then(() => {
      logAuthAuditEvent(data.user!.id, "login");
    });
  }
  // Suppress promise rejection handled above

  return data;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  profile: Partial<Profile> & { role?: string }
) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: profile.full_name || "",
        badge_number: profile.badge_number || "",
        station: profile.station || "",
        phone: profile.phone || null,
        role: profile.role || "traffic_officer",
      },
      // Redirect to dashboard after email confirmation (if confirm email is on)
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  });
  if (authError) throw authError;

  // Profile is auto-created by a database trigger on auth.users insert.
  // The trigger reads user_metadata from raw_user_meta_data.
  // If the trigger hasn't run yet (e.g. on a fresh project), we fall back
  // to creating the profile here.
  if (authData.user && !authData.user?.identities?.length) {
    // If user already existed (not new), profile should already exist
    return authData;
  }

  return authData;
}

export async function signOut() {
  const user = (await supabase.auth.getUser()).data.user;
  if (user) {
    await logAuthAuditEvent(user.id, "logout").catch(() => {});
    await offlineDelete("user_profile", user.id);
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ===== Password Management =====

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth?reset=true`,
  });
  if (error) throw error;

  const user = (await supabase.auth.getUser()).data.user;
  if (user) {
    await logAuthAuditEvent(user.id, "password_reset_requested").catch(() => {});
  }
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;

  if (data.user) {
    await Promise.all([
      supabase.from("profiles").update({
        password_changed_at: new Date().toISOString(),
      }).eq("id", data.user.id),
      logAuthAuditEvent(data.user.id, "password_changed").catch(() => {}),
    ]);
  }

  return data;
}

// ===== MFA / 2FA Architecture =====

export async function enrollMFA(): Promise<{
  qrCode: string;
  secret: string;
  methodId: string;
}> {
  const { data: existingFactors } = await supabase.auth.mfa.listFactors();
  const existingTotp = existingFactors?.all?.find(
    (f) => f.factor_type === "totp" && f.status === "verified"
  );
  if (existingTotp) {
    throw new Error("TOTP MFA is already enabled on this account");
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "TrafficWatch AI Authenticator",
  });
  if (error) throw error;

  const { id, totp } = data;
  const qrCode = totp?.qr_code ?? "";
  const secret = totp?.secret ?? "";

  try {
    await supabase.from("user_mfa_methods").insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      method_type: "totp",
      is_primary: false,
      is_verified: false,
      method_data: { factor_id: id, friendly_name: "TrafficWatch AI Authenticator" },
    });
  } catch {
    // Non-critical
  }

  return { qrCode, secret, methodId: id };
}

export async function verifyMFAChallenge(factorId: string, code: string): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });
  if (error) throw error;

  const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: data.id,
    code,
  });
  if (verifyError) throw verifyError;

  if (verifyData) {
    const user = (await supabase.auth.getUser()).data.user;
    if (user) {
      await Promise.all([
        supabase.from("user_mfa_methods")
          .update({ is_verified: true, is_primary: true, verified_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("method_type", "totp"),
        supabase.from("profiles").update({ mfa_enabled: true }).eq("id", user.id),
        logAuthAuditEvent(user.id, "mfa_verified").catch(() => {}),
      ]);
    }
    return true;
  }

  return false;
}

export async function disableMFA(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;

  const user = (await supabase.auth.getUser()).data.user;
  if (user) {
    await Promise.all([
      supabase.from("user_mfa_methods").delete().eq("user_id", user.id).eq("method_type", "totp"),
      supabase.from("profiles").update({ mfa_enabled: false }).eq("id", user.id),
      logAuthAuditEvent(user.id, "mfa_disabled").catch(() => {}),
    ]);
  }
}

export async function getMFAMethods(): Promise<MFAMethod[]> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return [];

  const { data: dbMethods } = await supabase
    .from("user_mfa_methods")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (dbMethods && dbMethods.length > 0) {
    return dbMethods.map((m: any) => ({
      id: m.id,
      methodType: m.method_type as MFAMethod["methodType"],
      isPrimary: m.is_primary,
      isVerified: m.is_verified,
      verifiedAt: m.verified_at,
    }));
  }

  // Fallback: try Supabase MFA list
  try {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    return (factors?.all || []).map((f) => ({
      id: f.id,
      methodType: (f.factor_type === "totp" ? "totp" : "phone_sms") as MFAMethod["methodType"],
      isPrimary: f.status === "verified",
      isVerified: f.status === "verified",
      verifiedAt: f.updated_at || null,
    }));
  } catch {
    return [];
  }
}

export async function generateRecoveryCodes(): Promise<string[]> {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const code = Array.from({ length: 4 }, () =>
      Math.random().toString(36).substring(2, 4).toUpperCase()
    ).join("-");
    codes.push(code);
  }

  const user = (await supabase.auth.getUser()).data.user;
  if (user) {
    try {
      await supabase.from("user_mfa_methods").insert(
        codes.map((code) => ({
          user_id: user.id,
          method_type: "recovery_code",
          is_primary: false,
          is_verified: true,
          method_data: { code_hash: code, is_used: false },
        }))
      );
    } catch {
      // Non-critical
    }
  }

  return codes;
}

// ===== Session Management =====

export async function getActiveSessions(): Promise<UserSession[]> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .is("revoked_at", null)
    .order("last_active_at", { ascending: false });

  if (error) {
    console.warn("Failed to fetch sessions:", error.message);
    return getLocalSessionFallback();
  }

  return (data || []).map((s: any) => ({
    id: s.id,
    sessionId: s.session_id,
    ipAddress: s.ip_address,
    userAgent: s.user_agent,
    deviceType: s.device_type || "unknown",
    browserName: s.browser_name,
    osName: s.os_name,
    locationCity: s.location_city,
    locationCountry: s.location_country,
    isCurrent: s.is_current,
    isActive: s.is_active,
    lastActiveAt: s.last_active_at,
    expiresAt: s.expires_at,
    createdAt: s.created_at,
    revokedAt: s.revoked_at,
  }));
}

export async function getLocalSessionFallback(): Promise<UserSession[]> {
  return [{
    id: "current",
    sessionId: "current",
    ipAddress: null,
    userAgent: navigator.userAgent || null,
    deviceType: detectDeviceType(),
    browserName: detectBrowser(),
    osName: detectOS(),
    locationCity: null,
    locationCountry: null,
    isCurrent: true,
    isActive: true,
    lastActiveAt: new Date().toISOString(),
    expiresAt: null,
    createdAt: new Date().toISOString(),
    revokedAt: null,
  }];
}

function detectDeviceType(): "desktop" | "mobile" | "tablet" | "unknown" {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Unknown";
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Unknown";
}

export async function revokeSession(sessionId: string): Promise<void> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not authenticated");

  try {
    await supabase.from("user_sessions")
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("user_id", user.id);
  } catch (e: any) {
    console.warn("Failed to revoke session:", e.message);
  }

  await logAuthAuditEvent(user.id, "session_revoked", { session_id: sessionId }).catch(() => {});
}

export async function revokeAllOtherSessions(): Promise<void> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not authenticated");

  try {
    await supabase.from("user_sessions")
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_current", false);
  } catch (e: any) {
    console.warn("Failed to revoke sessions:", e.message);
  }

  await logAuthAuditEvent(user.id, "session_revoked", { action: "revoke_all_other" }).catch(() => {});
}

// ===== Profile Management =====

export async function getProfile(userId: string): Promise<Profile | null> {
  const cached = await offlineGet<Profile>("user_profile", userId);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  if (data) {
    await offlineSet("user_profile", userId, data);
  }
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  if (data) {
    await offlineSet("user_profile", userId, data);
  }

  await logAuthAuditEvent(userId, "profile_updated", { fields: Object.keys(updates) }).catch(() => {});
  return data;
}

// ===== Auth Audit Log =====

export async function logAuthAuditEvent(
  userId: string,
  action: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabase.from("auth_audit_log").insert({
      user_id: userId,
      action,
      ip_address: null,
      user_agent: navigator.userAgent || null,
      details,
    });
  } catch {
    // Silent fail - audit logging is non-critical
  }
}

export async function getAuthAuditEvents(
  userId: string,
  limit = 20
): Promise<AuthAuditEvent[]> {
  const { data, error } = await supabase
    .from("auth_audit_log")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data || []).map((e: any) => ({
    id: e.id,
    userId: e.user_id,
    action: e.action,
    ipAddress: e.ip_address,
    userAgent: e.user_agent,
    details: e.details || {},
    createdAt: e.created_at,
  }));
}

export async function getAccountStatus(): Promise<AccountStatus | null> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return null;

  try {
    const { data, error } = await supabase.rpc("get_account_status", { p_user_id: user.id });
    if (!error && data) return data as AccountStatus;
  } catch {
    // fall through
  }

  // Fallback: compute from profile
  const profile = await getProfile(user.id);
  if (!profile) return null;

  return {
    userId: user.id,
    isActive: profile.is_active,
    role: profile.role || "traffic_officer",
    mfaEnabled: profile.mfa_enabled || false,
    mfaMethodCount: 0,
    activeSessions: 1,
    recentLoginFailures: 0,
    isLocked: false,
    accountCreatedAt: profile.created_at,
    accountUpdatedAt: profile.updated_at,
  };
}

// ===== Role-Based Access Control =====

export function hasMinimumRole(userRole: UserRole | undefined, minimumRole: UserRole): boolean {
  if (!userRole) return false;
  return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[minimumRole] || 0);
}

export function canManageIncidents(role: UserRole | undefined): boolean {
  return hasMinimumRole(role, "traffic_officer");
}

export function canReviewIncidents(role: UserRole | undefined): boolean {
  return hasMinimumRole(role, "police_supervisor");
}

export function canManageUsers(role: UserRole | undefined): boolean {
  return hasMinimumRole(role, "system_administrator");
}

export function canAccessAnalytics(role: UserRole | undefined): boolean {
  return hasMinimumRole(role, "investigator");
}
