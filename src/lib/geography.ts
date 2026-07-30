/**
 * TrafficWatch AI — Liberia Geographic Data Service
 *
 * All geographic entities are stored in database tables so the system
 * can be updated without rewriting the application. This service layer
 * provides typed access to counties, districts, police regions, roads,
 * and checkpoints.
 *
 * IMPORTANT: Never hard-code geographic information in UI components.
 * Always use this service or the GeoFilter component.
 */

import { supabase } from "@/supabase/client";
import type {
  LiberiaCounty,
  LiberiaDistrict,
  PoliceRegion,
  PoliceStation,
  MajorRoad,
  Checkpoint,
  CountyIncidentCount,
  GeoFilterState,
} from "@/supabase/types";

// ─── Cache (prevent repeated DB calls for static reference data) ──

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ─── Counties ─────────────────────────────────────────────

/**
 * Get all 15 counties of Liberia.
 */
export async function getCounties(): Promise<LiberiaCounty[]> {
  const cached = getCached<LiberiaCounty[]>("counties");
  if (cached) return cached;

  const { data, error } = await supabase
    .from("liberia_counties")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  setCache("counties", data || []);
  return data || [];
}

/**
 * Get a single county by code (e.g., "MO" for Montserrado).
 */
export async function getCounty(code: string): Promise<LiberiaCounty | null> {
  const counties = await getCounties();
  return counties.find((c) => c.code === code) || null;
}

// ─── Districts ────────────────────────────────────────────

/**
 * Get all districts, optionally filtered by county code.
 */
export async function getDistricts(countyCode?: string): Promise<LiberiaDistrict[]> {
  const cacheKey = `districts_${countyCode || "all"}`;
  const cached = getCached<LiberiaDistrict[]>(cacheKey);
  if (cached) return cached;

  let query = supabase.from("liberia_districts").select("*").eq("is_active", true);
  if (countyCode) {
    query = query.eq("county_code", countyCode);
  }
  const { data, error } = await query.order("name");

  if (error) throw error;
  setCache(cacheKey, data || []);
  return data || [];
}

// ─── Police Regions ───────────────────────────────────────

/**
 * Get all police regions.
 */
export async function getPoliceRegions(): Promise<PoliceRegion[]> {
  const cached = getCached<PoliceRegion[]>("police_regions");
  if (cached) return cached;

  const { data, error } = await supabase
    .from("police_regions")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  setCache("police_regions", data || []);
  return data || [];
}

// ─── Police Stations ──────────────────────────────────────

/**
 * Get police stations, optionally filtered by county.
 */
export async function getPoliceStations(countyCode?: string): Promise<PoliceStation[]> {
  const cacheKey = `stations_${countyCode || "all"}`;
  const cached = getCached<PoliceStation[]>(cacheKey);
  if (cached) return cached;

  let query = supabase.from("police_stations").select("*").eq("is_active", true);
  if (countyCode) {
    query = query.eq("county_code", countyCode);
  }
  const { data, error } = await query.order("name");

  if (error) throw error;
  setCache(cacheKey, data || []);
  return data || [];
}

// ─── Major Roads ──────────────────────────────────────────

/**
 * Get major roads, optionally filtered by county.
 */
export async function getMajorRoads(countyCode?: string): Promise<MajorRoad[]> {
  const cacheKey = `roads_${countyCode || "all"}`;
  const cached = getCached<MajorRoad[]>(cacheKey);
  if (cached) return cached;

  let query = supabase.from("major_roads").select("*").eq("is_active", true);
  if (countyCode) {
    query = query.contains("counties", [countyCode]);
  }
  const { data, error } = await query.order("name");

  if (error) throw error;
  setCache(cacheKey, data || []);
  return data || [];
}

// ─── Checkpoints ──────────────────────────────────────────

/**
 * Get checkpoints, optionally filtered by county.
 */
export async function getCheckpoints(countyCode?: string): Promise<Checkpoint[]> {
  const cacheKey = `checkpoints_${countyCode || "all"}`;
  const cached = getCached<Checkpoint[]>(cacheKey);
  if (cached) return cached;

  let query = supabase.from("checkpoints").select("*").eq("is_active", true);
  if (countyCode) {
    query = query.eq("county_code", countyCode);
  }
  const { data, error } = await query.order("name");

  if (error) throw error;
  setCache(cacheKey, data || []);
  return data || [];
}

