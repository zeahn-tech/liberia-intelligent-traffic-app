// ============================================================
// TrafficWatch AI — Error Handler Hooks
//
// Provides:
// - useErrorHandler: generic error handling with loading/error states
// - useApiError: wraps API calls with error handling
// - useSessionExpiry: detects session expiry and redirects
// - useSlowNetwork: detects slow network conditions
// ============================================================

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import {
  getUserFacingError,
  showErrorToast,
  showSuccessToast,
  mapToErrorCode,
  ErrorCodes,
  isOffline,
  type UserFacingError,
  type ErrorCode,
} from "@/lib/error-handler";

// ═══════════════════════════════════════════════════════════
// useErrorHandler — Generic async error handler
// ═══════════════════════════════════════════════════════════

interface ErrorHandlerState {
  isLoading: boolean;
  error: UserFacingError | null;
  errorCode: ErrorCode | null;
}

interface UseErrorHandlerReturn extends ErrorHandlerState {
  /** Execute an async function with automatic error handling */
  execute: <T>(fn: () => Promise<T>, options?: { showToast?: boolean; silent?: boolean }) => Promise<T | null>;
  /** Clear the current error state */
  clearError: () => void;
  /** Set an error manually */
  setError: (error: unknown) => void;
  /** Show a success message */
  showSuccess: (title: string, description?: string) => void;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [state, setState] = useState<ErrorHandlerState>({
    isLoading: false,
    error: null,
    errorCode: null,
  });

  const clearError = useCallback(() => {
    setState({ isLoading: false, error: null, errorCode: null });
  }, []);

  const setError = useCallback((error: unknown) => {
    const friendly = getUserFacingError(error);
    setState({
      isLoading: false,
      error: friendly,
      errorCode: mapToErrorCode(error),
    });
  }, []);

  const execute = useCallback(async <T,>(
    fn: () => Promise<T>,
    options?: { showToast?: boolean; silent?: boolean }
  ): Promise<T | null> => {
    // Check offline first
    if (isOffline() && !options?.silent) {
      const friendly = getUserFacingError(ErrorCodes.OFFLINE);
      if (options?.showToast !== false) {
        showErrorToast(ErrorCodes.OFFLINE);
      }
      setState({
        isLoading: false,
        error: friendly,
        errorCode: ErrorCodes.OFFLINE,
      });
      return null;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null, errorCode: null }));

    try {
      const result = await fn();
      setState((prev) => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const friendly = getUserFacingError(error);
      const code = mapToErrorCode(error);

      if (options?.showToast !== false) {
        showErrorToast(error);
      }

      if (!options?.silent) {
        setState({ isLoading: false, error: friendly, errorCode: code });
      } else {
        setState({ isLoading: false, error: null, errorCode: null });
      }

      return null;
    }
  }, []);

  const showSuccess = useCallback((title: string, description?: string) => {
    showSuccessToast(title, description);
  }, []);

  return {
    ...state,
    execute,
    clearError,
    setError,
    showSuccess,
  };
}

// ═══════════════════════════════════════════════════════════
// useSessionExpiry — Detect session expiry and redirect
// ═══════════════════════════════════════════════════════════

interface UseSessionExpiryOptions {
  /** Callback when session expires */
  onSessionExpired?: () => void;
  /** Whether to automatically redirect to /auth */
  autoRedirect?: boolean;
}

export function useSessionExpiry(options: UseSessionExpiryOptions = {}) {
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const { onSessionExpired, autoRedirect = true } = options;
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;

      onSessionExpired?.();

      if (autoRedirect) {
        showErrorToast(ErrorCodes.SESSION_EXPIRED);
        navigate("/auth", { replace: true });
      }
    }

    if (isAuthenticated) {
      hasRedirected.current = false;
    }
  }, [isAuthenticated, autoRedirect, navigate, onSessionExpired]);

  // Reset redirect ref on unmount
  useEffect(() => {
    return () => {
      hasRedirected.current = false;
    };
  }, []);

  const handleSessionExpired = useCallback(() => {
    showErrorToast(ErrorCodes.SESSION_EXPIRED);
    signOut().then(() => {
      navigate("/auth", { replace: true });
    });
  }, [signOut, navigate]);

  return { onSessionExpired: handleSessionExpired };
}

