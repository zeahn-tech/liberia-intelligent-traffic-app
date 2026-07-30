// ============================================================
// TrafficWatch AI — Query Cache Layer
//
// Prevents redundant Supabase queries by caching results:
// - In-memory request deduplication (same params = same promise)
// - IndexedDB persistence with configurable TTL
// - Automatic cache invalidation on write operations
// - Batch query deduplication for list endpoints
// ============================================================

import { setCache, getCache } from "@/lib/offline";
import type { ApiResponse } from "@/services/base";

// ─── In-memory deduplication ───────────────────────────

interface PendingRequest {
  promise: Promise<unknown>;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest>();

// Track which entity types have been invalidated
const invalidatedKeys = new Set<string>();

// ─── Cache Configuration ───────────────────────────────

export interface CacheConfig {
  /** Time-to-live in minutes (default: 5) */
  ttlMinutes?: number;
  /** Skip in-memory deduplication */
  skipDedup?: boolean;
  /** Skip IndexedDB persistence */
  skipPersist?: boolean;
  /** Force fresh fetch (skip all caches) */
  forceFresh?: boolean;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttlMinutes: 5,
  skipDedup: false,
  skipPersist: false,
  forceFresh: false,
};

// ─── Cache Key Generation ─────────────────────────────

function buildCacheKey(
  entityType: string,
  params: Record<string, unknown>
): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${JSON.stringify(params[key])}`)
    .join("&");
  return `query:${entityType}:${sorted}`;
}

// ─── Core Cached Query Executor ───────────────────────

/**
 * Execute a Supabase query with caching layers:
 * 1. Returns in-flight promise for deduplication
 * 2. Checks IndexedDB cache (if available)
 * 3. Fetches from Supabase
 * 4. Persists result to IndexedDB
 *
 * IMPORTANT: Only use for READ operations (SELECT, RPC calls).
 * WRITE operations should call invalidateQueryCache() after.
 */
export async function cachedQuery<T>(
  entityType: string,
  params: Record<string, unknown>,
  queryFn: () => Promise<ApiResponse<T>>,
  config: CacheConfig = {}
): Promise<ApiResponse<T>> {
  const cfg = { ...DEFAULT_CACHE_CONFIG, ...config };
  const cacheKey = buildCacheKey(entityType, params);

  // ── 1. Force fresh: skip all caches ──
  if (cfg.forceFresh) {
    const result = await queryFn();
    if (result.success && result.data && !cfg.skipPersist) {
      await setCache(cacheKey, result.data, cfg.ttlMinutes!).catch(() => {});
    }
    return result;
  }

  // ── 2. Check invalidation ──
  if (invalidatedKeys.has(entityType)) {
    invalidatedKeys.delete(entityType);
    // Skip cache — it was invalidated
    const result = await queryFn();
    if (result.success && result.data && !cfg.skipPersist) {
      await setCache(cacheKey, result.data, cfg.ttlMinutes!).catch(() => {});
    }
    return result;
  }

  // ── 3. In-memory deduplication ──
  if (!cfg.skipDedup) {
    const pending = pendingRequests.get(cacheKey);
    if (pending && Date.now() - pending.timestamp < 5000) {
      // Return the same in-flight promise
      return pending.promise as Promise<ApiResponse<T>>;
    }
  }

  // ── 4. Check IndexedDB cache ──
  if (!cfg.skipPersist && !cfg.skipDedup) {
    const cached = await getCache<T>(cacheKey).catch(() => null);
    if (cached !== null) {
      return { success: true, data: cached, error: null };
    }
  }

  // ── 5. Execute query ──
  const promise = queryFn();

  // Track in-flight request for dedup
  if (!cfg.skipDedup) {
    pendingRequests.set(cacheKey, {
      promise,
      timestamp: Date.now(),
    });
  }

  let result: ApiResponse<T>;
  try {
    result = await promise;
  } finally {
    // Clean up in-flight tracking (with slight delay to catch rapid re-requests)
    setTimeout(() => {
      pendingRequests.delete(cacheKey);
    }, 1000);
  }

  // ── 6. Cache successful results ──
  if (result.success && result.data && !cfg.skipPersist) {
    await setCache(cacheKey, result.data, cfg.ttlMinutes!).catch(() => {});
  }

  return result;
}

// ─── Cache Invalidation ───────────────────────────────

/**
 * Invalidate cached queries for an entity type.
 * Call this after any CREATE, UPDATE, or DELETE operation
 * to ensure stale data isn't served.
 */
export function invalidateQueryCache(entityType: string): void {
  invalidatedKeys.add(entityType);
}

/**
 * Invalidate multiple entity types at once.
 */
export function invalidateQueryCaches(entityTypes: string[]): void {
  entityTypes.forEach((type) => invalidatedKeys.add(type));
}

// ─── Cache-Aware Query Helpers ────────────────────────

/**
 * Creates a cached single-record fetch function.
 * Usage: const incidentQuery = createCachedGetter("incidents", (id) => ...)
 */
export function createCachedGetter<T>(
  entityType: string,
  fetchFn: (id: string) => Promise<ApiResponse<T>>
): (id: string, config?: CacheConfig) => Promise<ApiResponse<T>> {
  return (id: string, config?: CacheConfig) =>
    cachedQuery<T>(
      entityType,
      { id },
      () => fetchFn(id),
      config
    );
}

// ─── Performance Monitoring ───────────────────────────

/**
 * Track query performance with User Timing API marks.
 * Enables performance measurement in browser DevTools.
 */
export function markQueryStart(label: string): string {
  const markName = `query:${label}:${Date.now()}`;
  performance.mark(markName);
  return markName;
}

export function markQueryEnd(startMark: string, metadata?: Record<string, unknown>): number {
  const endMark = `${startMark}:end`;
  performance.mark(endMark);
  performance.measure(`⏱ ${startMark}`, startMark, endMark);

  const entries = performance.getEntriesByName(`⏱ ${startMark}`);
  const duration = entries.length > 0 ? entries[entries.length - 1].duration : 0;

  // Clean up marks
  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(`⏱ ${startMark}`);

  if (duration > 500) {
    console.warn(`[Perf] Slow query: ${startMark} took ${duration.toFixed(0)}ms`, metadata);
  }

  return duration;
}

/**
 * Wrap a query function with performance tracking.
 */
export function withPerfTracking<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const mark = markQueryStart(label);
  return fn().finally(() => markQueryEnd(mark));
}
