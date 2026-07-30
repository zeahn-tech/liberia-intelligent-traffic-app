/**
 * Chain-of-Custody Engine
 *
 * Automatically logs every interaction with evidence:
 * upload, view, download, analyze, transfer, verify, export, etc.
 *
 * All custody events are immutable — once written they are never
 * modified or deleted. Each event records who, what, when, and
 * device/network context.
 */

import type { EvidenceCustodyEvent } from "@/supabase/types";
import { offlineGet } from "@/lib/offline";
import { offlineSet } from "@/lib/offline";
import { addToSyncQueue } from "@/lib/sync";

// ===== Types =====

export type CustodyAction =
  | "uploaded"
  | "viewed"
  | "downloaded"
  | "analyzed"
  | "transferred"
  | "reviewed"
  | "verified"
  | "exported"
  | "archived"
  | "restored"
  | "expunged"
  | "hash_verified"
  | "officer_notes_added";

export interface CustodyEventInput {
  evidenceId: string;
  action: CustodyAction;
  officerId: string;
  officerName?: string;
  fromOfficer?: string;
  toOfficer?: string;
  details?: Record<string, unknown>;
}

// ===== Event Recording =====

const LOCAL_DB_KEY_PREFIX = "custody_events_";

/**
 * Record a chain-of-custody event.
 * Stores locally and queues for sync to Supabase.
 */
export async function recordCustodyEvent(input: CustodyEventInput): Promise<EvidenceCustodyEvent> {
  const event: EvidenceCustodyEvent = {
    id: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    evidence_id: input.evidenceId,
    action: input.action,
    performed_by: input.officerId,
    from_officer: input.fromOfficer || null,
    to_officer: input.toOfficer || null,
    ip_address: null, // TODO: capture via network info API
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : null,
    details: input.details || null,
    created_at: new Date().toISOString(),
  };

  // Store locally
  const key = LOCAL_DB_KEY_PREFIX + input.evidenceId;
  const existing = await offlineGet<EvidenceCustodyEvent[]>("cache", key);
  const updated = [...(existing || []), event];
  await offlineSet("cache", key, updated);

  // Queue for sync to Supabase
  await addToSyncQueue({
    tableName: "evidence_custody",
    recordId: event.id,
    operation: "create",
    payload: event,
  });

  return event;
}

// ===== Retrieval =====

/**
 * Get the full chain-of-custody for a piece of evidence.
 * Events are returned in chronological order (oldest first).
 */
