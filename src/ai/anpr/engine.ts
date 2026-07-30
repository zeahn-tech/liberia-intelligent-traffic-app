/**
 * ANPR Detection Engine
 *
 * Orchestrates the Automatic Number Plate Recognition workflow:
 *
 *   Media Input → Pre-processing → Plate Region Detection →
 *   OCR → Normalization → Confidence Scoring → Verification →
 *   Search History → Repeat Offender Check → Wanted Vehicle Check
 *
 * The engine is provider-agnostic and uses the AI pipeline for actual
 * detection. It adds the ANPR-specific logic on top.
 */

import type { MediaInput } from "../types";
import { providerRegistry } from "../registry";
import type {
  PlateDetectionResult,
  ANPRScanRecord,
  ANPRSearchQuery,
  ANPRSearchResult,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  VehicleRecord,
  StolenVehicleDatabase,
  StolenVehicleRecord,
} from "./types";
import { generateId } from "../utils";
import { offlineGet, offlineSet, offlineGetAll } from "@/lib/offline";
import { getPlateVariations } from "./anpr/engine";
import { correctOCRErrors } from "./anpr/engine";
import { normalizePlateText } from "./anpr/engine";
import { buildPlateResult } from "./anpr/engine";

// ===== Stolen Vehicle Database =====

let stolenVehicleDB: StolenVehicleDatabase | null = null;

/**
 * Load the stolen vehicle database from a secure source.
 * This must only be called with data from an authorized source.
 */
export async function loadStolenVehicleDatabase(
  source: StolenVehicleDatabase
): Promise<void> {
  stolenVehicleDB = source;
  await offlineSet("cache", "stolen_vehicle_db", source);
}

/**
 * Check a plate against the stolen vehicle database.
 * Returns null if no matching record exists.
 */
export async function checkStolenVehicle(
  normalizedPlate: string
): Promise<StolenVehicleRecord | null> {
  // Try cached database first
  if (!stolenVehicleDB) {
    const cached = await offlineGet<StolenVehicleDatabase>("cache", "stolen_vehicle_db");
    stolenVehicleDB = cached || null;
  }

  if (!stolenVehicleDB) return null;

  const plateVariations = getPlateVariations(normalizedPlate);

  for (const record of stolenVehicleDB.records) {
    if (record.status !== "active") continue;
    const recordVariations = getPlateVariations(record.plateNumber);
    for (const pv of plateVariations) {
      for (const rv of recordVariations) {
        if (pv === rv) return record;
      }
    }
  }

  return null;
}

// ===== ANPR Scan Engine =====

/**
 * Perform ANPR on a media input.
 * Returns a PlateDetectionResult with the detected plate information.
 */
export async function scanLicensePlate(
  media: MediaInput,
  options: { incidentId: string; officerId: string; signal?: AbortSignal }
): Promise<PlateDetectionResult> {
  const provider = providerRegistry.getActiveProvider();

  if (!provider) {
    // Return a simulated result for demo
    return simulatePlateScan();
  }

  const plateResult = await provider.detectLicensePlate(media, {
    incidentId: options.incidentId,
    signal: options.signal,
  });

  // Build the full PlateDetectionResult
  const corrected = correctOCRErrors(plateResult.plateText);
  const normalized = normalizePlateText(corrected.corrected);

  const result: PlateDetectionResult = {
    rawText: plateResult.plateText,
    normalizedPlate: normalized,
    confidence: Math.min(plateResult.confidence, corrected.confidence),
    boundingBox: plateResult.boundingBox,
    region: detectedRegion(normalized),
    officerVerified: false,
  };

  // Save scan record
  await saveScanRecord({
    incidentId: options.incidentId,
    result,
    officerId: options.officerId,
  });

  return result;
}

// ===== Scan History =====

async function saveScanRecord(scan: {
  incidentId: string;
  result: PlateDetectionResult;
  officerId: string;
}): Promise<void> {
  // Store locally
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Use a dedicated key for scan history
  const key = `anpr_scans_${scan.incidentId}`;
  const existing = await offlineGet<ANPRScanRecord[]>("cache", key);
  const record: ANPRScanRecord = {
    id: generateId("scan"),
    incidentId: scan.incidentId,
    plateText: scan.result.rawText,
    normalizedPlate: scan.result.normalizedPlate,
    confidence: scan.result.confidence,
    officerVerified: scan.result.officerVerified || false,
    officerCorrectedText: scan.result.officerCorrectedText,
    scannedAt: new Date().toISOString(),
    officerId: scan.officerId,
  };

  const updated = [...(existing || []), record];
  await offlineSet("cache", key, updated);
}

