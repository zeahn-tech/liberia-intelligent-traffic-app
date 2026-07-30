// ============================================================
// TrafficWatch AI — Data Privacy Utilities
//
// Implements:
//  - PII detection and masking
//  - Data classification (public/internal/confidential/restricted/PII)
//  - Data minimization (field-level access control)
//  - Retention policy queries
//  - Consent management
//  - Data subject request (GDPR-style: access, erasure, portability)
//  - Privacy impact logging
// ============================================================

import { supabase } from "@/supabase/client";
import type { Profile } from "@/supabase/types";

// ─── Classification Levels ────────────────────────────

export type DataClassification =
  | "public"
  | "internal"
  | "confidential"
  | "restricted"
  | "pii"
  | "sensitive_pii";

export const CLASSIFICATION_ORDER: Record<DataClassification, number> = {
  public: 0,
  internal: 1,
  confidential: 2,
  restricted: 3,
  pii: 4,
  sensitive_pii: 5,
};

export const CLASSIFICATION_LABELS: Record<DataClassification, string> = {
  public: "Public",
  internal: "Internal",
  confidential: "Confidential",
  restricted: "Restricted",
  pii: "Personally Identifiable",
  sensitive_pii: "Sensitive PII",
};

export const CLASSIFICATION_COLORS: Record<DataClassification, string> = {
  public: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
  internal: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  confidential: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  restricted: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
  pii: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
  sensitive_pii: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
};

// ─── Retention Policy Types ──────────────────────────

export type DataCategory =
  | "incidents" | "evidence" | "citizen_reports" | "anpr_scans"
  | "ai_analyses" | "audit_logs" | "security_events" | "user_sessions"
  | "notifications" | "reports" | "user_profiles";

export type ArchivalStrategy = "soft_delete" | "hard_delete" | "anonymize" | "archive";

export interface RetentionPolicy {
  id: string;
  data_category: DataCategory;
  retention_days: number;
  archival_strategy: ArchivalStrategy;
  auto_purge_enabled: boolean;
  requires_review_before_purge: boolean;
  exempt_critical: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataClassificationRecord {
  id: string;
  table_name: string;
  column_name: string;
  classification: DataClassification;
  description: string | null;
  masking_rule: string | null;
  retention_category: string | null;
  created_at: string;
}

export interface DataSubjectRequest {
  id: string;
  request_type: "access" | "rectification" | "erasure" | "restrict_processing" | "data_portability" | "object_to_processing";
  requested_by: string | null;
  subject_id: string | null;
  subject_type: string | null;
  status: "pending" | "in_review" | "approved" | "completed" | "rejected" | "expired";
  requested_at: string;
  completed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  response_data: Record<string, unknown> | null;
  expires_at: string | null;
}

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: string;
  granted: boolean;
  ip_address: string | null;
  user_agent: string | null;
  consent_version: string | null;
  granted_at: string;
  revoked_at: string | null;
  expires_at: string | null;
}

export interface PrivacySummary {
  total_pii_columns: number;
  total_retention_policies: number;
  auto_purge_enabled: number;
  active_consents: number;
  pending_data_requests: number;
  pii_access_events_30d: number;
}

// ─── PII Detection ────────────────────────────────────

const PII_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
// eslint-disable-next-line
  phone: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]{6,15}$/,
  fullName: /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/,
  licensePlate: /^[A-Z0-9]{1,8}[\s-]?[A-Z0-9]{1,8}$/i,
  ipAddress: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  badgeNumber: /^\d{4,10}$/,
};

/**
 * Check if a string value appears to contain PII.
 * Uses pattern matching — not perfect, but catches common cases.
 */
export function containsPII(value: string): { isPII: boolean; type?: string } {
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    if (pattern.test(value.trim())) {
      return { isPII: true, type };
    }
  }
  return { isPII: false };
}

// ─── Masking Functions ────────────────────────────────

/**
 * Mask an email: j***@example.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;
  const [name, domain] = email.split("@");
  if (name.length <= 1) return `*@${domain}`;
  return `${name[0]}${"*".repeat(Math.min(name.length - 1, 5))}@${domain}`;
}

/**
 * Mask a phone: ***-***-1234
 */
export function maskPhone(phone: string): string {
  if (!phone) return phone;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "*".repeat(digits.length);
  const visible = digits.slice(-4);
  return `${"*".repeat(digits.length - 4)}${visible}`;
}

/**
 * Mask a name: J*** D***
 */
export function maskName(name: string): string {
  if (!name) return name;
  return name
    .split(/\s+/)
    .map((part) => {
      if (part.length <= 1) return `${part}***`;
      return `${part[0]}${"*".repeat(Math.min(part.length - 1, 3))}`;
    })
    .join(" ");
}

/**
 * Mask a license plate: ***-*** (or all asterisks)
 */
export function maskPlate(plate: string): string {
  if (!plate) return plate;
  return "*".repeat(Math.min(plate.length, 10));
}

