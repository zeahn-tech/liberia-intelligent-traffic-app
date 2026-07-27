// ============================================================
// TrafficWatch AI — Notifications API Service
//
// Domain: Notification querying, preferences, read/unread management
// ============================================================

import { supabase } from "@/supabase/client";
import {
  executeQuery,
  executePaginatedQuery,
  buildSelect,
  FIELD_SETS,
  type ApiResponse,
  type PaginatedResponse,
} from "./base";

// ─── Constants ───────────────────────────────────────────

const NOTIFICATION_FIELDS = buildSelect([...FIELD_SETS.notification]);

// ─── Types ───────────────────────────────────────────────

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  priority: string;
  is_read: boolean;
  is_dismissed: boolean;
  reference_type: string | null;
  reference_id: string | null;
  action_url: string | null;
  created_at: string;
  read_at: string | null;
}

export interface NotificationFilter {
  type?: string;
  priority?: string;
  is_read?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  pageSize?: number;
}

// ─── Query Notifications ─────────────────────────────────

/**
 * List notifications for the current user with pagination.
 */
export async function listNotifications(
  userId: string,
  filter: NotificationFilter = {}
): Promise<PaginatedResponse<NotificationRecord>> {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 20;

  return executePaginatedQuery<NotificationRecord>(
    "officer_notifications",
    (q) => {
      let query = q.select(NOTIFICATION_FIELDS).eq("user_id", userId);

      if (filter.type) query = query.eq("type", filter.type);
      if (filter.priority) query = query.eq("priority", filter.priority);
      if (filter.is_read !== undefined) query = query.eq("is_read", filter.is_read);
      if (filter.date_from) query = query.gte("created_at", filter.date_from);
      if (filter.date_to) query = query.lte("created_at", filter.date_to);

      return query.order("created_at", { ascending: false });
    },
    page,
    pageSize,
    { label: "notifications.list" }
  );
}

/**
 * Get unread notification count for the current user.
 */
export async function getUnreadCount(userId: string): Promise<ApiResponse<number>> {
  const { count, error } = await supabase
    .from("officer_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) return { success: false, data: null, error: { code: "QUERY_FAILED", message: error.message } };
  return { success: true, data: count || 0, error: null };
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId: string): Promise<ApiResponse<null>> {
  return executeQuery(
    supabase.from("officer_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId),
    { label: "notifications.mark_read" }
  );
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllAsRead(userId: string): Promise<ApiResponse<null>> {
  return executeQuery(
    supabase.from("officer_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_read", false),
    { label: "notifications.mark_all_read" }
  );
}

/**
 * Dismiss a notification (soft delete).
 */
export async function dismissNotification(notificationId: string): Promise<ApiResponse<null>> {
  return executeQuery(
    supabase.from("officer_notifications")
      .update({ is_dismissed: true })
      .eq("id", notificationId),
    { label: "notifications.dismiss" }
  );
}

// ─── Notification Preferences ────────────────────────────

/**
 * Get notification preferences for a user.
 */
export async function getNotificationPreferences(userId: string): Promise<
  ApiResponse<{
    id: string;
    notification_type: string;
    channel_in_app: boolean;
    channel_push: boolean;
    channel_email: boolean;
    channel_sms: boolean;
    min_priority: string;
  }[]>
> {
  return executeQuery(
    supabase.from("notification_preferences")
      .select("id, notification_type, channel_in_app, channel_push, channel_email, channel_sms, min_priority")
      .eq("user_id", userId)
      .order("notification_type"),
    { label: "notifications.prefs" }
  );
}

/**
 * Update a notification preference.
 */
export async function updateNotificationPreference(
  prefId: string,
  updates: Partial<{
    channel_in_app: boolean;
    channel_push: boolean;
    channel_email: boolean;
    channel_sms: boolean;
    min_priority: string;
    is_paused: boolean;
  }>
): Promise<ApiResponse<null>> {
  return executeQuery(
    supabase.from("notification_preferences")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", prefId),
    { label: "notifications.update_pref" }
  );
}

// ─── Push Subscriptions ──────────────────────────────────

/**
 * Get active push subscriptions for a user.
 */
export async function getPushSubscriptions(userId: string): Promise<
  ApiResponse<{ endpoint: string; device_type: string | null }[]>
> {
  return executeQuery(
    supabase.from("push_subscriptions")
      .select("endpoint, device_type")
      .eq("user_id", userId)
      .eq("is_active", true),
    { label: "notifications.push_subs" }
  );
}
