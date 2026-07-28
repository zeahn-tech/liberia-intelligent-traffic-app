// ============================================================
// TrafficWatch AI — useReducedMotion Hook
//
// Respects the user's prefers-reduced-motion system setting.
// Returns true when animations should be disabled.
// Components can use this to conditionally disable:
//   - CSS transitions/animations
//   - Framer Motion animations
//   - Auto-scrolling behaviors
//   - Ping/pulse indicators
// ============================================================

import { useState, useEffect } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Returns true when the user prefers reduced motion.
 * Components should skip or simplify animations when true.
 *
 * Usage:
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 * const animationProps = prefersReducedMotion
 *   ? { initial: false, animate: {} }
 *   : { initial: { opacity: 0 }, animate: { opacity: 1 } };
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(QUERY);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns animation props that respect reduced motion.
 * Pass your normal animation props, and this will strip
 * animations when the user prefers reduced motion.
 */
export function useAccessibleMotion<T extends Record<string, unknown>>(
  normalProps: T,
  reducedProps?: Partial<T>
): T {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return { ...normalProps, ...reducedProps } as T;
  }

  return normalProps;
}

/**
 * Hook to control ping/pulse animations.
 * Returns false when user prefers reduced motion.
 */
export function usePingAnimation(): boolean {
  return !useReducedMotion();
}
