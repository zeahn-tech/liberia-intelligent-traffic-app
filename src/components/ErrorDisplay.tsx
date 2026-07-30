// ============================================================
// TrafficWatch AI — ErrorDisplay Components
//
// Reusable components for displaying errors, offline states,
// empty states, loading states, and permission-denied states
// consistently across the application.
// ============================================================

import { type ReactNode } from "react";
import {
  AlertTriangle,
  WifiOff,
  ShieldOff,
  SearchX,
  Inbox,
  FileWarning,
  RefreshCw,
  Home,
  ArrowLeft,
  Loader2,
  CloudOff,
  Clock,
  Upload,
  AlertOctagon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { ErrorCodes, getRecoveryActions, type ErrorCode } from "@/lib/error-handler";

// ═══════════════════════════════════════════════════════════
// ERROR BANNER — Inline error bar (sticky, top of content)
// ═══════════════════════════════════════════════════════════

interface ErrorBannerProps {
  title?: string;
  message: string;
  variant?: "error" | "warning" | "info" | "success";
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorBanner({
  title,
  message,
  variant = "error",
  action,
  dismissible = false,
  onDismiss,
  className,
}: ErrorBannerProps) {
  const variantStyles = {
    error: "bg-destructive/10 border-destructive/20 text-destructive",
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-600",
    info: "bg-blue-500/10 border-blue-500/20 text-blue-600",
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
  };

  const icons = {
    error: AlertTriangle,
    warning: AlertOctagon,
    info: AlertTriangle,
    success: AlertTriangle,
  };

  const Icon = icons[variant];

  return (
    <Alert
      className={cn(
        "rounded-xl border backdrop-blur-sm animate-in slide-in-from-top-1 duration-300",
        variantStyles[variant],
        className
      )}
    >
      <Icon className="size-4 !text-current" />
      <AlertTitle className="text-sm font-semibold">
        {title || (variant === "error" ? "Error" : variant === "warning" ? "Warning" : "Notice")}
      </AlertTitle>
      <AlertDescription className="text-xs mt-0.5">
        <div className="flex items-start justify-between gap-4">
          <p className="flex-1">{message}</p>
          <div className="flex items-center gap-2 shrink-0">
            {action && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs rounded-lg"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )}
            {dismissible && onDismiss && (
              <button
                onClick={onDismiss}
                className="text-current/60 hover:text-current transition-colors"
                aria-label="Dismiss error"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// ═══════════════════════════════════════════════════════════
// INLINE ERROR — Small error text for forms/fields
// ═══════════════════════════════════════════════════════════

interface InlineErrorProps {
  message?: string;
  className?: string;
}

export function InlineError({ message, className }: InlineErrorProps) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className={cn(
        "text-xs text-destructive flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-200",
        className
      )}
    >
      <AlertTriangle className="w-3 h-3 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

// ═══════════════════════════════════════════════════════════
// OFFLINE BANNER — Persistent offline indicator
// ═══════════════════════════════════════════════════════════

interface OfflineBannerProps {
  isOnline: boolean;
  wasOffline?: boolean;
  className?: string;
}

export function OfflineBanner({ isOnline, wasOffline, className }: OfflineBannerProps) {
  if (isOnline && !wasOffline) return null;

  return (
    <Alert
      className={cn(
        "rounded-xl border backdrop-blur-sm transition-all duration-500",
        isOnline
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
          : "bg-amber-500/10 border-amber-500/20 text-amber-600",
        className
      )}
    >
      <WifiOff className="size-4 !text-current" />
      <AlertTitle className="text-sm font-semibold">
        {isOnline ? "Back Online" : "You're Offline"}
      </AlertTitle>
      <AlertDescription className="text-xs mt-0.5">
        {isOnline
          ? "Your connection has been restored. Any pending changes are being synchronized."
          : "You are currently offline. Your data will be saved locally and synced when connectivity returns."}
      </AlertDescription>
    </Alert>
  );
}

// ═══════════════════════════════════════════════════════════
// OFFLINE PAGE — Full-page offline state
// ═══════════════════════════════════════════════════════════

interface OfflinePageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function OfflinePage({
  title = "You're Offline",
  message = "Some features are unavailable while you're offline. Any data you enter will be saved and synced automatically when you reconnect.",
  onRetry,
}: OfflinePageProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
        <CloudOff className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" className="rounded-xl" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Retry
        </Button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// EMPTY STATE — When no data is available
// ═══════════════════════════════════════════════════════════

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
        {icon || <Inbox className="w-7 h-7 text-muted-foreground/60" />}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <Button variant="outline" className="rounded-xl" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// NOT FOUND PAGE — 404 / Resource not found
// ═══════════════════════════════════════════════════════════

interface NotFoundStateProps {
  title?: string;
  description?: string;
  onGoBack?: () => void;
  onGoHome?: () => void;
}

export function NotFoundState({
  title = "Not Found",
  description = "The resource you're looking for could not be found. It may have been removed or you may not have access to it.",
  onGoBack,
  onGoHome,
}: NotFoundStateProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <SearchX className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      <div className="flex gap-3">
        {onGoBack && (
          <Button variant="outline" className="rounded-xl" onClick={onGoBack}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Go Back
          </Button>
        )}
        {onGoHome && (
          <Button variant="outline" className="rounded-xl" onClick={onGoHome}>
            <Home className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PERMISSION DENIED — Full-page access denied
// ═══════════════════════════════════════════════════════════

interface PermissionDeniedProps {
  title?: string;
  description?: string;
  onGoHome?: () => void;
  onSignOut?: () => void;
}

export function PermissionDenied({
  title = "Access Denied",
  description = "You do not have the required permissions to access this page. If you believe this is an error, please contact your supervisor or system administrator.",
  onGoHome,
  onSignOut,
}: PermissionDeniedProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <ShieldOff className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      <div className="flex gap-3">
        {onGoHome && (
          <Button variant="outline" className="rounded-xl" onClick={onGoHome}>
            <Home className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
        )}
        {onSignOut && (
          <Button variant="ghost" className="rounded-xl" onClick={onSignOut}>
            Sign Out
          </Button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ERROR PAGE — Full-page error with recovery actions
// ═══════════════════════════════════════════════════════════

interface ErrorPageProps {
  title?: string;
  message?: string;
  errorCode?: ErrorCode;
  onRetry?: () => void;
  onGoHome?: () => void;
  onSignOut?: () => void;
  /** Show error details for support (hidden by default) */
  error?: unknown;
  icon?: ReactNode;
}

export function ErrorPage({
  title,
  message,
  errorCode = ErrorCodes.UNKNOWN,
  onRetry,
  onGoHome,
  onSignOut,
  error,
  icon,
}: ErrorPageProps) {
  const recoveryActions = getRecoveryActions(errorCode, {
    onRetry,
    onGoBack: () => window.history.back(),
    onSignOut,
  });

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        {icon || <AlertTriangle className="w-8 h-8 text-destructive" />}
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">
        {title || "Something Went Wrong"}
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {message || "An unexpected error occurred. Please try again."}
      </p>

      {error != null ? (
        <details className="group bg-secondary/30 rounded-xl p-3 cursor-pointer max-w-md w-full mb-6 text-left">
          <summary className="text-xs font-medium text-muted-foreground group-open:text-foreground transition-colors">
            Technical Details
          </summary>
          <pre className="mt-2 text-[10px] leading-relaxed text-muted-foreground/80 max-h-32 overflow-auto whitespace-pre-wrap break-all font-mono bg-background/50 rounded-lg p-2">
            {error instanceof Error
              ? `${error.name}: ${error.message}`
              : typeof error === "string"
                ? error
                : JSON.stringify(error, null, 2)}
          </pre>
        </details>
      ) : null}

      <div className="flex flex-wrap gap-3 justify-center">
        {recoveryActions.map((action, i) => (
          <Button
            key={i}
            variant={action.variant || "default"}
            className="rounded-xl"
            onClick={action.action}
          >
            {action.label}
          </Button>
        ))}
        {onGoHome && (
          <Button variant="outline" className="rounded-xl" onClick={onGoHome}>
            <Home className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LOADING STATE — Full-page or section loading
// ═══════════════════════════════════════════════════════════

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "default" | "lg";
  fullPage?: boolean;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  size = "default",
  fullPage = false,
  className,
}: LoadingStateProps) {
  const sizeMap = {
    sm: { spinner: "w-4 h-4", text: "text-xs", gap: "gap-2" },
    default: { spinner: "w-6 h-6", text: "text-sm", gap: "gap-3" },
    lg: { spinner: "w-8 h-8", text: "text-base", gap: "gap-4" },
  };

  const s = sizeMap[size];

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        s.gap,
        fullPage ? "min-h-[60vh]" : "py-12",
        className
      )}
      role="status"
      aria-label={message}
    >
      <Spinner className={s.spinner} />
      <p className={cn("text-muted-foreground animate-pulse", s.text)}>
        {message}
      </p>
    </div>
  );

  if (fullPage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        {content}
      </main>
    );
  }

  return content;
}

// ═══════════════════════════════════════════════════════════
// SLOW NETWORK BANNER — Shown during slow connections
// ═══════════════════════════════════════════════════════════

interface SlowNetworkBannerProps {
  visible: boolean;
  className?: string;
}

export function SlowNetworkBanner({ visible, className }: SlowNetworkBannerProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 text-xs animate-in slide-in-from-top-1 duration-300",
        className
      )}
    >
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <p>
        Your connection seems slow. Operations may take longer than usual.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// RETRY SECTION — Error with prominent retry button
// ═══════════════════════════════════════════════════════════

interface RetrySectionProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  isLoading?: boolean;
  className?: string;
}

export function RetrySection({
  title = "Failed to Load",
  message = "Could not load this content. Please try again.",
  onRetry,
  isLoading = false,
  className,
}: RetrySectionProps) {
  return (
    <Card className={cn("border-destructive/20", className)}>
      <CardContent className="p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto">
          <FileWarning className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{message}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={onRetry}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Try Again
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// UPLOAD ERROR — For file upload failures
// ═══════════════════════════════════════════════════════════

interface UploadErrorProps {
  message?: string;
  fileName?: string;
  fileSize?: string;
  maxSize?: string;
  onRetry?: () => void;
  onCancel?: () => void;
}

export function UploadError({
  message = "Upload Failed",
  fileName,
  fileSize,
  maxSize,
  onRetry,
  onCancel,
}: UploadErrorProps) {
  return (
    <Card className="border-destructive/20">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
          <Upload className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{message}</p>
          {fileName && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{fileName}</p>
          )}
          {(fileSize || maxSize) && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              {fileSize && `File size: ${fileSize}`}
              {fileSize && maxSize && " · "}
              {maxSize && `Max allowed: ${maxSize}`}
            </p>
          )}
          <div className="flex gap-2 mt-2">
            {onRetry && (
              <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg" onClick={onRetry}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
            {onCancel && (
              <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// SESSION EXPIRED — Card prompting re-authentication
// ═══════════════════════════════════════════════════════════

interface SessionExpiredProps {
  onSignIn: () => void;
  message?: string;
}

export function SessionExpiredCard({
  onSignIn,
  message = "Your session has expired. Please sign in again to continue working.",
}: SessionExpiredProps) {
  return (
    <Card className="border-amber-500/20 max-w-sm mx-auto">
      <CardContent className="p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Session Expired</h3>
          <p className="text-xs text-muted-foreground mt-1">{message}</p>
        </div>
        <Button className="rounded-xl" onClick={onSignIn}>
          Sign In Again
        </Button>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// ERROR TOAST — Quick toast error display
// ═══════════════════════════════════════════════════════════

// eslint-disable-next-line react-refresh/only-export-components
export function showApiErrorToast(error: unknown, defaultTitle?: string) {
  // Dynamic import to avoid circular deps
  import("@/lib/error-handler").then(({ showErrorToast }) => {
    showErrorToast(error, { title: defaultTitle });
  });
}
