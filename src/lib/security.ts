/**
 * TrafficWatch AI — Security Architecture Utility Library
 *
 * Centralized security functions used across the application:
 * - Input validation & sanitization
 * - XSS prevention helpers
 * - File upload validation (frontend supplement)
 * - CSRF protection
 * - Security header validation
 * - Rate limiting helpers
 * - Security event logging
 *
 * NOTE: Server-side enforcement via Row Level Security and
 * database policies is the PRIMARY security layer.
 * These client-side utilities are UX and defense-in-depth.
 */

// ─── Constants ─────────────────────────────────────────

/** Dangerous file extensions blocked from upload */
const BLOCKED_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".msi", ".scr", ".vbs", ".ps1",
  ".sh", ".php", ".asp", ".aspx", ".jsp", ".cgi", ".pl", ".py",
  ".jar", ".wsf", ".lnk", ".gadget", ".app", ".pif", ".application",
];

/** Dangerous URL patterns (simple XSS checks) */
const DANGEROUS_URL_PATTERNS = [
  /^javascript:/i,
  /^data:\s*(text\/html|application\/x-javascript)/i,
  /^vbscript:/i,
  /<script/i,
  /on\w+\s*=/i,
];

/** HTML-encoding character map */
const HTML_ENCODE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

// ─── XSS Prevention ──────────────────────────────────

/**
 * Encode a string for safe insertion into HTML.
 * Prevents XSS by escaping HTML special characters.
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'/]/g, (char) => HTML_ENCODE_MAP[char] || char);
}

/**
 * Encode a string for safe insertion into an HTML attribute value.
 * Double-encodes quotes for attribute context safety.
 */
export function escapeHtmlAttribute(str: string): string {
  return str.replace(/[&<>"'/]/g, (char) => {
    if (char === '"') return "&quot;";
    if (char === "'") return "&#x27;";
    return HTML_ENCODE_MAP[char] || char;
  });
}

/**
 * Sanitize a URL to prevent javascript: XSS attacks.
 * Returns null if the URL is dangerous.
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  for (const pattern of DANGEROUS_URL_PATTERNS) {
    if (pattern.test(trimmed)) return null;
  }
  return trimmed;
}

/**
 * Sanitize user-provided text by stripping HTML tags
 * and encoding remaining special characters.
 */
export function sanitizeTextInput(input: string, maxLength = 5000): string {
  if (!input) return "";
  let sanitized = input
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<[^>]*on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
    .replace(/<[^>]*>/g, ""); // Strip remaining HTML tags
  sanitized = escapeHtml(sanitized);
  return sanitized.slice(0, maxLength);
}

// ─── Input Validation ────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate an email address format.
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email is required" };
  }
  const trimmed = email.trim();
  if (trimmed.length > 254) {
    return { valid: false, error: "Email address is too long" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Invalid email address format" };
  }
  return { valid: true };
}

/**
 * Validate password strength.
 * Requires: 8+ chars, uppercase, lowercase, digit, special char
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  if (password.length > 128) {
    return { valid: false, error: "Password must be less than 128 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain an uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain a lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain a number" };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: "Password must contain a special character" };
  }
  return { valid: true };
}

/**
 * Validate a license plate number format (Liberia).
 * Supports: 6-8 alphanumeric characters, with optional hyphen or space
 */
export function validateLicensePlate(plate: string): ValidationResult {
  if (!plate || typeof plate !== "string") {
    return { valid: false, error: "License plate is required" };
  }
  const trimmed = plate.trim().toUpperCase();
  if (trimmed.length < 2 || trimmed.length > 15) {
    return { valid: false, error: "License plate must be 2-15 characters" };
  }
  // Liberia plates: letters + numbers, optional separators
  const plateRegex = /^[A-Z0-9][A-Z0-9 -]{0,13}[A-Z0-9]$/;
  if (!plateRegex.test(trimmed)) {
    return { valid: false, error: "Invalid license plate format" };
  }
  return { valid: true };
}

