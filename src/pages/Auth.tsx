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
} from "lucide-react";
import { motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

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

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading, isAuthenticated, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [station, setStation] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("officer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [isLoading, isAuthenticated, navigate, redirect]);

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
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
      navigate(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  <Shield className="w-7 h-7 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">
                {mode === "signin" ? "Welcome Back" : "Join TrafficWatch"}
              </CardTitle>
              <CardDescription>
                {mode === "signin"
                  ? "Sign in to access the traffic management platform"
                  : "Create an account to start monitoring traffic"}
              </CardDescription>
            </CardHeader>

            {/* Tabs */}
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

            {mode === "signin" ? (
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
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-9 clay-inset"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                </CardContent>
                <CardFooter className="flex-col gap-3 pb-8">
                  <Button
                    type="submit"
                    className="w-full clay-btn rounded-xl h-11"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
                    ) : (
                      <><LogIn className="w-4 h-4 mr-2" /> Sign In</>
                    )}
                  </Button>
                </CardFooter>
              </form>
            ) : (
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
                        type="password"
                        placeholder="Min. 6 characters"
                        className="pl-9 clay-inset"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        required
                        minLength={6}
                      />
                    </div>
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
                        <SelectItem value="officer">Traffic Officer</SelectItem>
                        <SelectItem value="investigator">Investigator</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
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
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
                    ) : (
                      <><UserPlus className="w-4 h-4 mr-2" /> Create Account</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    By signing up, you agree to the terms of service and privacy policy.
                  </p>
                </CardFooter>
              </form>
            )}

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
