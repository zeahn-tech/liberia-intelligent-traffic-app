// ============================================================
// TrafficWatch AI — Base API Service
//
// Provides consistent patterns for:
// - Structured API responses
// - Error handling
// - Pagination (cursor-based & offset-based)
// - Field whitelisting (select strings)
// - Input validation helpers
// ============================================================

import { supabase } from "@/supabase/client";
import type { PostgrestError } from "@supabase/supabase-js";

// ─── Response Types ──────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  /** Optional server timing hint (ms) */
  duration?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  error: ApiError | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: string;
  /** The original Postgrest/database error (sanitized) */
  original?: string;
}

// ─── Success / Error Builders ────────────────────────────

export function success<T>(data: T): ApiResponse<T> {
  return { success: true, data, error: null };
}

export function failure<T = null>(code: string, message: string, details?: string, original?: string): ApiResponse<T> {
  return {
    success: false,
    data: null,
    error: { code, message, details, original },
  } as unknown as ApiResponse<T>;
}

export function paginatedSuccess<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    error: null,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
    },
  };
}

// ─── Supabase Error Mapper ───────────────────────────────

const ERROR_MAP: Record<string, { code: string; message: string }> = {
  "23505": { code: "DUPLICATE", message: "A record with this value already exists." },
  "23503": { code: "FK_VIOLATION", message: "Referenced record not found." },
  "23502": { code: "NOT_NULL", message: "A required value is missing." },
  "42P01": { code: "TABLE_NOT_FOUND", message: "Table does not exist." },
  "42703": { code: "COLUMN_NOT_FOUND", message: "Column does not exist." },
  "42501": { code: "PERMISSION_DENIED", message: "You do not have permission to perform this action." },
  "PGRST116": { code: "NOT_FOUND", message: "Resource not found." },
  "PGRST104": { code: "RATE_LIMITED", message: "Too many requests. Please try again later." },
  "22P02": { code: "INVALID_INPUT", message: "Invalid input format." },
};

export function mapPostgrestError(error: PostgrestError | null): ApiError | null {
  if (!error) return null;

  const mapped = ERROR_MAP[error.code];
  return {
    code: mapped?.code || "UNKNOWN",
    message: mapped?.message || error.message || "An unexpected database error occurred.",
    details: error.details || undefined,
    original: error.hint ? `${error.message} (hint: ${error.hint})` : error.message,
  };
}

// ─── Safe Query Execution ────────────────────────────────

export interface QueryOptions {
  /** Throw on error instead of returning ApiResponse */
  throwOnError?: boolean;
  /** Performance tracking label */
  label?: string;
}

/**
 * Execute a Supabase query and return a structured ApiResponse.
 * Accepts any Supabase query builder — awaits it internally.
 */
export async function executeQuery<T>(
  query: any,
  options: QueryOptions = {}
): Promise<ApiResponse<T>> {
  const start = performance.now();
  const label = options.label || "query";

  try {
    const { data, error } = await query;
    const duration = Math.round(performance.now() - start);

    if (error) {
      const apiError = mapPostgrestError(error);
      const friendlyMessage = apiError?.message || error.message || "An unexpected database error occurred.";
      console.warn(`[API:${label}] Failed:`, friendlyMessage);
      if (options.throwOnError) {
        throw new Error(friendlyMessage);
      }
      return { success: false, data: null, error: apiError, duration };
    }

    return { success: true, data: data as T, error: null, duration };
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    if (err instanceof Error && options.throwOnError) throw err;

    const message = err instanceof Error ? err.message : "Query execution failed";

    // User-friendly messages for common network/auth errors
    let friendlyMessage = message;
    const msg = message.toLowerCase();
    if (msg.includes("network") || msg.includes("fetch")) {
      friendlyMessage = "A network error occurred. Please check your connection and try again.";
    } else if (msg.includes("permission") || msg.includes("not allowed")) {
      friendlyMessage = "You do not have permission to perform this action.";
    } else if (msg.includes("auth") || msg.includes("session") || msg.includes("jwt")) {
      friendlyMessage = "Your session may have expired. Please try signing in again.";
    } else if (msg.includes("timeout") || msg.includes("timed out")) {
      friendlyMessage = "The request timed out. Please check your connection and try again.";
    }

    return {
      success: false,
      data: null,
      error: {
        code: "QUERY_FAILED",
        message: friendlyMessage,
        details: message,
      },
      duration,
    };
  }
}

/**
 * Helper to create a query function for paginated queries.
 */
export type QueryBuilder = (q: ReturnType<typeof supabase.from>) => any;

