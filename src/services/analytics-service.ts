// ============================================================
// TrafficWatch AI — Analytics API Service
//
// Domain: Dashboard KPIs, charts, statistics, predictive data
// ============================================================

import { supabase } from "@/supabase/client";
import {
  executeQuery,
  success,
  failure,
  type ApiResponse,
} from "./base";

// ─── Types ───────────────────────────────────────────────

export interface DashboardStats {
  violations_today: number;
  violations_this_week: number;
  violations_this_month: number;
  live_incidents: number;
  open_cases: number;
  resolved_cases: number;
  pending_investigations: number;
  total_officers: number;
  active_officers: number;
  average_response_time: string;
  ai_detections_today: number;
  citizen_reports_pending: number;
}

export interface TrendDataPoint {
  date: string;
  count: number;
  resolved?: number;
  created?: number;
}

export interface CountyStats {
  county_code: string;
  county_name: string;
  incident_count: number;
  resolved_count: number;
  most_common_violation: string | null;
}

export interface ViolationBreakdown {
  violation: string;
  count: number;
  percentage: number;
}

export interface OfficerActivity {
  officer_id: string;
  officer_name: string;
  incidents_created: number;
  incidents_resolved: number;
  evidence_uploaded: number;
}

// ─── Dashboard KPIs ──────────────────────────────────────

/**
 * Get main dashboard statistics.
 */
export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  try {
    const [
      todayCount,
      weekCount,
      monthCount,
      liveCount,
      openCount,
      resolvedCount,
      investigatingCount,
      officerCount,
      activeOfficerCount,
      aiToday,
      citizenPending,
    ] = await Promise.all([
      supabase.from("incidents").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
      supabase.from("incidents").select("*", { count: "exact", head: true }).gte("created_at", weekStart),
      supabase.from("incidents").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
      supabase.from("incidents").select("*", { count: "exact", head: true }).in("status", ["submitted", "under_review", "assigned", "investigating"]),
      supabase.from("incidents").select("*", { count: "exact", head: true }).in("status", ["submitted", "under_review", "assigned", "investigating", "escalated"]),
      supabase.from("incidents").select("*", { count: "exact", head: true }).in("status", ["resolved", "closed"]),
      supabase.from("incidents").select("*", { count: "exact", head: true }).eq("status", "investigating"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).neq("role", "citizen"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).neq("role", "citizen").eq("is_active", true),
      supabase.from("ai_analyses").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
      supabase.from("citizen_reports").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    ]);

    return success({
      violations_today: todayCount.count || 0,
      violations_this_week: weekCount.count || 0,
      violations_this_month: monthCount.count || 0,
      live_incidents: liveCount.count || 0,
      open_cases: openCount.count || 0,
      resolved_cases: resolvedCount.count || 0,
      pending_investigations: investigatingCount.count || 0,
      total_officers: officerCount.count || 0,
      active_officers: activeOfficerCount.count || 0,
      average_response_time: "N/A", // Requires time-stamped status transitions
      ai_detections_today: aiToday.count || 0,
      citizen_reports_pending: citizenPending.count || 0,
    });
  } catch (err) {
    return failure("STATS_FAILED", err instanceof Error ? err.message : "Failed to fetch dashboard stats");
  }
}

// ─── Trend Data ──────────────────────────────────────────

/**
 * Get incident trend data for chart rendering.
 */
export async function getIncidentTrends(
  days: number = 30,
  granularity: "day" | "week" = "day"
): Promise<ApiResponse<TrendDataPoint[]>> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  if (granularity === "week") {
    return executeQuery(
      supabase.rpc("get_weekly_trends", { p_since: since }),
      { label: "analytics.trends_weekly" }
    );
  }

  return executeQuery(
    supabase.rpc("get_daily_trends", { p_since: since }),
    { label: "analytics.trends_daily" }
  );
}

// ─── County Statistics ───────────────────────────────────

/**
 * Get incident statistics by county.
 */
export async function getCountyStats(): Promise<ApiResponse<CountyStats[]>> {
  return executeQuery(
    supabase.rpc("get_county_stats"),
    { label: "analytics.county_stats" }
  );
}

// ─── Violation Breakdown ─────────────────────────────────

/**
 * Get violation type breakdown with percentages.
 */
export async function getViolationBreakdown(
  days: number = 30
): Promise<ApiResponse<ViolationBreakdown[]>> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("incident_violations")
    .select("violation_type_id, incident_id")
    .gte("created_at", since);

  if (error) return failure("QUERY_FAILED", error.message);

  const { data: types } = await supabase.from("violation_types").select("id, name");
  const typeMap = new Map(types?.map((t) => [t.id, t.name]) || []);

  const counts = new Map<string, number>();
  let total = 0;

  data?.forEach((iv) => {
    const name = typeMap.get(iv.violation_type_id) || "Unknown";
    counts.set(name, (counts.get(name) || 0) + 1);
    total++;
  });

  const breakdown = Array.from(counts.entries())
    .map(([violation, count]) => ({
      violation,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return success(breakdown);
}

// ─── Officer Activity ────────────────────────────────────

/**
 * Get officer activity metrics.
 */
export async function getOfficerActivity(
  days: number = 30
): Promise<ApiResponse<OfficerActivity[]>> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  return executeQuery(
    supabase.rpc("get_officer_activity", { p_since: since }),
    { label: "analytics.officer_activity" }
  );
}

// ─── Most Dangerous Roads ────────────────────────────────

/**
 * Get the top roads by incident count.
 */
export async function getMostDangerousRoads(
  limit: number = 10
): Promise<ApiResponse<{ road: string; count: number }[]>> {
  return executeQuery(
    supabase.rpc("get_dangerous_roads", { p_limit: limit }),
    { label: "analytics.dangerous_roads" }
  );
}

// ─── Repeat Offenders ────────────────────────────────────

/**
 * Get repeat offender statistics.
 */
export async function getRepeatOffenderStats(
  threshold: number = 3
): Promise<ApiResponse<{ plate: string; count: number }[]>> {
  return executeQuery(
    supabase.rpc("get_repeat_offenders", { p_threshold: threshold }),
    { label: "analytics.repeat_offenders" }
  );
}

// ─── Predictive Analytics (Labeled as Estimates) ─────────

/**
 * Get predicted high-risk locations (estimates based on historical data).
 *
 * NOTE: These are predictions based on available data, not facts.
 * They should be clearly labeled as AI estimates in the UI.
 */
export async function getPredictedHotspots(
  days: number = 7
): Promise<ApiResponse<{ location: string; risk_level: "low" | "moderate" | "high"; confidence: number }[]>> {
  return executeQuery(
    supabase.rpc("get_predicted_hotspots", { p_days: days }),
    { label: "analytics.predictions" }
  );
}
