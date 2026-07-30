// ============================================================
// TrafficWatch AI — Realtime Dashboard Hook
//
// Provides live-updating metrics for dashboards:
// - Live count of new incidents (today, now)
// - AI analysis status changes
// - Evidence processing updates
// - Camera event counts
// - Combined "activity pulse" for dashboard KPI updates
// ============================================================

import { useState, useCallback, useRef, useEffect } from "react";
import { useRealtimeChannel, rt } from "./use-realtime";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────

export type DashboardActivityType =
  | "new_incident"
  | "incident_resolved"
  | "ai_analysis_complete"
  | "ai_analysis_started"
  | "evidence_uploaded"
  | "evidence_processed"
  | "camera_event"
  | "new_notification"
  | "status_change";

export interface DashboardActivity {
  type: DashboardActivityType;
  label: string;
  timestamp: string;
  /** Optional ID for linking */
  referenceId?: string;
  /** Optional severity for alert coloring */
  severity?: string;
}

export interface UseRealtimeDashboardResult {
  /** Accumulated activity feed (limited to last 20) */
  activityFeed: DashboardActivity[];
  /** Live counts for KPI cards */
  liveCounts: {
    newIncidentsToday: number;
    aiAnalysesCompleted: number;
    evidenceProcessed: number;
    cameraEvents: number;
    statusChanges: number;
  };
  /** Latest activity item (for toast/animation) */
  latestActivity: DashboardActivity | null;
  /** Whether all subscriptions are ready */
  ready: boolean;
  /** Error messages per subscription */
  errors: Record<string, string | null>;
  /** Clear latest activity */
  clearLatest: () => void;
  /** Reset all counts */
  resetCounts: () => void;
}

// ─── Hook ────────────────────────────────────────────────

/**
 * Subscribe to all dashboard-relevant tables.
 * Only active when the component using it is mounted.
 * Debounced to avoid React re-render storms.
 */
