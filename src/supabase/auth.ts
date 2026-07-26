import { supabase } from "./client";
import { offlineGet, offlineSet, offlineDelete } from "@/lib/offline";
import type { Profile } from "./types";

export type UserRole = "officer" | "supervisor" | "admin" | "investigator";

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

// ===== Session Management =====

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getUser(): Promise<AuthUser | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // Try to get cached profile first (for offline)
  let profile: Profile | null = (await offlineGet<Profile>("user_profile", user.id)) || null;

  if (!profile) {
    // Fetch from server
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profileError && profileData) {
      profile = profileData;
      // Cache locally
      await offlineSet("user_profile", user.id, profileData);
    }
  }

  return {
    id: user.id,
    email: user.email || "",
    profile,
  };
}

// ===== Sign In / Sign Up =====

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string, profile: Partial<Profile>) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (authError) throw authError;

  if (authData.user) {
    // Create profile
    const { error: profileError } = await (supabase.from("profiles") as any).insert({
      id: authData.user.id,
      email,
      full_name: profile.full_name || "",
      role: (profile.role as UserRole) || "officer",
      badge_number: profile.badge_number || "",
      station: profile.station || "",
      phone: profile.phone || null,
      avatar_url: null,
      is_active: true,
    });
    if (profileError) throw profileError;
  }

  return authData;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  // Clear local profile cache
  const user = (await supabase.auth.getUser()).data.user;
  if (user) {
    await offlineDelete("user_profile", user.id);
  }
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth?reset=true`,
  });
  if (error) throw error;
}

// ===== Profile Management =====

export async function getProfile(userId: string): Promise<Profile | null> {
  // Try cache first
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
  const { data, error } = await (supabase.from("profiles") as any)
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  // Update cache
  if (data) {
    await offlineSet("user_profile", userId, data);
  }
  return data;
}

// ===== Role-Based Access Control =====

const ROLE_HIERARCHY: Record<UserRole, number> = {
  officer: 1,
  investigator: 2,
  supervisor: 3,
  admin: 4,
};

export function hasMinimumRole(userRole: UserRole | undefined, minimumRole: UserRole): boolean {
  if (!userRole) return false;
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minimumRole] || 0);
}

export function canManageIncidents(role: UserRole | undefined): boolean {
  return hasMinimumRole(role, "officer");
}

export function canReviewIncidents(role: UserRole | undefined): boolean {
  return hasMinimumRole(role, "supervisor");
}

export function canManageUsers(role: UserRole | undefined): boolean {
  return hasMinimumRole(role, "admin");
}

export function canAccessAnalytics(role: UserRole | undefined): boolean {
  return hasMinimumRole(role, "investigator");
}
