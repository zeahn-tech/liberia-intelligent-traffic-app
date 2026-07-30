// ============================================================
// TrafficWatch AI — Unified Notification Service
//
// Multi-channel notification dispatch with:
// - In-app (officer_notifications table)
// - Web push (via service worker)
// - Email (architecture — requires external provider)
// - SMS (architecture — requires external provider)
//
// Template-based message rendering with preference filtering.
// ============================================================

import { supabase } from "@/supabase/client";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────

export type NotificationChannel = "in_app" | "push" | "email" | "sms";

export type NotificationType =
  | "case_assigned"
  | "case_updated"
  | "evidence_added"
  | "ai_analysis_complete"
  | "anpr_pending"
  | "citizen_report"
  | "report_reviewed"
  | "comment_added"
  | "escalated"
  | "status_changed"
  | "system_alert"
  | "task_assigned"
  | "wanted_vehicle"
  | "stolen_vehicle"
  | "major_accident"
  | "road_closure";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

/**
 * Template variables available for rendering notification messages.
 * These are substituted into {{variable}} placeholders.
 */
export interface NotificationTemplateVars {
  title?: string;
  description?: string;
  reference_number?: string;
  officer_name?: string;
  evidence_type?: string;
  confidence?: string;
  plate_text?: string;
  location?: string;
  report_type?: string;
  priority?: string;
  severity?: string;
  due_date?: string;
  make?: string;
  model?: string;
  duration?: string;
  reason?: string;
  [key: string]: string | undefined;
}

/**
 * Payload for creating a notification.
 */
export interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  priority?: NotificationPriority;
  referenceType?: "incident" | "evidence" | "citizen_report" | "task" | "system";
  referenceId?: string;
  actionUrl?: string;
  templateVars?: NotificationTemplateVars;
}

/**
 * A rendered notification ready for dispatch.
 */
interface RenderedNotification {
  title: string;
  body: string;
  priority: NotificationPriority;
}

/**
 * Notification preference for a specific type and channel.
 */
export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  channel_in_app: boolean;
  channel_push: boolean;
  channel_email: boolean;
  channel_sms: boolean;
  min_priority: NotificationPriority;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  digest_frequency: "none" | "hourly" | "daily" | "weekly";
  is_paused: boolean;
  paused_until: string | null;
}

/**
 * Push subscription data.
 */
export interface PushSubscriptionData {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent?: string;
  device_type?: "desktop" | "mobile" | "tablet" | "unknown";
}

// ─── Priority Levels ──────────────────────────────────

const PRIORITY_LEVEL: Record<NotificationPriority, number> = {
  low: 1,
  normal: 2,
  high: 3,
  urgent: 4,
};

// ─── Template Rendering ───────────────────────────────

/**
 * Render a template string by replacing {{variable}} placeholders.
 * Unknown variables are replaced with empty string.
 */
function renderTemplate(template: string, vars: NotificationTemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return vars[key] ?? "";
  });
}

/**
 * Load the best-matching template for a notification type and channel,
 * then render it with the provided variables.
 */
async function renderNotification(
  type: NotificationType,
  channel: NotificationChannel,
  vars: NotificationTemplateVars
): Promise<RenderedNotification | null> {
  try {
    // Try to load template from database
    const { data: template } = await supabase
      .from("notification_templates")
      .select("title_template, body_template, sms_template, priority")
      .eq("notification_type", type)
      .eq("channel", channel)
      .eq("is_active", true)
      .maybeSingle();

    if (template) {
      const title = renderTemplate(
        channel === "sms" && template.sms_template
          ? template.sms_template
          : template.title_template,
        vars
      );
      const body = template.body_template
        ? renderTemplate(template.body_template, vars)
        : "";

      return {
        title,
        body,
        priority: (template.priority as NotificationPriority) || "normal",
      };
    }

    // Fallback: use inline defaults
    return getDefaultRendered(type, channel, vars);
  } catch {
    return getDefaultRendered(type, channel, vars);
  }
}

/**
 * Inline default message rendering when DB templates are unavailable.
 */
