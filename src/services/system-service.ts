// ============================================================
// TrafficWatch AI — System Configuration API Service
//
// Domain: System settings, feature flags, configuration
// ============================================================

import { supabase } from "@/supabase/client";
import {
  executeQuery,
  success,
  failure,
  type ApiResponse,
} from "./base";

// ─── Types ───────────────────────────────────────────────

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: "string" | "number" | "boolean" | "json";
  category: string;
  label: string;
  description: string | null;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Settings ───────────────────────────────────────────

/**
 * Get a system setting by key.
 */
export async function getSetting(key: string): Promise<ApiResponse<string | null>> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("setting_value, setting_type")
    .eq("setting_key", key)
    .maybeSingle();

  if (error) return failure("QUERY_FAILED", error.message);
  if (!data) return success(null);

  // Parse based on type
  const value: string = data.setting_value;
  return success(value);
}

/**
 * Get all system settings grouped by category.
 */
export async function getSettingsByCategory(): Promise<
  ApiResponse<Record<string, SystemSetting[]>>
> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .order("label", { ascending: true });

  if (error) return failure("QUERY_FAILED", error.message);

  const grouped: Record<string, SystemSetting[]> = {};
  (data || []).forEach((setting) => {
    const cat = setting.category || "general";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(setting as SystemSetting);
  });

  return success(grouped);
}

/**
 * Update a system setting (admin only — enforced by RLS).
 */
export async function updateSetting(
  key: string,
  value: string
): Promise<ApiResponse<SystemSetting>> {
  return executeQuery(
    supabase.rpc("set_system_setting", {
      p_key: key,
      p_value: value,
    }),
    { label: "system.update_setting" }
  );
}

// ─── Feature Flags ──────────────────────────────────────

/**
 * Check if a feature flag is enabled.
 */
export async function isFeatureEnabled(feature: string): Promise<boolean> {
  const result = await getSetting(`feature_${feature}`);
  return result.data === "true" || result.data === "1";
}

/**
 * Get all feature flags.
 */
export async function getFeatureFlags(): Promise<
  ApiResponse<Record<string, boolean>>
> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("setting_key, setting_value")
    .ilike("setting_key", "feature_%");

  if (error) return failure("QUERY_FAILED", error.message);

  const flags: Record<string, boolean> = {};
  (data || []).forEach((s) => {
    const name = s.setting_key.replace("feature_", "");
    flags[name] = s.setting_value === "true" || s.setting_value === "1";
  });

  return success(flags);
}

// ─── Version & Health ────────────────────────────────────

/**
 * Get application version and build info.
 */
export async function getAppInfo(): Promise<
  ApiResponse<{
    name: string;
    version: string;
    build_date: string;
    environment: string;
  }>
> {
  const [nameResult, envResult] = await Promise.all([
    getSetting("app_name"),
    getSetting("environment"),
  ]);

  return success({
    name: nameResult.data || "TrafficWatch AI",
    version: import.meta.env.VITE_APP_VERSION || "1.0.0",
    build_date: import.meta.env.BUILD_DATE || new Date().toISOString(),
    environment: envResult.data || "production",
  });
}
