// ============================================================
// TrafficWatch AI — Realtime Incidents Hook
//
// Subscribes to incident changes for live updates:
// - New incidents
// - Status changes
// - Assignment changes
// - Individual incident detail page subscriptions
// ============================================================

import { useState, useCallback } from "react";
import { useRealtimeChannel, rt, useRealtimeCounter } from "./use-realtime";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────

export type IncidentChangeType =
  | "new_incident"
  | "status_change"
  | "incident_updated"
  | "incident_deleted"
  | "assignment_changed";

export interface IncidentChangeEvent {
  type: IncidentChangeType;
  incidentId: string;
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>;
  newStatus?: string;
  oldStatus?: string;
  newOfficerId?: string;
  oldOfficerId?: string;
  timestamp: string;
}

export interface UseRealtimeIncidentsResult {
  /** Latest incident change event (for toast/notification) */
  latestEvent: IncidentChangeEvent | null;
  /** Number of unseen changes since last acknowledged */
  newCount: number;
  /** Ready state */
  ready: boolean;
  /** Error message, if any */
  error: string | null;
  /** Acknowledge (reset) the new count */
  acknowledge: () => void;
  /** Clear the latest event */
  clearEvent: () => void;
}

// ─── Hook: Incident List (dashboard/main list) ──────────

/**
 * Subscribe to all incident changes (new, updated, deleted).
 * Use on the Dashboard, Incidents list, and Command Center.
 */
export function useRealtimeIncidents(): UseRealtimeIncidentsResult {
  const [latestEvent, setLatestEvent] = useState<IncidentChangeEvent | null>(null);

  const onChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      const newRecord = payload.new as Record<string, unknown> | undefined;
      const oldRecord = payload.old as Record<string, unknown> | undefined;

      let type: IncidentChangeType;
      const incidentId = (newRecord?.id ?? oldRecord?.id ?? "") as string;

      switch (payload.eventType) {
        case "INSERT":
          type = "new_incident";
          break;
        case "UPDATE": {
          // Check for status change specifically
          if (
            newRecord?.status &&
            oldRecord?.status &&
            newRecord.status !== oldRecord.status
          ) {
            type = "status_change";
          }
          // Check for assignment change
          else if (
            newRecord?.officer_id &&
            oldRecord?.officer_id &&
            newRecord.officer_id !== oldRecord.officer_id
          ) {
            type = "assignment_changed";
          } else {
            type = "incident_updated";
          }
          break;
        }
        case "DELETE":
          type = "incident_deleted";
          break;
        default:
          type = "incident_updated";
      }

      setLatestEvent({
        type,
        incidentId,
        payload,
        newStatus: (newRecord?.status as string) ?? undefined,
        oldStatus: (oldRecord?.status as string) ?? undefined,
        newOfficerId: (newRecord?.officer_id as string) ?? undefined,
        oldOfficerId: (oldRecord?.officer_id as string) ?? undefined,
        timestamp: new Date().toISOString(),
      });
    },
    []
  );

  const { count, ready, error, acknowledge } = useRealtimeCounter(
    {
      label: "incidents-live",
      channelName: "incidents",
      filters: [rt.all("incidents")],
      onChange,
      debounceMs: 300,
    },
    { debug: false }
  );

  const clearEvent = useCallback(() => setLatestEvent(null), []);

  return {
    latestEvent,
    newCount: count,
    ready,
    error,
    acknowledge,
    clearEvent,
  };
}

// ─── Hook: Single Incident Detail ────────────────────────

/**
 * Subscribe to changes on a specific incident by ID.
 * Use on the Incident Detail page to live-update status/comments.
 */
export function useRealtimeIncident(
  incidentId: string | undefined
): UseRealtimeIncidentsResult {
  const [latestEvent, setLatestEvent] = useState<IncidentChangeEvent | null>(null);
  const [newCount, setNewCount] = useState(0);

  const onChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      const newRecord = payload.new as Record<string, unknown> | undefined;
      const oldRecord = payload.old as Record<string, unknown> | undefined;

      let type: IncidentChangeType;
      const id = (newRecord?.id ?? oldRecord?.id ?? "") as string;

      switch (payload.eventType) {
        case "UPDATE": {
          if (
            newRecord?.status &&
            oldRecord?.status &&
            newRecord.status !== oldRecord.status
          ) {
            type = "status_change";
          } else if (
            newRecord?.officer_id &&
            oldRecord?.officer_id &&
            newRecord.officer_id !== oldRecord.officer_id
          ) {
            type = "assignment_changed";
          } else {
            type = "incident_updated";
          }
          break;
        }
        case "DELETE":
          type = "incident_deleted";
          break;
        default:
          type = "incident_updated";
      }

      setLatestEvent({
        type,
        incidentId: id,
        payload,
        newStatus: (newRecord?.status as string) ?? undefined,
        oldStatus: (oldRecord?.status as string) ?? undefined,
        timestamp: new Date().toISOString(),
      });

      setNewCount((prev) => prev + 1);
    },
    []
  );

  const { ready, error } = useRealtimeChannel(
    {
      label: `incident-${incidentId}`,
      channelName: `incident-${incidentId}`,
      filters: incidentId ? [rt.row("incidents", incidentId)] : [],
      onChange,
      debounceMs: 200,
    },
    { enabled: !!incidentId }
  );

  const acknowledge = useCallback(() => setNewCount(0), []);
  const clearEvent = useCallback(() => setLatestEvent(null), []);

  return {
    latestEvent,
    newCount,
    ready,
    error,
    acknowledge,
    clearEvent,
  };
}