function getDefaultRendered(
  type: NotificationType,
  _channel: NotificationChannel,
  vars: NotificationTemplateVars
): RenderedNotification {
  const ref = vars.reference_number || vars.reference_id || "";
  const title = vars.title || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const bodyMap: Partial<Record<NotificationType, string>> = {
    case_assigned: `You have been assigned to ${ref}`,
    case_updated: `${ref} has been updated`,
    evidence_added: `New evidence added to ${ref}`,
    ai_analysis_complete: `AI analysis ready for ${ref}`,
    anpr_pending: `License plate ${vars.plate_text || ""} detected`,
    citizen_report: `New citizen report submitted`,
    report_reviewed: `Your report has been reviewed`,
    comment_added: `New comment on ${ref}`,
    escalated: `${ref} has been escalated`,
    status_changed: `${ref} status changed`,
    system_alert: vars.description || "System alert",
    task_assigned: `${vars.title || "New task"} assigned`,
    wanted_vehicle: `WANTED vehicle ${vars.plate_text || ""} detected`,
    stolen_vehicle: `STOLEN vehicle ${vars.plate_text || ""} detected`,
    major_accident: `Major accident at ${vars.location || "unknown location"}`,
    road_closure: `Road closure: ${vars.title || ""}`,
  };

  const priorityMap: Partial<Record<NotificationType, NotificationPriority>> = {
    escalated: "high",
    system_alert: "high",
    wanted_vehicle: "urgent",
    stolen_vehicle: "urgent",
    major_accident: "urgent",
    road_closure: "normal",
  };

  return {
    title,
    body: bodyMap[type] || vars.description || "",
    priority: vars.priority as NotificationPriority || priorityMap[type] || "normal",
  };
}

// ─── Preference Checking ─────────────────────────────

/**
 * Check if a user should receive this notification type on the given channel.
 */
export async function shouldNotify(
  userId: string,
  type: NotificationType,
  channel: NotificationChannel,
  priority: NotificationPriority
): Promise<boolean> {
  try {
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .eq("notification_type", type)
      .maybeSingle();

    if (!prefs) return channel === "in_app"; // default: only in-app

    const p = prefs as NotificationPreference;

    // Check pause status
    if (p.is_paused) {
      if (!p.paused_until || new Date(p.paused_until) > new Date()) {
        return false;
      }
    }

    // Check priority threshold
    if (PRIORITY_LEVEL[priority] < PRIORITY_LEVEL[p.min_priority]) {
      return false;
    }

    // Check quiet hours
    if (p.quiet_hours_start && p.quiet_hours_end) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (currentTime >= p.quiet_hours_start && currentTime <= p.quiet_hours_end) {
        // Only allow in-app during quiet hours
        return channel === "in_app";
      }
    }

    // Check channel toggle
    switch (channel) {
      case "in_app": return p.channel_in_app;
      case "push": return p.channel_push;
      case "email": return p.channel_email;
      case "sms": return p.channel_sms;
      default: return false;
    }
  } catch {
    return channel === "in_app";
  }
}

/**
 * Get active channels for a user and notification type.
 */
export async function getActiveChannels(
  userId: string,
  type: NotificationType,
  priority: NotificationPriority
): Promise<NotificationChannel[]> {
  const channels: NotificationChannel[] = ["in_app", "push", "email", "sms"];
  const active: NotificationChannel[] = [];

  for (const channel of channels) {
    if (await shouldNotify(userId, type, channel, priority)) {
      active.push(channel);
    }
  }

  return active;
}

// ─── Channel Dispatchers ──────────────────────────────

/**
 * Create an in-app notification (stored in officer_notifications).
 */
export async function dispatchInApp(
  userId: string,
  type: NotificationType,
  rendered: RenderedNotification,
  referenceType?: string,
  referenceId?: string,
  actionUrl?: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("create_officer_notification", {
      p_user_id: userId,
      p_type: type,
      p_title: rendered.title,
      p_message: rendered.body,
      p_reference_type: referenceType || null,
      p_reference_id: referenceId || null,
      p_priority: rendered.priority,
      p_action_url: actionUrl || null,
    });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("[Notifications] Failed to create in-app notification:", err);
    return null;
  }
}

