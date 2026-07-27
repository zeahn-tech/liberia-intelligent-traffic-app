// ============================================================
// TrafficWatch AI — Frontend Permission System
//
// This mirrors the database permission matrix for frontend use.
// IMPORTANT: Frontend checks are UX convenience only.
// ALL authorization is ENFORCED at the database/RLS level.
// ============================================================

import { useAuth } from "@/hooks/use-auth";

// ─── 10 Roles matching the database enum ─────────────────

export const ROLES = [
  "system_administrator",
  "national_commissioner",
  "regional_commander",
  "traffic_commander",
  "police_supervisor",
  "traffic_officer",
  "investigator",
  "evidence_officer",
  "system_auditor",
  "citizen",
] as const;

export type UserRole = (typeof ROLES)[number];

// ─── Human-readable labels ──────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  system_administrator: "System Administrator",
  national_commissioner: "National Police Commissioner",
  regional_commander: "Regional Commander",
  traffic_commander: "Traffic Commander",
  police_supervisor: "Police Supervisor",
  traffic_officer: "Traffic Officer",
  investigator: "Investigator",
  evidence_officer: "Evidence Officer",
  system_auditor: "System Auditor",
  citizen: "Citizen",
};

// ─── All permission keys (mirrors DB columns) ───────────

export const PERMISSIONS = [
  "view_dashboard",
  "create_incidents",
  "edit_incidents",
  "assign_incidents",
  "delete_incidents",
  "view_all_incidents",
  "access_evidence",
  "download_evidence",
  "export_evidence",
  "delete_evidence",
  "manage_users",
  "view_users",
  "run_ai_analysis",
  "review_ai_analysis",
  "view_reports",
  "generate_reports",
  "view_analytics",
  "view_audit_logs",
  "export_audit_logs",
  "configure_system",
  "manage_settings",
  "manage_roles",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// ─── Permission matrix (mirrors DB seed data) ───────────

const PERMISSION_MATRIX: Record<UserRole, Permission[]> = {
  system_administrator: [...PERMISSIONS],

  national_commissioner: [
    "view_dashboard",
    "create_incidents",
    "edit_incidents",
    "assign_incidents",
    "view_all_incidents",
    "access_evidence",
    "download_evidence",
    "export_evidence",
    "view_users",
    "run_ai_analysis",
    "review_ai_analysis",
    "view_reports",
    "generate_reports",
    "view_analytics",
    "view_audit_logs",
    "export_audit_logs",
  ],

  regional_commander: [
    "view_dashboard",
    "create_incidents",
    "edit_incidents",
    "assign_incidents",
    "access_evidence",
    "download_evidence",
    "export_evidence",
    "view_users",
    "run_ai_analysis",
    "review_ai_analysis",
    "view_reports",
    "generate_reports",
    "view_analytics",
  ],

  traffic_commander: [
    "view_dashboard",
    "create_incidents",
    "edit_incidents",
    "assign_incidents",
    "view_all_incidents",
    "access_evidence",
    "download_evidence",
    "export_evidence",
    "view_users",
    "run_ai_analysis",
    "review_ai_analysis",
    "view_reports",
    "generate_reports",
    "view_analytics",
  ],

  police_supervisor: [
    "view_dashboard",
    "create_incidents",
    "edit_incidents",
    "assign_incidents",
    "view_all_incidents",
    "access_evidence",
    "download_evidence",
    "run_ai_analysis",
    "review_ai_analysis",
    "view_reports",
    "generate_reports",
    "view_analytics",
  ],

  traffic_officer: [
    "view_dashboard",
    "create_incidents",
    "edit_incidents",
    "access_evidence",
    "download_evidence",
    "run_ai_analysis",
    "view_reports",
    "view_analytics",
  ],

  investigator: [
    "view_dashboard",
    "create_incidents",
    "edit_incidents",
    "view_all_incidents",
    "access_evidence",
    "download_evidence",
    "export_evidence",
    "run_ai_analysis",
    "review_ai_analysis",
    "view_reports",
    "generate_reports",
    "view_analytics",
    "view_audit_logs",
  ],

  evidence_officer: [
    "access_evidence",
    "download_evidence",
    "export_evidence",
    "delete_evidence",
  ],

  system_auditor: [
    "view_dashboard",
    "view_all_incidents",
    "access_evidence",
    "download_evidence",
    "export_evidence",
    "view_users",
    "view_reports",
    "generate_reports",
    "view_analytics",
    "view_audit_logs",
    "export_audit_logs",
  ],

  citizen: [
    "create_incidents",
  ],
};

// ─── Permission checking functions ──────────────────────

/**
 * Check whether a given role has a specific permission.
 * This is a pure function — no React needed.
 */
export function roleHasPermission(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const perms = PERMISSION_MATRIX[role];
  if (!perms) return false;
  return perms.includes(permission);
}

/**
 * Check whether a given role has ALL of the specified permissions.
 */
export function roleHasAllPermissions(role: UserRole | undefined | null, permissions: Permission[]): boolean {
  return permissions.every((p) => roleHasPermission(role, p));
}

/**
 * Check whether a given role has ANY of the specified permissions.
 */
export function roleHasAnyPermission(role: UserRole | undefined | null, permissions: Permission[]): boolean {
  return permissions.some((p) => roleHasPermission(role, p));
}

/**
 * Get the hierarchy level of a role (higher = more authority).
 */
export function getRoleLevel(role: UserRole | undefined | null): number {
  const levels: Record<UserRole, number> = {
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
  return role ? levels[role] ?? 0 : 0;
}

/**
 * Check if a role has at least the minimum level.
 */
export function hasMinimumRole(role: UserRole | undefined | null, minimumRole: UserRole): boolean {
  return getRoleLevel(role) >= getRoleLevel(minimumRole);
}

/**
 * Get all permissions for a role (for UI display).
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return PERMISSION_MATRIX[role] ?? [];
}

/**
 * Get role color for UI badges.
 */
export function getRoleColor(role: UserRole | string): string {
  const colors: Record<string, string> = {
    system_administrator: "bg-red-500/10 text-red-500 border-red-500/20",
    national_commissioner: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    regional_commander: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    traffic_commander: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    police_supervisor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    traffic_officer: "bg-green-500/10 text-green-500 border-green-500/20",
    investigator: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    evidence_officer: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    system_auditor: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    citizen: "bg-secondary/50 text-muted-foreground border-border/50",
  };
  return colors[role] ?? colors.citizen;
}

// ─── React Hook ─────────────────────────────────────────

/**
 * Hook to check permissions for the currently authenticated user.
 * Returns checking functions and the user's role.
 *
 * Usage:
 *   const { can, role, roleLabel } = usePermission();
 *   if (can("create_incidents")) { ... }
 *   if (can.all(["view_reports", "view_analytics"])) { ... }
 */
export function usePermission() {
  const { user } = useAuth();
  const role = (user?.profile?.role as UserRole) || null;

  return {
    /** The current user's role */
    role,
    /** Human-readable role label */
    roleLabel: role ? ROLE_LABELS[role] : "Unknown",
    /** Check a single permission */
    can: (permission: Permission): boolean => roleHasPermission(role, permission),
    /** Check ALL permissions */
    all: (...permissions: Permission[]): boolean => roleHasAllPermissions(role, permissions),
    /** Check ANY permission */
    any: (...permissions: Permission[]): boolean => roleHasAnyPermission(role, permissions),
    /** Check minimum role hierarchy level */
    hasRole: (minimumRole: UserRole): boolean => hasMinimumRole(role, minimumRole),
    /** Get all permissions for display */
    permissions: role ? getPermissionsForRole(role) : [],
    /** Whether user has any permissions at all */
    isAuthorized: role !== null && role !== "citizen",
  };
}

/**
 * Check a permission for a specific role (non-hook version).
 */
export function checkPermission(role: UserRole | undefined | null, permission: Permission): boolean {
  return roleHasPermission(role, permission);
}
