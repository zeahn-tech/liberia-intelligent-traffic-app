// ============================================================
// TrafficWatch AI — VisuallyHidden (Screen-Reader Only) Component
//
// Renders content that is visually hidden but accessible to
// screen readers and assistive technology.
//
// Use for:
//   - Additional context for screen readers
//   - Icon-only button labels (when aria-label feels wrong)
//   - Descriptive text that would clutter the visual UI
//   - Keyboard shortcut hints
// ============================================================

import * as React from "react";

interface VisuallyHiddenProps {
  children: React.ReactNode;
  /** Optionally make focusable (e.g. skip links) */
  focusable?: boolean;
  /** Optional: show on focus (for skip links) */
  showOnFocus?: boolean;
  className?: string;
}

/**
 * VisuallyHidden — Content hidden from sight but available
 * to screen readers and assistive technology.
 *
 * Basic usage:
 * ```tsx
 * <button>
 *   <SearchIcon />
 *   <VisuallyHidden>Search incidents</VisuallyHidden>
 * </button>
 * ```
 *
 * Skip-to-content usage:
 * ```tsx
 * <VisuallyHidden focusable showOnFocus as="a" href="#main-content">
 *   Skip to main content
 * </VisuallyHidden>
 * ```
 */
export function VisuallyHidden({
  children,
  focusable = false,
  showOnFocus = false,
  className = "",
}: VisuallyHiddenProps) {
  const baseClass = focusable && showOnFocus
    ? "sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-background focus:text-foreground focus:z-50 focus:left-4 focus:top-4 focus:rounded-lg focus:shadow-lg"
    : "sr-only";

  return (
    <span className={`${baseClass} ${className}`}>
      {children}
    </span>
  );
}

/**
 * AccessibleIcon — Wraps an icon with proper aria-hidden
 * and an sr-only label.
 *
 * Usage:
 * ```tsx
 * <AccessibleIcon label="Close dialog">
 *   <XIcon />
 * </AccessibleIcon>
 * ```
 */
export function AccessibleIcon({
  children,
  label,
}: {
  children: React.ReactElement;
  label: string;
}) {
  return (
    <>
      {React.cloneElement(children, {
        "aria-hidden": true,
        focusable: "false", // for SVG
      } as React.HTMLAttributes<HTMLElement>)}
      <VisuallyHidden>{label}</VisuallyHidden>
    </>
  );
}

/**
 * LiveRegion — A region that announces dynamic content to
 * screen readers without moving focus.
 *
 * Usage:
 * ```tsx
 * <LiveRegion>
 *   {error && `Error: ${error}`}
 * </LiveRegion>
 * ```
 */
export function LiveRegion({
  children,
  politeness = "polite",
  ...props
}: {
  children: React.ReactNode;
  politeness?: "polite" | "assertive";
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
      {...props}
    >
      {children}
    </div>
  );
}
