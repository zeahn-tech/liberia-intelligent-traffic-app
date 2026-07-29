// ============================================================
// TrafficWatch AI — Error Handler
//
// Central error handling system providing:
// - User-friendly error messages for every error type
// - Recovery action suggestions
// - Error severity classification
// - Error logging abstraction
// ============================================================

import { toast } from "sonner";

// ─── Error Severity ─────────────────────────────────────

export type ErrorSeverity = "info" | "warning" | "error" | "critical";

export interface RecoveryAction {
  label: string;
  action: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
}

export interface UserFacingError {
  title: string;
  message: string;
  severity: ErrorSeverity;
  recoveryActions?: RecoveryAction[];
  /** Whether this error should be logged to the console */
  log?: boolean;
}

// ─── Error Code Registry ────────────────────────────────

export const ErrorCodes = {
  // Network & Connectivity
  OFFLINE: "OFFLINE",
  SLOW_NETWORK: "SLOW_NETWORK",
  NETWORK_TIMEOUT: "NETWORK_TIMEOUT",
  NETWORK_ERROR: "NETWORK_ERROR",

  // Authentication
  SESSION_EXPIRED: "SESSION_EXPIRED",
  NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_DISABLED: "ACCOUNT_DISABLED",
  MFA_REQUIRED: "MFA_REQUIRED",
  PASSWORD_RESET_REQUIRED: "PASSWORD_RESET_REQUIRED",

  // Authorization
  PERMISSION_DENIED: "PERMISSION_DENIED",
  INSUFFICIENT_ROLE: "INSUFFICIENT_ROLE",
  SCOPE_RESTRICTED: "SCOPE_RESTRICTED",

  // Data & Queries
  NOT_FOUND: "NOT_FOUND",
  DUPLICATE: "DUPLICATE",
  FK_VIOLATION: "FK_VIOLATION",
  INVALID_INPUT: "INVALID_INPUT",
  QUERY_FAILED: "QUERY_FAILED",
  TABLE_NOT_FOUND: "TABLE_NOT_FOUND",

  // File & Media
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  UPLOAD_FAILED: "UPLOAD_FAILED",
  DOWNLOAD_FAILED: "DOWNLOAD_FAILED",
  UNSUPPORTED_MEDIA: "UNSUPPORTED_MEDIA",
  VIRUS_DETECTED: "VIRUS_DETECTED",
  MEDIA_PROCESSING_FAILED: "MEDIA_PROCESSING_FAILED",

  // AI & Analysis
  AI_ANALYSIS_FAILED: "AI_ANALYSIS_FAILED",
  AI_SERVICE_UNAVAILABLE: "AI_SERVICE_UNAVAILABLE",
  ANPR_FAILED: "ANPR_FAILED",
  ANALYSIS_TIMEOUT: "ANALYSIS_TIMEOUT",

  // Server & API
  RATE_LIMITED: "RATE_LIMITED",
  SERVER_ERROR: "SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  API_ERROR: "API_ERROR",

  // Sync & Offline
  SYNC_CONFLICT: "SYNC_CONFLICT",
  SYNC_FAILED: "SYNC_FAILED",
  OFFLINE_DATA_CORRUPTED: "OFFLINE_DATA_CORRUPTED",

  // General
  UNKNOWN: "UNKNOWN",
  VALIDATION: "VALIDATION",
  TIMEOUT: "TIMEOUT",
  CANCELLED: "CANCELLED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ─── Error Message Registry ─────────────────────────────

const ERROR_MESSAGES: Record<ErrorCode, { title: string; message: string; severity: ErrorSeverity }> = {
  // Network & Connectivity
  [ErrorCodes.OFFLINE]: {
    title: "You're Offline",
    message: "Your device is currently offline. Some features may be unavailable. Don't worry — any data you enter will be saved and synced when you reconnect.",
    severity: "warning",
  },
  [ErrorCodes.SLOW_NETWORK]: {
    title: "Slow Connection",
    message: "Your network connection appears to be slow. Operations may take longer than usual.",
    severity: "warning",
  },
  [ErrorCodes.NETWORK_TIMEOUT]: {
    title: "Connection Timed Out",
    message: "The request took too long to complete. This could be due to a slow or unstable connection. Please try again.",
    severity: "error",
  },
  [ErrorCodes.NETWORK_ERROR]: {
    title: "Network Error",
    message: "A network error occurred. Please check your internet connection and try again.",
    severity: "error",
  },

  // Authentication
  [ErrorCodes.SESSION_EXPIRED]: {
    title: "Session Expired",
    message: "Your session has expired. Please sign in again to continue.",
    severity: "warning",
  },
  [ErrorCodes.NOT_AUTHENTICATED]: {
    title: "Not Signed In",
    message: "You need to sign in to access this feature.",
    severity: "info",
  },
  [ErrorCodes.INVALID_CREDENTIALS]: {
    title: "Invalid Credentials",
    message: "The email or password you entered is incorrect. Please try again.",
    severity: "error",
  },
  [ErrorCodes.ACCOUNT_DISABLED]: {
    title: "Account Disabled",
    message: "Your account has been disabled. Please contact your system administrator to restore access.",
    severity: "error",
  },
  [ErrorCodes.MFA_REQUIRED]: {
    title: "Additional Verification Required",
    message: "Please complete the two-factor authentication to sign in.",
    severity: "info",
  },
  [ErrorCodes.PASSWORD_RESET_REQUIRED]: {
    title: "Password Reset Required",
    message: "You need to reset your password before continuing. This may be required for new accounts or security policy updates.",
    severity: "warning",
  },

  // Authorization
  [ErrorCodes.PERMISSION_DENIED]: {
    title: "Permission Denied",
    message: "You do not have permission to perform this action. If you believe this is an error, contact your supervisor or system administrator.",
    severity: "error",
  },
  [ErrorCodes.INSUFFICIENT_ROLE]: {
    title: "Insufficient Access Level",
    message: "Your current role does not have sufficient privileges to access this feature.",
    severity: "error",
  },
  [ErrorCodes.SCOPE_RESTRICTED]: {
    title: "Access Restricted",
    message: "Your access is limited to certain regions or jurisdictions. You cannot view records outside your authorized scope.",
    severity: "warning",
  },

  // Data & Queries
  [ErrorCodes.NOT_FOUND]: {
    title: "Not Found",
    message: "The requested resource could not be found. It may have been removed or you may not have access to it.",
    severity: "info",
  },
  [ErrorCodes.DUPLICATE]: {
    title: "Duplicate Record",
    message: "A record with the same information already exists. Please check for duplicates before creating a new one.",
    severity: "error",
  },
  [ErrorCodes.FK_VIOLATION]: {
    title: "Referenced Record Not Found",
    message: "The operation could not be completed because a related record was not found. Please verify your selection.",
    severity: "error",
  },
  [ErrorCodes.INVALID_INPUT]: {
    title: "Invalid Input",
    message: "Some of the information provided is not in the correct format. Please check your entries and try again.",
    severity: "error",
  },
  [ErrorCodes.QUERY_FAILED]: {
    title: "Data Retrieval Failed",
    message: "Could not retrieve data from the server. Please try again or refresh the page.",
    severity: "error",
  },
  [ErrorCodes.TABLE_NOT_FOUND]: {
    title: "Configuration Error",
    message: "A system configuration error occurred. Please contact your system administrator.",
    severity: "critical",
  },

  // File & Media
  [ErrorCodes.FILE_TOO_LARGE]: {
    title: "File Too Large",
    message: "The selected file exceeds the maximum allowed size. Please choose a smaller file or compress it before uploading.",
    severity: "error",
  },
  [ErrorCodes.INVALID_FILE_TYPE]: {
    title: "Invalid File Type",
    message: "The selected file type is not supported. Please choose a supported file format.",
    severity: "error",
  },
  [ErrorCodes.UPLOAD_FAILED]: {
    title: "Upload Failed",
    message: "The file could not be uploaded. This could be due to a network issue or server error. Please try again.",
    severity: "error",
  },
  [ErrorCodes.DOWNLOAD_FAILED]: {
    title: "Download Failed",
    message: "The file could not be downloaded. Please check your connection and try again.",
    severity: "error",
  },
  [ErrorCodes.UNSUPPORTED_MEDIA]: {
    title: "Unsupported Media",
    message: "This media format is not supported for preview. You may still be able to download the original file.",
    severity: "info",
  },
  [ErrorCodes.VIRUS_DETECTED]: {
    title: "Security Alert",
    message: "The file did not pass security scanning. Please choose a different file.",
    severity: "critical",
  },
  [ErrorCodes.MEDIA_PROCESSING_FAILED]: {
    title: "Media Processing Failed",
    message: "The media file could not be processed. It may be corrupted or in an unsupported format.",
    severity: "error",
  },

  // AI & Analysis
  [ErrorCodes.AI_ANALYSIS_FAILED]: {
    title: "AI Analysis Failed",
    message: "The AI analysis could not be completed. This might be due to poor image quality, unclear content, or a temporary service issue. Please try again with clearer media.",
    severity: "error",
  },
  [ErrorCodes.AI_SERVICE_UNAVAILABLE]: {
    title: "AI Service Unavailable",
    message: "The AI analysis service is currently unavailable. Please try again later. Your media has been saved and can be analyzed when the service is restored.",
    severity: "warning",
  },
  [ErrorCodes.ANPR_FAILED]: {
    title: "License Plate Recognition Failed",
    message: "The system could not read the license plate from the image. This may be due to the plate being obscured, damaged, or the image quality being insufficient.",
    severity: "warning",
  },
  [ErrorCodes.ANALYSIS_TIMEOUT]: {
    title: "Analysis Timed Out",
    message: "The analysis took too long to complete. This is usually due to high demand or complex media. Please try again with smaller or shorter media files.",
    severity: "warning",
  },

  // Server & API
  [ErrorCodes.RATE_LIMITED]: {
    title: "Too Many Requests",
    message: "You have made too many requests in a short period. Please wait a moment before trying again.",
    severity: "warning",
  },
  [ErrorCodes.SERVER_ERROR]: {
    title: "Server Error",
    message: "The server encountered an error processing your request. Our team has been notified. Please try again in a few minutes.",
    severity: "error",
  },
  [ErrorCodes.SERVICE_UNAVAILABLE]: {
    title: "Service Unavailable",
    message: "The service is currently unavailable for maintenance or due to high demand. Please try again later.",
    severity: "warning",
  },
  [ErrorCodes.API_ERROR]: {
    title: "System Error",
    message: "An unexpected error occurred. Please try again. If the problem persists, contact your system administrator.",
    severity: "error",
  },

  // Sync & Offline
  [ErrorCodes.SYNC_CONFLICT]: {
    title: "Sync Conflict",
    message: "Changes were made to this record on another device while you were offline. Please review the changes and resolve any conflicts.",
    severity: "warning",
  },
  [ErrorCodes.SYNC_FAILED]: {
    title: "Synchronization Failed",
    message: "Some records could not be synchronized with the server. Your data is safely stored locally and will be retried automatically.",
    severity: "warning",
  },
  [ErrorCodes.OFFLINE_DATA_CORRUPTED]: {
    title: "Local Data Issue",
    message: "Some locally stored data could not be read. This may happen after a cache clear. Please refresh the page and try again.",
    severity: "error",
  },

  // General
  [ErrorCodes.UNKNOWN]: {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try again. If the problem persists, contact your system administrator.",
    severity: "error",
  },
  [ErrorCodes.VALIDATION]: {
    title: "Validation Error",
    message: "Please check the information you entered and correct any errors before submitting.",
    severity: "error",
  },
  [ErrorCodes.TIMEOUT]: {
    title: "Request Timed Out",
    message: "The operation did not complete in time. Please try again. If this continues, check your connection.",
    severity: "error",
  },
  [ErrorCodes.CANCELLED]: {
    title: "Operation Cancelled",
    message: "The operation was cancelled.",
    severity: "info",
  },
};

// ─── Error Mapping ──────────────────────────────────────

const SUPABASE_ERROR_MAP: Record<string, ErrorCode> = {
  "23505": ErrorCodes.DUPLICATE,
  "23503": ErrorCodes.FK_VIOLATION,
  "23502": ErrorCodes.VALIDATION,
  "42P01": ErrorCodes.TABLE_NOT_FOUND,
  "42703": ErrorCodes.INVALID_INPUT,
  "42501": ErrorCodes.PERMISSION_DENIED,
  "PGRST116": ErrorCodes.NOT_FOUND,
  "PGRST104": ErrorCodes.RATE_LIMITED,
  "22P02": ErrorCodes.INVALID_INPUT,
  "PGRST202": ErrorCodes.QUERY_FAILED,
  "auth/invalid-email": ErrorCodes.INVALID_INPUT,
  "auth/user-not-found": ErrorCodes.NOT_FOUND,
  "auth/wrong-password": ErrorCodes.INVALID_CREDENTIALS,
  "auth/invalid-login-credentials": ErrorCodes.INVALID_CREDENTIALS,
  "auth/email-already-in-use": ErrorCodes.DUPLICATE,
  "auth/too-many-requests": ErrorCodes.RATE_LIMITED,
  "auth/session-expired": ErrorCodes.SESSION_EXPIRED,
};

const HTTP_STATUS_MAP: Record<number, ErrorCode> = {
  400: ErrorCodes.INVALID_INPUT,
  401: ErrorCodes.SESSION_EXPIRED,
  403: ErrorCodes.PERMISSION_DENIED,
  404: ErrorCodes.NOT_FOUND,
  409: ErrorCodes.DUPLICATE,
  413: ErrorCodes.FILE_TOO_LARGE,
  422: ErrorCodes.VALIDATION,
  429: ErrorCodes.RATE_LIMITED,
  500: ErrorCodes.SERVER_ERROR,
  502: ErrorCodes.SERVICE_UNAVAILABLE,
  503: ErrorCodes.SERVICE_UNAVAILABLE,
  504: ErrorCodes.NETWORK_TIMEOUT,
};

/**
 * Map any error to a user-friendly ErrorCode.
 */
export function mapToErrorCode(error: unknown): ErrorCode {
  if (!error) return ErrorCodes.UNKNOWN;

  // Already an ErrorCode string
  if (typeof error === "string" && Object.values(ErrorCodes).includes(error as ErrorCode)) {
    return error as ErrorCode;
  }

  // Supabase/Postgrest error
  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>;

    // Check for Supabase auth error codes
    if (e.code && typeof e.code === "string" && SUPABASE_ERROR_MAP[e.code]) {
      return SUPABASE_ERROR_MAP[e.code];
    }

    // Check HTTP status
    if (e.status && typeof e.status === "number" && HTTP_STATUS_MAP[e.status]) {
      return HTTP_STATUS_MAP[e.status];
    }

    // Check for error message keywords
    if (e.message && typeof e.message === "string") {
      const msg = e.message.toLowerCase();
      if (msg.includes("network") || msg.includes("fetch")) return ErrorCodes.NETWORK_ERROR;
      if (msg.includes("timeout") || msg.includes("timed out")) return ErrorCodes.NETWORK_TIMEOUT;
      if (msg.includes("permission") || msg.includes("not allowed")) return ErrorCodes.PERMISSION_DENIED;
      if (msg.includes("not found")) return ErrorCodes.NOT_FOUND;
      if (msg.includes("duplicate") || msg.includes("already exists")) return ErrorCodes.DUPLICATE;
      if (msg.includes("rate limit") || msg.includes("too many requests")) return ErrorCodes.RATE_LIMITED;
      if (msg.includes("offline") || msg.includes("online")) return ErrorCodes.OFFLINE;
      if (msg.includes("upload")) return ErrorCodes.UPLOAD_FAILED;
      if (msg.includes("file too large")) return ErrorCodes.FILE_TOO_LARGE;
      if (msg.includes("invalid") || msg.includes("validation")) return ErrorCodes.VALIDATION;
      if (msg.includes("session") || msg.includes("expired")) return ErrorCodes.SESSION_EXPIRED;
    }

    // Check name property
    if (e.name === "AuthRetryableFetchError" || e.name === "AuthSessionMissingError") {
      return ErrorCodes.SESSION_EXPIRED;
    }
  }

  // Network offline
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return ErrorCodes.OFFLINE;
  }

  return ErrorCodes.UNKNOWN;
}

