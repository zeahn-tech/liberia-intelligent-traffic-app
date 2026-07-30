import { describe, it, expect } from "vitest";
import {
  geoFilterFromParams,
  geoFilterToParams,
  countiesToMapPoints,
  stationsToMapPoints,
  checkpointsToMapPoints,
} from "@/lib/geography";

describe("Geography Utilities", () => {
  // ─── geoFilterFromParams ───────────────────────────
  describe("geoFilterFromParams", () => {
    it("extracts filter values from URLSearchParams", () => {
      const params = new URLSearchParams("county=MO&region=west&road=UN+Drive");
      const filter = geoFilterFromParams(params);
      expect(filter.county_code).toBe("MO");
      expect(filter.police_region).toBe("west");
      expect(filter.road_name).toBe("UN Drive");
    });

    it("returns empty strings for missing params", () => {
      const filter = geoFilterFromParams(new URLSearchParams(""));
      expect(filter.county_code).toBe("");
      expect(filter.district_id).toBe("");
      expect(filter.date_from).toBe("");
    });
  });

  // ─── geoFilterToParams ─────────────────────────────
  describe("geoFilterToParams", () => {
    it("builds URLSearchParams from partial filter", () => {
      const params = geoFilterToParams({
        county_code: "MO",
        police_region: "north",
      });
      expect(params.get("county")).toBe("MO");
      expect(params.get("region")).toBe("north");
      expect(params.get("from")).toBeNull();
    });

    it("handles empty filter", () => {
      const params = geoFilterToParams({});
      expect(params.toString()).toBe("");
    });
  });

  // ─── countiesToMapPoints ───────────────────────────
  describe("countiesToMapPoints", () => {
    it("converts counties to map points", () => {
      const counties = [
        { code: "MO", name: "Montserrado", capital: "Bensonville", police_region: "West" },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any[];
      const points = countiesToMapPoints(counties);
      expect(points).toHaveLength(1);
      expect(points[0].title).toBe("Montserrado");
      expect(points[0].type).toBe("stations");
    });
  });

  // ─── stationsToMapPoints ───────────────────────────
  describe("stationsToMapPoints", () => {
    it("converts stations to map points", () => {
      const stations = [
        { id: "1", name: "Central Station", latitude: 6.3, longitude: -10.8, type: "hq" },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any[];
      const points = stationsToMapPoints(stations);
      expect(points).toHaveLength(1);
      expect(points[0].title).toBe("Central Station");
    });
  });

  // ─── checkpointsToMapPoints ────────────────────────
  describe("checkpointsToMapPoints", () => {
    it("converts checkpoints to map points", () => {
      const checks = [
        { id: "1", name: "Main Gate", latitude: 6.3, longitude: -10.8, road_name: "UN Drive" },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any[];
      const points = checkpointsToMapPoints(checks);
      expect(points).toHaveLength(1);
      expect(points[0].type).toBe("checkpoints");
    });
  });
});
