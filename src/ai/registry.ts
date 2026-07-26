/**
 * AI Provider Registry
 *
 * Manages AI providers and allows runtime selection/swapping.
 * Providers can be registered, unregistered, and selected at runtime.
 * This enables the system to start with one provider and switch later
 * without architectural changes.
 */

import type { AIProvider } from "./provider";
import type { AIProviderConfig, AIProviderId, AIProviderCapability } from "./types";

type ProviderConstructor = new () => AIProvider;

class ProviderRegistry {
  private providers = new Map<string, AIProvider>();
  private constructors = new Map<string, ProviderConstructor>();
  private activeProviderId: string | null = null;

  /**
   * Register a provider constructor. The provider is not instantiated until
   * `initialize()` is called.
   */
  register(id: string, ctor: ProviderConstructor): void {
    if (this.constructors.has(id)) {
      console.warn(`[AI Registry] Overwriting existing provider: ${id}`);
    }
    this.constructors.set(id, ctor);
  }

  /**
   * Unregister a provider constructor and destroy its instance if active.
   */
  unregister(id: string): void {
    this.constructors.delete(id);
    const instance = this.providers.get(id);
    if (instance) {
      instance.destroy().catch(console.error);
      this.providers.delete(id);
    }
    if (this.activeProviderId === id) {
      this.activeProviderId = null;
    }
  }

  /**
   * Initialize a provider with the given config.
   */
  async initialize(config: AIProviderConfig): Promise<AIProvider> {
    const ctor = this.constructors.get(config.id);
    if (!ctor) {
      throw new Error(`[AI Registry] Unknown provider: ${config.id}`);
    }

    // Destroy existing instance if re-initializing
    const existing = this.providers.get(config.id);
    if (existing) {
      await existing.destroy();
    }

    const provider = new ctor();
    await provider.initialize(config);
    this.providers.set(config.id, provider);

    if (!this.activeProviderId) {
      this.activeProviderId = config.id;
    }

    return provider;
  }

  /**
   * Get a provider instance by ID.
   */
  getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Get the currently active provider.
   */
  getActiveProvider(): AIProvider | undefined {
    if (!this.activeProviderId) return undefined;
    return this.providers.get(this.activeProviderId);
  }

  /**
   * Set the active provider by ID.
   */
  setActiveProvider(id: string): void {
    if (!this.providers.has(id)) {
      throw new Error(`[AI Registry] Provider not initialized: ${id}`);
    }
    this.activeProviderId = id;
  }

  /**
   * Get all registered provider IDs.
   */
  getRegisteredProviders(): string[] {
    return Array.from(this.constructors.keys());
  }

  /**
   * Get all initialized provider IDs.
   */
  getInitializedProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get providers that support a given capability.
   */
  getProvidersByCapability(capability: AIProviderCapability): AIProvider[] {
    return Array.from(this.providers.values()).filter((p) =>
      p.getCapabilities().includes(capability)
    );
  }

  /**
   * Check if any provider supports a capability.
   */
  hasCapability(capability: AIProviderCapability): boolean {
    return this.getProvidersByCapability(capability).length > 0;
  }

  /**
   * Get the active provider's capabilities.
   */
  getActiveCapabilities(): AIProviderCapability[] {
    return this.getActiveProvider()?.getCapabilities() ?? [];
  }

  /**
   * Destroy all provider instances.
   */
  async destroyAll(): Promise<void> {
    for (const [id, provider] of this.providers) {
      try {
        await provider.destroy();
      } catch (err) {
        console.error(`[AI Registry] Error destroying provider ${id}:`, err);
      }
    }
    this.providers.clear();
    this.activeProviderId = null;
  }
}

/**
 * Singleton registry instance.
 */
export const providerRegistry = new ProviderRegistry();
