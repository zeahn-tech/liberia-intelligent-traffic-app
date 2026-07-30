// ============================================================
// TrafficWatch AI — Camera Management Hook
//
// React hook for managing camera views, stream status,
// detection events, and future live stream display.
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/supabase/client";
import {
  listCameras,
  getCameraStats,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  listCameraEvents,
  getPendingCameraAlerts,
  acknowledgeCameraAlert,
} from "@/services/cameras-service";

// ─── Types ───────────────────────────────────────────────

export interface CameraDisplay {
  id: string;
  name: string;
  installationType: string;
  latitude: number;
  longitude: number;
  status: string;
  isActive: boolean;
  /** Placeholder for future live stream URL */
  streamUrl: string | null;
  /** Placeholder for future stream type */
  streamType: CameraSourceType | null;
  manufacturer: string | null;
  model: string | null;
  orientation: string | null;
  resolution: string | null;
  eventCount: number;
  lastEventAt: string | null;
}

export interface CameraAlert {
  id: string;
  cameraId: string;
  cameraName: string;
  eventType: string;
  confidence: number;
  detectedPlate: string | null;
  detectedSpeed: number | null;
  createdAt: string;
}

export interface CameraHookResult {
  cameras: CameraDisplay[];
  alerts: CameraAlert[];
  stats: {
    total: number;
    active: number;
    offline: number;
    eventsLast24h: number;
  } | null;
  loading: boolean;
  error: string | null;
  /** Currently selected camera for detail view */
  selectedCamera: CameraDisplay | null;
  /** Select a camera to view details / future live stream */
  selectCamera: (camera: CameraDisplay | null) => void;
  /** Refresh camera list */
  refresh: () => Promise<void>;
  /** Acknowledge a pending alert */
  acknowledgeAlert: (alertId: string) => Promise<void>;
}

// ─── Hook ────────────────────────────────────────────────

/**
 * Hook for camera management.
 *
 * Provides:
 * - Camera list with status
 * - Detection alerts
 * - Dashboard stats
 * - Camera selection for detail/live-stream view
 * - Auto-refresh on new events (via Supabase Realtime subscription)
 */
export function useCameras(): CameraHookResult {
  const [cameras, setCameras] = useState<CameraDisplay[]>([]);
  const [alerts, setAlerts] = useState<CameraAlert[]>([]);
  const [stats, setStats] = useState<CameraHookResult["stats"]>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<CameraDisplay | null>(null);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [camerasRes, statsRes, alertsRes] = await Promise.all([
        listCameras({ pageSize: 100 }),
        getCameraStats(),
        getPendingCameraAlerts(50),
      ]);

      if (camerasRes.success) {
        // Map DB records to CameraDisplay
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        const display: CameraDisplay[] = (camerasRes.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          installationType: c.installation_type || "fixed",
          latitude: c.latitude || 0,
          longitude: c.longitude || 0,
          status: c.status || "disconnected",
          isActive: c.is_active ?? true,
          streamUrl: c.stream_url || null,
          streamType: (c.stream_type as CameraSourceType) || null,
          manufacturer: c.manufacturer || null,
          model: c.model || null,
          orientation: c.orientation || null,
          resolution: c.resolution || null,
          eventCount: 0,
          lastEventAt: null,
        }));
        setCameras(display);
      }

      if (statsRes.success && statsRes.data) {
        const s = statsRes.data;
        setStats({
          total: s.total,
          active: s.active,
          offline: s.offline,
          eventsLast24h: s.events_last_24h,
        });
      }

      if (alertsRes.success) {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        const alertList: CameraAlert[] = (alertsRes.data || []).map((e: any) => ({
          id: e.id,
          cameraId: e.camera_id || "",
          cameraName: "",
          eventType: e.event_type || "unknown",
          confidence: e.confidence || 0,
          detectedPlate: e.detected_plate || null,
          detectedSpeed: e.detected_speed || null,
          createdAt: e.created_at,
        }));

        // Enrich with camera names
        const camMap = new Map(cameras.map((c) => [c.id, c.name]));
        alertList.forEach((a) => {
          a.cameraName = camMap.get(a.cameraId) || "Unknown Camera";
        });

        setAlerts(alertList);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cameras");
    } finally {
      setLoading(false);
    }
  }, [cameras]);

  // ─── Initial data load + Realtime subscription ──────

  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();

    // Subscribe to new camera events via Supabase Realtime
    const channel = supabase
      .channel("camera-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "camera_events" },
        () => {
          // Refresh data on new events
          fetchData();
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [fetchData]);

  // ─── Actions ───────────────────────────────────────────

  const selectCamera = useCallback((camera: CameraDisplay | null) => {
    setSelectedCamera(camera);
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    const result = await acknowledgeCameraAlert(alertId);
    if (result.success) {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    }
  }, []);

  return {
    cameras,
    alerts,
    stats,
    loading,
    error,
    selectedCamera,
    selectCamera,
    refresh,
    acknowledgeAlert,
  };
}
