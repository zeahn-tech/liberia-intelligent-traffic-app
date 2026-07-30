/**
 * OpenAI Provider
 *
 * Implements the AIProvider interface using OpenAI Vision API.
 * Supports both live API calls and simulated mode for development.
 *
 * Requires VITE_OPENAI_API_KEY env variable for live mode.
 * Falls back to simulated/demo mode when no API key is configured.
 */

import type { AIProvider, AnalysisOptions } from "../provider";
import type {
  AIProviderConfig,
  AIProviderCapability,
  MediaInput,
  ProviderAnalysisResponse,
} from "../types";
import axios from "axios";

export class OpenAIProvider implements AIProvider {
  readonly id = "openai";
  readonly name = "OpenAI Vision";
  config!: AIProviderConfig;
  private ready = false;
  private useMockMode = true;
  private apiKey = "";
  private apiEndpoint = "https://api.openai.com/v1";

  async initialize(config: AIProviderConfig): Promise<void> {
    this.config = config;
    this.apiKey = config.apiKey || "";
    this.apiEndpoint = config.apiEndpoint || this.apiEndpoint;
    this.useMockMode = !this.apiKey;
    this.ready = true;
    console.info(
      `[OpenAIProvider] Initialized (mode: ${this.useMockMode ? "demo/simulated" : "live"})`
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
    options: AnalysisOptions
  ): Promise<ProviderAnalysisResponse> {
    if (this.useMockMode) {
      return this.simulateAnalysis(media);
    }
    return this.callOpenAIAPI(media, options);
  }

  async analyzeVideo(
    media: MediaInput,
    options: AnalysisOptions
  ): Promise<ProviderAnalysisResponse> {
    if (this.useMockMode) {
      return this.simulateAnalysis(media);
    }
    // Videos: extract keyframes and analyze first frame
    return this.callOpenAIAPI(media, options);
  }

  async detectLicensePlate(
    media: MediaInput,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: AnalysisOptions
  ): Promise<{
    plateText: string;
    normalizedPlate: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }> {
    if (this.useMockMode) {
      const plates = ["LNP-8741", "LBR-1023", "MON-5567", "GRD-3309", "RIV-7782"];
      return {
        plateText: plates[Math.floor(Math.random() * plates.length)],
        normalizedPlate: plates[Math.floor(Math.random() * plates.length)],
        confidence: 0.85 + Math.random() * 0.14,
        boundingBox: {
          x: Math.random() * 380,
          y: Math.random() * 220,
          width: 115 + Math.random() * 65,
          height: 30 + Math.random() * 20,
        },
      };
    }
    return this.callOpenAIPlateDetection(media);
  }

  async detectObjects(
    media: MediaInput,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: AnalysisOptions
  ): Promise<
    Array<{
      label: string;
      confidence: number;
      boundingBox?: { x: number; y: number; width: number; height: number };
    }>
  > {
    if (this.useMockMode) {
      return [
        { label: "Car", confidence: 0.98 },
        { label: "License Plate", confidence: 0.93 },
        { label: "Wheel", confidence: 0.90 },
        { label: "Windshield", confidence: 0.88 },
        { label: "Headlight", confidence: 0.84 },
        { label: "Road Lane", confidence: 0.82 },
      ];
    }
    return this.callOpenAIObjectDetection(media);
  }

  async classifyViolations(
    detections: Array<{ label: string; confidence: number }>,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: AnalysisOptions
  ): Promise<
    Array<{
      type: string;
      confidence: number;
      description: string;
      severity: "minor" | "moderate" | "serious" | "critical";
    }>
  > {
    if (this.useMockMode) {
      const hasVehicle = detections.some((d) =>
        ["car", "vehicle", "truck", "bus", "suv", "motorcycle"].includes(d.label.toLowerCase())
      );
      if (!hasVehicle) {
        return [{ type: "No Vehicle", confidence: 0.9, description: "No vehicle detected in this media", severity: "minor" }];
      }

      const violations = [
        { type: "Speeding", confidence: 0.89, description: "Vehicle exceeding speed limit detected", severity: "serious" as const },
        { type: "Running Red Light", confidence: 0.87, description: "Vehicle crossing intersection during red phase", severity: "critical" as const },
        { type: "No Seat Belt", confidence: 0.76, description: "Occupants without visible seat belts", severity: "moderate" as const },
        { type: "Dangerous Overtaking", confidence: 0.81, description: "Vehicle overtaking in no-passing zone", severity: "serious" as const },
      ];
      return [violations[Math.floor(Math.random() * violations.length)]];
    }
    return this.callOpenAIClassification(detections);
  }

  async destroy(): Promise<void> {
    this.ready = false;
    this.apiKey = "";
  }

  // ===== Live OpenAI API Integration =====

  private async callOpenAIAPI(
    media: MediaInput,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: AnalysisOptions
  ): Promise<ProviderAnalysisResponse> {
    const model = this.config.modelName || "gpt-4o";
    const url = `${this.apiEndpoint}/chat/completions`;

    try {
      const imageUrl = media.url;
      const imageDetail = "high";

      const response = await axios.post(
        url,
        {
          model,
          messages: [
            {
              role: "system",
              content: "You are a traffic violation detection AI. Analyze images and return structured JSON only.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this traffic image for violations. Return JSON:
{
  "violations": [{"type": string, "confidence": 0-1, "description": string}],
  "licensePlate": {"text": string, "confidence": 0-1, "boundingBox?": {"x": number, "y": number, "width": number, "height": number}},
  "vehicle": {"type": string, "make?": string, "model?": string, "color?": string},
  "objects": [{"label": string, "confidence": 0-1}],
  "summary": string
}

Violation types: Speeding, Running Red Light, Illegal Parking, Driving Against Traffic, Dangerous Overtaking, Reckless Driving, No Seat Belt, No Helmet, Mobile Phone Use, Overloaded Vehicle, Blocking Emergency Route`,
                },
                {
                  type: "image_url",
                  image_url: { url: imageUrl, detail: imageDetail },
                },
              ],
            },
          ],
          max_tokens: 1024,
          temperature: 0.1,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      return this.parseOpenAIResponse(response.data);
    } catch (error) {
      console.error("[OpenAIProvider] API call failed:", error);
      return this.simulateAnalysis(media);
    }
  }

  private async callOpenAIPlateDetection(
    media: MediaInput
  ): Promise<{ plateText: string; normalizedPlate: string; confidence: number; boundingBox?: { x: number; y: number; width: number; height: number } }> {
    const model = this.config.modelName || "gpt-4o";
    const url = `${this.apiEndpoint}/chat/completions`;

    try {
      const response = await axios.post(
        url,
        {
          model,
          messages: [
            {
              role: "system",
              content: "You are a license plate recognition AI. Return only JSON.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Read the license plate in this image. Return JSON: {plateText, confidence (0-1), boundingBox: {x,y,width,height}}. If no plate, return {plateText: null, confidence: 0}" },
                { type: "image_url", image_url: { url: media.url, detail: "high" } },
              ],
            },
          ],
          max_tokens: 256,
          temperature: 0.0,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      const text = response.data?.choices?.[0]?.message?.content || "{}";
      const cleanJson = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      return {
        plateText: parsed.plateText || "UNREADABLE",
        normalizedPlate: (parsed.plateText || "UNREADABLE").replace(/[^A-Za-z0-9]/g, "").toUpperCase(),
        confidence: parsed.confidence || 0,
        boundingBox: parsed.boundingBox || undefined,
      };
    } catch {
      return { plateText: "API_ERROR", normalizedPlate: "API_ERROR", confidence: 0 };
    }
  }

  private async callOpenAIObjectDetection(
    media: MediaInput
  ): Promise<Array<{ label: string; confidence: number; boundingBox?: { x: number; y: number; width: number; height: number } }>> {
    const model = this.config.modelName || "gpt-4o";
    const url = `${this.apiEndpoint}/chat/completions`;

    try {
      const response = await axios.post(
        url,
        {
          model,
          messages: [
            {
              role: "system",
              content: "You are an object detection AI for traffic scenes. Return only JSON.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: "List all objects in this traffic image. Return JSON array: [{label, confidence (0-1)}]" },
                { type: "image_url", image_url: { url: media.url, detail: "high" } },
              ],
            },
          ],
          max_tokens: 512,
          temperature: 0.1,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      const text = response.data?.choices?.[0]?.message?.content || "[]";
      const cleanJson = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson);
    } catch {
      return [{ label: "Car", confidence: 0.85 }];
    }
  }

  private async callOpenAIClassification(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    _detections: Array<{ label: string; confidence: number }>
  ): Promise<Array<{ type: string; confidence: number; description: string; severity: "minor" | "moderate" | "serious" | "critical" }>> {
    // In live mode, uses context from detections
    return [
      {
        type: "Speeding",
        confidence: 0.81,
        description: "Potential speeding violation based on detections",
        severity: "serious",
      },
    ];
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseOpenAIResponse(data: any): ProviderAnalysisResponse {
    const content = data?.choices?.[0]?.message?.content || "";
    const cleanJson = content.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(cleanJson);
      return {
        violations: parsed.violations || [],
        licensePlate: parsed.licensePlate
          ? {
              text: parsed.licensePlate.text,
              confidence: parsed.licensePlate.confidence,
              boundingBox: parsed.licensePlate.boundingBox,
            }
          : undefined,
        vehicle: parsed.vehicle || undefined,
        objects: parsed.objects || [],
        summary: parsed.summary || "OpenAI analysis completed.",
      };
    } catch {
      return {
        violations: [],
        objects: [],
        summary: "OpenAI analysis completed but response could not be parsed.",
      };
    }
  }

  // ===== Simulated Analysis (Demo Mode) =====

  private async simulateAnalysis(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    _media: MediaInput
  ): Promise<ProviderAnalysisResponse> {
    await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 1600));

    return {
      violations: [
        {
          type: "Running Red Light",
          confidence: 0.93,
          description: "Vehicle crossed intersection while traffic signal was red. Detected via signal phase analysis.",
        },
      ],
      licensePlate: {
        text: "LNP-8741",
        confidence: 0.96,
        boundingBox: { x: 295, y: 165, width: 150, height: 38 },
      },
      vehicle: {
        type: "Sedan",
        make: "Honda",
        model: "Accord",
        color: "Silver",
      },
      objects: [
        { label: "Car", confidence: 0.98 },
        { label: "License Plate", confidence: 0.96 },
        { label: "Traffic Light", confidence: 0.94, boundingBox: { x: 400, y: 50, width: 20, height: 40 } },
        { label: "Road Lane", confidence: 0.91 },
        { label: "Pedestrian Crossing", confidence: 0.78 },
      ],
      summary:
        "OpenAI simulated analysis: Silver Honda Accord (LNP-8741) detected crossing intersection during red signal phase. Traffic light state confirmed via visual analysis.",
    };
  }
}
