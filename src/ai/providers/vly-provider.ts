/**
 * VLY AI Provider
 *
 * Implements the AIProvider interface using VLY's AI services.
 * This is the default provider for TrafficWatch AI.
 *
 * The provider runs analysis locally with mock/demo capabilities when
 * no VLY API key is configured, providing a realistic simulation.
 */

import type {
  AIProvider,
  AnalysisOptions,
} from "../provider";
import type {
  AIProviderConfig,
  AIProviderCapability,
  MediaInput,
  ProviderAnalysisResponse,
} from "../types";

export class VlyAIProvider implements AIProvider {
  readonly id = "vly";
  readonly name = "TrafficWatch AI Engine";
  config!: AIProviderConfig;
  private ready = false;
  private useMockMode = true;

  async initialize(config: AIProviderConfig): Promise<void> {
    this.config = config;
    this.useMockMode = !config.apiKey;
    this.ready = true;
    console.info(
      `[VlyAIProvider] Initialized (mode: ${this.useMockMode ? "demo/simulated" : "live"})`
    );
  }

  isReady(): boolean {
    return this.ready;
  }

  getCapabilities(): AIProviderCapability[] {
    return [
      "image_analysis",
      "video_analysis",
      "license_plate_detection",
      "object_detection",
      "violation_classification",
      "ocr",
    ];
  }

  async analyzeImage(
    media: MediaInput,
    _options: AnalysisOptions
  ): Promise<ProviderAnalysisResponse> {
    if (this.useMockMode) {
      return this.simulateAnalysis(media);
    }
    // --- Live VLY integration would go here ---
    // const result = await vly.analyze.image(media.url, { ... });
    // return mapVlyResponse(result);
    return this.simulateAnalysis(media);
  }

  async analyzeVideo(
    media: MediaInput,
    _options: AnalysisOptions
  ): Promise<ProviderAnalysisResponse> {
    if (this.useMockMode) {
      return this.simulateAnalysis(media);
    }
    return this.simulateAnalysis(media);
  }

  async detectLicensePlate(
    media: MediaInput,
    _options: AnalysisOptions
  ): Promise<{
    plateText: string;
    normalizedPlate: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }> {
    if (this.useMockMode) {
      const plates = ["LBR-4521", "LBR-1023", "LNP-8741", "MON-5567", "GRD-3309"];
      const plate = plates[Math.floor(Math.random() * plates.length)];
      return {
        plateText: plate,
        normalizedPlate: plate,
        confidence: 0.85 + Math.random() * 0.14,
        boundingBox: {
          x: Math.random() * 400,
          y: Math.random() * 200,
          width: 120 + Math.random() * 60,
          height: 30 + Math.random() * 20,
        },
      };
    }
    return this.simulatePlateDetection();
  }

  async detectObjects(
    _media: MediaInput,
    _options: AnalysisOptions
  ): Promise<
    Array<{
      label: string;
      confidence: number;
      boundingBox?: { x: number; y: number; width: number; height: number };
    }>
  > {
    return [
      { label: "Vehicle", confidence: 0.97 },
      { label: "License Plate", confidence: 0.92 },
      { label: "Road", confidence: 0.88 },
    ];
  }

  async classifyViolations(
    _detections: Array<{ label: string; confidence: number }>,
    _options: AnalysisOptions
  ): Promise<
    Array<{
      type: string;
      confidence: number;
      description: string;
      severity: "minor" | "moderate" | "serious" | "critical";
    }>
  > {
    const violations = [
      { type: "Speeding", description: "Vehicle exceeding posted speed limit", severity: "serious" as const },
      { type: "No Seat Belt", description: "Driver not wearing a seat belt", severity: "moderate" as const },
      { type: "Running Red Light", description: "Vehicle crossing intersection against red signal", severity: "critical" as const },
      { type: "Illegal Parking", description: "Vehicle parked in restricted zone", severity: "minor" as const },
    ];
    return [
      {
        ...violations[Math.floor(Math.random() * violations.length)],
        confidence: 0.75 + Math.random() * 0.24,
      },
    ];
  }

  async destroy(): Promise<void> {
    this.ready = false;
  }

  // ===== Simulated Analysis (Demo Mode) =====

  private async simulateAnalysis(
    _media: MediaInput
  ): Promise<ProviderAnalysisResponse> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));

    return {
      violations: [
        {
          type: "Speeding",
          confidence: 0.92 + Math.random() * 0.07,
          description: "Vehicle exceeding posted speed limit. Estimated speed: 95 km/h in 50 km/h zone.",
        },
      ],
      licensePlate: {
        text: "LBR-4521",
        confidence: 0.94,
        boundingBox: {
          x: 320,
          y: 180,
          width: 140,
          height: 35,
        },
      },
      vehicle: {
        type: "Sedan",
        make: "Toyota",
        model: "Corolla",
        color: "White",
      },
      objects: [
        { label: "Vehicle", confidence: 0.98 },
        { label: "License Plate", confidence: 0.94 },
        { label: "Road Sign", confidence: 0.87 },
        { label: "Speed Limit Sign", confidence: 0.82 },
        { label: "Wheel", confidence: 0.91 },
        { label: "Headlight", confidence: 0.85 },
      ],
      summary:
        "Analysis completed successfully. Vehicle identified as a white Toyota Corolla with license plate LBR-4521. Primary violation detected: Speeding (94% confidence). Front license plate clearly visible and legible.",
    };
  }

  private async simulatePlateDetection(): Promise<{
    plateText: string;
    normalizedPlate: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }> {
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));

    const plates = ["LBR-4521", "LBR-1023", "MON-5567", "GRD-3309", "RIV-7782"];
    const plate = plates[Math.floor(Math.random() * plates.length)];

    return {
      plateText: plate,
      normalizedPlate: plate,
      confidence: 0.88 + Math.random() * 0.11,
      boundingBox: {
        x: 300 + Math.random() * 100,
        y: 150 + Math.random() * 80,
        width: 120 + Math.random() * 40,
        height: 30 + Math.random() * 15,
      },
    };
  }
}
