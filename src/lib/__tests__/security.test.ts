import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  escapeHtmlAttribute,
  sanitizeUrl,
  sanitizeTextInput,
  validateEmail,
  validatePassword,
  validateLicensePlate,
  validatePhoneNumber,
  validateBadgeNumber,
  validateName,
  validatePositiveNumber,
  validateCoordinate,
  validateUploadFile,
  getFileUploadErrorMessage,
  sanitizeIncidentDescription,
  sanitizeOfficerNotes,
  sanitizeLocationAddress,
} from "@/lib/security";

import {
  roleHasPermission,
  roleHasAllPermissions,
  roleHasAnyPermission,
  hasMinimumRole,
  getRoleLevel,
} from "@/lib/permissions";

import { mapToErrorCode, ErrorCodes } from "@/lib/error-handler";

describe("Security — Input Validation", () => {
  // ── XSS Prevention ───────────────────────────────
  describe("XSS Prevention", () => {
    it("escapeHtml escapes HTML special characters", () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        "&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;"
      );
    });

    it("escapeHtml handles ampersands first", () => {
      expect(escapeHtml("A&B")).toBe("A&amp;B");
    });

    it("escapeHtmlAttribute double-encodes quotes", () => {
      const result = escapeHtmlAttribute('" onload="alert(1)"');
      expect(result).not.toContain('"');
      expect(result).toContain("&quot;");
    });

    it("sanitizeUrl blocks javascript: URLs", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
      expect(sanitizeUrl("JaVaScRiPt:alert(1)")).toBeNull();
    });

    it("sanitizeUrl blocks data:text/html URLs", () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it("sanitizeUrl allows normal URLs", () => {
      expect(sanitizeUrl("https://example.com/page?q=test")).toBe("https://example.com/page?q=test");
      expect(sanitizeUrl("/dashboard")).toBe("/dashboard");
    });

    it("sanitizeUrl returns null for non-string input", () => {
      expect(sanitizeUrl("")).toBeNull();
    });

    it("sanitizeTextInput strips script tags", () => {
      const result = sanitizeTextInput('Hello <script>alert("xss")</script> World');
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert");
      expect(result).toContain("Hello");
      expect(result).toContain("World");
    });

    it("sanitizeTextInput strips iframe tags", () => {
      const result = sanitizeTextInput('<iframe src="malicious.html"></iframe>content');
      expect(result).not.toContain("<iframe");
      expect(result).toBe("content");
    });

    it("sanitizeTextInput strips event handler attributes", () => {
      const result = sanitizeTextInput('<img src=x onerror="alert(1)">');
      expect(result).not.toContain("onerror");
    });

    it("sanitizeTextInput strips all HTML tags", () => {
      const result = sanitizeTextInput("<b>Bold</b><i>Italic</i>");
      expect(result).not.toContain("<b>");
      expect(result).not.toContain("</b>");
      expect(result).not.toContain("<i>");
    });

    it("sanitizeTextInput enforces max length", () => {
      const long = "a".repeat(100);
      const result = sanitizeTextInput(long, 10);
      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  // ── Email Validation ─────────────────────────────
  describe("Email Validation", () => {
    it("accepts valid emails", () => {
      expect(validateEmail("user@example.com").valid).toBe(true);
      expect(validateEmail("officer.kollie@police.gov.lr").valid).toBe(true);
    });

    it("rejects invalid emails", () => {
      expect(validateEmail("").valid).toBe(false);
      expect(validateEmail("not-an-email").valid).toBe(false);
      expect(validateEmail("@domain.com").valid).toBe(false);
      expect(validateEmail("user@").valid).toBe(false);
    });

    it("rejects excessively long emails", () => {
      const long = "a".repeat(250) + "@b.com";
      expect(validateEmail(long).valid).toBe(false);
    });
  });

  // ── Password Validation ──────────────────────────
  describe("Password Validation", () => {
    it("accepts strong passwords", () => {
      expect(validatePassword("Passw0rd!").valid).toBe(true);
      expect(validatePassword("Str0ng!Pass").valid).toBe(true);
    });

    it("rejects short passwords", () => {
      expect(validatePassword("Ab1!").valid).toBe(false);
    });

    it("rejects passwords without uppercase", () => {
      expect(validatePassword("password1!").valid).toBe(false);
    });

    it("rejects passwords without lowercase", () => {
      expect(validatePassword("PASSWORD1!").valid).toBe(false);
    });

    it("rejects passwords without numbers", () => {
      expect(validatePassword("Password!").valid).toBe(false);
    });

    it("rejects passwords without special characters", () => {
      expect(validatePassword("Password1").valid).toBe(false);
    });
  });

  // ── License Plate Validation ─────────────────────
  describe("License Plate Validation", () => {
    it("accepts valid Liberia plates", () => {
      expect(validateLicensePlate("ABC-123").valid).toBe(true);
    });

    it("rejects empty plates", () => {
      expect(validateLicensePlate("").valid).toBe(false);
    });

    it("rejects excessively long plates", () => {
      expect(validateLicensePlate("A".repeat(20)).valid).toBe(false);
    });
  });

  // ── Phone Validation ─────────────────────────────
  describe("Phone Validation", () => {
    it("accepts valid Liberia numbers", () => {
      // +231 prefix with 7-9 digits
      expect(validatePhoneNumber("+231555123456").valid).toBe(true);
    });

    it("accepts empty phone (optional field)", () => {
      expect(validatePhoneNumber("").valid).toBe(true);
    });
  });

  // ── Name Validation ──────────────────────────────
  describe("Name Validation", () => {
    it("accepts valid names", () => {
      expect(validateName("John Kollie", "Name").valid).toBe(true);
      expect(validateName("A-B-C", "Name").valid).toBe(true);
    });

    it("rejects empty names", () => {
      expect(validateName("", "Name").valid).toBe(false);
    });

    it("rejects names with HTML injection", () => {
      expect(validateName('<script>alert(1)</script>', "Name").valid).toBe(false);
    });
  });

  // ── Coordinate Validation ────────────────────────
  describe("Coordinate Validation", () => {
    it("accepts valid Liberia coordinates", () => {
      expect(validateCoordinate(6.3156, -10.8074).valid).toBe(true); // Monrovia
    });

    it("rejects out-of-range coordinates", () => {
      expect(validateCoordinate(100, 0).valid).toBe(false);
      expect(validateCoordinate(0, 200).valid).toBe(false);
    });

    it("rejects coordinates outside Liberia", () => {
      expect(validateCoordinate(10, -10).valid).toBe(false); // Too far north
    });
  });

  // ── Positive Number Validation ───────────────────
  describe("Positive Number Validation", () => {
    it("accepts valid numbers within range", () => {
      expect(validatePositiveNumber(5, "Value", 0, 100).valid).toBe(true);
    });

    it("rejects numbers below minimum", () => {
      expect(validatePositiveNumber(-1, "Value", 0).valid).toBe(false);
    });

    it("rejects NaN", () => {
      expect(validatePositiveNumber(NaN, "Value").valid).toBe(false);
    });
  });
});

describe("Security — File Upload Validation", () => {
  // Helper to create a minimal mock File
  function createMockFile(name: string, type: string, size: number): File {
    return new File([new ArrayBuffer(size)], name, { type });
  }

  describe("validateUploadFile", () => {
    it("accepts valid JPEG", () => {
      const file = createMockFile("photo.jpg", "image/jpeg", 1024 * 1024);
      const result = validateUploadFile(file);
      expect(result.valid).toBe(true);
      expect(result.details?.bucket).toBe("evidence-images");
    });

    it("accepts valid PDF", () => {
      const file = createMockFile("report.pdf", "application/pdf", 1024 * 500);
      const result = validateUploadFile(file);
      expect(result.valid).toBe(true);
      expect(result.details?.bucket).toBe("evidence-documents");
    });

    it("rejects oversized files", () => {
      const file = createMockFile("huge.mp4", "video/mp4", 300 * 1024 * 1024); // 300MB > 200MB limit
      const result = validateUploadFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds");
    });

    it("rejects blocked executable extensions", () => {
      const file = createMockFile("virus.exe", "application/x-msdownload", 1024);
      const result = validateUploadFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("not allowed");
    });

    it("rejects blocked shell script extensions", () => {
      const file = createMockFile("malware.sh", "text/x-shellscript", 100);
      const result = validateUploadFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("not allowed");
    });

    it("rejects unsupported MIME types", () => {
      const file = createMockFile("file.garbage", "application/x-garbage", 100);
      const result = validateUploadFile(file);
      expect(result.valid).toBe(false);
    });

    it("rejects files with name too long", () => {
      const longName = "a".repeat(300) + ".jpg";
      const file = createMockFile(longName, "image/jpeg", 1024);
      const result = validateUploadFile(file);
      expect(result.valid).toBe(false);
    });
  });
});

describe("Security — Permission Boundaries", () => {
  // ── Unauthorized Access Prevention ───────────────
  it("null/undefined roles have no permissions", () => {
    expect(roleHasPermission(null, "view_dashboard")).toBe(false);
    expect(roleHasPermission(undefined, "create_incidents")).toBe(false);
  });

  // ── Permission Escalation Prevention ─────────────
  it("citizen cannot access admin functions", () => {
    expect(roleHasPermission("citizen", "manage_users")).toBe(false);
    expect(roleHasPermission("citizen", "configure_system")).toBe(false);
    expect(roleHasPermission("citizen", "view_audit_logs")).toBe(false);
    expect(roleHasPermission("citizen", "delete_incidents")).toBe(false);
    expect(roleHasPermission("citizen", "access_evidence")).toBe(false);
  });

  it("traffic_officer cannot manage users or system", () => {
    expect(roleHasPermission("traffic_officer", "manage_users")).toBe(false);
    expect(roleHasPermission("traffic_officer", "configure_system")).toBe(false);
    expect(roleHasPermission("traffic_officer", "manage_roles")).toBe(false);
  });

  it("evidence_officer only has evidence permissions", () => {
    expect(roleHasPermission("evidence_officer", "access_evidence")).toBe(true);
    expect(roleHasPermission("evidence_officer", "download_evidence")).toBe(true);
    expect(roleHasPermission("evidence_officer", "view_dashboard")).toBe(false);
    expect(roleHasPermission("evidence_officer", "manage_users")).toBe(false);
  });

  it("system_auditor cannot modify data", () => {
    // Auditors should have read-only access
    expect(roleHasPermission("system_auditor", "view_audit_logs")).toBe(true);
    expect(roleHasPermission("system_auditor", "view_all_incidents")).toBe(true);
    // But not admin/modify permissions
    expect(roleHasPermission("system_auditor", "manage_users")).toBe(false);
    expect(roleHasPermission("system_auditor", "configure_system")).toBe(false);
    expect(roleHasPermission("system_auditor", "manage_roles")).toBe(false);
  });

  // ── RLS Bypass Attempt Detection (via error mapping) ──
  it("RLS permission denied error maps to PERMISSION_DENIED", () => {
    expect(mapToErrorCode({ code: "42501" })).toBe(ErrorCodes.PERMISSION_DENIED);
    expect(mapToErrorCode({ status: 403 })).toBe(ErrorCodes.PERMISSION_DENIED);
  });

  // ── Role Hierarchy Check ────────────────────────
  it("lower role cannot escalate to higher role permissions", () => {
    expect(hasMinimumRole("traffic_officer", "police_supervisor")).toBe(false);
    expect(hasMinimumRole("police_supervisor", "regional_commander")).toBe(false);
    expect(hasMinimumRole("citizen", "traffic_officer")).toBe(false);
  });

  it("role level hierarchy is correctly ordered", () => {
    expect(getRoleLevel("citizen")).toBeLessThan(getRoleLevel("traffic_officer"));
    expect(getRoleLevel("traffic_officer")).toBeLessThan(getRoleLevel("police_supervisor"));
    expect(getRoleLevel("police_supervisor")).toBeLessThan(getRoleLevel("regional_commander"));
    expect(getRoleLevel("regional_commander")).toBeLessThan(getRoleLevel("national_commissioner"));
    expect(getRoleLevel("national_commissioner")).toBeLessThan(getRoleLevel("system_administrator"));
  });
});

describe("Security — Sanitization Functions", () => {
  it("sanitizeIncidentDescription removes HTML", () => {
    const result = sanitizeIncidentDescription("Hello <b>world</b>");
    expect(result).not.toContain("<b>");
    expect(result).toContain("Hello");
  });

  it("sanitizeOfficerNotes removes script tags", () => {
    const result = sanitizeOfficerNotes('<script>stealData()</script>Note');
    expect(result).not.toContain("<script>");
    expect(result).toContain("Note");
  });

  it("sanitizeLocationAddress strips angle brackets", () => {
    const result = sanitizeLocationAddress('Main Street <script>');
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
    expect(result).toContain("Main Street");
  });

  it("getFileUploadErrorMessage returns message for known error codes", () => {
    expect(getFileUploadErrorMessage("file_too_large")).toContain("too large");
    expect(getFileUploadErrorMessage("virus_detected")).toContain("security scanning");
    expect(getFileUploadErrorMessage("file_type_not_allowed")).toContain("not supported");
  });

  it("getFileUploadErrorMessage returns fallback for unknown codes", () => {
    expect(getFileUploadErrorMessage("unknown_xyz")).toContain("unexpected error");
  });
});
