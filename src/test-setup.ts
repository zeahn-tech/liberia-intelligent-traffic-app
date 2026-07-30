// ─── Test Setup for TrafficWatch AI ─────────────────────
// Provides mocks for browser APIs and Supabase client

// Polyfill IndexedDB for testing offline/sync operations
import "fake-indexeddb/auto";

// Mock navigator.onLine
Object.defineProperty(globalThis, "navigator", {
  value: {
    onLine: true,
    userAgent: "node-test",
  },
  writable: true,
  configurable: true,
});

// Mock window with addEventListener and other common DOM methods
const mockWindowListeners = new Map<string, Set<() => void>>();

Object.defineProperty(globalThis, "window", {
  value: {
    location: {
      href: "http://localhost:5173",
      reload: () => {},
    },
    history: {
      back: () => {},
    },
    addEventListener: (type: string, cb: () => void) => {
      if (!mockWindowListeners.has(type)) mockWindowListeners.set(type, new Set());
      mockWindowListeners.get(type)!.add(cb);
    },
    removeEventListener: (type: string, cb: () => void) => {
      mockWindowListeners.get(type)?.delete(cb);
    },
  },
  writable: true,
  configurable: true,
});

// Mock console.warn to reduce noise during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  // Suppress Supabase mock warnings during tests
  if (typeof args[0] === "string" && args[0].includes("[Supabase]")) return;
  originalWarn.call(console, ...args);
};