/**
 * Get a user-friendly error object from any error.
 */
export function getUserFacingError(error: unknown): UserFacingError {
  const code = mapToErrorCode(error);
  const base = ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCodes.UNKNOWN];
  return { ...base, log: true };
}

/**
 * Get recovery actions for common error conditions.
 */
export function getRecoveryActions(errorCode: ErrorCode, options?: { onSignOut?: () => void; onRetry?: () => void; onGoBack?: () => void }): RecoveryAction[] {
  const actions: RecoveryAction[] = [];

  switch (errorCode) {
    case ErrorCodes.OFFLINE:
      actions.push({
        label: "Retry When Online",
        action: () => options?.onRetry?.() ?? window.location.reload(),
        variant: "outline",
      });
      break;

    case ErrorCodes.SESSION_EXPIRED:
      actions.push({
        label: "Sign In Again",
        action: () => {
          if (options?.onSignOut) {
            options.onSignOut();
          } else {
            window.location.href = "/auth";
          }
        },
        variant: "default",
      });
      break;

    case ErrorCodes.PERMISSION_DENIED:
    case ErrorCodes.INSUFFICIENT_ROLE:
      actions.push({
        label: "Go to Dashboard",
        action: () => { window.location.href = "/dashboard"; },
        variant: "outline",
      });
      break;

    case ErrorCodes.NOT_FOUND:
      actions.push({
        label: "Go Back",
        action: () => options?.onGoBack?.() ?? window.history.back(),
        variant: "outline",
      });
      break;

    case ErrorCodes.NETWORK_ERROR:
    case ErrorCodes.NETWORK_TIMEOUT:
    case ErrorCodes.SERVER_ERROR:
    case ErrorCodes.SERVICE_UNAVAILABLE:
    case ErrorCodes.QUERY_FAILED:
    case ErrorCodes.API_ERROR:
      actions.push({
        label: "Try Again",
        action: () => options?.onRetry?.() ?? window.location.reload(),
        variant: "default",
      });
      break;

    case ErrorCodes.UPLOAD_FAILED:
    case ErrorCodes.DOWNLOAD_FAILED:
    case ErrorCodes.AI_ANALYSIS_FAILED:
    case ErrorCodes.ANALYSIS_TIMEOUT:
      actions.push({
        label: "Try Again",
        action: () => options?.onRetry?.(),
        variant: "default",
      });
      break;

    case ErrorCodes.FILE_TOO_LARGE:
    case ErrorCodes.INVALID_FILE_TYPE:
    case ErrorCodes.UNSUPPORTED_MEDIA:
    case ErrorCodes.INVALID_INPUT:
    case ErrorCodes.VALIDATION:
      actions.push({
        label: "Go Back",
        action: () => options?.onGoBack?.() ?? window.history.back(),
        variant: "outline",
      });
      break;

    case ErrorCodes.RATE_LIMITED:
      actions.push({
        label: "Try Again in a Moment",
        action: () => options?.onRetry?.() ?? window.location.reload(),
        variant: "default",
      });
      break;

    default:
      actions.push({
        label: "Try Again",
        action: () => options?.onRetry?.() ?? window.location.reload(),
        variant: "default",
      });
      actions.push({
        label: "Go to Dashboard",
        action: () => { window.location.href = "/dashboard"; },
        variant: "outline",
      });
  }

  return actions;
}