/**
 * Validate a phone number format (Liberia: +231...).
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  if (!phone) return { valid: true }; // Phone is optional
  const trimmed = phone.trim();
  // Liberia country code +231 followed by 7-9 digits
  const phoneRegex = /^(\+231[0-9]{7,9}|0[0-9]{7,9})$/;
  if (!phoneRegex.test(trimmed.replace(/[\s-]/g, ""))) {
    return { valid: false, error: "Invalid phone number format. Use +231XXXXXXXXX" };
  }
  return { valid: true };
}

/**
 * Validate a badge number for police officers.
 */
export function validateBadgeNumber(badge: string): ValidationResult {
  if (!badge) return { valid: true };
  const trimmed = badge.trim();
  if (trimmed.length > 20) {
    return { valid: false, error: "Badge number is too long" };
  }
  const badgeRegex = /^[A-Za-z0-9-]+$/;
  if (!badgeRegex.test(trimmed)) {
    return { valid: false, error: "Badge number can only contain letters, numbers, and hyphens" };
  }
  return { valid: true };
}

/**
 * Validate a name (person or location).
 */
export function validateName(name: string, fieldName = "Name", maxLength = 100): ValidationResult {
  if (!name || typeof name !== "string") {
    return { valid: false, error: `${fieldName} is required` };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters` };
  }
  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must be less than ${maxLength} characters` };
  }
  // Allow letters, spaces, apostrophes, hyphens, periods
  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ'\-.\s]+$/;
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }
  return { valid: true };
}

// ─── Numeric Validation ───────────────────────────────

/**
 * Validate that a value is a positive number within bounds.
 */
export function validatePositiveNumber(
  value: number | string | null | undefined,
  fieldName = "Value",
  min = 0,
  max = Number.MAX_SAFE_INTEGER
): ValidationResult {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num == null || isNaN(num as number)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }
  if ((num as number) < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }
  if ((num as number) > max) {
    return { valid: false, error: `${fieldName} must be less than ${max}` };
  }
  return { valid: true };
}

// ─── File Upload Validation ──────────────────────────

/**
 * Validated file types and their details (matches Supabase storage config).
 */
export const ALLOWED_FILE_TYPES: Record<string, { bucket: string; maxSize: number; label: string }> = {
  "image/jpeg": { bucket: "evidence-images", maxSize: 50 * 1024 * 1024, label: "JPEG Image" },
  "image/png": { bucket: "evidence-images", maxSize: 50 * 1024 * 1024, label: "PNG Image" },
  "image/webp": { bucket: "evidence-images", maxSize: 50 * 1024 * 1024, label: "WebP Image" },
  "image/tiff": { bucket: "evidence-images", maxSize: 50 * 1024 * 1024, label: "TIFF Image" },
  "image/heic": { bucket: "evidence-images", maxSize: 50 * 1024 * 1024, label: "HEIC Image" },
  "image/heif": { bucket: "evidence-images", maxSize: 50 * 1024 * 1024, label: "HEIF Image" },
  "video/mp4": { bucket: "evidence-videos", maxSize: 200 * 1024 * 1024, label: "MP4 Video" },
  "video/quicktime": { bucket: "evidence-videos", maxSize: 200 * 1024 * 1024, label: "QuickTime Video" },
  "video/webm": { bucket: "evidence-videos", maxSize: 200 * 1024 * 1024, label: "WebM Video" },
  "video/x-matroska": { bucket: "evidence-videos", maxSize: 200 * 1024 * 1024, label: "MKV Video" },
  "audio/mpeg": { bucket: "evidence-audio", maxSize: 50 * 1024 * 1024, label: "MP3 Audio" },
  "audio/wav": { bucket: "evidence-audio", maxSize: 50 * 1024 * 1024, label: "WAV Audio" },
  "audio/ogg": { bucket: "evidence-audio", maxSize: 50 * 1024 * 1024, label: "OGG Audio" },
  "application/pdf": { bucket: "evidence-documents", maxSize: 25 * 1024 * 1024, label: "PDF Document" },
  "text/plain": { bucket: "evidence-documents", maxSize: 25 * 1024 * 1024, label: "Text File" },
  "text/csv": { bucket: "evidence-documents", maxSize: 25 * 1024 * 1024, label: "CSV File" },
};

