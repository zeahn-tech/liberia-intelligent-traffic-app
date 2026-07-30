/**
 * AI Providers — Index & Auto-Registration
 *
 * All available providers are exported and auto-registered with the
 * providerRegistry on first import. This ensures providers are ready
 * for runtime selection without manual registration steps.
 *
 * To add a new provider:
 * 1. Create your provider file (e.g., custom-provider.ts)
 * 2. Import it below
 * 3. Add it to the providers array
 *
 * The registry allows runtime switching between providers,
 * so the application never needs to be rebuilt to change AI providers.
 */

import { providerRegistry } from "../registry";
import { VlyAIProvider } from "./vly-provider";
import { GeminiProvider } from "./gemini-provider";
import { OpenAIProvider } from "./openai-provider";
import { FutureTrafficVisionProvider } from "./future-traffic-vision-provider";

// ===== Auto-Register All Providers =====
// Providers are registered lazily — the constructor is stored, not called,
// until initialize() is invoked with credentials.

providerRegistry.register("vly", VlyAIProvider);
providerRegistry.register("gemini", GeminiProvider);
providerRegistry.register("openai", OpenAIProvider);
providerRegistry.register("custom", FutureTrafficVisionProvider);

console.info(
  `[AI Providers] Registered ${providerRegistry.getRegisteredProviders().length} providers:`,
  providerRegistry.getRegisteredProviders().join(", ")
);

// ===== Re-exports =====

export { VlyAIProvider } from "./vly-provider";
export { GeminiProvider } from "./gemini-provider";
export { OpenAIProvider } from "./openai-provider";
export { FutureTrafficVisionProvider } from "./future-traffic-vision-provider";

export { providerRegistry } from "../registry";
