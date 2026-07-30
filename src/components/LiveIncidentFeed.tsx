// ============================================================
// TrafficWatch AI — LiveIncidentFeed Component
//
// Real-time scrolling feed showing the latest incidents,
// status changes, AI completions, and evidence uploads.
// Auto-scrolls with smooth animations as new items arrive.
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  Brain,
  Camera,
  CheckCircle2,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  AlertTriangle,
  Upload,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  FileText,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Activity,
  Bell,
} from "lucide-react";
import type { DashboardActivity } from "@/hooks/use-realtime-dashboard";

// ─── Types ───────────────────────────────────────────────

interface LiveIncidentFeedProps {
  /** Live activity feed from useRealtimeDashboard() */
  activities: DashboardActivity[];
  /** Maximum items to show (default: 20) */
  maxItems?: number;
  /** Title for the feed panel */
  title?: string;
  /** Whether to show the pulse indicator */
  showPulse?: boolean;
  /** Callback when an activity is clicked */
  onActivityClick?: (activity: DashboardActivity) => void;
}

// ─── Activity Type Config ───────────────────────────────

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  new_incident: <Car className="w-3.5 h-3.5" />,
  incident_resolved: <CheckCircle2 className="w-3.5 h-3.5" />,
  ai_analysis_complete: <Brain className="w-3.5 h-3.5" />,
  ai_analysis_started: <Activity className="w-3.5 h-3.5" />,
  evidence_uploaded: <Upload className="w-3.5 h-3.5" />,
  evidence_processed: <Camera className="w-3.5 h-3.5" />,
  camera_event: <Camera className="w-3.5 h-3.5" />,
  new_notification: <Bell className="w-3.5 h-3.5" />,
  status_change: <TrendingUp className="w-3.5 h-3.5" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  new_incident: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  incident_resolved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ai_analysis_complete: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ai_analysis_started: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  evidence_uploaded: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  evidence_processed: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  camera_event: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  new_notification: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  status_change: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

const ACTIVITY_ICON_BG: Record<string, string> = {
  new_incident: "bg-blue-500/10",
  incident_resolved: "bg-emerald-500/10",
  ai_analysis_complete: "bg-purple-500/10",
  ai_analysis_started: "bg-indigo-500/10",
  evidence_uploaded: "bg-amber-500/10",
  evidence_processed: "bg-cyan-500/10",
  camera_event: "bg-rose-500/10",
  new_notification: "bg-sky-500/10",
  status_change: "bg-orange-500/10",
};

// ─── Time Formatting ─────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Component ───────────────────────────────────────────

export function LiveIncidentFeed({
  activities,
  maxItems = 20,
  title = "Live Activity Feed",
  showPulse = true,
  onActivityClick,
}: LiveIncidentFeedProps) {
  const navigate = useNavigate();
  const feedRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevLengthRef = useRef(activities.length);

  // Auto-scroll to bottom when new activities appear
  useEffect(() => {
    if (autoScroll && activities.length > prevLengthRef.current && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
    prevLengthRef.current = activities.length;
  }, [activities.length, autoScroll]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    if (!feedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 30;
    setIsAtBottom(atBottom);
    if (!atBottom && activities.length > prevLengthRef.current) {
      setAutoScroll(false);
    }
    if (atBottom) {
      setAutoScroll(true);
    }
  }, [activities.length]);

  const scrollToBottom = useCallback(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
      setAutoScroll(true);
    }
  }, []);

  const handleClick = (activity: DashboardActivity) => {
    if (onActivityClick) {
      onActivityClick(activity);
    } else if (activity.referenceId) {
      navigate(`/incidents/${activity.referenceId}`);
    }
  };

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          {showPulse && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
          <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
            {title}
          </h3>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-primary/5 text-primary border-primary/15">
            {activities.length}
          </Badge>
        </div>
        {!isAtBottom && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-5 w-5 rounded-md text-muted-foreground"
            onClick={scrollToBottom}
            title="Scroll to latest"
          >
            <ArrowUpRight className="w-3 h-3 rotate-90" />
          </Button>
        )}
      </div>

      {/* Feed */}
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-hide"
      >
        {displayedActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-medium text-muted-foreground/60">No activity yet</p>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5">
              Live updates will appear here
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {displayedActivities.map((activity, index) => (
              <motion.button
                key={`${activity.type}-${activity.timestamp}-${index}`}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.3, delay: index === 0 ? 0 : 0 }}
                className="w-full flex items-start gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-secondary/30 border-b border-border/10 last:border-b-0 group"
                onClick={() => handleClick(activity)}
              >
                {/* Icon */}
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
                    ACTIVITY_ICON_BG[activity.type] || "bg-secondary"
                  }`}
                >
                  {ACTIVITY_ICONS[activity.type] || <Activity className="w-3 h-3" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground/80 truncate group-hover:text-foreground transition-colors">
                    {activity.label}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {activity.severity && (
                      <Badge
                        variant="outline"
                        className={`text-[8px] px-1 py-0 h-3 ${
                          ACTIVITY_COLORS[activity.type] || "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {activity.severity}
                      </Badge>
                    )}
                    <span className="text-[9px] text-muted-foreground/50 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Type indicator */}
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                    activity.type === "new_incident" ? "bg-blue-500" :
                    activity.type === "incident_resolved" ? "bg-emerald-500" :
                    activity.type === "ai_analysis_complete" ? "bg-purple-500" :
                    activity.type === "evidence_uploaded" ? "bg-amber-500" :
                    activity.type === "camera_event" ? "bg-rose-500" :
                    activity.type === "status_change" ? "bg-orange-500" :
                    "bg-muted-foreground/30"
                  }`}
                />
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer with live indicator */}
      {displayedActivities.length > 0 && (
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-border/30 bg-secondary/20">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[9px] text-muted-foreground/60">Live</span>
          </div>
          <span className="text-[9px] text-muted-foreground/40">
            {activities.length > 0 ? `${activities.filter(a => {
// eslint-disable-next-line react-hooks/purity
              const diff = Date.now() - new Date(a.timestamp).getTime();
              return diff < 3600000;
            }).length} in last hour` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