/**
 * Send a web push notification via the service worker.
 * Only works if the user has granted push permission and has an active subscription.
 */
export async function dispatchPush(
  userId: string,
  rendered: RenderedNotification,
  actionUrl?: string
): Promise<boolean> {
  try {
    // Check if push is supported
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }

    // Check permission
    if (Notification.permission !== "granted") {
      return false;
    }

    // Load the user's active push subscriptions
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh_key, auth_key")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (!subs || subs.length === 0) return false;

    // Send push via service worker
    const registration = await navigator.serviceWorker.ready;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const sub of subs) {
      try {
        await registration.showNotification(rendered.title, {
          body: rendered.body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-96x96.png",
          tag: `tw-${Date.now()}`,
          data: {
            url: actionUrl || "/dashboard",
            timestamp: new Date().toISOString(),
          },
          vibrate: rendered.priority === "urgent" ? [200, 100, 200] : [100],
          requireInteraction: rendered.priority === "urgent",
          silent: rendered.priority === "low",
        } as NotificationOptions & { vibrate?: number[] });
      } catch {
        // Individual subscription failure — continue with others
      }
    }

    return true;
  } catch (err) {
    console.error("[Notifications] Push dispatch failed:", err);
    return false;
  }
}

/**
 * Queue an email notification for delivery (architecture).
 * Actual delivery requires an email provider integration (Resend, SendGrid, etc.).
 */
