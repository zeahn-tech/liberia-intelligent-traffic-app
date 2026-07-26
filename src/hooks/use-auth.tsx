import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import { supabase } from "@/supabase/client";
import {
  getUser,
  signInWithEmail,
  signUpWithEmail,
  signOut as supabaseSignOut,
  getProfile,
  type AuthUser,
  type UserRole,
} from "@/supabase/auth";

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profile: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (minimumRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  const refreshUser = async () => {
    try {
      const currentUser = await getUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    // Check initial session
    const init = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await refreshUser();
      }
      setIsLoading(false);
    };

    init();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await refreshUser();
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await signInWithEmail(email, password);
    if (data.user) {
      await refreshUser();
    }
  };

  const signUp = async (email: string, password: string, profile: any) => {
    const data = await signUpWithEmail(email, password, profile);
    if (data.user) {
      await refreshUser();
    }
  };

  const handleSignOut = async () => {
    await supabaseSignOut();
    setUser(null);
  };

  const hasRole = (minimumRole: UserRole): boolean => {
    if (!user?.profile?.role) return false;
    const hierarchy: Record<UserRole, number> = {
      officer: 1,
      investigator: 2,
      supervisor: 3,
      admin: 4,
    };
    return (hierarchy[user.profile.role] || 0) >= (hierarchy[minimumRole] || 0);
  };

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
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
