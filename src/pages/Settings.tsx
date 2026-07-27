import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
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
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

import { checkPasswordStrength } from "@/supabase/auth";
import type { UserSession } from "@/supabase/auth";
import { ROLE_LABELS, getRoleColor } from "@/lib/permissions";

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

// ─── Settings Page ─────────────────────────────────────

export default function Settings() {
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
    refreshMFAMethods,
  } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

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

  // Load sessions on mount
  useEffect(() => {
    getActiveSessions();
    getAccountStatus();
  }, [getActiveSessions, getAccountStatus]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
    } catch (err: any) {
      toast.error(err.message || "Failed to start MFA enrollment");
      setMfaStep("idle");
    }
  };

  const handleVerifyMFA = async () => {
    try {
      await verifyMFAChallenge(mfaMethodId, mfaVerifyCode);

      // Generate recovery codes
      const codes = await generateRecoveryCodes();
      setRecoveryCodes(codes);
      setMfaStep("codes");
      toast.success("Two-factor authentication enabled!");
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
    } catch (err: any) {
      toast.error(err.message || "Failed to disable MFA");
    } finally {
      setMfaDisabling(false);
    }
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

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account, security, and preferences
          </p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="grid grid-cols-5 rounded-xl p-1 bg-secondary">
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
              Preferences
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg text-xs">
              <History className="w-3.5 h-3.5 mr-1" />
              Activity
            </TabsTrigger>
          </TabsList>

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

            {/* MFA / Two-Factor Auth */}
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
                        {mfaDisabling ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Shield className="w-4 h-4 mr-2" />
                        )}
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
                    <Button
                      className="w-full clay-btn rounded-xl"
                      onClick={handleVerifyMFA}
                      disabled={mfaVerifyCode.length !== 6}
                    >
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
                        <code key={i} className="text-xs bg-secondary/50 px-3 py-1.5 rounded font-mono text-center">
                          {code}
                        </code>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        navigator.clipboard.writeText(recoveryCodes.join("\n"));
                        setCodesCopied(true);
                        setTimeout(() => setCodesCopied(false), 2000);
                        toast.success("Recovery codes copied");
                      }}
                    >
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
                  <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-4 h-4 ${accountStatus?.isActive ? "text-success" : "text-destructive"}`} />
                    <div>
                      <p className="text-sm font-medium">Account Status</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`clay-pill text-[10px] ${accountStatus?.isActive ? "text-success bg-success/10 border-success/20" : "text-destructive bg-destructive/10 border-destructive/20"}`}>
                    {accountStatus?.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">MFA</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`clay-pill text-[10px] ${accountStatus?.mfaEnabled ? "text-success bg-success/10" : "text-muted-foreground"}`}>
                    {accountStatus?.mfaEnabled ? "Enabled" : "Not Set Up"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Active Sessions</p>
                    </div>
                  </div>
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
                  <CardDescription>
                    Devices and browsers where you're currently signed in
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => getActiveSessions()}
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No active sessions found</p>
                ) : (
                  sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onRevoke={handleRevokeSession}
                      isRevoking={revokingId === session.id}
                    />
                  ))
                )}
                {sessions.length > 1 && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={async () => {
                        const otherSessions = sessions.filter((s) => !s.isCurrent);
                        for (const s of otherSessions) {
                          await handleRevokeSession(s.id);
                        }
                      }}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Revoke All Other Sessions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════════════ Preferences Tab ════════════ */}
          <TabsContent value="preferences" className="space-y-4 mt-4">
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Appearance & Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Moon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Dark Mode</p>
                      <p className="text-xs text-muted-foreground">Use dark color theme</p>
                    </div>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive alerts for new incidents</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Install App</p>
                      <p className="text-xs text-muted-foreground">Add TrafficWatch to your home screen</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    Install
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Offline */}
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Offline Data Management</CardTitle>
                <CardDescription>Manage cached data for offline access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Cached Incidents</p>
                      <p className="text-xs text-muted-foreground">247 incidents available offline</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <Download className="w-4 h-4 mr-1" />
                    Sync All
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Wifi className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Auto-Sync</p>
                      <p className="text-xs text-muted-foreground">Automatically sync when online</p>
                    </div>
                  </div>
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

          {/* ════════════════ Activity Tab ════════════════ */}
          <TabsContent value="activity" className="space-y-4 mt-4">
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Account Activity
                  </CardTitle>
                  <CardDescription>
                    Recent security events and account changes
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => getAuthAuditEvents(20)}
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                {authAuditEvents.length === 0 ? (
                  <div className="text-center py-6">
                    <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl mt-3"
                      onClick={() => getAuthAuditEvents(20)}
                    >
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