// ═══════════════════════════════════════════════════════════
// useApiCall — Simplified API call wrapper
// ═══════════════════════════════════════════════════════════

interface UseApiCallOptions<T> {
  /** The API function to call */
  apiCall: () => Promise<T>;
  /** Whether to show error toasts */
  showToast?: boolean;
  /** Callback on success */
  onSuccess?: (data: T) => void;
  /** Callback on error */
  onError?: (error: unknown) => void;
  /** Initial data value */
  initialData?: T | null;
}

interface UseApiCallReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: UserFacingError | null;
  errorCode: ErrorCode | null;
  execute: () => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

export function useApiCall<T>({
  apiCall,
  showToast = true,
  onSuccess,
  onError,
  initialData = null,
}: UseApiCallOptions<T>): UseApiCallReturn<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState<UserFacingError | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);

  const execute = useCallback(async (): Promise<T | null> => {
    if (isOffline()) {
      const offlineError = getUserFacingError(ErrorCodes.OFFLINE);
      setErrorState(offlineError);
      setErrorCode(ErrorCodes.OFFLINE);
      return null;
    }

    setIsLoading(true);
    setErrorState(null);
    setErrorCode(null);

    try {
      const result = await apiCall();
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const friendly = getUserFacingError(err);
      const code = mapToErrorCode(err);

      setErrorState(friendly);
      setErrorCode(code);

      if (showToast) {
        showErrorToast(err);
      }

      onError?.(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, showToast, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(initialData);
    setErrorState(null);
    setErrorCode(null);
    setIsLoading(false);
  }, [initialData]);

  return {
    data,
    isLoading,
    error,
    errorCode,
    execute,
    reset,
    setData,
  };
}

// ═══════════════════════════════════════════════════════════
// useSlowNetwork — Detect slow network conditions
// ═══════════════════════════════════════════════════════════

interface UseSlowNetworkOptions {
  /** Threshold in ms to consider network slow (default: 3000ms) */
  threshold?: number;
  /** How often to check (default: 10000ms) */
  checkInterval?: number;
}

export function useSlowNetwork(options: UseSlowNetworkOptions = {}) {
  const { threshold = 3000, checkInterval = 10000 } = options;
  const [isSlow, setIsSlow] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    const checkLatency = async () => {
      if (!navigator.onLine) {
        setIsSlow(false);
        return;
      }

      const start = performance.now();
      try {
        // Fetch a small resource to measure latency
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), threshold);

        await fetch("/favicon.ico", {
          method: "HEAD",
          signal: controller.signal,
          cache: "no-store",
        });

        clearTimeout(timeoutId);
        const elapsed = performance.now() - start;
        setLatency(elapsed);
        setIsSlow(elapsed > threshold);
      } catch {
        setIsSlow(true);
      }
    };

    // Check immediately
    checkLatency();

    // Periodic check
    const interval = setInterval(checkLatency, checkInterval);
    return () => clearInterval(interval);
  }, [threshold, checkInterval]);

  return { isSlow, latency };
}

// ═══════════════════════════════════════════════════════════
// useAsyncData — Fetch data with loading/error states
// ═══════════════════════════════════════════════════════════

interface UseAsyncDataOptions<T> {
  fetchFn: () => Promise<T>;
  /** Auto-fetch on mount */
  autoFetch?: boolean;
  /** Dependencies to refetch on change */
  deps?: unknown[];
  /** Show error toasts */
  showToast?: boolean;
  /** Initial data value */
  initialData?: T | null;
}

interface UseAsyncDataReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: UserFacingError | null;
  errorCode: ErrorCode | null;
  refresh: () => Promise<T | null>;
  setData: (data: T | null) => void;
}

export function useAsyncData<T>({
  fetchFn,
  autoFetch = true,
  deps = [],
  showToast = true,
  initialData = null,
}: UseAsyncDataOptions<T>): UseAsyncDataReturn<T> {
  const { isLoading, error, errorCode, execute, setData, data } = useApiCall<T>({
    apiCall: fetchFn,
    showToast,
    initialData,
  });

  const refresh = useCallback(async () => {
    return execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, ...deps]);

  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, refresh, ...deps]);

  return {
    data,
    isLoading,
    error,
    errorCode,
    refresh,
    setData,
  };
}