/**
 * Mask an IP: 192.168.***.***
 */
export function maskIP(ip: string): string {
  if (!ip) return ip;
  const parts = ip.split(".");
  if (parts.length !== 4) return "*".repeat(ip.length);
  return `${parts[0]}.${parts[1]}.***.***`;
}

/**
 * Mask a value based on a masking rule.
 */
export function maskValue(value: string, rule: string | null): string {
  if (!value || !rule) return value;
  switch (rule) {
    case "mask_email": return maskEmail(value);
    case "mask_phone": return maskPhone(value);
    case "mask_name": return maskName(value);
    case "mask_plate": return maskPlate(value);
    case "mask_ip": return maskIP(value);
    case "truncate": return value.length > 50 ? `${value.slice(0, 50)}...` : value;
    default: return value;
  }
}

// ─── Data Minimization Helper ────────────────────────

/**
 * Build a safe (minimized) profile object based on the viewer's role.
 * Removes or masks sensitive PII fields for unauthorized viewers.
 */
export function minimizeProfile(
  profile: Profile | null,
  viewerRole?: string
): Partial<Profile> {
  if (!profile) return {};

  const isAuthorized = viewerRole && ["system_administrator", "national_commissioner", "regional_commander", "traffic_commander", "police_supervisor", "investigator"].includes(viewerRole);
  const isOwnerViewing = false; // caller can override

  if (isAuthorized || isOwnerViewing) {
    return profile;
  }

  // Return minimized version
  return {
    id: profile.id,
    role: profile.role,
    full_name: maskName(profile.full_name || ""),
    badge_number: profile.badge_number ? `***${profile.badge_number.slice(-3)}` : undefined,
    station: profile.station || undefined,
  } as Partial<Profile>;
}

// ─── Retrieval Functions ─────────────────────────────

/**
 * Get all retention policies.
 */
export async function getRetentionPolicies(): Promise<RetentionPolicy[]> {
  try {
    const { data, error } = await supabase
      .from("retention_policies")
      .select("*")
      .order("data_category");

    if (error) throw error;
    return (data || []) as RetentionPolicy[];
  } catch (err) {
    console.error("[Privacy] Failed to fetch retention policies:", err);
    return [];
  }
}

/**
 * Update a retention policy.
 */
export async function updateRetentionPolicy(
  policyId: string,
  updates: Partial<Pick<RetentionPolicy, "retention_days" | "archival_strategy" | "auto_purge_enabled" | "requires_review_before_purge">>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("retention_policies")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", policyId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[Privacy] Failed to update retention policy:", err);
    return false;
  }
}

/**
 * Get data classification records.
 */
export async function getDataClassifications(): Promise<DataClassificationRecord[]> {
  try {
    const { data, error } = await supabase
      .from("data_classification")
      .select("*")
      .order("table_name")
      .order("column_name");

    if (error) throw error;
    return (data || []) as DataClassificationRecord[];
  } catch (err) {
    console.error("[Privacy] Failed to fetch data classifications:", err);
    return [];
  }
}

/**
 * Get the user's consent records.
 */
export async function getConsentRecords(userId: string): Promise<ConsentRecord[]> {
  try {
    const { data, error } = await supabase
      .from("consent_records")
      .select("*")
      .eq("user_id", userId)
      .order("granted_at", { ascending: false });

    if (error) throw error;
    return (data || []) as ConsentRecord[];
  } catch (err) {
    console.error("[Privacy] Failed to fetch consent records:", err);
    return [];
  }
}

/**
 * Record or update a consent choice.
 */
