import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import type { Permission, UserRole } from "@/lib/permissions";
import { roleHasPermission, hasMinimumRole, ROLE_LABELS, getRoleColor } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RequireAuthProps {
  children: ReactNode;
  /** Optional: require a specific permission to access this route */
  requirePermission?: Permission;
  /** Optional: require a minimum role level */
  requireRole?: UserRole;
  /** Optional: fallback redirect when unauthorized (default: /) */
  fallbackPath?: string;
  /** Optional: render a forbidden page instead of redirecting */
  showForbidden?: boolean;
}

export function RequireAuth({
  children,
  requirePermission,
  requireRole,
  fallbackPath = "/",
  showForbidden = false,
}: RequireAuthProps) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground animate-pulse">Verifying session...</p>
        </div>
      </main>
    );
  }

  // Not authenticated — redirect to auth with return path
  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  const userRole = user?.profile?.role as UserRole | undefined;

  // Check permission
  if (requirePermission && !roleHasPermission(userRole, requirePermission)) {
    if (showForbidden) {
      return <ForbiddenPage permission={requirePermission} role={userRole} fallbackPath={fallbackPath} />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Check role
  if (requireRole && !hasMinimumRole(userRole, requireRole)) {
    if (showForbidden) {
      return <ForbiddenPage requiredRole={requireRole} role={userRole} fallbackPath={fallbackPath} />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}

// ─── Forbidden Page Component ───────────────────────────

function ForbiddenPage({
  permission,
  requiredRole,
  role,
  fallbackPath,
}: {
  permission?: Permission;
  requiredRole?: UserRole;
  role?: UserRole;
  fallbackPath: string;
}) {
  const { signOut } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="clay-card border-border/50 !rounded-2xl max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Access Denied</h1>
            <p className="text-sm text-muted-foreground mt-2">
              You do not have the required permissions to access this page.
            </p>
          </div>
          <div className="bg-secondary/30 rounded-xl p-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Role</span>
              <span className={`font-medium px-2 py-0.5 rounded-full ${getRoleColor(role || "citizen")}`}>
                {role ? ROLE_LABELS[role] || role : "Unknown"}
              </span>
            </div>
            {permission && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Required Permission</span>
                <span className="font-medium">{permission.replace(/_/g, " ")}</span>
              </div>
            )}
            {requiredRole && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum Role</span>
                <span className="font-medium">{ROLE_LABELS[requiredRole] || requiredRole}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => window.location.href = fallbackPath}
            >
              Go Back
            </Button>
            <Button
              variant="ghost"
              className="rounded-xl text-muted-foreground"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
