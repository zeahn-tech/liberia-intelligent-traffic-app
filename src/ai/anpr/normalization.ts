/**
 * ANPR Plate Text Normalization
 *
 * Handles:
 * - Plate text cleaning (removing noise, standardizing characters)
 * - Format detection and validation
 * - OCR error correction (common misreads)
 * - Multiple region/format support
 */

import type { PlateFormat, PlateNormalizationRule, PlateDetectionResult } from "./types";
import { KNOWN_PLATE_FORMATS } from "./types";

// ===== Common OCR Substitution Errors =====
// These are characters commonly misread by OCR

const OCR_SUBSTITUTIONS: Record<string, string> = {
  O: "0",
  I: "1",
  L: "1",
  Z: "2",
  S: "5",
  B: "8",
  G: "6",
  Q: "0",
  D: "0",
  // Reverse
  "0": "O",
  "1": "I",
  "2": "Z",
  "5": "S",
  "8": "B",
  "6": "G",
};

const OCR_SUBSTITUTIONS_REVERSE: Record<string, string> = {};
for (const [k, v] of Object.entries(OCR_SUBSTITUTIONS)) {
  OCR_SUBSTITUTIONS_REVERSE[v] = k;
}

// ===== Normalization Rules =====

const DEFAULT_RULES: PlateNormalizationRule[] = [
  {
    pattern: /\s+/g,
    replacement: "",
    description: "Remove all whitespace",
  },
  {
    pattern: /[^A-Za-z0-9-]/g,
    replacement: "",
    description: "Remove non-alphanumeric characters except hyphens",
  },
  {
    pattern: /-+/g,
    replacement: "-",
    description: "Collapse multiple hyphens into one",
  },
  {
    pattern: /^[-]+|[-]+$/g,
    replacement: "",
    description: "Remove leading/trailing hyphens",
  },
];

// ===== Main Export Functions =====

/**
 * Normalize a raw plate text string.
 * Converts to uppercase, removes noise, and applies format rules.
 */
export function normalizePlateText(raw: string): string {
  if (!raw || raw.trim().length === 0) return "";

  let text = raw.toUpperCase().trim();

  // Apply default normalization rules
  for (const rule of DEFAULT_RULES) {
    text = text.replace(rule.pattern, rule.replacement);
  }

  return text;
}

/**
 * Attempt to correct common OCR errors in plate text.
 * Tries multiple substitution strategies and returns the most likely
 * valid plate format.
 */
export function correctOCRErrors(raw: string): {
  corrected: string;
  confidence: number;
  corrections: Array<{ original: string; corrected: string; reason: string }>;
} {
  const text = raw.toUpperCase().trim();
  const corrections: Array<{
    original: string;
    corrected: string;
    reason: string;
  }> = [];

  if (!text) {
    return { corrected: "", confidence: 0, corrections: [] };
  }

  // Try direct normalization first
  const normalized = normalizePlateText(text);
  if (isValidPlateFormat(normalized)) {
    return { corrected: normalized, confidence: 0.95, corrections: [] };
  }

  // Try character substitutions
  let attempt = text;
  let changed = false;

  // Try substituting characters that look similar
  const characters = attempt.split("");
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const substitute = OCR_SUBSTITUTIONS[char] || OCR_SUBSTITUTIONS_REVERSE[char];
    if (substitute) {
      const testChars = [...characters];
      testChars[i] = substitute;
      const testText = normalizePlateText(testChars.join(""));
      if (isValidPlateFormat(testText) && isValidPlateFormat(testText) !== isValidPlateFormat(attempt)) {
        corrections.push({
          original: char,
          corrected: substitute,
          reason: `OCR confusion: '${char}' → '${substitute}'`,
        });
        attempt = testText;
        changed = true;
        break;
      }
    }
  }

  // If still no valid format, try the normalized version
  if (!changed) {
    return {
      corrected: normalized,
      confidence: 0.6,
      corrections: [{ original: text, corrected: normalized, reason: "Applied default normalization" }],
    };
  }

  return {
    corrected: attempt,
    confidence: changed ? 0.8 : 0.6,
    corrections,
  };
}

/**
 * Check if a plate text matches a known valid format.
 */
export function isValidPlateFormat(plateText: string): boolean {
  if (!plateText) return false;
  return KNOWN_PLATE_FORMATS.some((fmt) => fmt.pattern.test(plateText));
}

/**
 * Detect the plate format for a given plate text.
 * Returns null if no known format matches.
 */
export function detectPlateFormat(plateText: string): PlateFormat | null {
  if (!plateText) return null;
  return KNOWN_PLATE_FORMATS.find((fmt) => fmt.pattern.test(plateText)) || null;
}

/**
 * Get all possible plate variations for a detection result.
 * Used for fuzzy matching in repeat offender search.
 */
export function getPlateVariations(plateText: string): string[] {
  const normalized = normalizePlateText(plateText);
  const variations = new Set<string>([normalized]);

  // Remove hyphens
  variations.add(normalized.replace(/-/g, ""));

  // Add with different hyphen positions
  if (normalized.includes("-")) {
    variations.add(normalized.replace("-", ""));
    variations.add(normalized.replace("-", " "));
  }

  // Common Liberia formats
  const match = normalized.match(/^([A-Z]{3})-?(\d{4})$/);
  if (match) {
    variations.add(`${match[1]}-${match[2]}`);
    variations.add(`${match[1]}${match[2]}`);
  }

  return Array.from(variations);
}

/**
 * Calculate a similarity score between two plate texts.
 * Returns 0-1 where 1 is an exact match.
 */
export function plateSimilarity(a: string, b: string): number {
  const normA = normalizePlateText(a);
  const normB = normalizePlateText(b);

  if (normA === normB) return 1.0;

  // Remove hyphens and compare
  const strippedA = normA.replace(/-/g, "");
  const strippedB = normB.replace(/-/g, "");
  if (strippedA === strippedB) return 0.9;

  // Levenshtein distance for partial matches
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(normA, normB);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Levenshtein edit distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Build a comprehensive PlateDetectionResult from raw OCR text.
 */
export function buildPlateResult(rawText: string, confidence: number): PlateDetectionResult {
  const corrected = correctOCRErrors(rawText);
  const normalized = normalizePlateText(corrected.corrected);
  const format = detectPlateFormat(normalized);

  return {
    rawText,
    normalizedPlate: normalized,
    confidence: Math.min(confidence, corrected.confidence),
    region: format?.country,
    countryCode: format?.country,
    officerVerified: false,
  };
}