export async function setConsent(
  userId: string,
  consentType: string,
  granted: boolean,
  consentVersion?: string
): Promise<boolean> {
  try {
    // Check if a record already exists for this user+type
    const { data: existing } = await supabase
      .from("consent_records")
      .select("id")
      .eq("user_id", userId)
      .eq("consent_type", consentType)
      .is("revoked_at", null)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from("consent_records")
        .update({
          granted,
          revoked_at: granted ? null : new Date().toISOString(),
          consent_version: consentVersion || null,
          user_agent: navigator.userAgent.slice(0, 200),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      // Insert new
      const { error } = await supabase
        .from("consent_records")
        .insert({
          user_id: userId,
          consent_type: consentType,
          granted,
          consent_version: consentVersion || null,
          user_agent: navigator.userAgent.slice(0, 200),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      if (error) throw error;
    }

    // Log privacy impact
    await logPrivacyImpact({
      eventType: "consent_change",
      description: `Consent ${granted ? "granted" : "revoked"} for ${consentType}`,
      userId,
      details: { consent_type: consentType, granted, consent_version: consentVersion },
      riskLevel: "low",
    });

    return true;
  } catch (err) {
    console.error("[Privacy] Failed to record consent:", err);
    return false;
  }
}

/**
 * Get privacy summary statistics.
 */
export async function getPrivacySummary(): Promise<PrivacySummary | null> {
  try {
    const { data, error } = await supabase.rpc("get_privacy_summary");
    if (error) throw error;
    return data as PrivacySummary;
  } catch (err) {
    console.error("[Privacy] Failed to get privacy summary:", err);
    return null;
  }
}

// ─── Data Subject Requests ───────────────────────────

/**
 * Submit a data subject request (access, erasure, portability, etc.)
 */
export async function submitDataSubjectRequest(
  requestType: DataSubjectRequest["request_type"],
  subjectId?: string,
  subjectType?: string
): Promise<string | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("data_subject_requests")
      .insert({
        request_type: requestType,
        requested_by: user.user.id,
        subject_id: subjectId || null,
        subject_type: subjectType || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  } catch (err) {
    console.error("[Privacy] Failed to submit data subject request:", err);
    return null;
  }
}

/**
 * Get the user's data subject requests.
 */
export async function getDataSubjectRequests(): Promise<DataSubjectRequest[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from("data_subject_requests")
      .select("*")
      .eq("requested_by", user.user.id)
      .order("requested_at", { ascending: false });

    if (error) throw error;
    return (data || []) as DataSubjectRequest[];
  } catch (err) {
    console.error("[Privacy] Failed to fetch data subject requests:", err);
    return [];
  }
}

/**
 * Request full data erasure (Right to Erasure / GDPR Article 17).
 */
export async function requestDataErasure(): Promise<{ success: boolean; requestId?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    const requestId = await submitDataSubjectRequest("erasure", user.user.id, "user");
    return { success: !!requestId, requestId: requestId || undefined };
  } catch (err) {
    console.error("[Privacy] Failed to request data erasure:", err);
    return { success: false };
  }
}

/**
 * Export personal data (Right to Data Portability).
 */
export async function exportPersonalData(): Promise<Record<string, unknown> | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc("export_user_data", {
      p_user_id: user.user.id,
    });

    if (error) throw error;
    return data as Record<string, unknown>;
  } catch (err) {
    console.error("[Privacy] Failed to export personal data:", err);
    return null;
  }
}

// ─── Privacy Impact Logging ──────────────────────────

export interface PrivacyImpactEvent {
  eventType: string;
  description?: string;
  userId?: string;
  details?: Record<string, unknown>;
  riskLevel?: "low" | "medium" | "high" | "critical";
}

/**
 * Log a privacy impact event.
 */
export async function logPrivacyImpact(event: PrivacyImpactEvent): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("privacy_impact_log")
      .insert({
        event_type: event.eventType,
        description: event.description || null,
        user_id: event.userId || null,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        details: (event.details || {}) as any,
        risk_level: event.riskLevel || "low",
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[Privacy] Failed to log privacy impact:", err);
    return false;
  }
}

// ─── Apply Retention Policy ──────────────────────────

/**
 * Manually trigger a retention policy for a data category.
 */
export async function applyRetentionPolicy(category: DataCategory): Promise<Record<string, unknown> | null> {
  try {
    const { data, error } = await supabase.rpc("apply_retention_policy", {
      p_category: category,
    });

    if (error) throw error;
    return data as Record<string, unknown>;
  } catch (err) {
    console.error("[Privacy] Failed to apply retention policy:", err);
    return null;
  }
}

// ─── Privacy Category Labels ─────────────────────────

export const DATA_CATEGORY_LABELS: Record<DataCategory, string> = {
  incidents: "Incidents",
  evidence: "Evidence",
  citizen_reports: "Citizen Reports",
  anpr_scans: "ANPR Scans",
  ai_analyses: "AI Analyses",
  audit_logs: "Audit Logs",
  security_events: "Security Events",
  user_sessions: "User Sessions",
  notifications: "Notifications",
  reports: "Reports",
  user_profiles: "User Profiles",
};

export const ARCHIVAL_STRATEGY_LABELS: Record<ArchivalStrategy, string> = {
  soft_delete: "Soft Delete (marked as deleted)",
  hard_delete: "Hard Delete (permanently removed)",
  anonymize: "Anonymize (PII removed, data retained)",
  archive: "Archive (moved to cold storage)",
};

export const CONSENT_TYPE_LABELS: Record<string, string> = {
  data_processing: "Data Processing",
  data_sharing: "Data Sharing",
  marketing: "Marketing Communications",
  analytics: "Analytics & Usage Tracking",
  ai_analysis: "AI-Powered Analysis",
  biometrics: "Biometric Data Processing",
  third_party_sharing: "Third-Party Data Sharing",
  research: "Research & Development",
};

export const REQUEST_TYPE_LABELS: Record<string, string> = {
  access: "Access My Data",
  rectification: "Correct My Data",
  erasure: "Delete My Data (Right to Erasure)",
  restrict_processing: "Restrict Processing",
  data_portability: "Export My Data (Data Portability)",
  object_to_processing: "Object to Processing",
};
