// ============================================================
// TrafficWatch AI — Demo Mode Detection Hook
// ============================================================
// Detects demo mode by checking if the authenticated user's
// email matches known demo/seed data patterns.
// ============================================================

import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";

export interface DemoModeInfo {
  /** Whether the current user/session is in demo mode */
  isDemo: boolean;
  /** The detected demo type (profile, vehicle, etc.) or null */
  demoType: "seed_data" | "development" | null;
  /** Human-readable description of demo status */
  label: string;
}

/**
 * Pattern: emails ending in @trafficwatch.gov.lr or @example.com
 * These are the emails used in the seed data SQL files.
 */
const DEMO_EMAIL_PATTERNS = [
  /@trafficwatch\.gov\.lr$/i,
  /@example\.com$/i,
];

/**
 * useDemoMode — Detects whether the current session is operating
 * with demo/seed data rather than real production data.
 */
export function useDemoMode(): DemoModeInfo {
  const { user } = useAuth();

  return useMemo(() => {
    const email = user?.profile?.email || user?.email || "";

    if (!email) {
      return { isDemo: false, demoType: null, label: "" };
    }

    const matchesPattern = DEMO_EMAIL_PATTERNS.some((pattern) =>
      pattern.test(email)
    );

    if (matchesPattern) {
      return {
        isDemo: true,
        demoType: "seed_data",
        label: "Development / Seed Data",
      };
    }

    return { isDemo: false, demoType: null, label: "" };
  }, [user?.profile?.email, user?.email]);
}
