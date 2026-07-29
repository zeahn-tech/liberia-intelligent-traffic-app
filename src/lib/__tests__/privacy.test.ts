import { describe, it, expect } from "vitest";
import {
  containsPII,
  maskEmail,
  maskPhone,
  maskName,
  maskPlate,
  maskIP,
  maskValue,
  CLASSIFICATION_LABELS,
} from "@/lib/privacy";

describe("Privacy Utilities", () => {
  // ─── containsPII ───────────────────────────────────
  describe("containsPII", () => {
    it("detects email addresses", () => {
      const result = containsPII("user@example.com");
      expect(result.isPII).toBe(true);
      expect(result.type).toBe("email");
    });

    it("detects phone numbers", () => {
      const result = containsPII("+231 555-123-456");
      expect(result.isPII).toBe(true);
      expect(result.type).toBe("phone");
    });

    it("does not flag normal text", () => {
      expect(containsPII("Traffic violation report").isPII).toBe(false);
    });

    it("does not flag normal text", () => {
      expect(containsPII("Lorem ipsum dolor sit amet").isPII).toBe(false);
    });
  });

  // ─── maskEmail ─────────────────────────────────────
  describe("maskEmail", () => {
    it("masks email domain", () => {
      expect(maskEmail("john@example.com")).toBe("j***@example.com");
    });

    it("handles single-character name", () => {
      expect(maskEmail("j@example.com")).toBe("*@example.com");
    });

    it("returns original if no @", () => {
      expect(maskEmail("notanemail")).toBe("notanemail");
    });

    it("handles empty string", () => {
      expect(maskEmail("")).toBe("");
    });
  });

  // ─── maskPhone ─────────────────────────────────────
  describe("maskPhone", () => {
    it("masks all but last 4 digits", () => {
      expect(maskPhone("+2315551234")).toBe("******1234");
    });

    it("handles short numbers", () => {
      expect(maskPhone("123")).toBe("***");
    });

    it("handles empty string", () => {
      expect(maskPhone("")).toBe("");
    });
  });

  // ─── maskName ──────────────────────────────────────
  describe("maskName", () => {
    it("masks first and last name", () => {
      const masked = maskName("John Doe");
      expect(masked).toBe("J*** D**");
    });

    it("handles single word", () => {
      expect(maskName("John")).toContain("J***");
    });

    it("handles empty string", () => {
      expect(maskName("")).toBe("");
    });
  });

  // ─── maskPlate ─────────────────────────────────────
  describe("maskPlate", () => {
    it("replaces all characters with asterisks", () => {
      expect(maskPlate("ABC-123")).toBe("*******");
    });
  });

  // ─── maskIP ────────────────────────────────────────
  describe("maskIP", () => {
    it("masks last two octets", () => {
      expect(maskIP("192.168.1.100")).toBe("192.168.***.***");
    });
  });

  // ─── maskValue ─────────────────────────────────────
  describe("maskValue", () => {
    it("applies masking rules by type", () => {
      expect(maskValue("user@example.com", "mask_email")).toContain("***");
      expect(maskValue("+2315551234", "mask_phone")).toContain("***");
      expect(maskValue("John Doe", "mask_name")).toContain("***");
    });

    it("returns original for unknown rule", () => {
      expect(maskValue("hello", "bogus_rule")).toBe("hello");
    });

    it("returns original for empty rule", () => {
      expect(maskValue("hello", null)).toBe("hello");
    });
  });

  // ─── Classification Labels ─────────────────────────
  describe("classification labels", () => {
    it("has labels for all classifications", () => {
      expect(CLASSIFICATION_LABELS.public).toBe("Public");
      expect(CLASSIFICATION_LABELS.confidential).toBe("Confidential");
      expect(CLASSIFICATION_LABELS.pii).toBe("Personally Identifiable");
    });
  });
});
