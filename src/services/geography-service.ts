// ============================================================
// TrafficWatch AI — Geography API Service
//
// Domain: Counties, districts, police regions, stations, roads
// ============================================================

import { supabase } from "@/supabase/client";
import {
  executeQuery,
  success,
  failure,
  type ApiResponse,
} from "./base";

// ─── Types ───────────────────────────────────────────────

export interface County {
  id: string;
  code: string;
  name: string;
  capital: string;
  police_region: string;
  center_lat: number | null;
  center_lng: number | null;
}

export interface District {
  id: string;
  county_code: string;
  name: string;
}

export interface PoliceRegion {
  id: string;
  name: string;
  headquarters: string;
}

export interface PoliceStation {
  id: string;
  name: string;
  county_code: string;
  type: string;
  latitude: number;
  longitude: number;
  phone: string | null;
}

export interface MajorRoad {
  id: string;
  name: string;
  road_number: string | null;
  road_type: string | null;
}

export interface Checkpoint {
  id: string;
  name: string;
  county_code: string;
  latitude: number;
  longitude: number;
  is_permanent: boolean;
}

// ─── Counties ────────────────────────────────────────────

/**
 * Get all active counties.
 */
export async function getCounties(): Promise<ApiResponse<County[]>> {
  return executeQuery(
    supabase.from("liberia_counties")
      .select("id, code, name, capital, police_region, center_lat, center_lng")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    { label: "geography.counties" }
  );
}

/**
 * Get a single county by code.
 */
export async function getCounty(code: string): Promise<ApiResponse<County | null>> {
  return executeQuery(
    supabase.from("liberia_counties")
      .select("id, code, name, capital, police_region, center_lat, center_lng")
      .eq("code", code)
      .maybeSingle(),
    { label: "geography.county" }
  );
}

// ─── Districts ───────────────────────────────────────────

/**
 * Get districts, optionally filtered by county.
 */
export async function getDistricts(countyCode?: string): Promise<ApiResponse<District[]>> {
  let query = supabase
    .from("liberia_districts")
    .select("id, county_code, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (countyCode) query = query.eq("county_code", countyCode);

  return executeQuery(query, { label: "geography.districts" });
}

// ─── Police Regions ──────────────────────────────────────

/**
 * Get all police regions.
 */
export async function getPoliceRegions(): Promise<ApiResponse<PoliceRegion[]>> {
  return executeQuery(
    supabase.from("police_regions")
      .select("id, name, headquarters")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    { label: "geography.regions" }
  );
}

// ─── Police Stations ─────────────────────────────────────

/**
 * Get police stations, optionally filtered by county.
 */
export async function getPoliceStations(countyCode?: string): Promise<ApiResponse<PoliceStation[]>> {
  let query = supabase
    .from("police_stations")
    .select("id, name, county_code, type, latitude, longitude, phone")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (countyCode) query = query.eq("county_code", countyCode);

  return executeQuery(query, { label: "geography.stations" });
}

/**
 * Get police stations by type (HQ, station, substation, post).
 */
export async function getStationsByType(type: string): Promise<ApiResponse<PoliceStation[]>> {
  return executeQuery(
    supabase.from("police_stations")
      .select("id, name, county_code, type, latitude, longitude, phone")
      .eq("type", type)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    { label: "geography.stations_by_type" }
  );
}

// ─── Roads ───────────────────────────────────────────────

/**
 * Get major roads.
 */
export async function getMajorRoads(): Promise<ApiResponse<MajorRoad[]>> {
  return executeQuery(
    supabase.from("major_roads")
      .select("id, name, road_number, road_type")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    { label: "geography.roads" }
  );
}

// ─── Checkpoints ─────────────────────────────────────────

/**
 * Get police checkpoints, optionally filtered by county.
 */
export async function getCheckpoints(countyCode?: string): Promise<ApiResponse<Checkpoint[]>> {
  let query = supabase
    .from("checkpoints")
    .select("id, name, county_code, latitude, longitude, is_permanent")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (countyCode) query = query.eq("county_code", countyCode);

  return executeQuery(query, { label: "geography.checkpoints" });
}

// ─── Geographic Stats ────────────────────────────────────

/**
 * Get geographic distribution of incidents for map heatmaps.
 */
export async function getIncidentGeoDistribution(
  days: number = 30
): Promise<ApiResponse<{ county_code: string; county_name: string; count: number; lat: number; lng: number }[]>> {
  return executeQuery(
    supabase.rpc("get_incident_geo_distribution", { p_days: days }),
    { label: "geography.incident_distribution" }
  );
}

/**
 * Get incidents by county for county-level analytics.
 */
export async function getCountyIncidentCounts(
  days: number = 30
): Promise<ApiResponse<{ county_code: string; county_name: string; incident_count: number }[]>> {
  return executeQuery(
    supabase.rpc("get_county_incident_counts", { p_days: days }),
    { label: "geography.county_counts" }
  );
}
