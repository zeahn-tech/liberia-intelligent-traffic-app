import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { checkPasswordStrength } from "@/supabase/auth";
import {
  Shield,
  ArrowRight,
  Loader2,
  Mail,
  Lock,
  UserPlus,
  LogIn,
  BadgeAlert,
  ArrowLeft,
  Building,
  Phone,
  KeyRound,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

// ─── Password Strength Indicator ───────────────────────

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = checkPasswordStrength(password);
  if (!password) return null;

  const widthPercent = (strength.score + 1) * 20;

  return (
    <div className="space-y-1">
      <Progress value={widthPercent} className="h-1.5 rounded-full" />
      <p className={`text-[10px] font-medium ${strength.color.split(" ")[1]}`}>
        {strength.label}
      </p>
    </div>
  );
}

// ─── MFA Setup Dialog ──────────────────────────────────

function MFASetup({
  qrCode,
  secret,
  methodId,
  onVerify,
  onCancel,
}: {
  qrCode: string;
  secret: string;
  methodId: string;
  onVerify: (code: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await onVerify(code);
      toast.success("MFA enabled successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to verify code");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-secondary/30 rounded-xl p-4 text-center">
        <div className="flex justify-center mb-3">
          <div className="w-48 h-48 bg-white rounded-xl p-2 flex items-center justify-center shadow-sm">
            {qrCode ? (
              <img src={qrCode} alt="MFA QR Code" className="w-full h-full" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Smartphone className="w-10 h-10" />
                <p className="text-xs">Scan with authenticator app</p>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </p>
        <div className="flex items-center justify-center gap-2">
          <code className="text-xs bg-background px-2 py-1 rounded font-mono select-all">
            {secret}
          </code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(secret);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="p-1 hover:bg-secondary rounded transition-colors"
          >
            {copied ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mfa-code">Verification Code</Label>
        <Input
          id="mfa-code"
          placeholder="000000"
          className="clay-inset text-center text-lg font-mono tracking-widest"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          disabled={verifying}
        />
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 rounded-xl"
          onClick={onCancel}
          disabled={verifying}
        >
          Cancel
        </Button>
        <Button
          className="flex-1 clay-btn rounded-xl"
          onClick={handleVerify}
          disabled={code.length !== 6 || verifying}
        >
          {verifying ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4 mr-2" />
          )}
          Verify & Enable
        </Button>
      </div>
    </div>
  );
}

// ─── Auth Component ────────────────────────────────────

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const {
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    resetPassword,
    enrollMFA,
    verifyMFAChallenge,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "mfa-setup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [station, setStation] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("traffic_officer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // MFA enrollment state
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaMethodId, setMfaMethodId] = useState("");

  // Check for password reset redirect
  useEffect(() => {
    if (searchParams.get("reset") === "true") {
      setMode("forgot");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && mode !== "mfa-setup") {
      navigate(redirect);
    }
  }, [isLoading, isAuthenticated, navigate, redirect, mode]);

  // ─── Sign In ─────────────────────────────────────────

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
      navigate(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Sign Up ─────────────────────────────────────────

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const strength = checkPasswordStrength(password);
    if (strength.score < 1) {
      setError("Password is too weak. Use at least 8 characters with mixed case, numbers, or symbols.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await signUp(email, password, {
        full_name: fullName,
        badge_number: badgeNumber,
        station,
        phone: phone || null,
        role,
      });

      // Offer MFA setup after signup
      try {
        const result = await enrollMFA();
        setMfaQrCode(result.qrCode);
        setMfaSecret(result.secret);
        setMfaMethodId(result.methodId);
        setMode("mfa-setup");
      } catch {
        // MFA enrollment is optional
        navigate(redirect);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Forgot Password ────────────────────────────────

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await resetPassword(email);
      setResetSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── MFA Verification ───────────────────────────────

  const handleMFAVerify = async (code: string) => {
    await verifyMFAChallenge(mfaMethodId, code);
    navigate(redirect);
  };

  // ─── Render ─────────────────────────────────────────

  const renderForm = () => {
    // ── Forgot Password ─────────────────────────────────
    if (mode === "forgot") {
      return (
        <form onSubmit={handleForgotPassword}>
          <CardContent className="space-y-4 pb-4">
            {resetSent ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Check Your Email</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl mt-2"
                  onClick={() => { setMode("signin"); setResetSent(false); }}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <KeyRound className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter your email and we'll send you a password reset link.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="name@police.gov.lr"
                      className="pl-9 clay-inset"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                    <BadgeAlert className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
              </>
            )}
          </CardContent>
          {!resetSent && (
            <CardFooter className="flex-col gap-3 pb-8">
              <Button
                type="submit"
                className="w-full clay-btn rounded-xl h-11"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Send Reset Link
              </Button>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { setMode("signin"); setError(null); }}
              >
                Back to Sign In
              </button>
            </CardFooter>
          )}
        </form>
      );
    }

    // ── MFA Setup ────────────────────────────────────
    if (mode === "mfa-setup") {
      return (
        <div>
          <CardContent className="pb-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 mb-4">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                Enhance your account security by setting up two-factor authentication.
              </p>
            </div>
            <MFASetup
              qrCode={mfaQrCode}
              secret={mfaSecret}
              methodId={mfaMethodId}
              onVerify={handleMFAVerify}
              onCancel={() => navigate(redirect)}
            />
          </CardContent>
        </div>
      );
    }

    // ── Sign In ──────────────────────────────────────
    if (mode === "signin") {
      return (
        <form onSubmit={handleSignIn}>
          <CardContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@police.gov.lr"
                  className="pl-9 clay-inset"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => { setMode("forgot"); setError(null); }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-9 pr-9 clay-inset"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                <BadgeAlert className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-3 pb-8">
            <Button
              type="submit"
              className="w-full clay-btn rounded-xl h-11"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              Sign In
            </Button>
          </CardFooter>
        </form>
      );
    }

    // ── Sign Up ───────────────────────────────────────
    return (
      <form onSubmit={handleSignUp}>
        <CardContent className="space-y-4 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Officer Name"
                className="clay-inset"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="badge">Badge #</Label>
              <Input
                id="badge"
                placeholder="LNP-1234"
                className="clay-inset"
                value={badgeNumber}
                onChange={(e) => setBadgeNumber(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-email"
                type="email"
                placeholder="name@police.gov.lr"
                className="pl-9 clay-inset"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                className="pl-9 pr-9 clay-inset"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
                minLength={8}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrengthBar password={password} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="station">Station</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="station"
                  placeholder="Central Station"
                  className="pl-9 clay-inset"
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+231 XXX XXX"
                  className="pl-9 clay-inset"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={isSubmitting}>
              <SelectTrigger className="clay-inset">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system_administrator">System Administrator</SelectItem>
                <SelectItem value="national_commissioner">National Commissioner</SelectItem>
                <SelectItem value="regional_commander">Regional Commander</SelectItem>
                <SelectItem value="traffic_commander">Traffic Commander</SelectItem>
                <SelectItem value="police_supervisor">Police Supervisor</SelectItem>
                <SelectItem value="traffic_officer">Traffic Officer</SelectItem>
                <SelectItem value="investigator">Investigator</SelectItem>
                <SelectItem value="evidence_officer">Evidence Officer</SelectItem>
                <SelectItem value="system_auditor">System Auditor</SelectItem>
                <SelectItem value="citizen">Citizen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
              <BadgeAlert className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-3 pb-8">
          <Button
            type="submit"
            className="w-full clay-btn rounded-xl h-11"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            Create Account
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            By signing up, you agree to the terms of service and privacy policy.
          </p>
        </CardFooter>
      </form>
    );
  };

  // Only show tabs for signin/signup modes
  const showTabs = mode === "signin" || mode === "signup";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Header */}
      <nav className="sticky top-0 z-50 clay-card bg-card/80 backdrop-blur-xl border-b border-border/50 mx-0 rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">TrafficWatch AI</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>
        </div>
      </nav>

      {/* Auth Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="w-full max-w-[420px] clay-card border-border/50 !rounded-2xl pb-0 overflow-hidden">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                  {mode === "forgot" ? (
                    <KeyRound className="w-7 h-7 text-primary-foreground" />
                  ) : mode === "mfa-setup" ? (
                    <Smartphone className="w-7 h-7 text-primary-foreground" />
                  ) : (
                    <Shield className="w-7 h-7 text-primary-foreground" />
                  )}
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">
                {mode === "forgot" && "Reset Password"}
                {mode === "mfa-setup" && "Set Up Two-Factor Auth"}
                {mode === "signin" && "Welcome Back"}
                {mode === "signup" && "Join TrafficWatch"}
              </CardTitle>
              <CardDescription>
                {mode === "forgot" && "We'll send you a password reset link"}
                {mode === "mfa-setup" && "Scan the QR code with your authenticator app"}
                {mode === "signin" && "Sign in to access the traffic management platform"}
                {mode === "signup" && "Create an account to start monitoring traffic"}
              </CardDescription>
            </CardHeader>

            {/* Tabs - only for signin/signup */}
            {showTabs && (
              <div className="flex mx-6 mb-6 bg-secondary rounded-xl p-1">
                <button
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    mode === "signin"
                      ? "bg-card clay-card shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => { setMode("signin"); setError(null); }}
                >
                  <LogIn className="w-4 h-4 inline mr-1.5" />
                  Sign In
                </button>
                <button
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    mode === "signup"
                      ? "bg-card clay-card shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => { setMode("signup"); setError(null); }}
                >
                  <UserPlus className="w-4 h-4 inline mr-1.5" />
                  Sign Up
                </button>
              </div>
            )}

            {renderForm()}

            <div className="py-3 px-6 text-[11px] text-center text-muted-foreground bg-secondary/50 border-t border-border/50">
              Secured system — Authorized personnel only
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
