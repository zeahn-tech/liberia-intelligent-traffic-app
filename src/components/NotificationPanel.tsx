import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  BellOff,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Car,
  Brain,
  Camera,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  UserPlus,
  Upload,
  MessageCircle,
  TrendingUp,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  X,
  Loader2,
  ChevronRight,
  Inbox,
  Settings,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Smartphone,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Mail,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  MessageCircle as MessageCircle2,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  BellRing,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { useRealtimeContext } from "@/lib/realtime-context";
import { supabase } from "@/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";
import { useCallback } from "react";
import { useEffect } from "react";


// ─── Types ─────────────────────────────────────────────

export interface OfficerNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  reference_type: string | null;
  reference_id: string | null;
  priority: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

interface NotificationPanelProps {
  /** Optional: auto-fetch from Supabase */
  enableLive?: boolean;
}

// ─── Notification Icons ───────────────────────────────

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  case_assigned: <UserPlus className="w-4 h-4 text-blue-500" />,
  case_updated: <FileText className="w-4 h-4 text-amber-500" />,
  evidence_added: <Upload className="w-4 h-4 text-emerald-500" />,
  ai_analysis_complete: <Brain className="w-4 h-4 text-purple-500" />,
  anpr_pending: <Camera className="w-4 h-4 text-cyan-500" />,
  citizen_report: <MessageSquare className="w-4 h-4 text-amber-500" />,
  report_reviewed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  comment_added: <MessageCircle className="w-4 h-4 text-blue-500" />,
  escalated: <AlertTriangle className="w-4 h-4 text-red-500" />,
  status_changed: <TrendingUp className="w-4 h-4 text-indigo-500" />,
  system_alert: <Bell className="w-4 h-4 text-rose-500" />,
  task_assigned: <Clock className="w-4 h-4 text-purple-500" />,
};

const NOTIFICATION_BG: Record<string, string> = {
  case_assigned: "bg-blue-500/10",
  case_updated: "bg-amber-500/10",
  evidence_added: "bg-emerald-500/10",
  ai_analysis_complete: "bg-purple-500/10",
  anpr_pending: "bg-cyan-500/10",
  citizen_report: "bg-amber-500/10",
  report_reviewed: "bg-green-500/10",
  comment_added: "bg-blue-500/10",
  escalated: "bg-red-500/10",
  status_changed: "bg-indigo-500/10",
  system_alert: "bg-rose-500/10",
  task_assigned: "bg-purple-500/10",
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-amber-500",
  normal: "bg-blue-500",
  low: "bg-gray-400",
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Component ────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NotificationPanel({ enableLive = true }: NotificationPanelProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    unreadCount,
    latestNotification,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    loading,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    ready,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    clearLatest,
    refreshCount,
  } = useRealtimeNotifications();
  const { acknowledgeNotifications } = useRealtimeContext();
  const [notifications, setNotifications] = useState<OfficerNotification[]>([]);
  const [fetching, setFetching] = useState(false);
  const [open, setOpen] = useState(false);

// eslint-disable-next-line react-hooks/preserve-manual-memoization
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("officer_notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_dismissed", false)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data as OfficerNotification[]);
      }
    } catch (err) {
      console.debug("Load notifications:", err);
    } finally {
      setFetching(false);
    }
  }, [user?.id]);

  // Load on mount and when panel opens
  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) loadNotifications();
  }, [open, loadNotifications]);

  // Refresh notification list when a new real-time notification arrives
  useEffect(() => {
    if (latestNotification) {
// eslint-disable-next-line react-hooks/set-state-in-effect
      loadNotifications();
    }
  }, [latestNotification, loadNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase.rpc("mark_notification_read", { p_notification_id: notificationId });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      refreshCount();
    } catch { /* silent */ }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    try {
      await Promise.all(
        unreadIds.map((id) =>
          supabase.rpc("mark_notification_read", { p_notification_id: id })
        )
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      acknowledgeNotifications();
      toast.success("All notifications marked as read");
      refreshCount();
    } catch { /* silent */ }
  };

  const handleNotificationClick = async (notification: OfficerNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    setOpen(false);
    if (notification.action_url) {
      navigate(notification.action_url);
    } else if (notification.reference_type === "incident" && notification.reference_id) {
      navigate(`/incidents/${notification.reference_id}`);
    } else if (notification.reference_type === "citizen_report") {
      navigate("/review/citizen-reports");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl relative"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          {unreadCount > 0 ? (
            <>
              <Bell className="w-4 h-4" aria-hidden="true" />
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[14px] h-3.5 px-1 rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground" aria-hidden="true">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </>
          ) : (
            <BellOff className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          )}
        </Button>
      </PopoverTrigger>

      {/* Live region for screen reader updates */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "No unread notifications"}
      </div>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[85vw] sm:w-[380px] md:w-[420px] p-0 rounded-2xl shadow-xl border-border/50 max-h-[70vh] sm:max-h-[500px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="outline" className="clay-pill text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => { setOpen(false); navigate('/settings'); }}
              title="Notification Settings"
            >
              <Settings className="w-3 h-3" />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] rounded-lg text-muted-foreground hover:text-foreground"
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto max-h-[380px]">
          {fetching && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                You're all caught up
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.button
                  key={notification.id}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/30 border-b border-border/20 last:border-b-0 ${
                    !notification.is_read ? "bg-primary/[0.02]" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg ${NOTIFICATION_BG[notification.type] || "bg-secondary"} flex items-center justify-center shrink-0 mt-0.5`}>
                    {NOTIFICATION_ICONS[notification.type] || <Bell className="w-4 h-4" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {!notification.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      )}
                      <p className={`text-xs font-medium truncate ${
                        !notification.is_read ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {notification.title}
                      </p>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[notification.priority] || "bg-gray-400"}`} />
                    </div>
                    {notification.message && (
                      <p className={`text-[11px] mt-0.5 line-clamp-2 ${
                        !notification.is_read ? "text-muted-foreground" : "text-muted-foreground/70"
                      }`}>
                        {notification.message}
                      </p>
                    )}
                    <p className="text-[9px] text-muted-foreground/60 mt-1">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>

                  <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0 mt-2" />
                </motion.button>
              ))}
            </AnimatePresence>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
