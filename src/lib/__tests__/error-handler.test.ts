import { describe, it, expect } from "vitest";
import {
  mapToErrorCode,
  getUserFacingError,
  getRecoveryActions,
  ErrorCodes,
  isOffline,
} from "@/lib/error-handler";

describe("Error Handler", () => {
  // ─── mapToErrorCode ────────────────────────────────
  describe("mapToErrorCode", () => {
    it("maps Supabase auth errors", () => {
      expect(mapToErrorCode({ code: "auth/invalid-login-credentials" })).toBe(
        ErrorCodes.INVALID_CREDENTIALS
      );
      expect(mapToErrorCode({ code: "auth/session-expired" })).toBe(
        ErrorCodes.SESSION_EXPIRED
      );
      expect(mapToErrorCode({ code: "auth/too-many-requests" })).toBe(
        ErrorCodes.RATE_LIMITED
      );
    });

    it("maps Supabase database error codes", () => {
      expect(mapToErrorCode({ code: "23505" })).toBe(ErrorCodes.DUPLICATE);
      expect(mapToErrorCode({ code: "23503" })).toBe(ErrorCodes.FK_VIOLATION);
      expect(mapToErrorCode({ code: "42501" })).toBe(ErrorCodes.PERMISSION_DENIED);
      expect(mapToErrorCode({ code: "42P01" })).toBe(ErrorCodes.TABLE_NOT_FOUND);
    });

    it("maps HTTP status codes", () => {
      expect(mapToErrorCode({ status: 401 })).toBe(ErrorCodes.SESSION_EXPIRED);
      expect(mapToErrorCode({ status: 403 })).toBe(ErrorCodes.PERMISSION_DENIED);
      expect(mapToErrorCode({ status: 404 })).toBe(ErrorCodes.NOT_FOUND);
      expect(mapToErrorCode({ status: 429 })).toBe(ErrorCodes.RATE_LIMITED);
      expect(mapToErrorCode({ status: 500 })).toBe(ErrorCodes.SERVER_ERROR);
      expect(mapToErrorCode({ status: 503 })).toBe(ErrorCodes.SERVICE_UNAVAILABLE);
      expect(mapToErrorCode({ status: 413 })).toBe(ErrorCodes.FILE_TOO_LARGE);
    });

    it("maps error message keywords", () => {
      expect(mapToErrorCode({ message: "Network error occurred" })).toBe(
        ErrorCodes.NETWORK_ERROR
      );
      expect(mapToErrorCode({ message: "request timed out" })).toBe(
        ErrorCodes.NETWORK_TIMEOUT
      );
      expect(mapToErrorCode({ message: "permission denied" })).toBe(
        ErrorCodes.PERMISSION_DENIED
      );
      expect(mapToErrorCode({ message: "not found" })).toBe(
        ErrorCodes.NOT_FOUND
      );
      expect(mapToErrorCode({ message: "file too large" })).toBe(
        ErrorCodes.FILE_TOO_LARGE
      );
    });

    it("maps error name for auth errors", () => {
      expect(
        mapToErrorCode({ name: "AuthRetryableFetchError" })
      ).toBe(ErrorCodes.SESSION_EXPIRED);
    });

    it("returns UNKNOWN for unrecognized errors", () => {
      expect(mapToErrorCode({ random: "thing" })).toBe(ErrorCodes.UNKNOWN);
      expect(mapToErrorCode("weird")).toBe(ErrorCodes.UNKNOWN);
    });

    it("handles null/undefined", () => {
      expect(mapToErrorCode(null)).toBe(ErrorCodes.UNKNOWN);
      expect(mapToErrorCode(undefined)).toBe(ErrorCodes.UNKNOWN);
    });

    it("maps direct error code strings", () => {
      expect(mapToErrorCode(ErrorCodes.OFFLINE)).toBe(ErrorCodes.OFFLINE);
      expect(mapToErrorCode(ErrorCodes.AI_ANALYSIS_FAILED)).toBe(
        ErrorCodes.AI_ANALYSIS_FAILED
      );
    });
  });

  // ─── getUserFacingError ────────────────────────────
  describe("getUserFacingError", () => {
    it("returns a user-friendly error object", () => {
      const result = getUserFacingError({ code: "auth/invalid-login-credentials" });
      expect(result.title).toBe("Invalid Credentials");
      expect(result.message).toContain("email or password");
      expect(result.severity).toBe("error");
      expect(result.log).toBe(true);
    });

    it("returns UNKNOWN for unrecognized errors", () => {
      const result = getUserFacingError("garbage");
      expect(result.title).toBe("Something Went Wrong");
      expect(result.severity).toBe("error");
    });

    it("has valid messages for all error codes", () => {
      const codes = Object.values(ErrorCodes);
      for (const code of codes) {
        const result = getUserFacingError(code);
        expect(result.title).toBeTruthy();
        expect(result.message).toBeTruthy();
        expect(["info", "warning", "error", "critical"]).toContain(
          result.severity
        );
      }
    });
  });

  // ─── getRecoveryActions ────────────────────────────
  describe("getRecoveryActions", () => {
    it("returns sign-in action for expired session", () => {
      const actions = getRecoveryActions(ErrorCodes.SESSION_EXPIRED);
      expect(actions.length).toBeGreaterThanOrEqual(1);
      expect(actions[0].label).toContain("Sign In");
    });

    it("returns dashboard action for permission denied", () => {
      const actions = getRecoveryActions(ErrorCodes.PERMISSION_DENIED);
      expect(actions.some((a) => a.label.includes("Dashboard"))).toBe(true);
    });

    it("returns try-again action for network errors", () => {
      const actions = getRecoveryActions(ErrorCodes.NETWORK_ERROR);
      expect(actions.some((a) => a.label.includes("Try Again"))).toBe(true);
    });

    it("returns go-back action for not-found", () => {
      const actions = getRecoveryActions(ErrorCodes.NOT_FOUND);
      expect(actions.some((a) => a.label.includes("Go Back"))).toBe(true);
    });
  });

  // ─── isOffline ─────────────────────────────────────
  describe("isOffline", () => {
    it("returns false when online (mocked)", () => {
      expect(isOffline()).toBe(false);
    });
  });
});
