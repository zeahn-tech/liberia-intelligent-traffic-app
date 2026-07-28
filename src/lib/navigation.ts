// ============================================================
// TrafficWatch AI — Role-Based Navigation Configuration
//
// Centralizes all navigation items with their icons, paths,
// permission/role requirements, and group organization.
// Navigation dynamically changes according to user role.
// ============================================================

import {
  LayoutDashboard,
  Activity,
  Car,
  Brain,
  Shield,
  Truck,
  IdCard,
  Map,
  FileText,
  BarChart3,
  Bell,
  MessageSquare,
  Users,
  ScrollText,
  Settings,
  AlertTriangle,
  Camera,
  type LucideIcon,
} from "lucide-react";
import type { UserRole, Permission } from "./permissions";

// ─── Types ───────────────────────────────────────────────

export interface NavItem {
  /** Display label */
  label: string;
  /** Route path */
  path: string;
  /** Lucide icon */
  icon: LucideIcon;
  /** Required permission(s) — user must have at least one */
  requirePermission?: Permission[];
  /** Minimum role level required */
  minRole?: UserRole;
  /** Whether this is a shortcut (shown in "quick actions" area) */
  isShortcut?: boolean;
  /** Hide from condensed sidebar */
  hideCollapsed?: boolean;
  /** Badge/label text (e.g., "New" or "Live") */
  badge?: string;
  /** Badge color variant */
  badgeVariant?: "default" | "destructive" | "warning" | "success" | "info";
}

export interface NavGroup {
  /** Group label (shown as section header) */
  label: string;
  /** Items in this group */
  items: NavItem[];
}

// ─── Navigation Configuration ────────────────────────────

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        requirePermission: ["view_dashboard"],
      },
      {
        label: "Live Operations",
        path: "/command-center",
        icon: Activity,
        requirePermission: ["view_analytics"],
        minRole: "police_supervisor",
        badge: "LIVE",
        badgeVariant: "destructive",
      },
      {
        label: "Incidents",
        path: "/incidents",
        icon: Car,
        requirePermission: ["view_all_incidents", "create_incidents"],
      },
      {
        label: "Incident Map",
        path: "/incidents?view=map",
        icon: Map,
        requirePermission: ["view_all_incidents", "create_incidents"],
        hideCollapsed: true,
      },
    ],
  },
  {
    label: "Intelligence",
    items: [
      {
        label: "AI Detection",
        path: "/ai-detection",
        icon: Brain,
        requirePermission: ["run_ai_analysis"],
        badge: "AI",
        badgeVariant: "info",
      },
      {
        label: "Evidence Center",
        path: "/evidence",
        icon: Shield,
        requirePermission: ["access_evidence"],
      },
      {
        label: "Vehicles",
        path: "/vehicles",
        icon: Truck,
        requirePermission: ["view_all_incidents"],
        minRole: "investigator",
      },
      {
        label: "License Plates",
        path: "/license-plates",
        icon: IdCard,
        requirePermission: ["run_ai_analysis"],
        badge: "ANPR",
        badgeVariant: "info",
      },
    ],
  },
  {
    label: "Analysis",
    items: [
      {
        label: "Reports",
        path: "/reports",
        icon: FileText,
        requirePermission: ["view_reports"],
      },
      {
        label: "Analytics",
        path: "/analytics",
        icon: BarChart3,
        requirePermission: ["view_analytics"],
      },
      {
        label: "Notifications",
        path: "/notifications",
        icon: Bell,
        requirePermission: ["view_dashboard"],
      },
    ],
  },
  {
    label: "Oversight",
    items: [
      {
        label: "Citizen Reports",
        path: "/review/citizen-reports",
        icon: MessageSquare,
        requirePermission: ["review_ai_analysis"],
        minRole: "police_supervisor",
      },
      {
        label: "Users",
        path: "/users",
        icon: Users,
        requirePermission: ["view_users"],
        minRole: "police_supervisor",
      },
      {
        label: "Audit Logs",
        path: "/audit",
        icon: ScrollText,
        requirePermission: ["view_audit_logs"],
      },
      {
        label: "Security",
        path: "/security",
        icon: AlertTriangle,
        requirePermission: ["configure_system"],
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Settings",
        path: "/settings",
        icon: Settings,
        requirePermission: ["manage_settings", "configure_system"],
      },
    ],
  },
];

// ─── Quick Action Items ──────────────────────────────────

export const QUICK_ACTIONS: NavItem[] = [
  {
    label: "New Report",
    path: "/incidents/new",
    icon: Car,
    requirePermission: ["create_incidents"],
    isShortcut: true,
    badge: "+",
    badgeVariant: "default",
  },
  {
    label: "Upload Evidence",
    path: "/evidence/upload",
    icon: Camera,
    requirePermission: ["access_evidence"],
    isShortcut: true,
  },
];

// ─── Mobile Bottom Nav (top 5 primary items) ─────────────

export const MOBILE_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    requirePermission: ["view_dashboard"],
  },
  {
    label: "Incidents",
    path: "/incidents",
    icon: Car,
    requirePermission: ["view_all_incidents", "create_incidents"],
  },
  {
    label: "Evidence",
    path: "/evidence",
    icon: Shield,
    requirePermission: ["access_evidence"],
  },
  {
    label: "AI",
    path: "/ai-detection",
    icon: Brain,
    requirePermission: ["run_ai_analysis"],
  },
  {
    label: "Map",
    path: "/incidents?view=map",
    icon: Map,
    requirePermission: ["view_all_incidents", "create_incidents"],
  },
];

// ─── All flat items (for search, etc.) ───────────────────

export function getAllNavItems(): NavItem[] {
  return NAV_GROUPS.flatMap((g) => g.items);
}

// ─── Filter by role/permission ───────────────────────────

export function getAccessibleNavGroups(
  role: UserRole | null,
  hasPermission: (perm: Permission) => boolean,
  hasMinRole: (role: UserRole) => boolean
): NavGroup[] {
  const accessible = (item: NavItem): boolean => {
    // Check minimum role
    if (item.minRole && !hasMinRole(item.minRole)) return false;
    // Check permission(s)
    if (item.requirePermission && item.requirePermission.length > 0) {
      return item.requirePermission.some((p) => hasPermission(p));
    }
    return true;
  };

  return NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter(accessible),
    }))
    .filter((group) => group.items.length > 0);
}

export function getAccessibleQuickActions(
  role: UserRole | null,
  hasPermission: (perm: Permission) => boolean,
  hasMinRole: (role: UserRole) => boolean
): NavItem[] {
  return QUICK_ACTIONS.filter((item) => {
    if (item.minRole && !hasMinRole(item.minRole)) return false;
    if (item.requirePermission && item.requirePermission.length > 0) {
      return item.requirePermission.some((p) => hasPermission(p));
    }
    return true;
  });
}

export function getAccessibleMobileItems(
  role: UserRole | null,
  hasPermission: (perm: Permission) => boolean,
  hasMinRole: (role: UserRole) => boolean
): NavItem[] {
  return MOBILE_NAV_ITEMS.filter((item) => {
    if (item.minRole && !hasMinRole(item.minRole)) return false;
    if (item.requirePermission && item.requirePermission.length > 0) {
      return item.requirePermission.some((p) => hasPermission(p));
    }
    return true;
  });
}
