// ============================================================
// TrafficWatch AI — AnimatedCounter Component
//
// Smoothly animates numeric values from 0 → target using
// requestAnimationFrame for buttery-smooth transitions.
// Supports prefixes (e.g. "$", "+"), suffixes ("%", "m"),
// and custom formatting.
// ============================================================

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  /** Target value to count up/down to */
  value: number;
  /** Duration of animation in ms (default: 1000) */
  duration?: number;
  /** Delay before starting animation (ms) */
  delay?: number;
  /** Optional prefix (e.g. "+", "$") */
  prefix?: string;
  /** Optional suffix (e.g. "%", "m") */
  suffix?: string;
  /** Number of decimal places (default: 0) */
  decimals?: number;
  /** Format as compact number (e.g. 1,247) */
  compact?: boolean;
  /** CSS class overrides */
  className?: string;
  /** Trigger animation on mount */
  animateOnMount?: boolean;
  /** Separator for thousands (default: ",") */
  separator?: string;
  /** Framer-motion-like ease: "easeOut" | "linear" | "easeInOut" */
  easing?: "easeOut" | "linear" | "easeInOut";
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  delay = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
  compact = false,
  className = "",
  animateOnMount = true,
  separator = ",",
  easing = "easeOut",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(animateOnMount ? 0 : value);
  const previousValueRef = useRef(animateOnMount ? 0 : value);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(animateOnMount ? 0 : value);

  useEffect(() => {
    // If the value hasn't changed, skip animation
    if (value === previousValueRef.current) return;

    const startValue = previousValueRef.current;
    startValueRef.current = startValue;
    previousValueRef.current = value;

    // Cancel any running animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const easeFn = easing === "easeOut" ? easeOutCubic :
      easing === "easeInOut" ? easeInOutCubic :
      (t: number) => t; // linear

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeFn(progress);

      const current = startValue + (value - startValue) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        startTimeRef.current = null;
      }
    };

    // Apply delay
    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        animationRef.current = requestAnimationFrame(animate);
      }, delay);
      return () => {
        clearTimeout(timeoutId);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value, duration, delay, decimals, easing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const formatNumber = (num: number): string => {
    if (compact) {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
      if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    }

    const fixed = num.toFixed(decimals);
    const parts = fixed.split(".");

    // Add thousands separator
    if (separator) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    }

    return parts.join(".");
  };

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}{formatNumber(displayValue)}{suffix}
    </span>
  );
}
