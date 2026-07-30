import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useCallback } from "react";
import {
  User,
  Shield,
  Bell,
  Wifi,
  Database,
  ShieldCheck,
  Save,
  LogOut,
  Palette,
  Moon,
  Sun,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  MapPin,
  Smartphone,
  Download,
  Trash2,
  KeyRound,
  Copy,
  CheckCircle2,
  Monitor,
  Tablet,
  Smartphone as SmartphoneIcon,
  Globe,
  Clock,
  XCircle,
  History,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  BellRing,
  BellOff,
  Mail,
  MessageSquare,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Volume2,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  VolumeX,
  Moon as MoonIcon,
  ArrowUpDown,
  AlertTriangle,
  Lock,
  Eye as EyeIcon,
  FileJson,
  RefreshCw,
  UserX,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  ScrollText,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { checkPasswordStrength } from "@/supabase/auth";
import type { UserSession } from "@/supabase/auth";
import { ROLE_LABELS, getRoleColor } from "@/lib/permissions";

import {
  getNotificationPreferences,
  updateNotificationPreference,
  requestPushPermission,
  isPushAvailable,
  ensureNotificationPreferences,
  type NotificationPreference,
  type NotificationPriority,
  type NotificationType,
} from "@/lib/notifications";

import {
  getRetentionPolicies,
  updateRetentionPolicy,
  getDataClassifications,
  getPrivacySummary,
  getConsentRecords,
  setConsent,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  submitDataSubjectRequest,
  getDataSubjectRequests,
  requestDataErasure,
  exportPersonalData,
  applyRetentionPolicy,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  maskEmail,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  maskName,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  maskPhone,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  maskPlate,
  DATA_CATEGORY_LABELS,
  ARCHIVAL_STRATEGY_LABELS,
  CONSENT_TYPE_LABELS,
  REQUEST_TYPE_LABELS,
  type RetentionPolicy,
  type DataClassificationRecord,
  type PrivacySummary,
  type ConsentRecord,
  type DataSubjectRequest,
  type DataCategory,
} from "@/lib/privacy";

// ─── Constants ────────────────────────────────────────

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  case_assigned: "Case Assigned",
  case_updated: "Case Updated",
  evidence_added: "Evidence Added",
  ai_analysis_complete: "AI Analysis Complete",
  anpr_pending: "ANPR Pending Review",
  citizen_report: "Citizen Report Submitted",
  report_reviewed: "Report Reviewed",
  comment_added: "Comment Added",
  escalated: "Case Escalated",
  status_changed: "Status Changed",
  system_alert: "System Alert",
  task_assigned: "Task Assigned",
  wanted_vehicle: "Wanted Vehicle Alert",
  stolen_vehicle: "Stolen Vehicle Alert",
  major_accident: "Major Accident Alert",
  road_closure: "Road Closure",
};

const NOTIFICATION_TYPE_GROUPS: Record<string, NotificationType[]> = {
  "Case Management": ["case_assigned", "case_updated", "status_changed", "escalated", "task_assigned"],
  "Evidence & AI": ["evidence_added", "ai_analysis_complete", "anpr_pending"],
  "Citizen Reports": ["citizen_report", "report_reviewed", "comment_added"],
  "Emergency Alerts": ["wanted_vehicle", "stolen_vehicle", "major_accident", "road_closure"],
  "System": ["system_alert"],
};

// ─── Password Strength Bar ─────────────────────────────

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = checkPasswordStrength(password);
  if (!password) return null;
  const widthPercent = (strength.score + 1) * 20;

  return (
    <div className="space-y-1 mt-1">
      <Progress value={widthPercent} className="h-1.5 rounded-full" />
      <p className={`text-[10px] font-medium ${strength.color.split(" ")[1]}`}>{strength.label}</p>
    </div>
  );
}

// ─── Session Card ──────────────────────────────────────

