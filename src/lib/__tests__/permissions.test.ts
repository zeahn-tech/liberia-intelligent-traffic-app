import { describe, it, expect } from "vitest";
import {
  roleHasPermission,
  roleHasAllPermissions,
  roleHasAnyPermission,
  getRoleLevel,
  hasMinimumRole,
  getPermissionsForRole,
  getRoleColor,
} from "@/lib/permissions";
import type { UserRole } from "@/lib/permissions";

describe("Permissions System", () => {
  // ─── roleHasPermission ─────────────────────────────
  describe("roleHasPermission", () => {
    it("returns true when role has the permission", () => {
      expect(roleHasPermission("traffic_officer", "create_incidents")).toBe(true);
      expect(roleHasPermission("system_administrator", "configure_system")).toBe(true);
      expect(roleHasPermission("citizen", "create_incidents")).toBe(true);
    });

    it("returns false when role lacks the permission", () => {
      expect(roleHasPermission("citizen", "view_dashboard")).toBe(false);
      expect(roleHasPermission("traffic_officer", "manage_users")).toBe(false);
      expect(roleHasPermission("evidence_officer", "view_analytics")).toBe(false);
    });

    it("returns false for null or undefined role", () => {
      expect(roleHasPermission(null, "view_dashboard")).toBe(false);
      expect(roleHasPermission(undefined, "view_dashboard")).toBe(false);
    });

    it("gives system_administrator all permissions", () => {
      const allPerms = [
        "view_dashboard", "create_incidents", "edit_incidents",
        "assign_incidents", "delete_incidents", "view_all_incidents",
        "access_evidence", "download_evidence", "export_evidence",
        "delete_evidence", "manage_users", "view_users",
        "run_ai_analysis", "review_ai_analysis", "view_reports",
        "generate_reports", "view_analytics", "view_audit_logs",
        "export_audit_logs", "configure_system", "manage_settings",
        "manage_roles",
      ] as const;
      for (const perm of allPerms) {
        expect(roleHasPermission("system_administrator", perm)).toBe(true);
      }
    });
  });

  // ─── roleHasAllPermissions ─────────────────────────
  describe("roleHasAllPermissions", () => {
    it("returns true when role has all permissions", () => {
      expect(roleHasAllPermissions("traffic_officer", ["create_incidents", "edit_incidents"])).toBe(true);
    });

    it("returns false when role lacks any permission", () => {
      expect(roleHasAllPermissions("traffic_officer", ["create_incidents", "manage_users"])).toBe(false);
    });
  });

  // ─── roleHasAnyPermission ──────────────────────────
  describe("roleHasAnyPermission", () => {
    it("returns true when role has at least one permission", () => {
      expect(roleHasAnyPermission("traffic_officer", ["manage_users", "create_incidents"])).toBe(true);
    });

    it("returns false when role has none", () => {
      expect(roleHasAnyPermission("citizen", ["manage_users", "view_dashboard"])).toBe(false);
    });
  });

  // ─── getRoleLevel ──────────────────────────────────
  describe("getRoleLevel", () => {
    it("returns correct levels for each role", () => {
      expect(getRoleLevel("citizen")).toBe(1);
      expect(getRoleLevel("traffic_officer")).toBe(2);
      expect(getRoleLevel("police_supervisor")).toBe(4);
      expect(getRoleLevel("national_commissioner")).toBe(7);
      expect(getRoleLevel("system_administrator")).toBe(10);
    });

    it("returns 0 for null/undefined", () => {
      expect(getRoleLevel(null)).toBe(0);
      expect(getRoleLevel(undefined)).toBe(0);
    });
  });

  // ─── hasMinimumRole ────────────────────────────────
  describe("hasMinimumRole", () => {
    it("returns true when role meets or exceeds minimum", () => {
      expect(hasMinimumRole("system_administrator", "traffic_officer")).toBe(true);
      expect(hasMinimumRole("traffic_officer", "traffic_officer")).toBe(true);
      expect(hasMinimumRole("police_supervisor", "traffic_officer")).toBe(true);
    });

    it("returns false when role is below minimum", () => {
      expect(hasMinimumRole("citizen", "traffic_officer")).toBe(false);
      expect(hasMinimumRole("traffic_officer", "police_supervisor")).toBe(false);
    });
  });

  // ─── getPermissionsForRole ─────────────────────────
  describe("getPermissionsForRole", () => {
    it("returns all permissions for a role", () => {
      const perms = getPermissionsForRole("citizen");
      expect(perms).toContain("create_incidents");
      expect(perms).toHaveLength(1);
    });

    it("returns empty array for unknown role", () => {
      const perms = getPermissionsForRole("unknown" as UserRole);
      expect(perms).toEqual([]);
    });
  });

  // ─── getRoleColor ──────────────────────────────────
  describe("getRoleColor", () => {
    it("returns a color string for each role", () => {
      expect(getRoleColor("system_administrator")).toContain("bg-red");
      expect(getRoleColor("citizen")).toContain("bg-secondary");
    });

    it("falls back to citizen color for unknown role", () => {
      const fallback = getRoleColor("citizen");
      expect(getRoleColor("unknown_role")).toBe(fallback);
    });
  });
});