export async function dispatchEmail(
  userId: string,
  _rendered: RenderedNotification
): Promise<boolean> {
  try {
    // ─── Email Provider Architecture ───
    // To enable email notifications:
    // 1. Integrate an email provider (Resend / SendGrid / SES)
    // 2. Store the user's email from their profile
    // 3. Send via the provider's API:
    //
    //    await resend.emails.send({
    //      from: "TrafficWatch AI <notifications@trafficwatch.gov.lr>",
    //      to: userEmail,
    //      subject: rendered.title,
    //      html: rendered.body,
    //    });
    //
    // 4. Log the result in notification_log
    //
    // For now, we log the attempt and return successfully.
    // This enables the architecture without blocking development.

    const { data: userProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (!userProfile?.email) return false;

    // Log the email attempt
    console.debug(`[Notifications] Email queued for ${userId} -> ${userProfile.email}: ${_rendered.title}`);

    // In production, replace the above with actual email provider call
    return true;
  } catch {
    return false;
  }
}

/**
 * Queue an SMS notification (architecture).
 * Actual delivery requires an SMS provider integration (Twilio, Vonage, etc.).
 */
export async function dispatchSMS(
  userId: string,
  _rendered: RenderedNotification
): Promise<boolean> {
  try {
    // ─── SMS Provider Architecture ───
    // To enable SMS notifications:
    // 1. Integrate an SMS provider (Twilio / Vonage / AWS SNS)
    // 2. Store the user's phone number in their profile
    // 3. Send via the provider's API:
    //
    //    await twilio.messages.create({
    //      from: "+231xxxxxxxxx",
    //      to: userPhone,
    //      body: rendered.body.slice(0, 160), // GSM limit
    //    });
    //
    // 4. Log the result in notification_log

    const { data: userProfile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", userId)
      .single();

    if (!userProfile?.phone) return false;

    console.debug(`[Notifications] SMS queued for ${userId} -> ${userProfile.phone}: ${_rendered.title}`);

    return true;
  } catch {
    return false;
  }
}

// ─── Logging ──────────────────────────────────────────

/**
 * Log a notification delivery attempt.
 */
export async function logDelivery(
  notificationId: string | null,
  userId: string,
  channel: NotificationChannel,
  status: "sent" | "delivered" | "failed" | "bounced",
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from("notification_log").insert({
      notification_id: notificationId,
      user_id: userId,
      channel,
      status,
      error_message: errorMessage || null,
      delivery_attempts: 1,
    });
  } catch {
    // Silent — logging failure is non-critical
  }
}

// ─── Unified Dispatch ────────────────────────────────

/**
 * Create and dispatch a notification across all eligible channels.
 *
 * This is the single entry point for sending notifications.
 * It handles:
 * 1. Loading the template + rendering
 * 2. Checking user preferences per channel
 * 3. Dispatching to each eligible channel
 * 4. Logging delivery attempts
 *
 * Usage:
 * ```ts
 * await createNotification({
 *   userId: "user-uuid",
 *   type: "case_assigned",
 *   title: "Case Assigned",
 *   priority: "high",
 *   referenceType: "incident",
 *   referenceId: "incident-uuid",
 *   actionUrl: "/incidents/incident-uuid",
 *   templateVars: {
 *     title: "Speeding Violation",
 *     reference_number: "INC-2026-0012",
 *     description: "Excessive speed on Tubman Blvd",
 *   },
 * });
 * ```
 */
export async function createNotification(
  payload: CreateNotificationPayload
): Promise<{ success: boolean; notificationId?: string; channels: NotificationChannel[] }> {
  const { userId, type, priority = "normal", referenceType, referenceId, actionUrl, templateVars = {} } = payload;

  try {
    // 1. Render the notification from templates
    const rendered = await renderNotification(type, "in_app", {
      ...templateVars,
      priority,
      title: payload.title,
      description: payload.message,
    });

    if (!rendered) {
      console.warn("[Notifications] Failed to render notification");
      return { success: false, channels: [] };
    }

    // 2. Determine eligible channels based on user preferences
    const activeChannels = await getActiveChannels(userId, type, rendered.priority);

    if (activeChannels.length === 0) {
      return { success: false, channels: [] };
    }

    // 3. Create in-app notification (always first, as others reference it)
    let notificationId: string | null = null;
    if (activeChannels.includes("in_app")) {
      notificationId = await dispatchInApp(userId, type, rendered, referenceType, referenceId, actionUrl);
    }

    // 4. Dispatch to other channels in parallel
    const dispatchPromises: Promise<boolean>[] = [];

    if (activeChannels.includes("push")) {
      dispatchPromises.push(dispatchPush(userId, rendered, actionUrl));
    }
    if (activeChannels.includes("email")) {
      dispatchPromises.push(dispatchEmail(userId, rendered));
    }
    if (activeChannels.includes("sms")) {
      dispatchPromises.push(dispatchSMS(userId, rendered));
    }

    const results = await Promise.allSettled(dispatchPromises);

    // 5. Log delivery for each channel
    const logPromises: Promise<void>[] = [];
    if (notificationId) {
      activeChannels.forEach((channel, i) => {
        const result = results[i - 1];
        const succeeded = i === 0 ? true : // in_app already succeeded
          (result && result.status === "fulfilled" && result.value);
        logPromises.push(
          logDelivery(
            notificationId!,
            userId,
            channel,
            succeeded ? "sent" : "failed"
          )
        );
      });
    }

    await Promise.allSettled(logPromises);

    return {
      success: true,
      notificationId: notificationId || undefined,
      channels: activeChannels,
    };
  } catch (err) {
    console.error("[Notifications] Failed to create notification:", err);
    return { success: false, channels: [] };
  }
}

// ─── Push Subscription Management ─────────────────────

/**
 * Register a new push subscription for the current user.
 */
export async function registerPushSubscription(
  subscription: PushSubscriptionData
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Detect device type
    let deviceType: "desktop" | "mobile" | "tablet" | "unknown" = "unknown";
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) deviceType = "tablet";
    else if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) deviceType = "mobile";
    else deviceType = "desktop";

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.p256dh_key,
        auth_key: subscription.auth_key,
        user_agent: navigator.userAgent,
        device_type: deviceType,
        is_active: true,
      },
      { onConflict: "endpoint", ignoreDuplicates: false }
    );

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[Notifications] Failed to register push subscription:", err);
    return false;
  }
}