function SessionCard({ session, onRevoke, isRevoking }: {
  session: UserSession;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}) {
  const DeviceIcon = session.deviceType === "mobile"
    ? SmartphoneIcon : session.deviceType === "tablet"
      ? Tablet : Monitor;

  const timeAgo = session.lastActiveAt
    ? (() => {
// eslint-disable-next-line react-hooks/purity
        const diff = Date.now() - new Date(session.lastActiveAt).getTime();
        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return new Date(session.lastActiveAt).toLocaleDateString();
      })()
    : "Unknown";

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl ${session.isCurrent ? "bg-primary/5 border border-primary/20" : "bg-secondary/30"}`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${session.isCurrent ? "bg-primary/10" : "bg-secondary"}`}>
          <DeviceIcon className={`w-4 h-4 ${session.isCurrent ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">
              {session.browserName || "Unknown Browser"}
            </p>
            {session.isCurrent && (
              <Badge className="clay-pill text-[9px] px-1.5 py-0 h-3.5 bg-primary/10 text-primary border-primary/20">
                Current
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
            <span>{session.osName || "Unknown OS"}</span>
            {session.ipAddress && (
              <>
                <span>·</span>
                <Globe className="w-2.5 h-2.5" />
                <span>{session.ipAddress}</span>
              </>
            )}
            <span>·</span>
            <Clock className="w-2.5 h-2.5" />
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
      {!session.isCurrent && (
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl text-destructive hover:bg-destructive/10 shrink-0 ml-2"
          onClick={() => onRevoke(session.id)}
          disabled={isRevoking}
        >
          <XCircle className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}

// ─── Notification Preference Row ──────────────────────

function NotificationPreferenceRow({
  pref,
  onUpdate,
}: {
  pref: NotificationPreference;
  onUpdate: (id: string, updates: Partial<{
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
  }>) => void;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{NOTIFICATION_TYPE_LABELS[pref.notification_type] || pref.notification_type}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{pref.notification_type.replace(/_/g, " ")}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex flex-col items-center gap-0.5">
          <Bell className={`w-3 h-3 ${pref.channel_in_app ? "text-primary" : "text-muted-foreground/40"}`} />
          <Switch
            checked={pref.channel_in_app}
            onCheckedChange={(checked) => onUpdate(pref.id, { channel_in_app: checked })}
            className="scale-75"
          />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <SmartphoneIcon className={`w-3 h-3 ${pref.channel_push ? "text-primary" : "text-muted-foreground/40"}`} />
          <Switch
            checked={pref.channel_push}
            onCheckedChange={(checked) => onUpdate(pref.id, { channel_push: checked })}
            className="scale-75"
          />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Mail className={`w-3 h-3 ${pref.channel_email ? "text-primary" : "text-muted-foreground/40"}`} />
          <Switch
            checked={pref.channel_email}
            onCheckedChange={(checked) => onUpdate(pref.id, { channel_email: checked })}
            className="scale-75"
          />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <MessageSquare className={`w-3 h-3 ${pref.channel_sms ? "text-primary" : "text-muted-foreground/40"}`} />
          <Switch
            checked={pref.channel_sms}
            onCheckedChange={(checked) => onUpdate(pref.id, { channel_sms: checked })}
            className="scale-75"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Settings Page ─────────────────────────────────────

export default function Settings() {
  const [pushAvailable, setPushAvailable] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);

  const {
    user,
    signOut,
    updatePassword,
    sessions,
    getActiveSessions,
    revokeSession,
    accountStatus,
    getAccountStatus,
    authAuditEvents,
    getAuthAuditEvents,
    mfaMethods,
    isMFAEnabled,
    enrollMFA,
    verifyMFAChallenge,
    disableMFA,
    generateRecoveryCodes,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    refreshMFAMethods,
  } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Session management
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // MFA
  const [mfaStep, setMfaStep] = useState<"idle" | "enrolling" | "verify" | "codes">("idle");
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaMethodId, setMfaMethodId] = useState("");
  const [mfaVerifyCode, setMfaVerifyCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [codesCopied, setCodesCopied] = useState(false);
  const [mfaDisabling, setMfaDisabling] = useState(false);

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreference[]>([]);
  const [notifPrefsLoading, setNotifPrefsLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("07:00");
  const [globalPriority, setGlobalPriority] = useState<NotificationPriority>("normal");
  const [globalPaused, setGlobalPaused] = useState(false);

  // Appearance
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  // Load sessions on mount
  useEffect(() => {
    getActiveSessions();
    getAccountStatus();
  }, [getActiveSessions, getAccountStatus]);

  // Load notification preferences
// eslint-disable-next-line react-hooks/exhaustive-deps
  const loadNotificationPrefs = async () => {
    if (!user?.id) return;
    setNotifPrefsLoading(true);
    let prefs = await getNotificationPreferences(user.id);

    // Auto-seed preferences if none exist yet
    if (prefs.length === 0) {
      await ensureNotificationPreferences(user.id);
      prefs = await getNotificationPreferences(user.id);
    }

    setNotifPrefs(prefs);

    // Check global quiet hours from first preference
    if (prefs.length > 0) {
      const first = prefs.find((p) => p.quiet_hours_start);
      if (first) {
        if (first.quiet_hours_start) setQuietHoursStart(first.quiet_hours_start);
        if (first.quiet_hours_end) setQuietHoursEnd(first.quiet_hours_end);
      }
      setGlobalPaused(prefs.some((p) => p.is_paused));
    }

    setNotifPrefsLoading(false);
  };

// eslint-disable-next-line react-hooks/exhaustive-deps
  const checkPushStatus = async () => {
    const avail = await isPushAvailable();
    setPushAvailable(avail);
    setPushEnabled(avail);
  };

  useEffect(() => {
    if (!user?.id) return;
// eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotificationPrefs();
    checkPushStatus();
  }, [user?.id, loadNotificationPrefs, checkPushStatus]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // ─── Notification Preferences ───────────────────────

  const handleUpdateNotifPref = async (
    id: string,
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
  ) => {
    const success = await updateNotificationPreference(id, updates);
    if (success) {
      setNotifPrefs((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    } else {
      toast.error("Failed to update notification preference");
    }
  };

  const handleToggleGlobalPause = async () => {
    const newPaused = !globalPaused;
    setGlobalPaused(newPaused);
    for (const pref of notifPrefs) {
      await updateNotificationPreference(pref.id, { is_paused: newPaused });
    }
    toast.success(newPaused ? "All notifications paused" : "Notifications resumed");
  };

  const handleApplyQuietHours = async () => {
    for (const pref of notifPrefs) {
      await updateNotificationPreference(pref.id, {
        quiet_hours_start: quietHoursStart,
        quiet_hours_end: quietHoursEnd,
      });
    }
    setNotifPrefs((prev) =>
      prev.map((p) => ({
        ...p,
        quiet_hours_start: quietHoursStart,
        quiet_hours_end: quietHoursEnd,
      }))
    );
    toast.success("Quiet hours updated for all notification types");
  };

  const handleApplyGlobalPriority = async () => {
    for (const pref of notifPrefs) {
      await updateNotificationPreference(pref.id, { min_priority: globalPriority });
    }
    setNotifPrefs((prev) =>
      prev.map((p) => ({ ...p, min_priority: globalPriority }))
    );
    toast.success(`Minimum priority set to ${globalPriority}`);
  };

  const handleToggleChannel = async (channel: "in_app" | "push" | "email" | "sms", enable: boolean) => {
    const channelKey = `channel_${channel}` as keyof NotificationPreference;
    for (const pref of notifPrefs) {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateNotificationPreference(pref.id, { [channelKey]: enable } as any);
    }
    setNotifPrefs((prev) =>
      prev.map((p) => ({ ...p, [channelKey]: enable }))
    );
    toast.success(`${channel === "in_app" ? "In-app" : channel.charAt(0).toUpperCase() + channel.slice(1)} notifications ${enable ? "enabled" : "disabled"} for all types`);
  };

  const handleEnablePush = async () => {
    setPushLoading(true);
    const success = await requestPushPermission();
    setPushEnabled(success);
    setPushAvailable(success);
    setPushLoading(false);
  };

  // ─── Password Change ─────────────────────────────────

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    const strength = checkPasswordStrength(newPassword);
    if (strength.score < 1) {
      toast.error("Password is too weak");
      return;
    }
    setChangingPassword(true);
    try {
      await updatePassword(newPassword);
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  // ─── Session Revoke ──────────────────────────────────

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await revokeSession(sessionId);
      toast.success("Session revoked");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke session");
    } finally {
      setRevokingId(null);
    }
  };

  // ─── MFA ─────────────────────────────────────────────

  const handleEnrollMFA = async () => {
    setMfaStep("enrolling");
    try {
      const result = await enrollMFA();
      setMfaQrCode(result.qrCode);
      setMfaSecret(result.secret);
      setMfaMethodId(result.methodId);
      setMfaStep("verify");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "Failed to start MFA enrollment");
      setMfaStep("idle");
    }
  };

  const handleVerifyMFA = async () => {
    try {
      await verifyMFAChallenge(mfaMethodId, mfaVerifyCode);
      const codes = await generateRecoveryCodes();
      setRecoveryCodes(codes);
      setMfaStep("codes");
      toast.success("Two-factor authentication enabled!");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "Failed to verify code");
    }
  };

  const handleDisableMFA = async () => {
    setMfaDisabling(true);
    try {
      const method = mfaMethods.find((m) => m.methodType === "totp");
      if (method) {
        await disableMFA(method.id);
        toast.success("Two-factor authentication disabled");
      }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "Failed to disable MFA");
    } finally {
      setMfaDisabling(false);
    }
  };

  // ─── Dark Mode ───────────────────────────────────────

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  // ─── Format helpers ──────────────────────────────────

  const actionLabels: Record<string, string> = {
    login: "Sign In",
    logout: "Sign Out",
    password_reset_requested: "Password Reset Requested",
    password_changed: "Password Changed",
    mfa_verified: "MFA Enabled",
    mfa_disabled: "MFA Disabled",
    session_revoked: "Session Revoked",
    profile_updated: "Profile Updated",
    login_failed: "Failed Sign In",
  };

  // ─── Notification group toggle handlers ──────────────

  const getChannelCount = (channel: "in_app" | "push" | "email" | "sms") => {
    const key = `channel_${channel}` as keyof NotificationPreference;
    return notifPrefs.filter((p) => p[key]).length;
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account, security, notifications, and preferences
          </p>
        </div>          <Tabs defaultValue="notifications">
          <TabsList className="grid grid-cols-7 rounded-xl p-1 bg-secondary">
            <TabsTrigger value="notifications" className="rounded-lg text-xs">
              <Bell className="w-3.5 h-3.5 mr-1" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-lg text-xs">
              <User className="w-3.5 h-3.5 mr-1" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg text-xs">
              <Shield className="w-3.5 h-3.5 mr-1" />
              Security
            </TabsTrigger>
            <TabsTrigger value="sessions" className="rounded-lg text-xs">
              <Monitor className="w-3.5 h-3.5 mr-1" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-lg text-xs">
              <Palette className="w-3.5 h-3.5 mr-1" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg text-xs">
              <History className="w-3.5 h-3.5 mr-1" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-lg text-xs">
              <Lock className="w-3.5 h-3.5 mr-1" />
              Privacy
            </TabsTrigger>
          </TabsList>

          {/* ════════════════ Notifications Tab ═══════════ */}
          <TabsContent value="notifications" className="space-y-4 mt-4">
            {/* Global Controls */}
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-primary" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Control how and when you receive notifications across all channels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Global toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    {globalPaused ? (
                      <BellOff className="w-4 h-4 text-destructive" />
                    ) : (
                      <BellRing className="w-4 h-4 text-primary" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {globalPaused ? "All Notifications Paused" : "Notifications Active"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {globalPaused ? "You won't receive any notifications" : "You will receive notifications based on your preferences"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={globalPaused ? "default" : "outline"}
                    size="sm"
                    className={`rounded-xl ${globalPaused ? "clay-btn" : ""}`}
                    onClick={handleToggleGlobalPause}
                  >
                    {globalPaused ? (
                      <><BellRing className="w-3.5 h-3.5 mr-1" /> Resume</>
                    ) : (
                      <><BellOff className="w-3.5 h-3.5 mr-1" /> Pause All</>
                    )}
                  </Button>
                </div>

                {/* Channel toggle bar */}
                <div className="grid grid-cols-4 gap-2">
                  <div className={`flex flex-col items-center gap-2 p-3 rounded-xl ${getChannelCount("in_app") === notifPrefs.length ? "bg-primary/10 border border-primary/20" : "bg-secondary/30"} transition-colors`}>
                    <Bell className="w-4 h-4 text-primary" />
                    <p className="text-[10px] font-medium">In-App</p>
                    <p className="text-[9px] text-muted-foreground">{getChannelCount("in_app")}/{notifPrefs.length}</p>
                    <Switch
                      checked={getChannelCount("in_app") > 0}
                      onCheckedChange={(checked) => handleToggleChannel("in_app", checked)}
                      className="scale-75"
                    />
                  </div>
                  <div className={`flex flex-col items-center gap-2 p-3 rounded-xl ${getChannelCount("push") === notifPrefs.length ? "bg-primary/10 border border-primary/20" : "bg-secondary/30"} transition-colors`}>
                    <SmartphoneIcon className="w-4 h-4 text-primary" />
                    <p className="text-[10px] font-medium">Push</p>
                    <p className="text-[9px] text-muted-foreground">{getChannelCount("push")}/{notifPrefs.length}</p>
                    <Switch
                      checked={getChannelCount("push") > 0}
                      onCheckedChange={(checked) => handleToggleChannel("push", checked)}
                      className="scale-75"
                    />
                  </div>
                  <div className={`flex flex-col items-center gap-2 p-3 rounded-xl ${getChannelCount("email") === notifPrefs.length ? "bg-primary/10 border border-primary/20" : "bg-secondary/30"} transition-colors`}>
                    <Mail className="w-4 h-4 text-primary" />
                    <p className="text-[10px] font-medium">Email</p>
                    <p className="text-[9px] text-muted-foreground">{getChannelCount("email")}/{notifPrefs.length}</p>
                    <Switch
                      checked={getChannelCount("email") > 0}
                      onCheckedChange={(checked) => handleToggleChannel("email", checked)}
                      className="scale-75"
                    />
                  </div>
                  <div className={`flex flex-col items-center gap-2 p-3 rounded-xl ${getChannelCount("sms") === notifPrefs.length ? "bg-primary/10 border border-primary/20" : "bg-secondary/30"} transition-colors`}>
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <p className="text-[10px] font-medium">SMS</p>
                    <p className="text-[9px] text-muted-foreground">{getChannelCount("sms")}/{notifPrefs.length}</p>
                    <Switch
                      checked={getChannelCount("sms") > 0}
                      onCheckedChange={(checked) => handleToggleChannel("sms", checked)}
                      className="scale-75"
                    />
                  </div>
                </div>

                <Separator />

                {/* Push setup */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Smartphone className={`w-4 h-4 ${pushEnabled ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-medium">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        {pushEnabled
                          ? "Push notifications are active on this device"
                          : "Enable push notifications to receive alerts instantly"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={pushEnabled ? "outline" : "default"}
                    size="sm"
                    className={`rounded-xl ${!pushEnabled ? "clay-btn" : ""}`}
                    onClick={handleEnablePush}
                    disabled={pushLoading}
                  >
                    {pushLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : pushEnabled ? (
                      <><ShieldCheck className="w-3.5 h-3.5 mr-1" /> Active</>
                    ) : (
                      <><BellRing className="w-3.5 h-3.5 mr-1" /> Enable</>
                    )}
                  </Button>
                </div>

                {/* Quiet hours */}
                <div className="p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-2 mb-3">
                    <MoonIcon className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Quiet Hours</p>
                    <p className="text-[10px] text-muted-foreground ml-1">(Only in-app during this period)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-[10px]">Start</Label>
                      <Input
                        type="time"
                        value={quietHoursStart}
                        onChange={(e) => setQuietHoursStart(e.target.value)}
                        className="clay-inset mt-1"
                      />
                    </div>
                    <ArrowUpDown className="w-3 h-3 text-muted-foreground mt-5" />
                    <div className="flex-1">
                      <Label className="text-[10px]">End</Label>
                      <Input
                        type="time"
                        value={quietHoursEnd}
                        onChange={(e) => setQuietHoursEnd(e.target.value)}
                        className="clay-inset mt-1"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl mt-5"
                      onClick={handleApplyQuietHours}
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Apply
                    </Button>
                  </div>
                </div>

                {/* Priority threshold */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Minimum Priority</p>
                      <p className="text-xs text-muted-foreground">Only notify for this level or above</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={globalPriority} onValueChange={(v) => setGlobalPriority(v as NotificationPriority)}>
                      <SelectTrigger className="w-[110px] h-8 rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low" className="text-xs">Low & Above</SelectItem>
                        <SelectItem value="normal" className="text-xs">Normal & Above</SelectItem>
                        <SelectItem value="high" className="text-xs">High & Above</SelectItem>
                        <SelectItem value="urgent" className="text-xs">Urgent Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={handleApplyGlobalPriority}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Per-Type Preferences */}
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Notification Types</CardTitle>
                <CardDescription>
                  Configure channels per notification type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {notifPrefsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : notifPrefs.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notification preferences found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl mt-3"
                      onClick={loadNotificationPrefs}
                    >
                      Reload
                    </Button>
                  </div>
                ) : (
                  Object.entries(NOTIFICATION_TYPE_GROUPS).map(([groupName, types]) => (
                    <div key={groupName}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{groupName}</h4>
                        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                          <Bell className="w-2.5 h-2.5" />
                          <SmartphoneIcon className="w-2.5 h-2.5" />
                          <Mail className="w-2.5 h-2.5" />
                          <MessageSquare className="w-2.5 h-2.5" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        {notifPrefs
                          .filter((p) => types.includes(p.notification_type))
                          .map((pref) => (
                            <NotificationPreferenceRow
                              key={pref.id}
                              pref={pref}
                              onUpdate={handleUpdateNotifPref}
                            />
                          ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════════════ Profile Tab ════════════════ */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
                <CardDescription>Your account details as registered with the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                    {user?.profile?.full_name?.charAt(0) || "O"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{user?.profile?.full_name || "Officer"}</h3>
                    <p className="text-sm text-muted-foreground">#{user?.profile?.badge_number || "N/A"}</p>
                    {user?.profile?.role && (
                      <Badge className={`clay-pill text-[10px] px-2 py-0 h-4 mt-1 ${getRoleColor(user.profile.role)}`}>
                        {ROLE_LABELS[user.profile.role as keyof typeof ROLE_LABELS] || user.profile.role}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input className="clay-inset" defaultValue={user?.profile?.full_name || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input className="clay-inset" defaultValue={user?.email || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>Badge Number</Label>
                    <Input className="clay-inset" defaultValue={user?.profile?.badge_number || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input className="clay-inset" defaultValue={user?.profile?.phone || ""} type="tel" />
                  </div>
                  <div className="space-y-2">
                    <Label>Station</Label>
                    <Input className="clay-inset" defaultValue={user?.profile?.station || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input className="clay-inset" defaultValue={user?.profile?.role || ""} disabled />
                  </div>
                </div>

                <Button className="clay-btn rounded-xl" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  {saved ? "Saved!" : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="text-sm font-medium">Sign Out</p>
                      <p className="text-xs text-muted-foreground">End your current session</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════════════ Security Tab ═══════════════ */}
          <TabsContent value="security" className="space-y-4 mt-4">
            {/* Password Change */}
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your account password. Use a strong, unique password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type={showNewPw ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        className="pl-9 pr-9 clay-inset"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={8}
                        required
                      />
                      <button type="button" className="absolute right-3 top-3 text-muted-foreground" onClick={() => setShowNewPw(!showNewPw)}>
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrengthBar password={newPassword} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Re-enter new password"
                        className="pl-9 clay-inset"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[10px] text-destructive">Passwords don't match</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="clay-btn rounded-xl"
                    disabled={changingPassword || !newPassword || newPassword !== confirmPassword}
                  >
                    {changingPassword ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" /> Update Password</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* MFA */}
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mfaStep === "idle" && (
                  <>
                    <div className={`flex items-center justify-between p-3 rounded-xl ${isMFAEnabled ? "bg-success/5" : "bg-secondary/30"}`}>
                      <div className="flex items-center gap-3">
                        <ShieldCheck className={`w-4 h-4 ${isMFAEnabled ? "text-success" : "text-muted-foreground"}`} />
                        <div>
                          <p className="text-sm font-medium">
                            {isMFAEnabled ? "Two-factor authentication is active" : "Two-factor authentication is off"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isMFAEnabled
                              ? "Your account is protected with TOTP verification"
                              : "Protect your account with TOTP via an authenticator app"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`clay-pill text-[10px] ${isMFAEnabled ? "text-success border-success/20 bg-success/10" : "text-muted-foreground"}`}>
                        {isMFAEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    {isMFAEnabled ? (
                      <Button
                        variant="outline"
                        className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={handleDisableMFA}
                        disabled={mfaDisabling}
                      >
                        {mfaDisabling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                        Disable Two-Factor Auth
                      </Button>
                    ) : (
                      <Button className="clay-btn rounded-xl" onClick={handleEnrollMFA}>
                        <Smartphone className="w-4 h-4 mr-2" />
                        Set Up Two-Factor Auth
                      </Button>
                    )}
                  </>
                )}

                {mfaStep === "verify" && (
                  <div className="space-y-4">
                    <div className="bg-secondary/30 rounded-xl p-4 text-center">
                      <div className="flex justify-center mb-3">
                        <div className="w-48 h-48 bg-white rounded-xl p-2 flex items-center justify-center shadow-sm">
                          {mfaQrCode ? (
                            <img src={mfaQrCode} alt="QR Code" className="w-full h-full" />
                          ) : (
                            <Smartphone className="w-10 h-10 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Scan this QR code with your authenticator app
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <code className="text-[10px] bg-background px-2 py-1 rounded font-mono select-all">{mfaSecret}</code>
                        <button type="button" onClick={() => { navigator.clipboard.writeText(mfaSecret); toast.success("Secret copied"); }} className="p-1 hover:bg-secondary rounded">
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Verification Code</Label>
                      <Input
                        placeholder="000000"
                        className="clay-inset text-center text-lg font-mono tracking-widest"
                        value={mfaVerifyCode}
                        onChange={(e) => setMfaVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                      />
                    </div>
                    <Button className="w-full clay-btn rounded-xl" onClick={handleVerifyMFA} disabled={mfaVerifyCode.length !== 6}>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Verify & Enable
                    </Button>
                  </div>
                )}

                {mfaStep === "codes" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5">
                      <Shield className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="text-xs text-muted-foreground">
                        Save these recovery codes in a safe place. Each code can only be used once.
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {recoveryCodes.map((code, i) => (
                        <code key={i} className="text-xs bg-secondary/50 px-3 py-1.5 rounded font-mono text-center">{code}</code>
                      ))}
                    </div>
                    <Button variant="outline" className="rounded-xl" onClick={() => { navigator.clipboard.writeText(recoveryCodes.join("\n")); setCodesCopied(true); setTimeout(() => setCodesCopied(false), 2000); toast.success("Recovery codes copied"); }}>
                      <Copy className="w-4 h-4 mr-2" />
                      {codesCopied ? "Copied!" : "Copy Recovery Codes"}
                    </Button>
                    <Button className="clay-btn rounded-xl" onClick={() => setMfaStep("idle")}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Done — MFA Enabled
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <ShieldCheck className={`w-4 h-4 ${accountStatus?.isActive ? "text-success" : "text-destructive"}`} />
                  <span className="text-sm font-medium flex-1 ml-3">Account Status</span>
                  <Badge variant="outline" className={`clay-pill text-[10px] ${accountStatus?.isActive ? "text-success bg-success/10 border-success/20" : "text-destructive bg-destructive/10 border-destructive/20"}`}>
                    {accountStatus?.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium flex-1 ml-3">MFA</span>
                  <Badge variant="outline" className={`clay-pill text-[10px] ${accountStatus?.mfaEnabled ? "text-success bg-success/10" : "text-muted-foreground"}`}>
                    {accountStatus?.mfaEnabled ? "Enabled" : "Not Set Up"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium flex-1 ml-3">Active Sessions</span>
                  <span className="text-sm font-medium">{accountStatus?.activeSessions || 0}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════════════ Sessions Tab ════════════════ */}
          <TabsContent value="sessions" className="space-y-4 mt-4">
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-primary" />
                    Active Sessions
                  </CardTitle>
                  <CardDescription>Devices and browsers where you're currently signed in</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => getActiveSessions()}>
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No active sessions found</p>
                ) : (
                  sessions.map((session) => (
                    <SessionCard key={session.id} session={session} onRevoke={handleRevokeSession} isRevoking={revokingId === session.id} />
                  ))
                )}
                {sessions.length > 1 && (
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="rounded-xl text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={async () => {
                      const otherSessions = sessions.filter((s) => !s.isCurrent);
                      for (const s of otherSessions) await handleRevokeSession(s.id);
                    }}>
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Revoke All Other Sessions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════════════ Appearance Tab ═══════════════ */}
          <TabsContent value="preferences" className="space-y-4 mt-4">
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Appearance</CardTitle>
                <CardDescription>Customize your visual experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    <div>
                      <p className="text-sm font-medium">Dark Mode</p>
                      <p className="text-xs text-muted-foreground">{darkMode ? "Dark theme active" : "Light theme active"}</p>
                    </div>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
                </div>
              </CardContent>
            </Card>

            {/* Offline Data Management */}
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Offline Data Management</CardTitle>
                <CardDescription>Manage cached data for offline access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium flex-1 ml-3">Cached Incidents</span>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <Download className="w-4 h-4 mr-1" />
                    Sync All
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <Wifi className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium flex-1 ml-3">Auto-Sync</span>
                  <Switch defaultChecked />
                </div>
                <div className="border-t border-border/50 pt-4">
                  <Button variant="outline" size="sm" className="rounded-xl text-destructive border-destructive/30">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All Cached Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════════════ Privacy Tab ═════════════════ */}
          <TabsContent value="privacy" className="space-y-4 mt-4">
            <PrivacyTabContent />
          </TabsContent>

          {/* ════════════════ Activity Tab ════════════════ */}
          <TabsContent value="activity" className="space-y-4 mt-4">
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Account Activity
                  </CardTitle>
                  <CardDescription>Recent security events and account changes</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => getAuthAuditEvents(20)}>
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                {authAuditEvents.length === 0 ? (
                  <div className="text-center py-6">
                    <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                    <Button variant="outline" size="sm" className="rounded-xl mt-3" onClick={() => getAuthAuditEvents(20)}>
                      Load Activity
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-border/50" />
                    <div className="space-y-3">
                      {authAuditEvents.map((event) => (
                        <div key={event.id} className="relative pl-10">
                          <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {actionLabels[event.action] || event.action.replace(/_/g, " ")}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(event.createdAt).toLocaleString()}
                            </p>
                            {event.userAgent && (
                              <p className="text-[10px] text-muted-foreground truncate max-w-[300px]">
                                {event.userAgent}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// ─── Privacy Tab Content ────────────────────────────────

function PrivacyTabContent() {
  const { user } = useAuth();
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [dataClassifications, setDataClassifications] = useState<DataClassificationRecord[]>([]);
  const [privacySummary, setPrivacySummary] = useState<PrivacySummary | null>(null);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [dataRequests, setDataRequests] = useState<DataSubjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [erasureRequesting, setErasureRequesting] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [activePrivacyTab, setActivePrivacyTab] = useState("overview");
const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
// eslint-disable-next-line react-hooks/immutability
    loadPrivacyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPrivacyData = async () => {
    setLoading(true);
    const [policies, classifications, summary, dsrs] = await Promise.all([
      getRetentionPolicies(),
      getDataClassifications(),
      getPrivacySummary(),
      getDataSubjectRequests(),
    ]);
    setRetentionPolicies(policies);
    setDataClassifications(classifications);
    setPrivacySummary(summary);
    setDataRequests(dsrs);

    if (user?.id) {
      const consentRecords = await getConsentRecords(user.id);
      setConsents(consentRecords);
    }
    setLoading(false);
  };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdatePolicy = async (policyId: string, field: string, value: any) => {
    const success = await updateRetentionPolicy(policyId, { [field]: value });
    if (success) {
      setRetentionPolicies((prev) =>
        prev.map((p) => (p.id === policyId ? { ...p, [field]: value } : p))
      );
      toast.success("Retention policy updated");
    } else {
      toast.error("Failed to update retention policy");
    }
  };

  const handleApplyPolicy = async (category: DataCategory) => {
    const result = await applyRetentionPolicy(category);
    if (result) {
      toast.success(`Applied retention policy for ${DATA_CATEGORY_LABELS[category]}: ${JSON.stringify(result)}`);
      loadPrivacyData();
    } else {
      toast.error("Failed to apply retention policy");
    }
  };

  const handleConsentToggle = async (consentType: string, granted: boolean) => {
    if (!user?.id) return;
    const success = await setConsent(user.id, consentType, granted);
    if (success) {
      toast.success(`${granted ? "Granted" : "Revoked"} consent for ${CONSENT_TYPE_LABELS[consentType] || consentType}`);
      loadPrivacyData();
    }
  };

  const handleRequestErasure = async () => {
    setErasureRequesting(true);
    const result = await requestDataErasure();
    if (result.success) {
      toast.success("Data erasure request submitted — an administrator will review it");
      loadPrivacyData();
    } else {
      toast.error("Failed to submit erasure request");
    }
    setErasureRequesting(false);
  };

  const handleExportData = async () => {
    setExportLoading(true);
    const data = await exportPersonalData();
    if (data) {
      // Create a downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `personal-data-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Personal data exported — check your downloads");
    } else {
      toast.error("Failed to export personal data");
    }
    setExportLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Privacy Summary Cards */}
      {privacySummary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-secondary/30 text-center">
            <p className="text-lg font-bold">{privacySummary.total_pii_columns}</p>
            <p className="text-[10px] text-muted-foreground">PII Columns Tracked</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/30 text-center">
            <p className="text-lg font-bold">{privacySummary.total_retention_policies}</p>
            <p className="text-[10px] text-muted-foreground">Retention Policies</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/30 text-center">
            <p className="text-lg font-bold">{privacySummary.active_consents}</p>
            <p className="text-[10px] text-muted-foreground">Active Consents</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/30 text-center">
            <p className="text-lg font-bold">{privacySummary.pending_data_requests}</p>
            <p className="text-[10px] text-muted-foreground">Pending Requests</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/30 text-center">
            <p className="text-lg font-bold">{privacySummary.pii_access_events_30d}</p>
            <p className="text-[10px] text-muted-foreground">PII Access (30d)</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/30 text-center">
            <p className="text-lg font-bold">{privacySummary.auto_purge_enabled}</p>
            <p className="text-[10px] text-muted-foreground">Auto-Purge Policies</p>
          </div>
        </div>
      )}

      {/* Inner Tabs */}
      <Tabs value={activePrivacyTab} onValueChange={setActivePrivacyTab}>
        <TabsList className="rounded-xl p-1 bg-secondary">
          <TabsTrigger value="overview" className="rounded-lg text-xs">
            <EyeIcon className="w-3.5 h-3.5 mr-1" />
            Data Classification
          </TabsTrigger>
          <TabsTrigger value="retention" className="rounded-lg text-xs">
            <Database className="w-3.5 h-3.5 mr-1" />
            Retention Policies
          </TabsTrigger>
          <TabsTrigger value="consent" className="rounded-lg text-xs">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Consent
          </TabsTrigger>
          <TabsTrigger value="rights" className="rounded-lg text-xs">
            <UserX className="w-3.5 h-3.5 mr-1" />
            Data Rights
          </TabsTrigger>
        </TabsList>

        {/* Data Classification */}
        <TabsContent value="overview" className="mt-4 space-y-3">
          <Card className="clay-card border-border/50 !rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <EyeIcon className="w-4 h-4 text-primary" />
                Data Classification Registry
              </CardTitle>
              <CardDescription>
                All database columns containing personal or sensitive data are classified and tracked
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dataClassifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No data classification records found. Run the v18 migration to seed default classifications.
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {dataClassifications.map((dc) => (
                    <div key={dc.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <code className="text-[11px] bg-background px-1.5 py-0.5 rounded font-mono">{dc.table_name}</code>
                        <span className="text-muted-foreground">.</span>
                        <code className="text-[11px] font-mono">{dc.column_name}</code>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {dc.masking_rule && (
                          <Badge variant="outline" className="clay-pill text-[9px] bg-blue-500/5 border-blue-500/20 text-blue-500">
                            {dc.masking_rule}
                          </Badge>
                        )}
                        <Badge className={`clay-pill text-[9px] px-2 py-0 h-5 ${
                          dc.classification === "pii" ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300" :
                          dc.classification === "sensitive_pii" ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300" :
                          dc.classification === "confidential" ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300" :
                          "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
                        }`}>
                          {dc.classification.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Policies */}
        <TabsContent value="retention" className="mt-4 space-y-3">
          <Card className="clay-card border-border/50 !rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                Data Retention Policies
              </CardTitle>
              <CardDescription>
                Configure how long each data category is retained and what happens when it expires
              </CardDescription>
            </CardHeader>
            <CardContent>
              {retentionPolicies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Load policies from database</p>
              ) : (
                <div className="space-y-3">
                  {retentionPolicies.map((policy) => (
                    <div key={policy.id} className="p-3 rounded-xl bg-secondary/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {DATA_CATEGORY_LABELS[policy.data_category] || policy.data_category}
                          </span>
                        </div>
                        <Badge variant="outline" className={`clay-pill text-[9px] ${policy.auto_purge_enabled ? "bg-success/10 text-success border-success/20" : "text-muted-foreground"}`}>
                          {policy.auto_purge_enabled ? "Auto-Purge" : "Manual"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{policy.retention_days} days</span>
                          <Input
                            type="number"
                            className="w-20 h-7 text-xs clay-inset"
                            value={policy.retention_days}
                            onChange={(e) => handleUpdatePolicy(policy.id, "retention_days", parseInt(e.target.value) || 365)}
                            min={1}
                          />
                        </div>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-muted-foreground">{ARCHIVAL_STRATEGY_LABELS[policy.archival_strategy]}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Switch
                              checked={policy.auto_purge_enabled}
                              onCheckedChange={(v) => handleUpdatePolicy(policy.id, "auto_purge_enabled", v)}
                              className="scale-75"
                            />
                            Auto
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-lg text-[10px] px-2"
                            onClick={() => handleApplyPolicy(policy.data_category)}
                          >
                            <RefreshCw className="w-2.5 h-2.5 mr-1" />
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consent Management */}
        <TabsContent value="consent" className="mt-4 space-y-3">
          <Card className="clay-card border-border/50 !rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Data Processing Consent
              </CardTitle>
              <CardDescription>
                Control how your personal data may be processed and shared
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(CONSENT_TYPE_LABELS).map(([type, label]) => {
                const activeConsent = consents.find(
                  (c) => c.consent_type === type && c.revoked_at === null
                );
                const isGranted = activeConsent?.granted ?? false;
                return (
                  <div key={type} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{type.replace(/_/g, " ")}</p>
                    </div>
                    <Switch
                      checked={isGranted}
                      onCheckedChange={(checked) => handleConsentToggle(type, checked)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Rights */}
        <TabsContent value="rights" className="mt-4 space-y-3">
          <Card className="clay-card border-border/50 !rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserX className="w-4 h-4 text-primary" />
                Your Data Rights
              </CardTitle>
              <CardDescription>
                Exercise your rights under applicable data protection laws
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Export Data */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-3">
                  <FileJson className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Export My Data</p>
                    <p className="text-xs text-muted-foreground">
                      Download all your personal data (JSON format)
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleExportData}
                  disabled={exportLoading}
                >
                  {exportLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <><Download className="w-3.5 h-3.5 mr-1" /> Export</>
                  )}
                </Button>
              </div>

              {/* Request Erasure */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">Delete My Data (Right to Erasure)</p>
                    <p className="text-xs text-muted-foreground">
                      Submit a request to have your personal data permanently removed
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={handleRequestErasure}
                  disabled={erasureRequesting}
                >
                  {erasureRequesting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <><UserX className="w-3.5 h-3.5 mr-1" /> Request Deletion</>
                  )}
                </Button>
              </div>

              {/* Previous Requests */}
              {dataRequests.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Previous Requests
                  </h4>
                  <div className="space-y-2">
                    {dataRequests.map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20">
                        <div>
                          <p className="text-xs font-medium">
                            {REQUEST_TYPE_LABELS[req.request_type] || req.request_type}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(req.requested_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={`clay-pill text-[9px] ${
                          req.status === "completed" ? "bg-success/10 text-success" :
                          req.status === "pending" ? "bg-amber-500/10 text-amber-500" :
                          req.status === "rejected" ? "bg-destructive/10 text-destructive" :
                          "bg-secondary/50 text-muted-foreground"
                        }`}>
                          {req.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy Impact Notice */}
          <Card className="clay-card border-border/50 !rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Privacy by Design</p>
                  <p>TrafficWatch AI implements data minimization, purpose limitation, and storage limitation by default.</p>
                  <p>All PII columns are classified and masked appropriately. Retention policies are configurable and auditable.</p>
                  <p>Chain-of-custody and audit logging ensure all data access is traceable to authorized personnel only.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
