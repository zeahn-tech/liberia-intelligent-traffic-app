// ============================================================
// TrafficWatch AI — Responsive Breakpoint Hooks
//
// Provides granular viewport detection:
// - useIsMobile() — < 768px (phones)
// - useIsTablet() — 768px–1023px
// - useIsDesktop() — 1024px–1599px
// - useIsLargeDesktop() — 1600px–1919px
// - useIsCommandCenter() — 1920px+ (large command displays)
// - useResponsive() — returns all breakpoints + orientation
// ============================================================

import * as React from "react"

// ─── Breakpoints (matching Tailwind defaults) ───────────

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
  largeDesktop: 1600,
  commandCenter: 1920,
} as const;

type BreakpointName = keyof typeof BREAKPOINTS;

// ─── Simple Mobile Check ────────────────────────────────

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

// ─── Advanced Multi-Breakpoint Hook ─────────────────────

export interface ResponsiveInfo {
  /** Current viewport width (pixels) */
  width: number;
  /** Current viewport height (pixels) */
  height: number;
  /** True when width < 768px */
  isMobile: boolean;
  /** True when 768px ≤ width < 1024px */
  isTablet: boolean;
  /** True when 1024px ≤ width < 1600px */
  isDesktop: boolean;
  /** True when 1600px ≤ width < 1920px */
  isLargeDesktop: boolean;
  /** True when width ≥ 1920px (command-center displays) */
  isCommandCenter: boolean;
  /** True when width ≥ 1024px */
  isMinDesktop: boolean;
  /** True when width < 1024px */
  isMaxTablet: boolean;
  /** Portrait vs landscape orientation */
  orientation: "portrait" | "landscape";
  /** The largest active breakpoint name */
  activeBreakpoint: BreakpointName | "commandCenter";
  /** Touch-capable device (phone/tablet) */
  isTouchDevice: boolean;
}

/**
 * Granular responsive hook that returns all viewport states.
 * Use this when you need to make layout decisions based on
 * specific breakpoints (e.g., command-center large screens).
 */
export function useResponsive(): ResponsiveInfo {
  const [info, setInfo] = React.useState<ResponsiveInfo>(() => {
    if (typeof window === "undefined") {
      return {
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: false,
        isCommandCenter: false,
        isMinDesktop: true,
        isMaxTablet: false,
        orientation: "landscape",
        activeBreakpoint: "lg",
        isTouchDevice: false,
      };
    }

    const w = window.innerWidth;
    const h = window.innerHeight;

    return {
      width: w,
      height: h,
      isMobile: w < BREAKPOINTS.md,
      isTablet: w >= BREAKPOINTS.md && w < BREAKPOINTS.lg,
      isDesktop: w >= BREAKPOINTS.lg && w < BREAKPOINTS.largeDesktop,
      isLargeDesktop: w >= BREAKPOINTS.largeDesktop && w < BREAKPOINTS.commandCenter,
      isCommandCenter: w >= BREAKPOINTS.commandCenter,
      isMinDesktop: w >= BREAKPOINTS.lg,
      isMaxTablet: w < BREAKPOINTS.lg,
      orientation: w > h ? "landscape" : "portrait",
      activeBreakpoint: getBreakpointName(w),
      isTouchDevice: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    };
  });

  React.useEffect(() => {
    let rafId: number | null = null;

    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;

        setInfo({
          width: w,
          height: h,
          isMobile: w < BREAKPOINTS.md,
          isTablet: w >= BREAKPOINTS.md && w < BREAKPOINTS.lg,
          isDesktop: w >= BREAKPOINTS.lg && w < BREAKPOINTS.largeDesktop,
          isLargeDesktop: w >= BREAKPOINTS.largeDesktop && w < BREAKPOINTS.commandCenter,
          isCommandCenter: w >= BREAKPOINTS.commandCenter,
          isMinDesktop: w >= BREAKPOINTS.lg,
          isMaxTablet: w < BREAKPOINTS.lg,
          orientation: w > h ? "landscape" : "portrait",
          activeBreakpoint: getBreakpointName(w),
          isTouchDevice: "ontouchstart" in window || navigator.maxTouchPoints > 0,
        });
      });
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return info;
}

// ─── Individual Breakpoint Hooks ────────────────────────

/** True on tablets (768px–1023px) */
export function useIsTablet(): boolean {
  return useResponsive().isTablet;
}

/** True on desktops (1024px+) */
export function useIsDesktop(): boolean {
  return useResponsive().isMinDesktop;
}

/** True on large displays (1600px+) */
export function useIsLargeDesktop(): boolean {
  return useResponsive().isLargeDesktop;
}

/** True on command-center displays (1920px+) */
export function useIsCommandCenter(): boolean {
  return useResponsive().isCommandCenter;
}

// ─── Utility ────────────────────────────────────────────

function getBreakpointName(width: number): BreakpointName | "commandCenter" {
  if (width >= BREAKPOINTS.commandCenter) return "commandCenter";
  if (width >= BREAKPOINTS.largeDesktop) return "largeDesktop";
  if (width >= BREAKPOINTS["2xl"]) return "2xl";
  if (width >= BREAKPOINTS.xl) return "xl";
  if (width >= BREAKPOINTS.lg) return "lg";
  if (width >= BREAKPOINTS.md) return "md";
  return "sm";
}

// ─── CSS-in-JS Helpers ──────────────────────────────────

/**
 * Returns a responsive style map based on breakpoints.
 * Example usage:
 *   const styles = useResponsiveStyle({
 *     mobile: { flexDirection: "column" as const, gap: 8 },
 *     desktop: { flexDirection: "row" as const, gap: 16 },
 *   });
 */
export function useResponsiveStyle<T extends React.CSSProperties>(
  styles: Partial<Record<"mobile" | "tablet" | "desktop" | "commandCenter", T>>
): T {
  const { isMobile, isTablet, isDesktop, isCommandCenter } = useResponsive();

  return React.useMemo(() => {
    if (isCommandCenter && styles.commandCenter) return styles.commandCenter;
    if (isDesktop && styles.desktop) return styles.desktop;
    if (isTablet && styles.tablet) return styles.tablet;
    if (isMobile && styles.mobile) return styles.mobile;
    return (styles.desktop ?? styles.tablet ?? styles.mobile ?? {}) as T;
  }, [isMobile, isTablet, isDesktop, isCommandCenter, styles]);
}