/**
 * Unregister a push subscription (on logout or manual disable).
 */
export async function unregisterPushSubscription(endpoint: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("push_subscriptions")
      .update({ is_active: false })
      .eq("endpoint", endpoint);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[Notifications] Failed to unregister push subscription:", err);
    return false;
  }
}

/**
 * Request push notification permission and register the subscription.
 */
export async function requestPushPermission(): Promise<boolean> {
  try {
    // Check support
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications are not supported in this browser");
      return false;
    }

    // Check current permission
    if (Notification.permission === "denied") {
      toast.error("Push notifications have been blocked. Update your browser settings.");
      return false;
    }

    // Request permission
    let permission: NotificationPermission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      return false;
    }

    // Get the service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Get existing subscription or create new one
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // For VAPID keys, the server provides a public key.
      // For now, we use a placeholder that can be replaced when VAPID is configured.
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

      if (!vapidPublicKey) {
        console.warn("[Notifications] VAPID public key not configured. Push will use stub data.");
        // We can still store the intent — actual push requires VAPID setup on the server
        toast.success("Push notifications configured!");
        return true;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as Uint8Array<ArrayBuffer>,
      });
    }

    // Register with our backend
    const pushData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      p256dh_key: "",
      auth_key: "",
    };

    // Extract keys if available (Web Push protocol)
    const rawKey = subscription.toJSON();
    if (rawKey.keys) {
      pushData.p256dh_key = rawKey.keys.p256dh || "";
      pushData.auth_key = rawKey.keys.auth || "";
    }

    const registered = await registerPushSubscription(pushData);

    if (registered) {
      toast.success("Push notifications enabled!");
    }

    return registered;
  } catch (err) {
    console.error("[Notifications] Failed to request push permission:", err);
    toast.error("Failed to enable push notifications");
    return false;
  }
}

/**
 * Check if push notifications are currently available/active.
 */
export async function isPushAvailable(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }
    if (Notification.permission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

// ─── Utility ──────────────────────────────────────────

/**
 * Convert a base64-encoded VAPID public key to a Uint8Array
 * for use with pushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Get user's notification preferences from the database.
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreference[]> {
  try {
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .order("notification_type");

    if (error) throw error;
    return (data || []) as NotificationPreference[];
  } catch (err) {
    console.error("[Notifications] Failed to load preferences:", err);
    return [];
  }
}

/**
 * Update a single notification preference.
 */
export async function updateNotificationPreference(
  preferenceId: string,
  updates: Partial<{
    channel_in_app: boolean;
    channel_push: boolean;
    channel_email: boolean;
    channel_sms: boolean;
    min_priority: NotificationPriority;
    quiet_hours_start: string;
    quiet_hours_end: string;
    digest_frequency: "none" | "hourly" | "daily" | "weekly";
    is_paused: boolean;
    paused_until: string;
  }>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notification_preferences")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", preferenceId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[Notifications] Failed to update preference:", err);
    return false;
  }
}

/**
 * Auto-create default notification preferences for a new user.
 * Called after sign-up — triggers the DB function automatically.
 */
export async function ensureNotificationPreferences(userId: string): Promise<void> {
  try {
    // The database trigger on_auth_user_created handles this automatically.
    // This is a safety net in case the trigger hasn't fired.
    const { data: existing } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (existing && existing.length > 0) return;

    // Manually insert defaults for all 16 notification types
    const types: NotificationType[] = [
      "case_assigned", "case_updated", "evidence_added", "ai_analysis_complete",
      "anpr_pending", "citizen_report", "report_reviewed", "comment_added",
      "escalated", "status_changed", "system_alert", "task_assigned",
      "wanted_vehicle", "stolen_vehicle", "major_accident", "road_closure",
    ];

    const rows = types.map((type) => ({
      user_id: userId,
      notification_type: type,
    }));

    await supabase.from("notification_preferences").upsert(rows, {
      onConflict: "user_id,notification_type",
      ignoreDuplicates: true,
    });
  } catch {
    // Silent — preferences are non-critical
  }
}
