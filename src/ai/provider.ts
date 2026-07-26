/**
 * AIProvider Interface
 *
 * TrafficWatch AI uses an abstract provider pattern. All AI/ML providers
 * (VLY, Gemini, OpenAI, custom) must implement this interface.
 *
 * This ensures providers can be swapped at configuration time without
 * changing the analysis pipeline or UI code.
 */

import type {
  AIProviderConfig,
  AIProviderCapability,
  MediaInput,
  ProviderAnalysisResponse,
} from "./types";

/**
 * Options passed to an analysis call.
 */
export interface AnalysisOptions {
  incidentId: string;
  evidenceId?: string;
  signal?: AbortSignal;
  onProgress?: (percent: number, message: string) => void;
}

/**
 * Every AI provider must export a default class implementing this interface.
 */
export interface AIProvider {
  /** Unique identifier (e.g. "vly", "gemini", "openai") */
  readonly id: string;

  /** Human-readable display name */
  readonly name: string;

  /** The provider's configuration */
  readonly config: AIProviderConfig;

  /** Initialize the provider (load keys, models, etc.) */
  initialize(config: AIProviderConfig): Promise<void>;

  /** Check if the provider is ready and authenticated */
  isReady(): boolean;

  /** List of capabilities this provider supports */
  getCapabilities(): AIProviderCapability[];

  /**
   * Analyze a single image for traffic violations.
   * Returns structured analysis results.
   */
  analyzeImage(
    media: MediaInput,
    options: AnalysisOptions
  ): Promise<ProviderAnalysisResponse>;

  /**
   * Analyze a video for traffic violations.
   * May process keyframes or use video-specific models.
   */
  analyzeVideo(
    media: MediaInput,
    options: AnalysisOptions
  ): Promise<ProviderAnalysisResponse>;

  /**
   * Detect and read license plates from an image.
   * Returns normalized plate text with confidence.
   */
  detectLicensePlate(
    media: MediaInput,
    options: AnalysisOptions
  ): Promise<{
    plateText: string;
    normalizedPlate: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;

  /**
   * Detect objects in an image (vehicles, traffic signs, pedestrians, etc.).
   */
  detectObjects(
    media: MediaInput,
    options: AnalysisOptions
  ): Promise<
    Array<{
      label: string;
      confidence: number;
      boundingBox?: { x: number; y: number; width: number; height: number };
    }>
  >;

  /**
   * Classify traffic violations from detection results.
   */
  classifyViolations(
    detections: Array<{ label: string; confidence: number }>,
    options: AnalysisOptions
  ): Promise<
    Array<{
      type: string;
      confidence: number;
      description: string;
      severity: "minor" | "moderate" | "serious" | "critical";
    }>
  >;

  /**
   * Clean up any resources held by the provider.
   */
  destroy(): Promise<void>;
}