/**
 * Execute a paginated Supabase query.
 */
export async function executePaginatedQuery<T>(
  tableName: string,
  queryBuilder: QueryBuilder,
  page: number = 1,
  pageSize: number = 20,
  options: QueryOptions = {}
): Promise<PaginatedResponse<T>> {
  try {
    // Count total
    const countQuery = queryBuilder(supabase.from(tableName)).select("*", { count: "exact", head: true });
    const countResult = await countQuery;
    const total = (countResult.count as number) || 0;

    // Fetch data with pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const dataQuery = queryBuilder(supabase.from(tableName))
      .select("*")
      .range(from, to);

    const { data, error } = await dataQuery;

    if (error) {
      const apiError = mapPostgrestError(error);
      return {
        success: false,
        data: [],
        error: apiError,
        pagination: { page, pageSize, total: 0, totalPages: 0, hasMore: false },
      };
    }

    return paginatedSuccess<T>(data as T[], page, pageSize, total || 0);
  } catch (err) {
    return {
      success: false,
      data: [],
      error: {
        code: "PAGINATION_FAILED",
        message: err instanceof Error ? err.message : "Pagination query failed",
      },
      pagination: { page, pageSize, total: 0, totalPages: 0, hasMore: false },
    };
  }
}

// ─── Field Whitelisting ──────────────────────────────────

/**
 * Build a select string from a whitelist of allowed fields.
 * Prevents accidental exposure of sensitive columns.
 */
export function buildSelect(fields: readonly string[]): string {
  return fields.join(",");
}

/**
 * Common field whitelists for each entity.
 * Add/remove fields as needed — these control what reaches the frontend.
 */
export const FIELD_SETS = {
  profile: [
    "id", "email", "full_name", "role", "badge_number",
    "station", "phone", "avatar_url", "is_active", "department",
    "division", "last_login_at", "created_at",
  ] as const,

  incident: [
    "id", "officer_id", "violation_type_id", "title", "description",
    "location_lat", "location_lng", "location_address",
    "vehicle_plate", "vehicle_type", "vehicle_color",
    "severity", "status", "officer_notes", "created_at", "updated_at",
  ] as const,

  evidence: [
    "id", "incident_id", "type", "description", "file_size",
    "mime_type", "officer_id", "captured_at", "capture_lat", "capture_lng",
    "sha256_hash", "evidence_status", "source", "uploaded_at",
  ] as const,

  vehicle: [
    "id", "license_plate", "vehicle_type", "vehicle_make",
    "vehicle_model", "vehicle_color", "vin", "is_stolen", "is_wanted",
  ] as const,

  driver: [
    "id", "full_name", "driver_license_number", "driver_license_class",
    "driver_license_expiry", "phone", "photo_url", "is_active",
  ] as const,

  user: [
    "id", "email", "full_name", "role", "badge_number",
    "station", "is_active", "last_login_at", "created_at",
  ] as const,

  notification: [
    "id", "user_id", "type", "title", "message", "priority",
    "is_read", "created_at", "reference_type", "reference_id", "action_url",
  ] as const,

  audit: [
    "id", "action", "performed_by", "target_type", "target_id",
    "description", "severity", "created_at",
  ] as const,

  citizenReport: [
    "id", "report_type", "violation_type", "description",
    "location_address", "location_lat", "location_lng",
    "vehicle_plate", "status", "created_at",
  ] as const,
} as const;

// ─── Validation Helpers ──────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: { field: string; message: string }[];
}

export function validateRequired(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || value === "") {
    return `${fieldName} is required.`;
  }
  return null;
}

export function validateStringLength(value: string, fieldName: string, min: number, max: number): string | null {
  if (value.length < min || value.length > max) {
    return `${fieldName} must be between ${min} and ${max} characters.`;
  }
  return null;
}

export function validateEnum<T extends string>(value: string, allowedValues: readonly T[], fieldName: string): string | null {
  if (!allowedValues.includes(value as T)) {
    return `${fieldName} must be one of: ${allowedValues.join(", ")}.`;
  }
  return null;
}

export function validateLatitude(lat: number): string | null {
  if (lat < -90 || lat > 90) return "Latitude must be between -90 and 90.";
  return null;
}

export function validateLongitude(lng: number): string | null {
  if (lng < -180 || lng > 180) return "Longitude must be between -180 and 180.";
  return null;
}

export function combineValidations(...validations: (string | null)[]): string | null {
  const errors = validations.filter((v): v is string => v !== null);
  return errors.length > 0 ? errors.join(" ") : null;
}
