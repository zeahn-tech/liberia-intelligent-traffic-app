// ============================================================
// TrafficWatch AI — Users API Service
//
// Domain: User & profile management, role assignment
// ============================================================

import { supabase } from "@/supabase/client";
import type { Profile } from "@/supabase/types";
import {
  executeQuery,
  executePaginatedQuery,
  success,
  failure,
  buildSelect,
  FIELD_SETS,
  type ApiResponse,
  type PaginatedResponse,
  type ValidationResult,
} from "./base";

// ─── Constants ───────────────────────────────────────────

const SELECT_FIELDS = buildSelect([...FIELD_SETS.user]);

// ─── Types ───────────────────────────────────────────────

export interface UserFilter {
  role?: string;
  station?: string;
  county_code?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ─── CRUD Operations ─────────────────────────────────────

/**
 * List users with optional filters and pagination.
 */
export async function listUsers(filter: UserFilter = {}): Promise<PaginatedResponse<Profile>> {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 20;

  return executePaginatedQuery<Profile>(
    "profiles",
    (q) => {
      let query = q.select(SELECT_FIELDS);

      if (filter.role) query = query.eq("role", filter.role);
      if (filter.station) query = query.eq("station", filter.station);
      if (filter.is_active !== undefined) query = query.eq("is_active", filter.is_active);
      if (filter.search) {
        query = query.or(
          `full_name.ilike.%${filter.search}%,email.ilike.%${filter.search}%,badge_number.ilike.%${filter.search}%`
        );
      }

      return query.order("full_name", { ascending: true });
    },
    page,
    pageSize,
    { label: "users.list" }
  );
}

/**
 * Get a single user profile by ID.
 */
export async function getUser(id: string): Promise<ApiResponse<Profile>> {
  return executeQuery(
    supabase.from("profiles").select(SELECT_FIELDS).eq("id", id).maybeSingle(),
    { label: "users.get" }
  );
}

/**
 * Update a user's profile.
 */
export async function updateUser(
  id: string,
  updates: Partial<Pick<Profile, "full_name" | "phone" | "station" | "badge_number" | "department" | "division">>
): Promise<ApiResponse<Profile>> {
  return executeQuery(
    supabase.from("profiles").update(updates).eq("id", id).select(SELECT_FIELDS).single(),
    { label: "users.update" }
  );
}

/**
 * Change a user's role (admin only — enforced by RLS).
 */
export async function changeUserRole(
  userId: string,
  newRole: string
): Promise<ApiResponse<Profile>> {
  return executeQuery(
    supabase.from("profiles").update({ role: newRole }).eq("id", userId).select(SELECT_FIELDS).single(),
    { label: "users.change_role" }
  );
}

/**
 * Activate or deactivate a user account (admin only).
 */
export async function setUserActiveStatus(
  userId: string,
  isActive: boolean
): Promise<ApiResponse<Profile>> {
  return executeQuery(
    supabase.from("profiles").update({ is_active: isActive }).eq("id", userId).select(SELECT_FIELDS).single(),
    { label: "users.toggle_active" }
  );
}

// ─── Role & Station Management ───────────────────────────

/**
 * Get all available roles.
 */
export async function getRoles(): Promise<ApiResponse<{ name: string; label: string; hierarchy_level: number }[]>> {
  return executeQuery(
    supabase.from("roles").select("name, label, hierarchy_level").order("hierarchy_level", { ascending: true }),
    { label: "users.roles" }
  );
}

/**
 * Get all officers for assignment dropdowns.
 */
export async function getOfficers(
  station?: string
): Promise<ApiResponse<Pick<Profile, "id" | "full_name" | "badge_number" | "role">[]>> {
  let query = supabase
    .from("profiles")
    .select("id, full_name, badge_number, role")
    .neq("role", "citizen")
    .eq("is_active", true);

  if (station) query = query.eq("station", station);

  return executeQuery(query.order("full_name", { ascending: true }), { label: "users.officers" });
}

/**
 * Get officers by county for jurisdiction-based assignments.
 */
export async function getOfficersByCounty(countyCode: string): Promise<
  ApiResponse<Pick<Profile, "id" | "full_name" | "badge_number" | "role">[]>
> {
  return executeQuery(
    supabase.from("profiles")
      .select("id, full_name, badge_number, role")
      .eq("county_code", countyCode)
      .neq("role", "citizen")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    { label: "users.by_county" }
  );
}

// ─── User Statistics ─────────────────────────────────────

/**
 * Get user statistics for admin dashboards.
 */
export async function getUserStats(): Promise<
  ApiResponse<{ total: number; active: number; by_role: Record<string, number> }>
> {
  const { data: allUsers, error } = await supabase
    .from("profiles")
    .select("role, is_active");

  if (error) return failure("QUERY_FAILED", error.message);

  const byRole: Record<string, number> = {};
  let active = 0;

  allUsers?.forEach((u) => {
    byRole[u.role] = (byRole[u.role] || 0) + 1;
    if (u.is_active) active++;
  });

  return success({
    total: allUsers?.length || 0,
    active,
    by_role: byRole,
  });
}