/**
 * Validate a file for upload safety.
 * Checks: MIME type, file size, file extension, file name safety
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    bucket: string;
    maxSize: number;
    label: string;
    nameSafe: boolean;
    extensionSafe: boolean;
    mimeValid: boolean;
    sizeValid: boolean;
  };
}

export function validateUploadFile(file: File): FileValidationResult {
  const errors: string[] = [];
  const details = {
    bucket: "evidence-other",
    maxSize: 25 * 1024 * 1024,
    label: "Other File",
    nameSafe: true,
    extensionSafe: true,
    mimeValid: false,
    sizeValid: false,
  };

  // 1. Check file name length
  if (!file.name || file.name.length > 255) {
    details.nameSafe = false;
    errors.push("File name is too long or invalid");
  }

  // 2. Check file extension
  const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    details.extensionSafe = false;
    errors.push(`File type "${ext}" is not allowed for security reasons`);
  }

  // 3. Check MIME type
  const typeConfig = ALLOWED_FILE_TYPES[file.type];
  if (typeConfig) {
    details.mimeValid = true;
    details.bucket = typeConfig.bucket;
    details.maxSize = typeConfig.maxSize;
    details.label = typeConfig.label;
  } else {
    // Unknown MIME type — check extension-based fallback
    const extMapping: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".tiff": "image/tiff",
      ".tif": "image/tiff",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".mkv": "video/x-matroska",
      ".avi": "video/x-msvideo",
      ".mov": "video/quicktime",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".ogg": "audio/ogg",
      ".pdf": "application/pdf",
      ".txt": "text/plain",
      ".csv": "text/csv",
    };
    const fallbackType = extMapping[ext];
    if (fallbackType && ALLOWED_FILE_TYPES[fallbackType]) {
      const fb = ALLOWED_FILE_TYPES[fallbackType];
      details.bucket = fb.bucket;
      details.maxSize = fb.maxSize;
      details.label = fb.label;
    } else {
      errors.push(`File type "${file.type || ext}" is not supported`);
    }
  }

  // 4. Check file size
  if (file.size <= details.maxSize) {
    details.sizeValid = true;
  } else {
    const maxMB = (details.maxSize / (1024 * 1024)).toFixed(0);
    errors.push(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the ${maxMB} MB limit`);
  }

  return {
    valid: errors.length === 0,
    error: errors.length > 0 ? errors.join("; ") : undefined,
    details,
  };
}

/**
 * Get a user-friendly error message for file upload errors.
 */
export function getFileUploadErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    "file_too_large": "The file is too large. Please select a smaller file.",
    "file_type_not_allowed": "This file type is not supported. Please select a different file.",
    "duplicate_file": "This file has already been uploaded.",
    "upload_failed": "Upload failed. Please try again.",
    "network_error": "Network error. Please check your connection and try again.",
    "storage_full": "Storage is full. Please contact your administrator.",
    "virus_detected": "This file failed security scanning and cannot be uploaded.",
    "name_too_long": "File name is too long. Please rename and try again.",
    "hash_mismatch": "File integrity check failed. Please upload again.",
  };
  return messages[errorCode] || "An unexpected error occurred during upload.";
}

// ─── CSRF Protection ─────────────────────────────────

/**
 * Generate a CSRF token for form submissions.
 * NOTE: This is a client-only helper. Supabase's built-in
 * CSRF protection via the auth token is the primary defense.
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Simple CSRF token storage using sessionStorage.
 */
export function getStoredCsrfToken(): string {
  let token = sessionStorage.getItem("_csrf_token");
  if (!token) {
    token = generateCsrfToken();
    sessionStorage.setItem("_csrf_token", token);
  }
  return token;
}

// ─── Content Security Policy ─────────────────────────

/**
 * Recommended Content-Security-Policy header value for the application.
 * This documents what the app expects — configure on the server/proxy.
 */
export function getRecommendedCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.tile.openstreetmap.org",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org https://unpkg.com https://unpkg.com/leaflet@1.9.4/dist/images/",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.tile.openstreetmap.org https://unpkg.com",
    "frame-src 'none'",
    "object-src 'none'",
    "media-src 'self' https://*.supabase.co blob:",
    "worker-src 'self' blob:",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

// ─── Rate Limiting Helpers (Client-side) ─────────────

