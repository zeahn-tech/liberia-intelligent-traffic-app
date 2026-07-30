import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from "react";
import { supabase } from "@/supabase/client";
import {
  getUser,
  signInWithEmail,
  signUpWithEmail,
  signOut as supabaseSignOut,
  resetPassword as supabaseResetPassword,
  updatePassword as supabaseUpdatePassword,
  enrollMFA as supabaseEnrollMFA,
  verifyMFAChallenge as supabaseVerifyMFAChallenge,
  disableMFA as supabaseDisableMFA,
  getMFAMethods as supabaseGetMFAMethods,
  generateRecoveryCodes as supabaseGenerateRecoveryCodes,
  getActiveSessions as supabaseGetActiveSessions,
  revokeSession as supabaseRevokeSession,
  revokeAllOtherSessions as supabaseRevokeAllOtherSessions,
  getAccountStatus as supabaseGetAccountStatus,
  getAuthAuditEvents,
  checkPasswordStrength,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  getProfile,
  type AuthUser,
  type UserSession,
  type MFAMethod,
  type AccountStatus,
  type AuthAuditEvent,
  type PasswordStrength,
} from "@/supabase/auth";
import type { UserRole } from "@/lib/permissions";

// ─── Types ─────────────────────────────────────────────

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;

  // Core auth
  signIn: (email: string, password: string) => Promise<void>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  signUp: (email: string, password: string, profile: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;

  // Password management
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  checkPasswordStrength: (password: string) => PasswordStrength;

  // MFA / 2FA
  mfaMethods: MFAMethod[];
  isMFAEnabled: boolean;
  enrollMFA: () => Promise<{ qrCode: string; secret: string; methodId: string }>;
  verifyMFAChallenge: (factorId: string, code: string) => Promise<boolean>;
  disableMFA: (factorId: string) => Promise<void>;
  getMFAMethods: () => Promise<MFAMethod[]>;
  generateRecoveryCodes: () => Promise<string[]>;
  refreshMFAMethods: () => Promise<void>;

  // Session management
  sessions: UserSession[];
  getActiveSessions: () => Promise<UserSession[]>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllOtherSessions: () => Promise<void>;
  refreshSessions: () => Promise<void>;

  // Account status
  accountStatus: AccountStatus | null;
  getAccountStatus: () => Promise<AccountStatus | null>;
  authAuditEvents: AuthAuditEvent[];
  getAuthAuditEvents: (limit?: number) => Promise<AuthAuditEvent[]>;
  refreshAccountStatus: () => Promise<void>;

  // Role (backward-compatible)
  hasRole: (minimumRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ──────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mfaMethods, setMFAMethods] = useState<MFAMethod[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [authAuditEvents, setAuthAuditEvents] = useState<AuthAuditEvent[]>([]);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  }, []);

  const refreshMFAMethods = useCallback(async () => {
    try {
      const methods = await supabaseGetMFAMethods();
      setMFAMethods(methods);
    } catch {
      // Silent
    }
  }, []);

  const refreshSessions = useCallback(async () => {
    try {
      const activeSessions = await supabaseGetActiveSessions();
      setSessions(activeSessions);
    } catch {
      // Silent
    }
  }, []);

  const refreshAccountStatus = useCallback(async () => {
    try {
      const status = await supabaseGetAccountStatus();
      setAccountStatus(status);
    } catch {
      // Silent
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await refreshUser();
        await Promise.all([
          refreshMFAMethods(),
          refreshSessions(),
          refreshAccountStatus(),
        ]);
      }
      setIsLoading(false);
    };

    init();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await refreshUser();
          await Promise.all([
            refreshMFAMethods(),
            refreshSessions(),
            refreshAccountStatus(),
          ]);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setMFAMethods([]);
          setSessions([]);
          setAccountStatus(null);
          setAuthAuditEvents([]);
        } else if (event === "TOKEN_REFRESHED") {
          await refreshUser();
        } else if (event === "USER_UPDATED") {
          await refreshUser();
        }
        setIsLoading(false);
      }
    );

    // Check session expiry periodically (every 5 minutes)
    const interval = window.setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
        setMFAMethods([]);
        setSessions([]);
        setAccountStatus(null);
      }
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [refreshUser, refreshMFAMethods, refreshSessions, refreshAccountStatus]);

  // ─── Core Auth ─────────────────────────────────────

  const signIn = async (email: string, password: string) => {
    const data = await signInWithEmail(email, password);
    if (data.user) {
      await refreshUser();
      await Promise.all([
        refreshMFAMethods(),
        refreshSessions(),
        refreshAccountStatus(),
      ]);
    }
  };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signUp = async (email: string, password: string, profile: any) => {
    const data = await signUpWithEmail(email, password, profile);
    if (data.user) {
      await refreshUser();
      await Promise.all([
        refreshMFAMethods(),
        refreshSessions(),
        refreshAccountStatus(),
      ]);
    }
  };

  const handleSignOut = async () => {
    await supabaseSignOut();
    setUser(null);
    setMFAMethods([]);
    setSessions([]);
    setAccountStatus(null);
    setAuthAuditEvents([]);
  };

  // ─── Password Management ────────────────────────────

  const resetPassword = async (email: string) => {
    await supabaseResetPassword(email);
  };

  const updatePassword = async (newPassword: string) => {
    await supabaseUpdatePassword(newPassword);
    await refreshUser();
  };

  // ─── MFA ────────────────────────────────────────────

  const enrollMFA = async () => {
    const result = await supabaseEnrollMFA();
    await refreshMFAMethods();
    return result;
  };

  const verifyMFAChallenge = async (factorId: string, code: string) => {
    const result = await supabaseVerifyMFAChallenge(factorId, code);
    if (result) {
      await refreshMFAMethods();
      await refreshAccountStatus();
    }
    return result;
  };

  const disableMFA = async (factorId: string) => {
    await supabaseDisableMFA(factorId);
    await refreshMFAMethods();
    await refreshAccountStatus();
  };

  const getMFAMethods = async () => {
    const methods = await supabaseGetMFAMethods();
    setMFAMethods(methods);
    return methods;
  };

  const generateRecoveryCodes = async () => {
    return await supabaseGenerateRecoveryCodes();
  };

  // ─── Sessions ───────────────────────────────────────

  const getActiveSessions = async () => {
    const s = await supabaseGetActiveSessions();
    setSessions(s);
    return s;
  };

  const revokeSession = async (sessionId: string) => {
    await supabaseRevokeSession(sessionId);
    await refreshSessions();
  };

  const revokeAllOtherSessions = async () => {
    await supabaseRevokeAllOtherSessions();
    await refreshSessions();
  };

  // ─── Account Status ─────────────────────────────────

  const getAccountStatus = async () => {
    const status = await supabaseGetAccountStatus();
    setAccountStatus(status);
    return status;
  };

  const getAuthAuditEventsFn = async (limit: number = 20) => {
    const userData = await getUser();
    if (!userData) return [];
    const events = await getAuthAuditEvents(userData.id, limit);
    setAuthAuditEvents(events);
    return events;
  };

  // ─── Role (backward-compatible) ─────────────────────

  const hasRole = (minimumRole: UserRole): boolean => {
    if (!user?.profile?.role) return false;
    const ROLE_LEVELS: Record<string, number> = {
      citizen: 1,
      traffic_officer: 2,
      evidence_officer: 2,
      investigator: 3,
      police_supervisor: 4,
      traffic_commander: 5,
      regional_commander: 6,
      national_commissioner: 7,
      system_auditor: 7,
      system_administrator: 10,
    };
    const userLevel = ROLE_LEVELS[user.profile.role] || 0;
    const minLevel = ROLE_LEVELS[minimumRole] || 0;
    return userLevel >= minLevel;
  };

  const isMFAEnabled = mfaMethods.some((m) => m.isVerified);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated: !!user,
        user,
        signIn,
        signUp,
        signOut: handleSignOut,
        refreshUser,
        resetPassword,
        updatePassword,
        checkPasswordStrength,
        mfaMethods,
        isMFAEnabled,
        enrollMFA,
        verifyMFAChallenge,
        disableMFA,
        getMFAMethods,
        generateRecoveryCodes,
        refreshMFAMethods,
        sessions,
        getActiveSessions,
        revokeSession,
        revokeAllOtherSessions,
        refreshSessions,
        accountStatus,
        getAccountStatus,
        authAuditEvents,
        getAuthAuditEvents: getAuthAuditEventsFn,
        refreshAccountStatus,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