/**
 * Search historical ANPR scans.
 */
export async function searchANPRHistory(
  query: ANPRSearchQuery
): Promise<ANPRSearchResult> {
  // Get all scan records from cache
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allKeys = await offlineGetAll<any>("cache");
  const allScans: ANPRScanRecord[] = [];

  // Collect all scan records from cache
  for (const entry of allKeys) {
    if (typeof entry.key === "string" && entry.key.startsWith("anpr_scans_")) {
      if (Array.isArray(entry.data)) {
        allScans.push(...entry.data);
      } else if (Array.isArray(entry)) {
        allScans.push(...entry);
      }
    }
  }

  // Apply filters
  let filtered = allScans;

  if (query.plateText) {
    const q = query.plateText.toUpperCase();
    filtered = filtered.filter(
      (s) =>
        s.normalizedPlate.includes(q) || s.plateText.toUpperCase().includes(q)
    );
  }

  if (query.partialPlate) {
    const q = query.partialPlate.toUpperCase();
    filtered = filtered.filter(
      (s) =>
        s.normalizedPlate.includes(q) || s.plateText.toUpperCase().includes(q)
    );
  }

  if (query.vehicleType) {
    filtered = filtered.filter((s) => s.vehicleType === query.vehicleType);
  }

  if (query.vehicleColor) {
    filtered = filtered.filter((s) => s.vehicleColor === query.vehicleColor);
  }

  if (query.dateFrom) {
    filtered = filtered.filter((s) => s.scannedAt >= query.dateFrom!);
  }

  if (query.dateTo) {
    filtered = filtered.filter((s) => s.scannedAt <= query.dateTo!);
  }

  if (query.officerId) {
    filtered = filtered.filter((s) => s.officerId === query.officerId);
  }

  if (query.onlyConfirmed) {
    filtered = filtered.filter((s) => s.officerVerified);
  }

  if (query.minConfidence) {
    filtered = filtered.filter((s) => s.confidence >= query.minConfidence!);
  }

  // Sort by date descending
  filtered.sort(
    (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
  );

  const page = query.page || 1;
  const pageSize = query.pageSize || 20;
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return {
    scans: paged,
    total,
    page,
    pageSize,
    hasMore: start + pageSize < total,
  };
}

/**
 * Find repeat offenders by plate number.
 * Returns incidents for a given plate within a time window.
 */
export async function findRepeatOffenders(
  normalizedPlate: string,
  windowDays: number = 90
): Promise<ANPRScanRecord[]> {
  const result = await searchANPRHistory({
    plateText: normalizedPlate,
    dateFrom: new Date(
      Date.now() - windowDays * 24 * 60 * 60 * 1000
    ).toISOString(),
    minConfidence: 0.5,
  });

  return result.scans;
}

/**
 * Verify a plate detection result by an officer.
 */
export async function verifyPlateByOfficer(
  scanRecordId: string,
  incidentId: string,
  correctedText?: string
): Promise<void> {
  const key = `anpr_scans_${incidentId}`;
  const existing = await offlineGet<ANPRScanRecord[]>("cache", key);
  if (!existing) return;

  const updated = existing.map((r) => {
    if (r.id === scanRecordId) {
      return {
        ...r,
        officerVerified: true,
        officerCorrectedText: correctedText || r.normalizedPlate,
      };
    }
    return r;
  });

  await offlineSet("cache", key, updated);
}

// ===== Helpers =====

function detectedRegion(normalized: string): string | undefined {
  if (normalized.startsWith("LBR") || normalized.startsWith("MON")) return "Liberia";
  if (normalized.startsWith("CD-")) return "Diplomatic";
  if (normalized.startsWith("LNP")) return "Liberia - Government";
  return undefined;
}

function simulatePlateScan(): PlateDetectionResult {
  const plates = ["LBR-4521", "MON-5567", "GRD-3309", "RIV-7782", "LNP-8741"];
  const plate = plates[Math.floor(Math.random() * plates.length)];
  return buildPlateResult(plate, 0.85 + Math.random() * 0.14);
}