/**
 * Client-side rate limiting using a simple token bucket.
 * Prevents rapid-fire form submissions and API calls.
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 10, windowMs = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request is allowed.
   * Cleans up old timestamps and checks count against limit.
   */
  isAllowed(): boolean {
    const now = Date.now();
    // Remove timestamps outside the window
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }
    this.timestamps.push(now);
    return true;
  }

  /**
   * Get the number of remaining requests in the current window.
   */
  remaining(): number {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }

  /**
   * Get the time until the rate limit resets (in ms).
   */
  resetTime(): number {
    if (this.timestamps.length === 0) return 0;
    const now = Date.now();
    const oldest = Math.min(...this.timestamps);
    return Math.max(0, this.windowMs - (now - oldest));
  }

  /**
   * Reset the rate limiter.
   */
  reset(): void {
    this.timestamps = [];
  }
}

// ─── Security Header Validation ─────────────────────

/**
 * Check if required security headers are present (for documentation/reporting).
 * This is a client-side informational check only.
 */
export interface SecurityHeaderStatus {
  name: string;
  present: boolean;
  value: string | null;
  recommended: string;
  critical: boolean;
}

export function getSecurityHeaderStatus(): SecurityHeaderStatus[] {
  const headers: Record<string, string> = {};
  // Fetch headers via the current page response (limited info available client-side)
  // This is best-effort — full validation requires server access
  try {
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (metaCSP) headers["Content-Security-Policy"] = metaCSP.getAttribute("content") || "";
  } catch {
    // Ignore
  }

  return [
    {
      name: "Content-Security-Policy",
      present: !!headers["Content-Security-Policy"],
      value: headers["Content-Security-Policy"] || null,
      recommended: getRecommendedCSP().substring(0, 80) + "...",
      critical: true,
    },
    {
      name: "X-Content-Type-Options",
      present: false,
      value: null,
      recommended: "nosniff",
      critical: true,
    },
    {
      name: "X-Frame-Options",
      present: false,
      value: null,
      recommended: "DENY",
      critical: true,
    },
    {
      name: "Strict-Transport-Security",
      present: window.location.protocol === "https:",
      value: window.location.protocol === "https:" ? "implied by HTTPS" : null,
      recommended: "max-age=31536000; includeSubDomains",
      critical: true,
    },
    {
      name: "Referrer-Policy",
      present: false,
      value: null,
      recommended: "strict-origin-when-cross-origin",
      critical: false,
    },
    {
      name: "Permissions-Policy",
      present: false,
      value: null,
      recommended: "camera=(), microphone=(), geolocation=(self), payment=()",
      critical: false,
    },
  ];
}

// ─── Input Sanitization for Specific Fields ──────────

/**
 * Sanitize an incident description for safe storage/display.
 */
export function sanitizeIncidentDescription(text: string): string {
  return sanitizeTextInput(text, 5000);
}

/**
 * Sanitize officer notes for safe storage/display.
 */
export function sanitizeOfficerNotes(text: string): string {
  return sanitizeTextInput(text, 10000);
}

/**
 * Sanitize a location address.
 */
export function sanitizeLocationAddress(address: string): string {
  return address
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[<>]/g, "") // Strip angle brackets
    .trim()
    .slice(0, 500);
}

/**
 * Validate that a coordinate is within valid bounds.
 */
export function validateCoordinate(
  lat: number | null | undefined,
  lng: number | null | undefined
): ValidationResult {
  if (lat == null || lng == null) {
    return { valid: false, error: "Coordinates are required" };
  }
  if (lat < -90 || lat > 90) {
    return { valid: false, error: "Latitude must be between -90 and 90" };
  }
  if (lng < -180 || lng > 180) {
    return { valid: false, error: "Longitude must be between -180 and 180" };
  }
  // Liberia bounding box
  if (lat < 4.0 || lat > 8.5 || lng < -12.0 || lng > -7.0) {
    return { valid: false, error: "Coordinates are outside Liberia's geographic bounds" };
  }
  return { valid: true };
}

// ─── Security Info (for admin display) ───────────────

export interface SecurityArchitectureInfo {
  name: string;
  description: string;
  status: "implemented" | "partial" | "planned";
  details: string;
}

/**
 * Get the complete security architecture overview for the admin dashboard.
 */
