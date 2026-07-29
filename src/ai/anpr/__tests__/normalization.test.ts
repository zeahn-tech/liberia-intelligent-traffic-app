import { describe, it, expect } from "vitest";
import {
  normalizePlateText,
  correctOCRErrors,
  isValidPlateFormat,
  detectPlateFormat,
  getPlateVariations,
  plateSimilarity,
  buildPlateResult,
} from "@/ai/anpr/normalization";

describe("ANPR Normalization", () => {
  // ─── normalizePlateText ────────────────────────────
  describe("normalizePlateText", () => {
    it("converts to uppercase", () => {
      expect(normalizePlateText("abc-123")).toBe("ABC-123");
    });

    it("removes whitespace", () => {
      expect(normalizePlateText(" AB  C  123 ")).toBe("ABC123");
    });

    it("removes non-alphanumeric characters except hyphens", () => {
      expect(normalizePlateText("ABC-123!@#")).toBe("ABC-123");
    });

    it("collapses multiple hyphens", () => {
      expect(normalizePlateText("ABC---123")).toBe("ABC-123");
    });

    it("removes leading/trailing hyphens", () => {
      expect(normalizePlateText("-ABC-123-")).toBe("ABC-123");
    });

    it("returns empty string for empty input", () => {
      expect(normalizePlateText("")).toBe("");
      expect(normalizePlateText("   ")).toBe("");
    });
  });

  // ─── correctOCRErrors ──────────────────────────────
  describe("correctOCRErrors", () => {
    it("returns high confidence for already-valid plates", () => {
      const result = correctOCRErrors("ABC-123");
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.corrected).toBe("ABC-123");
    });

    it("returns empty for empty input", () => {
      const result = correctOCRErrors("");
      expect(result.confidence).toBe(0);
      expect(result.corrected).toBe("");
    });
  });

  // ─── isValidPlateFormat ────────────────────────────
  describe("isValidPlateFormat", () => {
    it("returns true for valid-looking plate formats", () => {
      expect(isValidPlateFormat("ABC-123")).toBe(true);
    });

    it("returns false for empty or invalid", () => {
      expect(isValidPlateFormat("")).toBe(false);
      expect(isValidPlateFormat("A")).toBe(false);
    });
  });

  // ─── detectPlateFormat ─────────────────────────────
  describe("detectPlateFormat", () => {
    it("returns a format object for a valid plate", () => {
      const format = detectPlateFormat("ABC-123");
      expect(format).not.toBeNull();
      expect(format?.country).toBeTruthy();
    });

    it("returns null for invalid plate", () => {
      expect(detectPlateFormat("")).toBeNull();
    });
  });

  // ─── getPlateVariations ────────────────────────────
  describe("getPlateVariations", () => {
    it("returns the original normalized plate", () => {
      const variations = getPlateVariations("ABC-123");
      expect(variations).toContain("ABC-123");
    });

    it("includes hyphen-stripped version", () => {
      const variations = getPlateVariations("ABC-123");
      expect(variations).toContain("ABC123");
    });
  });

  // ─── plateSimilarity ───────────────────────────────
  describe("plateSimilarity", () => {
    it("returns 1.0 for exact match", () => {
      expect(plateSimilarity("ABC-123", "ABC-123")).toBe(1.0);
    });

    it("returns 0.9 for same characters without hyphen", () => {
      expect(plateSimilarity("ABC-123", "ABC123")).toBe(0.9);
    });

    it("returns 0 for completely different plates", () => {
      expect(plateSimilarity("ABC-123", "XYZ-999")).toBeLessThan(0.5);
    });

    it("handles empty strings", () => {
      expect(plateSimilarity("", "")).toBe(1.0);
    });
  });

  // ─── buildPlateResult ──────────────────────────────
  describe("buildPlateResult", () => {
    it("builds a complete PlateDetectionResult", () => {
      const result = buildPlateResult("ABC-123", 0.85);
      expect(result.rawText).toBe("ABC-123");
      expect(result.normalizedPlate).toBe("ABC-123");
      expect(result.confidence).toBeLessThanOrEqual(0.85);
      expect(result.officerVerified).toBe(false);
    });
  });
});
