/**
 * ANPR (Automatic Number Plate Recognition) Types
 *
 * Defines the data structures for the ANPR subsystem including
 * plate detection, OCR results, vehicle matching, and wanted/stolen
 * vehicle databases.
 *
 * Note: Wanted/stolen vehicle flags are only valid when an authorized
 * database record actually exists. No system should flag a vehicle
 * as stolen based on a plate match alone.
 */

import type { BoundingBox } from "../types";

// ===== Plate Detection =====

export interface PlateDetectionResult {
  /** Raw OCR text from the plate region */
  rawText: string;

  /** Normalized plate text (uppercase, stripped special chars) */
  normalizedPlate: string;

  /** Confidence score 0-1 */
  confidence: number;

  /** The bounding box of the plate in the source image */
  boundingBox?: BoundingBox;

  /** Region/format detected (e.g. "Liberia", "International") */
  region?: string;

  /** ISO country code if detected */
  countryCode?: string;

  /** Was the plate verified by a human officer? */
  officerVerified?: boolean;

  /** Officer-corrected text if the OCR was wrong */
  officerCorrectedText?: string;
}

// ===== OCR Processing =====

export interface OCRResult {
  raw: string;
  processed: string;
  confidence: number;
  characters: OCRCharacter[];
}

export interface OCRCharacter {
  char: string;
  confidence: number;
  boundingBox?: BoundingBox;
}

// ===== Vehicle Matching =====

export interface VehicleMatchResult {
  plateText: string;
  isMatched: boolean;
  matchConfidence: number;
  matchType?: "exact" | "partial" | "similar";
  matchedRecords?: VehicleRecord[];
}

export interface VehicleRecord {
  plateNumber: string;
  ownerName?: string;
  ownerId?: string;
  vehicleType?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  registrationYear?: number;
  registrationExpiry?: string;
  insuranceStatus?: "valid" | "expired" | "unknown";
  isStolen?: boolean;
  isWanted?: boolean;
  stolenReportedAt?: string;
  stolenReportedBy?: string;
  notes?: string;
}

// ===== Plate Normalization =====

export interface PlateNormalizationRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

export interface PlateFormat {
  name: string;
  country: string;
  pattern: RegExp;
  format: string;
  example: string;
}

// ===== Known Plate Formats =====

export const KNOWN_PLATE_FORMATS: PlateFormat[] = [
  {
    name: "Liberia Standard",
    country: "LR",
    pattern: /^[A-Z]{3}-\d{4}$/,
    format: "XXX-0000",
    example: "LBR-4521",
  },
  {
    name: "Liberia Government",
    country: "LR",
    pattern: /^[A-Z]{3}\d{3}$/,
    format: "XXX000",
    example: "LNP874",
  },
  {
    name: "Liberia Diplomatic",
    country: "LR",
    pattern: /^CD-\d{4}$/,
    format: "CD-0000",
    example: "CD-1023",
  },
  {
    name: "International Standard",
    country: "INTL",
    pattern: /^[A-Z]{1,3}-\d{1,4}$/,
    format: "X-0000",
    example: "A-1234",
  },
  {
    name: "European Standard",
    country: "EU",
    pattern: /^[A-Z]{1,3}\s?\d{1,4}[A-Z]{1,2}$/,
    format: "XXX-0000-XX",
    example: "AB-123-CD",
  },
];

// ===== Wanted/Stolen Vehicle Records =====

export interface StolenVehicleRecord {
  id: string;
  plateNumber: string;
  make?: string;
  model?: string;
  color?: string;
  year?: number;
  vin?: string;
  reportedAt: string;
  reportedBy: string; // Officer ID
  status: "active" | "recovered" | "closed";
  jurisdiction: string;
  caseNumber: string;
  ownerName?: string;
  ownerContact?: string;
  notes?: string;
  recoveredAt?: string;
  recoveredBy?: string;
}

/**
 * Authorized database for stolen/wanted vehicles.
 * This must be populated from an official source.
 * NEVER flag a vehicle as stolen based solely on plate detection
 * without a corresponding record in this database.
 */
export interface StolenVehicleDatabase {
  records: StolenVehicleRecord[];
  lastUpdated: string;
  source: string;
}

// ===== ANPR History & Search =====

export interface ANPRSearchQuery {
  plateText?: string;
  partialPlate?: string;
  vehicleType?: string;
  vehicleColor?: string;
  dateFrom?: string;
  dateTo?: string;
  officerId?: string;
  location?: {
    lat: number;
    lng: number;
    radiusKm: number;
  };
  minConfidence?: number;
  onlyConfirmed?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ANPRSearchResult {
  scans: ANPRScanRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ANPRScanRecord {
  id: string;
  incidentId: string;
  plateText: string;
  normalizedPlate: string;
  confidence: number;
  officerVerified: boolean;
  officerCorrectedText?: string;
  vehicleType?: string;
  vehicleColor?: string;
  scannedAt: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  officerId: string;
  incident?: {
    title: string;
    type: string;
    severity: string;
    status: string;
  };
}