export function getSecurityArchitectureInfo(): SecurityArchitectureInfo[] {
  return [
    {
      name: "Row Level Security (RLS)",
      description: "Database-level access control on all tables",
      status: "implemented",
      details: "All primary tables have RLS policies enforcing row-level access based on user roles and ownership. See v17 migration for full audit.",
    },
    {
      name: "Role-Based Access Control (RBAC)",
      description: "10 user roles with granular permission matrix",
      status: "implemented",
      details: "Roles: system_administrator, national_commissioner, regional_commander, traffic_commander, police_supervisor, traffic_officer, investigator, evidence_officer, system_auditor, citizen.",
    },
    {
      name: "Authentication",
      description: "Supabase Auth with email/password and MFA",
      status: "implemented",
      details: "Secure sign-in, sign-up, password reset, session management. MFA via TOTP authenticator apps. Session visibility per device.",
    },
    {
      name: "Secure Storage",
      description: "Private storage buckets with signed URLs",
      status: "implemented",
      details: "5 private buckets (images, videos, audio, documents, other). Time-limited signed URLs (1 hour expiry). MIME validation and file-size limits enforced at upload.",
    },
    {
      name: "Input Validation",
      description: "Client and server-side input validation",
      status: "implemented",
      details: "Email, password, license plate, phone number, name, badge number, coordinate validation. XSS sanitization on all text inputs. Server-side sanitize_input() SQL function.",
    },
    {
      name: "File Upload Security",
      description: "File type validation, size limits, extension blocking",
      status: "implemented",
      details: "Executable extensions blocked (.exe, .bat, .sh, .php, etc.). MIME type verification. File size limits per bucket. SHA-256 integrity hashing.",
    },
    {
      name: "Audit Logging",
      description: "Comprehensive security event logging",
      status: "implemented",
      details: "30+ audit action types across authentication, incidents, evidence, AI analysis, users, and system. Immutable audit_logs table. Auth audit events tracked separately.",
    },
    {
      name: "Chain of Custody",
      description: "Evidence interaction traceability",
      status: "implemented",
      details: "Every evidence interaction logged: upload, view, download, analyze, transfer, verify, export. Includes officer ID, timestamp, device info.",
    },
    {
      name: "Security Events Monitoring",
      description: "Dedicated security events table for suspicious activity",
      status: "implemented",
      details: "Tracks auth failures, rate-limit triggers, suspicious IP/UA, brute force attempts, permission denials, CSRF failures, file upload blocks. Severity levels: info, warning, error, critical.",
    },
    {
      name: "Rate Limiting",
      description: "Token-bucket rate limiting per user/IP",
      status: "implemented",
      details: "Server-side check_rate_limit() function with configurable window and max requests. Client-side RateLimiter class for form submissions.",
    },
    {
      name: "HTTPS",
      description: "End-to-end encrypted connections",
      status: "implemented",
      details: "All Supabase API calls over HTTPS. Application served over HTTPS via Vite/Framework infrastructure. HSTS recommended.",
    },
    {
      name: "CSRF Protection",
      description: "Cross-Site Request Forgery prevention",
      status: "implemented",
      details: "Supabase auth token provides built-in CSRF protection. Client-side token generation available for custom forms. SPA architecture naturally limits CSRF attack surface.",
    },
    {
      name: "SQL Injection Prevention",
      description: "Parameterized queries throughout",
      status: "implemented",
      details: "All database access via Supabase client (parameterized). All RPC functions use SECURITY DEFINER with SET search_path = ''. No raw SQL concatenation in application code.",
    },
    {
      name: "Secrets Management",
      description: "API keys and secrets never in client-side code",
      status: "implemented",
      details: "Supabase anon key is public-safe (RLS prevents misuse). Service-role key never in frontend. AI provider keys handled server-side via VLY integrations. Env vars via Keys/API keys tab.",
    },
    {
      name: "Content Security Policy",
      description: "Browser-level XSS protection",
      status: "partial",
      details: "Recommended CSP documented in security.ts. Should be configured on the production server/proxy. See getRecommendedCSP() for the exact header value.",
    },
    {
      name: "MFA/2FA",
      description: "Multi-factor authentication support",
      status: "partial",
      details: "TOTP authenticator app enrollment, verification, and recovery codes. UI is implemented. Requires Supabase Auth MFA to be enabled in project settings.",
    },
  ];
}