export function useRealtimeDashboard(): UseRealtimeDashboardResult {
  const [activityFeed, setActivityFeed] = useState<DashboardActivity[]>([]);
  const [latestActivity, setLatestActivity] = useState<DashboardActivity | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const feedRef = useRef<DashboardActivity[]>([]);

  // Live counts — tracked locally, incremented on each event
  const liveCountsRef = useRef({
    newIncidentsToday: 0,
    aiAnalysesCompleted: 0,
    evidenceProcessed: 0,
    cameraEvents: 0,
    statusChanges: 0,
  });
  const [liveCounts, setLiveCounts] = useState({
    newIncidentsToday: 0,
    aiAnalysesCompleted: 0,
    evidenceProcessed: 0,
    cameraEvents: 0,
    statusChanges: 0,
  });

  // Helper: add activity to feed (max 20)
  const addActivity = useCallback((activity: DashboardActivity) => {
    feedRef.current = [activity, ...feedRef.current].slice(0, 20);
    setActivityFeed(feedRef.current);
    setLatestActivity(activity);

    // Auto-clear latest after 4s
    setTimeout(() => setLatestActivity((prev) =>
      prev?.timestamp === activity.timestamp ? null : prev
    ), 4000);
  }, []);

  // Helper: set error for a subscription
  const setSubError = useCallback((key: string, err: string | null) => {
    setErrors((prev) => ({ ...prev, [key]: err }));
  }, []);

  // ─── 1. Incidents subscription ────────────────────────

  const onIncidentChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      const newRecord = payload.new as Record<string, unknown>;
      const oldRecord = payload.old as Record<string, unknown>;

      if (payload.eventType === "INSERT") {
        liveCountsRef.current.newIncidentsToday++;
        addActivity({
          type: "new_incident",
          label: `New incident: ${(newRecord.title as string) || "Untitled"}`,
          timestamp: new Date().toISOString(),
          referenceId: newRecord.id as string,
          severity: newRecord.severity as string,
        });
      } else if (payload.eventType === "UPDATE") {
        const newStatus = newRecord.status as string;
        const oldStatus = oldRecord.status as string;
        if (newStatus && oldStatus && newStatus !== oldStatus) {
          liveCountsRef.current.statusChanges++;
          if (newStatus === "resolved" || newStatus === "closed") {
            addActivity({
              type: "incident_resolved",
              label: `Incident resolved: ${(newRecord.title as string) || "Untitled"}`,
              timestamp: new Date().toISOString(),
              referenceId: newRecord.id as string,
            });
          } else {
            addActivity({
              type: "status_change",
              label: `Status changed: ${(newRecord.title as string) || "Untitled"} → ${newStatus}`,
              timestamp: new Date().toISOString(),
              referenceId: newRecord.id as string,
            });
          }
        }
      }

      setLiveCounts({ ...liveCountsRef.current });
    },
    [addActivity]
  );

  const { error: incidentsError } = useRealtimeChannel(
    {
      label: "dashboard-incidents",
      channelName: "dash-incidents",
      filters: [rt.all("incidents")],
      onChange: onIncidentChange,
      debounceMs: 400,
    },
    { debug: false }
  );

  useEffect(() => {
    setSubError("incidents", incidentsError);
    // eslint-disable-next-line
  }, [incidentsError, setSubError]);

  // ─── 2. AI Analysis subscription ─────────────────────

  const onAIAnalysisChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      const newRecord = payload.new as Record<string, unknown>;
      const oldRecord = payload.old as Record<string, unknown>;

      if (payload.eventType === "UPDATE") {
        const newStatus = newRecord.status as string;
        const oldStatus = oldRecord.status as string;

        if (newStatus === "completed" && oldStatus !== "completed") {
          liveCountsRef.current.aiAnalysesCompleted++;
          addActivity({
            type: "ai_analysis_complete",
            label: `AI analysis complete for incident #${(newRecord.incident_id as string)?.slice(0, 8)}`,
            timestamp: new Date().toISOString(),
            referenceId: newRecord.incident_id as string,
          });
        } else if (newStatus === "processing" && oldStatus === "queued") {
          addActivity({
            type: "ai_analysis_started",
            label: "AI analysis started",
            timestamp: new Date().toISOString(),
            referenceId: newRecord.incident_id as string,
          });
        }
      }

      setLiveCounts({ ...liveCountsRef.current });
    },
    [addActivity]
  );

  const { error: aiError } = useRealtimeChannel(
    {
      label: "dashboard-ai",
      channelName: "dash-ai",
      filters: [rt.updates("ai_analysis_jobs")],
      onChange: onAIAnalysisChange,
      debounceMs: 500,
    },
    { debug: false }
  );

  useEffect(() => {
    setSubError("ai", aiError);
    // eslint-disable-next-line
  }, [aiError, setSubError]);

  // ─── 3. Evidence subscription ─────────────────────────

  const onEvidenceChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      const newRecord = payload.new as Record<string, unknown>;

      if (payload.eventType === "INSERT") {
        liveCountsRef.current.evidenceProcessed++;
        addActivity({
          type: "evidence_uploaded",
          label: `New evidence: ${(newRecord.description as string) || "Upload"}`,
          timestamp: new Date().toISOString(),
          referenceId: newRecord.incident_id as string,
        });
      }

      setLiveCounts({ ...liveCountsRef.current });
    },
    [addActivity]
  );

  const { error: evidenceError } = useRealtimeChannel(
    {
      label: "dashboard-evidence",
      channelName: "dash-evidence",
      filters: [rt.inserts("evidence")],
      onChange: onEvidenceChange,
      debounceMs: 300,
    },
    { debug: false }
  );

  useEffect(() => {
    setSubError("evidence", evidenceError);
    // eslint-disable-next-line
  }, [evidenceError, setSubError]);

  // ─── 4. Camera events subscription ────────────────────

  const onCameraEvent = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      const newRecord = payload.new as Record<string, unknown>;

      liveCountsRef.current.cameraEvents++;
      addActivity({
        type: "camera_event",
        label: `Camera event: ${(newRecord.event_type as string) || "detection"}`,
        timestamp: new Date().toISOString(),
        referenceId: newRecord.id as string,
        severity: (newRecord.confidence as number) && (newRecord.confidence as number) > 0.9
          ? "critical"
          : (newRecord.confidence as number) && (newRecord.confidence as number) > 0.7
            ? "high"
            : "normal",
      });

      setLiveCounts({ ...liveCountsRef.current });
    },
    [addActivity]
  );

  const { error: cameraError } = useRealtimeChannel(
    {
      label: "dashboard-cameras",
      channelName: "dash-cameras",
      filters: [rt.inserts("camera_events")],
      onChange: onCameraEvent,
      debounceMs: 300,
    },
    { debug: false }
  );

  useEffect(() => {
    setSubError("camera", cameraError);
    // eslint-disable-next-line
  }, [cameraError, setSubError]);

  // ─── Ready state ──────────────────────────────────────

  const ready = !incidentsError && !aiError && !evidenceError && !cameraError;

  // ─── Actions ─────────────────────────────────────────

  const clearLatest = useCallback(() => setLatestActivity(null), []);

  const resetCounts = useCallback(() => {
    liveCountsRef.current = {
      newIncidentsToday: 0,
      aiAnalysesCompleted: 0,
      evidenceProcessed: 0,
      cameraEvents: 0,
      statusChanges: 0,
    };
    setLiveCounts({ ...liveCountsRef.current });
    setActivityFeed([]);
    feedRef.current = [];
  }, []);

  return {
    activityFeed,
    liveCounts,
    latestActivity,
    ready,
    errors,
    clearLatest,
    resetCounts,
  };
}

// ─── Individual Subscriptions (for targeted use) ─────────

/**
 * Just subscribe to AI analysis job updates for a specific incident.
 * Returns latest AI analysis status.
 */
export function useRealtimeAIAnalysis(incidentId?: string) {
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const onChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      const newRecord = payload.new as Record<string, unknown>;
      setStatus((newRecord.status as string) ?? null);
      setProgress((newRecord.progress as number) ?? null);
    },
    []
  );

  const { ready } = useRealtimeChannel(
    {
      label: `ai-${incidentId}`,
      channelName: `ai-analysis-${incidentId}`,
      filters: incidentId
        ? [
            {
              event: "UPDATE",
              table: "ai_analysis_jobs",
              filter: `incident_id=eq.${incidentId}`,
            } as const,
          ]
        : [],
      onChange,
      debounceMs: 200,
    },
    { enabled: !!incidentId }
  );

  return { status, progress, ready };
}

/**
 * Just subscribe to evidence changes for a specific incident.
 */
export function useRealtimeEvidence(incidentId?: string) {
  const [newCount, setNewCount] = useState(0);

  const onChange = useCallback(() => {
    setNewCount((prev) => prev + 1);
  }, []);

  const { ready } = useRealtimeChannel(
    {
      label: `evidence-${incidentId}`,
      channelName: `evidence-${incidentId}`,
      filters: incidentId
        ? [
            {
              event: "INSERT",
              table: "evidence",
              filter: `incident_id=eq.${incidentId}`,
            } as const,
          ]
        : [],
      onChange,
      debounceMs: 200,
    },
    { enabled: !!incidentId }
  );

  const acknowledge = useCallback(() => setNewCount(0), []);

  return { newCount, ready, acknowledge };
}
