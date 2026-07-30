// ============================================================
// TrafficWatch AI — Core Realtime Subscription Hook
//
// Provides a safe, debounced, auto-cleanup wrapper around
// Supabase Realtime subscriptions.
// ============================================================

import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────

export type ChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";
export type TableFilter =
  | { event: ChangeEvent; schema?: string; table: string; filter?: string }
  | { event: ChangeEvent; schema?: string; table: string; filter?: `id=eq.${string}` };

export interface RealtimeSubscription {
  /** Human-readable label for debugging */
  label: string;
  /** Channel name (auto-namespaced) */
  channelName: string;
  /** The filters to subscribe to */
  filters: TableFilter[];
  /** Called with the change payload */
  onChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  /** Debounce window in ms (default: 200). Accumulates and fires once. */
  debounceMs?: number;
}

export interface UseRealtimeOptions {
  /** Enable/disable this subscription (default: true) */
  enabled?: boolean;
  /** Log subscription events to console */
  debug?: boolean;
}

// ─── Core Hook ───────────────────────────────────────────

/**
 * Subscribe to one or more Supabase Realtime postgres_changes filters.
 *
 * Features:
 * - Auto-cleanup on unmount
 * - Debounced onChange with configurable window
 * - Enable/disable toggle
 * - Debug logging option
 * - Single channel per call (multiple filters)
 * - Returns ready state + error
 */
export function useRealtimeChannel(
  subscription: RealtimeSubscription,
  options: UseRealtimeOptions = {}
) {
  const { enabled = true, debug = false } = options;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<RealtimePostgresChangesPayload<Record<string, unknown>>[]>([]);
  const mountedRef = useRef(true);

  // Register the callback for debounced execution
  const debouncedOnChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      pendingRef.current.push(payload);

      if (debounceTimerRef.current) return;

      debounceTimerRef.current = setTimeout(() => {
        const batch = pendingRef.current.slice();
        pendingRef.current = [];
        debounceTimerRef.current = null;

        if (mountedRef.current && batch.length > 0) {
          // Fire only the last payload in the batch for efficiency
          const last = batch[batch.length - 1];
          subscription.onChange(last);
        }
      }, subscription.debounceMs ?? 200);
    },
    [subscription]
  );

  // ─── Setup / Teardown ────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
// eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(false);
      return;
    }

    const channelName = `rt:${subscription.channelName}:${Date.now()}`;
    if (debug) console.debug(`[Realtime] Creating channel: ${channelName}`);

    const channel = supabase.channel(channelName);

    // Register all filters
    subscription.filters.forEach((filter) => {
      channel.on(
        "postgres_changes",
        {
          event: filter.event,
          schema: filter.schema ?? "public",
          table: filter.table,
          filter: filter.filter,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (mountedRef.current) {
            debouncedOnChange(payload);
          }
        }
      );
    });

    // Subscribe
    channel.subscribe((status) => {
      if (debug) console.debug(`[Realtime] Channel "${channelName}" status:`, status);
      if (mountedRef.current) {
        if (status === "SUBSCRIBED") {
          setReady(true);
          setError(null);
        } else if (status === "CHANNEL_ERROR") {
          setError(`Subscription failed: ${channelName}`);
          setReady(false);
        } else if (status === "TIMED_OUT") {
          setError(`Subscription timed out: ${channelName}`);
          setReady(false);
        } else if (status === "CLOSED") {
          setReady(false);
        }
      }
    });

    channelRef.current = channel;

    // ─── Cleanup ───────────────────────────────────────
    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      pendingRef.current = [];
      if (channelRef.current) {
        if (debug) console.debug(`[Realtime] Removing channel: ${channelName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setReady(false);
    };
  }, [enabled, subscription.channelName, subscription.filters, subscription.debounceMs, subscription.onChange, debouncedOnChange, debug]);

  return { ready, error };
}

// ─── Helper: Build common filter objects ─────────────────

export const rt = {
  /** Subscribe to all changes on a table */
  all(table: string, schema?: string): TableFilter {
    return { event: "*", schema, table };
  },
  /** Subscribe to INSERTs on a table */
  inserts(table: string, schema?: string): TableFilter {
    return { event: "INSERT", schema, table };
  },
  /** Subscribe to UPDATEs on a table */
  updates(table: string, schema?: string): TableFilter {
    return { event: "UPDATE", schema, table };
  },
  /** Subscribe to DELETEs on a table */
  deletes(table: string, schema?: string): TableFilter {
    return { event: "DELETE", schema, table };
  },
  /** Only watch a specific row by ID */
  row(table: string, id: string, schema?: string): TableFilter {
    return { event: "*", schema, table, filter: `id=eq.${id}` };
  },
  /** Only watch a specific row's updates */
  rowUpdates(table: string, id: string, schema?: string): TableFilter {
    return { event: "UPDATE", schema, table, filter: `id=eq.${id}` };
  },
} as const;

// ─── Batch State Updater ─────────────────────────────────

/**
 * A convenience hook that maintains a counter or state that
 * increments on each real-time event. Useful for "new items"
 * badges where you want to show a count of unseen changes.
 *
 * The consumer calls `acknowledge()` to reset the count.
 */
export function useRealtimeCounter(subscription: RealtimeSubscription, options?: UseRealtimeOptions) {
  const [count, setCount] = useState(0);

  const onChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      setCount((prev) => prev + 1);
      subscription.onChange(payload);
    },
    [subscription]
  );

  const { ready, error } = useRealtimeChannel(
    { ...subscription, onChange },
    options
  );

  const acknowledge = useCallback(() => setCount(0), []);

  return { count, ready, error, acknowledge };
}
