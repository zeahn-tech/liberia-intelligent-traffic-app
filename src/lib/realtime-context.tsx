// ============================================================
// TrafficWatch AI — Realtime Context Provider
//
// Centralized real-time subscription management.
// Provides a single RealtimeProvider that wraps the app with
// global subscriptions (notifications) and exposes hooks for
// components to subscribe to domain-specific updates.
//
// Design:
// - The Provider subscribes to important global channels once
// - Domain hooks (useRealtimeIncidents, etc.) are independent
// - Redundant subscriptions are prevented (same channel + filters)
// - Cleanup on unmount
// ============================================================

import React, { createContext, useContext, useCallback, useSyncExternalStore, useRef } from "react";
import { supabase } from "@/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────

export interface RealtimeEvent {
  /** ISO timestamp of when the event was received */
  receivedAt: string;
  /** The raw payload from Supabase Realtime */
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>;
  /** Human-readable label */
  label: string;
}

type EventListener = (event: RealtimeEvent) => void;

interface RealtimeContextValue {
  /** Subscribe to real-time events. Returns unsubscribe function. */
  onEvent: (label: string, listener: EventListener) => () => void;
  /** Global notification count (unseen new notifications) */
  notificationCount: number;
  /** Acknowledge (reset) global notification count */
  acknowledgeNotifications: () => void;
  /** Whether the global channels are subscribed and ready */
  ready: boolean;
}

// ─── Context ─────────────────────────────────────────────

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

// ─── Store (outside React for useSyncExternalStore) ──────

let _notificationCount = 0;
const notificationCountListeners = new Set<() => void>();

function notifyNotificationListeners() {
  notificationCountListeners.forEach((l) => l());
}

function getNotificationCountSnapshot(): number {
  return _notificationCount;
}

function subscribeToNotificationCount(callback: () => void): () => void {
  notificationCountListeners.add(callback);
  return () => notificationCountListeners.delete(callback);
}

// ─── Provider ────────────────────────────────────────────

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const listenersRef = useRef<Map<string, Set<EventListener>>>(new Map());
  const [ready, setReadyState] = React.useState(false);

  // ─── Global notification subscription ────────────────

  React.useEffect(() => {
    if (!user?.id) {
      setReadyState(false);
      return;
    }

    const channel = supabase
      .channel("global-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "officer_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          _notificationCount++;
          notifyNotificationListeners();

          // Also emit to any subscribers
          const labelListeners = listenersRef.current.get("notification");
          if (labelListeners) {
            labelListeners.forEach((fn) =>
              fn({
                receivedAt: new Date().toISOString(),
                payload,
                label: "notification",
              })
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setReadyState(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setReadyState(false);
      _notificationCount = 0;
      notifyNotificationListeners();
    };
  }, [user?.id]);

  // ─── Event subscription system ───────────────────────

  const onEvent = useCallback(
    (label: string, listener: EventListener): (() => void) => {
      if (!listenersRef.current.has(label)) {
        listenersRef.current.set(label, new Set());
      }
      listenersRef.current.get(label)!.add(listener);

      return () => {
        listenersRef.current.get(label)?.delete(listener);
      };
    },
    []
  );

  const acknowledgeNotifications = useCallback(() => {
    _notificationCount = 0;
    notifyNotificationListeners();
  }, []);

  const notificationCount = useSyncExternalStore(
    subscribeToNotificationCount,
    getNotificationCountSnapshot,
    getNotificationCountSnapshot
  );

  const value: RealtimeContextValue = {
    onEvent,
    notificationCount,
    acknowledgeNotifications,
    ready,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────

/**
 * Access the Realtime context for global count + event subscription.
 */
export function useRealtimeContext(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error("useRealtimeContext must be used within a <RealtimeProvider>");
  }
  return ctx;
}