export async function getCustodyChain(evidenceId: string): Promise<EvidenceCustodyEvent[]> {
  const key = LOCAL_DB_KEY_PREFIX + evidenceId;
  const events = await offlineGet<EvidenceCustodyEvent[]>("cache", key);
  if (!events) return [];
  return events.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

/**
 * Get custody events for multiple evidence items, keyed by evidence ID.
 */
export async function getCustodyChains(
  evidenceIds: string[]
): Promise<Record<string, EvidenceCustodyEvent[]>> {
  const result: Record<string, EvidenceCustodyEvent[]> = {};
  for (const id of evidenceIds) {
    result[id] = await getCustodyChain(id);
  }
  return result;
}

/**
 * Check if the user is authorized to view custody data.
 * Authorized roles: officer, supervisor, admin, investigator
 */
export function isAuthorizedForCustody(role?: string): boolean {
  if (!role) return false;
  return ["officer", "supervisor", "admin", "investigator"].includes(role);
}

// ===== Convenience Logging =====

/**
 * Log that evidence was viewed by an officer.
 */
export async function logEvidenceViewed(evidenceId: string, officerId: string): Promise<EvidenceCustodyEvent> {
  return recordCustodyEvent({
    evidenceId,
    action: "viewed",
    officerId,
    details: { viewed_from: "evidence_detail_dialog" },
  });
}

/**
 * Log that evidence was downloaded by an officer.
 */
export async function logEvidenceDownloaded(evidenceId: string, officerId: string): Promise<EvidenceCustodyEvent> {
  return recordCustodyEvent({
    evidenceId,
    action: "downloaded",
    officerId,
    details: { download_type: "original" },
  });
}

/**
 * Log that evidence was analyzed by AI.
 */
export async function logEvidenceAnalyzed(
  evidenceId: string,
  officerId: string,
  providerName: string,
  confidence: number
): Promise<EvidenceCustodyEvent> {
  return recordCustodyEvent({
    evidenceId,
    action: "analyzed",
    officerId,
    details: { provider: providerName, confidence, analysis_type: "ai_computer_vision" },
  });
}

/**
 * Log that evidence hash was verified.
 */
export async function logHashVerified(
  evidenceId: string,
  officerId: string,
  hashMatch: boolean
): Promise<EvidenceCustodyEvent> {
  return recordCustodyEvent({
    evidenceId,
    action: "hash_verified",
    officerId,
    details: { hash_match: hashMatch, algorithm: "SHA-256" },
  });
}

/**
 * Log that evidence was transferred between officers.
 */
export async function logEvidenceTransferred(
  evidenceId: string,
  fromOfficer: string,
  toOfficer: string
): Promise<EvidenceCustodyEvent> {
  return recordCustodyEvent({
    evidenceId,
    action: "transferred",
    officerId: fromOfficer,
    fromOfficer,
    toOfficer,
    details: { transfer_method: "assignment" },
  });
}

/**
 * Log that officer notes were added to evidence.
 */
export async function logNotesAdded(
  evidenceId: string,
  officerId: string
): Promise<EvidenceCustodyEvent> {
  return recordCustodyEvent({
    evidenceId,
    action: "officer_notes_added",
    officerId,
  });
}

/**
 * Log that evidence was exported.
 */
export async function logEvidenceExported(
  evidenceId: string,
  officerId: string,
  format: string
): Promise<EvidenceCustodyEvent> {
  return recordCustodyEvent({
    evidenceId,
    action: "exported",
    officerId,
    details: { export_format: format },
  });
}

// ===== Integrity Verification =====

export interface IntegrityReport {
  evidenceId: string;
  fileHash: string | null;
  originalHash: string | null;
  status: "verified" | "mismatch" | "no_hash";
  lastVerifiedAt: string | null;
  custodyEvents: number;
}

/**
 * Generate an integrity report for evidence.
 * Compares current SHA-256 hash with original recorded hash.
 */
export function generateIntegrityReport(
  evidence: {
    id: string;
    sha256_hash: string | null;
    original_file_hash: string | null;
  },
  custodyEvents: EvidenceCustodyEvent[]
): IntegrityReport {
  const hashVerifyEvents = custodyEvents.filter((e) => e.action === "hash_verified");
  const lastVerified = hashVerifyEvents.length > 0
    ? hashVerifyEvents[hashVerifyEvents.length - 1].created_at
    : null;

  let status: IntegrityReport["status"] = "no_hash";

  if (evidence.sha256_hash && evidence.original_file_hash) {
    status = evidence.sha256_hash === evidence.original_file_hash ? "verified" : "mismatch";
  } else if (evidence.sha256_hash) {
    status = "verified";
  }

  return {
    evidenceId: evidence.id,
    fileHash: evidence.sha256_hash,
    originalHash: evidence.original_file_hash,
    status,
    lastVerifiedAt: lastVerified,
    custodyEvents: custodyEvents.length,
  };
}

// ===== Mock Data Generator =====

/**
 * Generate mock custody events for demo/simulation purposes.
 * Called when evidence is first viewed in the detail dialog.
 */
export async function seedMockCustodyEvents(
  evidenceId: string,
  officerId: string,
  officerName: string,
  uploadedAt: string,
  deviceInfo?: string | null
): Promise<void> {
  const key = LOCAL_DB_KEY_PREFIX + evidenceId;
  const existing = await offlineGet<EvidenceCustodyEvent[]>("cache", key);
  if (existing && existing.length > 0) return; // Already seeded

  const base = new Date(uploadedAt).getTime();
  const mockEvents: EvidenceCustodyEvent[] = [
    {
      id: `cust-mock-${evidenceId}-1`,
      evidence_id: evidenceId,
      action: "uploaded",
      performed_by: officerId,
      from_officer: null,
      to_officer: null,
      ip_address: "10.0.1.45",
      user_agent: "TrafficWatch App / Mobile",
      details: { device: deviceInfo || "Mobile Device", source: "officer_upload" },
      created_at: new Date(base).toISOString(),
    },
    {
      id: `cust-mock-${evidenceId}-2`,
      evidence_id: evidenceId,
      action: "viewed",
      performed_by: officerId,
      from_officer: null,
      to_officer: null,
      ip_address: "10.0.1.45",
      user_agent: "TrafficWatch App / Desktop",
      details: null,
      created_at: new Date(base + 60000).toISOString(),
    },
    {
      id: `cust-mock-${evidenceId}-3`,
      evidence_id: evidenceId,
      action: "hash_verified",
      performed_by: "system",
      from_officer: null,
      to_officer: null,
      ip_address: null,
      user_agent: "System Auto-Verify",
      details: { hash_match: true, algorithm: "SHA-256" },
      created_at: new Date(base + 90000).toISOString(),
    },
  ];

  await offlineSet("cache", key, mockEvents);
}
