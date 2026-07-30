import { describe, it, expect } from "vitest";
import { getAccessibleNavGroups, getAccessibleMobileItems, getAccessibleQuickActions } from "@/lib/navigation";

/**
 * Validate that all navigation routes used in the app are valid paths.
 * This test doesn't check actual route registration (that's runtime),
 * but ensures the navigation config is well-formed.
 */
describe("Deep-link routes", () => {
  // ── Navigation routes are valid paths ─────────────
  it("all nav group items have valid paths starting with /", () => {
    // Test with system_administrator to get all possible routes
    const groups = getAccessibleNavGroups(
      "system_administrator",
      () => true,
      () => true
    );
    for (const group of groups) {
      for (const item of group.items) {
        expect(item.path).toMatch(/^\//);
        expect(item.label).toBeTruthy();
        expect(item.icon).toBeDefined();
      }
    }
  });

  // ── Mobile items are valid ───────────────────────
  it("all mobile nav items have valid paths", () => {
    const items = getAccessibleMobileItems(
      "system_administrator",
      () => true,
      () => true
    );
    for (const item of items) {
      expect(item.path).toMatch(/^\//);
      expect(item.label).toBeTruthy();
    }
  });

  // ── Quick actions have valid paths ───────────────
  it("all quick actions have valid paths", () => {
    const actions = getAccessibleQuickActions(
      "system_administrator",
      () => true,
      () => true
    );
    for (const action of actions) {
      expect(action.path).toMatch(/^\//);
    }
  });

  // ── Routes are accessible by appropriate roles ──
  it("system_administrator sees all nav groups", () => {
    const groups = getAccessibleNavGroups(
      "system_administrator",
      () => true,
      () => true
    );
    // Should see multiple groups (operations, enforcement, intelligence, etc.)
    expect(groups.length).toBeGreaterThanOrEqual(3);
  });

  it("citizen sees minimal navigation", () => {
    const groups = getAccessibleNavGroups(
      "citizen",
      () => true,
      () => true
    );
    // Citizens should see very limited navigation
    // Citizens have access to citizen portal, safety, and basic nav
    expect(groups.length).toBeGreaterThanOrEqual(1);
  });

  // ── Route paths are unique within each group ────
  it("nav group items have unique paths within each group", () => {
    const groups = getAccessibleNavGroups(
      "system_administrator",
      () => true,
      () => true
    );
    for (const group of groups) {
      const paths = group.items.map((i) => i.path);
      const uniquePaths = new Set(paths);
      expect(uniquePaths.size).toBe(paths.length);
    }
  });

  // ── No empty groups ─────────────────────────────
  it("no nav group is empty", () => {
    const groups = getAccessibleNavGroups(
      "system_administrator",
      () => true,
      () => true
    );
    for (const group of groups) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });
});
