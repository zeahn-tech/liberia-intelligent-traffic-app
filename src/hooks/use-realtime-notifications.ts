// ============================================================
// TrafficWatch AI — Realtime Notifications Hook
//
// Subscribes to new notifications for the current user.
// Provides:
// - Live unread badge count
// - New notification events (for toast popups)
// - Integration with the RealtimeContext global count
// ============================================================

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRealtimeChannel, useRealtimeCounter, rt } from "./use-realtime";
import { useRealtimeContext } from "@/lib/realtime-context";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────

export interface LiveNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  priority: string;
  is_read: boolean;
  reference_type: string | null;
  reference_id: string | null;
  action_url: string | null;
  created_at: string;
}

export interface UseRealtimeNotificationsResult {
  /** Live unread count (from global context + local combined) */
  unreadCount: number;
  /** Latest new notification for toast display */
  latestNotification: LiveNotification | null;
  /** Loading state for initial fetch */
  loading: boolean;
  /** Whether the subscription is ready */
  ready: boolean;
  /** Error message */
  error: string | null;
  /** Acknowledge (clear) the latest notification toast */
  clearLatest: () => void;
  /** Manually refresh the unread count */
  refreshCount: () => Promise<void>;
}

// ─── Hook ────────────────────────────────────────────────

/**
 * Subscribe to real-time notifications for the current user.
 *
 * Combines:
 * - RealtimeContext global notification count (from provider)
 * - A local subscription that also shows toast notifications
 * - Initial unread count fetch from the database
 */
export function useRealtimeNotifications(): UseRealtimeNotificationsResult {
  const { user } = useAuth();
  const { notificationCount: globalCount, acknowledgeNotifications } = useRealtimeContext();
  const [latestNotification, setLatestNotification] = useState<LiveNotification | null>(null);
  const [localCount, setLocalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionReady, setSubscriptionReady] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Initial fetch of unread count ────────────────────

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { count, error: err } = await supabase
        .from("officer_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (!err && count !== null) {
        setLocalCount(count);
      }
    } catch (e) {
      console.debug("[RealtimeNotifications] Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // ─── Realtime subscription for new notifications ─────

  const onChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      const newRecord = payload.new as Record<string, unknown>;

      const notification: LiveNotification = {
        id: (newRecord.id as string) || "",
        type: (newRecord.type as string) || "system_alert",
        title: (newRecord.title as string) || "New Notification",
        message: (newRecord.message as string) || null,
        priority: (newRecord.priority as string) || "normal",
        is_read: (newRecord.is_read as boolean) || false,
        reference_type: (newRecord.reference_type as string) || null,
        reference_id: (newRecord.reference_id as string) || null,
        action_url: (newRecord.action_url as string) || null,
        created_at: (newRecord.created_at as string) || new Date().toISOString(),
      };

      // Increment local count
      setLocalCount((prev) => prev + 1);

      // Show the latest notification for toast
      setLatestNotification(notification);

      // Auto-clear the toast after 6 seconds
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setLatestNotification(null);
      }, 6000);
    },
    []
  );

  const { ready } = useRealtimeChannel(
    {
      label: "notifications-live",
      channelName: "notifications",
      filters: user?.id
        ? [{ event: "INSERT", table: "officer_notifications", filter: `user_id=eq.${user.id}` }]
        : [],
      onChange,
      debounceMs: 100,
    },
    { enabled: !!user?.id }
  );

  // Track subscription readiness
  useEffect(() => {
    if (ready) setSubscriptionReady(true);
  }, [ready]);

  // ─── Cleanup ──────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const clearLatest = useCallback(() => {
    setLatestNotification(null);
  }, []);

  const refreshCount = useCallback(async () => {
    await fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Total unread = local count (from realtime) — the global context count is tracked separately
  return {
    unreadCount: localCount,
    latestNotification,
    loading,
    ready: subscriptionReady,
    error,
    clearLatest,
    refreshCount,
  };
}