// ─── Toast Helpers ──────────────────────────────────────

/**
 * Show a user-friendly toast notification for an error.
 */
export function showErrorToast(error: unknown, options?: { title?: string; duration?: number }) {
  const friendly = getUserFacingError(error);
  const title = options?.title || friendly.title;

  switch (friendly.severity) {
    case "critical":
    case "error":
      toast.error(title, {
        description: friendly.message,
        duration: options?.duration || 6000,
      });
      break;
    case "warning":
      toast.warning(title, {
        description: friendly.message,
        duration: options?.duration || 5000,
      });
      break;
    case "info":
      toast.info(title, {
        description: friendly.message,
        duration: options?.duration || 4000,
      });
      break;
  }

  if (friendly.log && typeof console !== "undefined") {
    console.warn(`[ErrorHandler] ${title}: ${friendly.message}`, error);
  }
}

/**
 * Show a success toast.
 */
export function showSuccessToast(title: string, description?: string) {
  toast.success(title, { description });
}

// ─── Async Error Wrapper ────────────────────────────────

/**
 * Wraps an async function with error handling that shows user-friendly toasts.
 */
export function withErrorHandling<T>(
  fn: () => Promise<T>,
  options?: { title?: string; onError?: (error: unknown) => void }
): Promise<T | null> {
  return fn().catch((error) => {
    showErrorToast(error, options);
    options?.onError?.(error);
    return null;
  });
}

/**
 * Check if the user is likely offline.
 */
export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}
