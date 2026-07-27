/**
 * TrafficWatch AI — Liberia Geographic Filter Component
 *
 * Database-driven filter for counties, districts, police regions,
 * roads, checkpoints, police stations, and date range.
 *
 * Geographic data is loaded from Supabase tables so the system can
 * be updated without rewriting the application.
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getCounties,
  getDistricts,
  getPoliceRegions,
  getPoliceStations,
  getMajorRoads,
  getCheckpoints,
} from "@/lib/geography";
import type {
  LiberiaCounty,
  LiberiaDistrict,
  PoliceRegion,
  PoliceStation,
  MajorRoad,
  Checkpoint,
  GeoFilterState,
} from "@/supabase/types";
import {
  MapPin,
  Filter,
  X,
  Loader2,
  Calendar,
  Route,
  Shield,
  Building2,
  LocateFixed,
} from "lucide-react";

export interface GeoFilterProps {
  value: GeoFilterState;
  onChange: (state: GeoFilterState) => void;
  compact?: boolean;
  className?: string;
}

export function GeoFilter({ value, onChange, compact = false, className = "" }: GeoFilterProps) {
  const [counties, setCounties] = useState<LiberiaCounty[]>([]);
  const [districts, setDistricts] = useState<LiberiaDistrict[]>([]);
  const [regions, setRegions] = useState<PoliceRegion[]>([]);
  const [stations, setStations] = useState<PoliceStation[]>([]);
  const [roads, setRoads] = useState<MajorRoad[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(!compact);

  // Load all geographic reference data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [c, d, r, s, rd, ch] = await Promise.all([
          getCounties(),
          getDistricts(value.county_code || undefined),
          getPoliceRegions(),
          getPoliceStations(value.county_code || undefined),
          getMajorRoads(value.county_code || undefined),
          getCheckpoints(value.county_code || undefined),
        ]);
        setCounties(c);
        setDistricts(d);
        setRegions(r);
        setStations(s);
        setRoads(rd);
        setCheckpoints(ch);
      } catch (err) {
        console.error("Failed to load geographic data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [value.county_code]);

  // Reload dependent data when county changes
  useEffect(() => {
    async function loadDependents() {
      if (!value.county_code) return;
      const [d, s, rd, ch] = await Promise.all([
        getDistricts(value.county_code),
        getPoliceStations(value.county_code),
        getMajorRoads(value.county_code),
        getCheckpoints(value.county_code),
      ]);
      setDistricts(d);
      setStations(s);
      setRoads(rd);
      setCheckpoints(ch);
    }
    loadDependents();
  }, [value.county_code]);

  const update = useCallback(
    (partial: Partial<GeoFilterState>) => {
      onChange({ ...value, ...partial });
    },
    [value, onChange],
  );

  const clearAll = useCallback(() => {
    onChange({
      county_code: "",
      district_id: "",
      police_region: "",
      road_name: "",
      checkpoint_id: "",
      police_station_id: "",
      date_from: "",
      date_to: "",
    });
  }, [onChange]);

  const hasActiveFilters = !!(
    value.county_code ||
    value.district_id ||
    value.police_region ||
    value.road_name ||
    value.checkpoint_id ||
    value.police_station_id ||
    value.date_from ||
    value.date_to
  );

  const activeFilterCount = [
    value.county_code,
    value.district_id,
    value.police_region,
    value.road_name,
    value.checkpoint_id,
    value.police_station_id,
    value.date_from || value.date_to,
  ].filter(Boolean).length;

  if (loading) {
    return (
      <Card className={`clay-card border-border/50 !rounded-2xl ${className}`}>
        <CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading geographic data...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`clay-card border-border/50 !rounded-2xl ${className}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors"
            onClick={() => setShowFilters(!showFilters)}
          >
            <MapPin className="w-4 h-4 text-primary" />
            <span>Geographic Filters</span>
            {activeFilterCount > 0 && (
              <Badge className="clay-pill text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary">
                {activeFilterCount}
              </Badge>
            )}
          </button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={clearAll}
              title="Clear all filters"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {showFilters && (
          <div className={`grid gap-3 ${compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
            {/* County */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                County
              </label>
              <Select
                value={value.county_code}
                onValueChange={(v) => update({ county_code: v, district_id: "", checkpoint_id: "", police_station_id: "" })}
              >
                <SelectTrigger className="clay-inset h-8 text-xs">
                  <SelectValue placeholder="All Counties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Counties</SelectItem>
                  {counties.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* District */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                District
              </label>
              <Select
                value={value.district_id}
                onValueChange={(v) => update({ district_id: v })}
                disabled={!value.county_code}
              >
                <SelectTrigger className="clay-inset h-8 text-xs">
                  <SelectValue placeholder={value.county_code ? "Select district" : "Select county first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Districts</SelectItem>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Police Region */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" />
                Police Region
              </label>
              <Select
                value={value.police_region}
                onValueChange={(v) => update({ police_region: v })}
              >
                <SelectTrigger className="clay-inset h-8 text-xs">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Regions</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Road */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Route className="w-2.5 h-2.5" />
                Road
              </label>
              <Select
                value={value.road_name}
                onValueChange={(v) => update({ road_name: v })}
              >
                <SelectTrigger className="clay-inset h-8 text-xs">
                  <SelectValue placeholder="All Roads" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roads</SelectItem>
                  {roads.map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Checkpoint */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <LocateFixed className="w-2.5 h-2.5" />
                Checkpoint
              </label>
              <Select
                value={value.checkpoint_id}
                onValueChange={(v) => update({ checkpoint_id: v })}
                disabled={!value.county_code}
              >
                <SelectTrigger className="clay-inset h-8 text-xs">
                  <SelectValue placeholder={value.county_code ? "Select checkpoint" : "Select county first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Checkpoints</SelectItem>
                  {checkpoints.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Police Station */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5" />
                Police Station
              </label>
              <Select
                value={value.police_station_id}
                onValueChange={(v) => update({ police_station_id: v })}
                disabled={!value.county_code}
              >
                <SelectTrigger className="clay-inset h-8 text-xs">
                  <SelectValue placeholder={value.county_code ? "Select station" : "Select county first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Stations</SelectItem>
                  {stations.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                From Date
              </label>
              <input
                type="date"
                value={value.date_from}
                onChange={(e) => update({ date_from: e.target.value })}
                className="clay-inset h-8 text-xs w-full rounded-xl border border-border/50 bg-background px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>

            {/* Date To */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                To Date
              </label>
              <input
                type="date"
                value={value.date_to}
                onChange={(e) => update({ date_to: e.target.value })}
                className="clay-inset h-8 text-xs w-full rounded-xl border border-border/50 bg-background px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
          </div>
        )}

        {/* Active filter tags */}
        {hasActiveFilters && showFilters && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/30">
            {value.county_code && (
              <Badge variant="outline" className="clay-pill text-[10px] px-1.5 py-0 h-4 bg-primary/5">
                <MapPin className="w-2.5 h-2.5 mr-0.5" />
                {counties.find((c) => c.code === value.county_code)?.name || value.county_code}
              </Badge>
            )}
            {value.police_region && (
              <Badge variant="outline" className="clay-pill text-[10px] px-1.5 py-0 h-4">
                <Shield className="w-2.5 h-2.5 mr-0.5" />
                {value.police_region}
              </Badge>
            )}
            {value.road_name && (
              <Badge variant="outline" className="clay-pill text-[10px] px-1.5 py-0 h-4">
                <Route className="w-2.5 h-2.5 mr-0.5" />
                {value.road_name}
              </Badge>
            )}
            {(value.date_from || value.date_to) && (
              <Badge variant="outline" className="clay-pill text-[10px] px-1.5 py-0 h-4">
                <Calendar className="w-2.5 h-2.5 mr-0.5" />
                {value.date_from || "..."} — {value.date_to || "..."}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