// ─── Incident Counts by County ────────────────────────────

/**
 * Get incident counts grouped by county for dashboard stats.
 */
export async function getCountyIncidentCounts(): Promise<CountyIncidentCount[]> {
  const cached = getCached<CountyIncidentCount[]>("incident_counts");
  if (cached) return cached;

  try {
    const { data, error } = await supabase.rpc("get_county_incident_counts");
    if (error) throw error;
    setCache("incident_counts", data || []);
    return data || [];
  } catch {
    // Fallback: return empty counts if RPC not available yet
    return [];
  }
}

// ─── GeoFilter Helpers ────────────────────────────────────

/**
 * Get all unique road names from the roads table for filtering.
 */
export async function getRoadNames(): Promise<string[]> {
  const roads = await getMajorRoads();
  return roads.map((r) => r.name).sort();
}

/**
 * Build a GeoFilterState from URL search params.
 */
export function geoFilterFromParams(params: URLSearchParams): GeoFilterState {
  return {
    county_code: params.get("county") || "",
    district_id: params.get("district") || "",
    police_region: params.get("region") || "",
    road_name: params.get("road") || "",
    checkpoint_id: params.get("checkpoint") || "",
    police_station_id: params.get("station") || "",
    date_from: params.get("from") || "",
    date_to: params.get("to") || "",
  };
}

/**
 * Build URL search params from a GeoFilterState.
 */
export function geoFilterToParams(filter: Partial<GeoFilterState>): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.county_code) params.set("county", filter.county_code);
  if (filter.district_id) params.set("district", filter.district_id);
  if (filter.police_region) params.set("region", filter.police_region);
  if (filter.road_name) params.set("road", filter.road_name);
  if (filter.checkpoint_id) params.set("checkpoint", filter.checkpoint_id);
  if (filter.police_station_id) params.set("station", filter.police_station_id);
  if (filter.date_from) params.set("from", filter.date_from);
  if (filter.date_to) params.set("to", filter.date_to);
  return params;
}

// ─── Map Data Converters ──────────────────────────────────

/**
 * Convert counties to MapPoint[] for the IncidentMap component.
 */
export function countiesToMapPoints(counties: LiberiaCounty[]): Array<{
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  type: "stations";
  details?: Record<string, string>;
}> {
  return counties.map((c) => ({
    id: `county-${c.code}`,
    lat: c.center_lat || 6.5,
    lng: c.center_lng || -10.0,
    title: c.name,
    subtitle: `Capital: ${c.capital} · Region: ${c.police_region}`,
    type: "stations" as const,
    details: {
      Population: c.population?.toLocaleString() || "N/A",
      Area: c.area_km2 ? `${c.area_km2} km²` : "N/A",
      Code: c.code,
    },
  }));
}

/**
 * Convert police stations to MapPoint[] for the IncidentMap component.
 */
export function stationsToMapPoints(stations: PoliceStation[]): Array<{
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  type: "stations";
}> {
  return stations.map((s) => ({
    id: `station-${s.id}`,
    lat: s.latitude,
    lng: s.longitude,
    title: s.name,
    subtitle: s.type === "hq" ? "Police Headquarters" : `Police ${s.type}`,
    type: "stations" as const,
  }));
}

/**
 * Convert checkpoints to MapPoint[] for the IncidentMap component.
 */
export function checkpointsToMapPoints(checks: Checkpoint[]): Array<{
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  type: "checkpoints";
  details?: Record<string, string>;
}> {
  return checks.map((c) => ({
    id: `checkpoint-${c.id}`,
    lat: c.latitude,
    lng: c.longitude,
    title: c.name,
    subtitle: c.road_name || "No road data",
    type: "checkpoints" as const,
    details: c.unit ? { Unit: c.unit, Hours: c.hours || "N/A" } : undefined,
  }));
}

// ─── County Boundary GeoJSON (fallback if DB doesn't have it) ──

export const LIBERIA_COUNTY_BOUNDARIES = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { name: "Bomi", code: "BM" }, geometry: { type: "Polygon", coordinates: [[[-10.9, 6.5], [-10.5, 6.5], [-10.5, 6.9], [-10.9, 6.9], [-10.9, 6.5]]] } },
    { type: "Feature", properties: { name: "Bong", code: "BG" }, geometry: { type: "Polygon", coordinates: [[[-10.2, 6.6], [-9.4, 6.6], [-9.4, 7.2], [-10.2, 7.2], [-10.2, 6.6]]] } },
    { type: "Feature", properties: { name: "Gbarpolu", code: "GP" }, geometry: { type: "Polygon", coordinates: [[[-10.8, 7.0], [-10.2, 7.0], [-10.2, 7.6], [-10.8, 7.6], [-10.8, 7.0]]] } },
    { type: "Feature", properties: { name: "Grand Bassa", code: "GB" }, geometry: { type: "Polygon", coordinates: [[[-10.3, 5.8], [-9.7, 5.8], [-9.7, 6.3], [-10.3, 6.3], [-10.3, 5.8]]] } },
    { type: "Feature", properties: { name: "Grand Cape Mount", code: "CM" }, geometry: { type: "Polygon", coordinates: [[[-11.5, 6.5], [-10.8, 6.5], [-10.8, 7.0], [-11.5, 7.0], [-11.5, 6.5]]] } },
    { type: "Feature", properties: { name: "Grand Gedeh", code: "GG" }, geometry: { type: "Polygon", coordinates: [[[-8.5, 5.8], [-7.8, 5.8], [-7.8, 6.5], [-8.5, 6.5], [-8.5, 5.8]]] } },
    { type: "Feature", properties: { name: "Grand Kru", code: "GK" }, geometry: { type: "Polygon", coordinates: [[[-8.5, 4.7], [-8.0, 4.7], [-8.0, 5.1], [-8.5, 5.1], [-8.5, 4.7]]] } },
    { type: "Feature", properties: { name: "Lofa", code: "LF" }, geometry: { type: "Polygon", coordinates: [[[-10.2, 7.6], [-9.3, 7.6], [-9.3, 8.3], [-10.2, 8.3], [-10.2, 7.6]]] } },
    { type: "Feature", properties: { name: "Margibi", code: "MG" }, geometry: { type: "Polygon", coordinates: [[[-10.6, 6.2], [-10.1, 6.2], [-10.1, 6.6], [-10.6, 6.6], [-10.6, 6.2]]] } },
    { type: "Feature", properties: { name: "Maryland", code: "MY" }, geometry: { type: "Polygon", coordinates: [[[-7.9, 4.5], [-7.4, 4.5], [-7.4, 5.0], [-7.9, 5.0], [-7.9, 4.5]]] } },
    { type: "Feature", properties: { name: "Montserrado", code: "MO" }, geometry: { type: "Polygon", coordinates: [[[-10.9, 6.1], [-10.4, 6.1], [-10.4, 6.6], [-10.9, 6.6], [-10.9, 6.1]]] } },
    { type: "Feature", properties: { name: "Nimba", code: "NI" }, geometry: { type: "Polygon", coordinates: [[[-9.0, 6.3], [-8.3, 6.3], [-8.3, 7.5], [-9.0, 7.5], [-9.0, 6.3]]] } },
    { type: "Feature", properties: { name: "River Cess", code: "RI" }, geometry: { type: "Polygon", coordinates: [[[-9.8, 5.3], [-9.3, 5.3], [-9.3, 5.7], [-9.8, 5.7], [-9.8, 5.3]]] } },
    { type: "Feature", properties: { name: "River Gee", code: "RG" }, geometry: { type: "Polygon", coordinates: [[[-8.1, 5.0], [-7.6, 5.0], [-7.6, 5.5], [-8.1, 5.5], [-8.1, 5.0]]] } },
    { type: "Feature", properties: { name: "Sinoe", code: "SI" }, geometry: { type: "Polygon", coordinates: [[[-9.3, 4.8], [-8.5, 4.8], [-8.5, 5.5], [-9.3, 5.5], [-9.3, 4.8]]] } },
  ],
};
