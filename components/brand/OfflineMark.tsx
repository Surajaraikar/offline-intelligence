"use client";

import { useId } from "react";

type OfflineMarkProps = {
  size?: number;
  className?: string;
  animated?: boolean;
  variant?: "full" | "mark-only" | "monochrome";
};

export function OfflineMark({ size = 36, className = "", animated = true, variant = "mark-only" }: OfflineMarkProps) {
  const gradientId = `offline-copper-${useId().replaceAll(":", "")}`;
  const monochrome = variant === "monochrome";
  return <span className={`offline-mark ${animated ? "offline-mark-animated" : ""} ${className}`} style={{ width: size, height: size }} aria-hidden="true">
    <svg viewBox="0 0 40 40" role="img">
      <defs><linearGradient id={gradientId} x1="7" y1="5" x2="33" y2="35" gradientUnits="userSpaceOnUse"><stop stopColor={monochrome ? "currentColor" : "#F2A467"} /><stop offset=".45" stopColor={monochrome ? "currentColor" : "#D7783D"} /><stop offset="1" stopColor={monochrome ? "currentColor" : "#A94E25"} /></linearGradient></defs>
      <circle className="offline-mark-bed" cx="20" cy="20" r="18.5" />
      <path className="offline-mark-outer" d="M30.8 9.2A15.3 15.3 0 0 1 35.2 20c0 8.4-6.8 15.2-15.2 15.2S4.8 28.4 4.8 20 11.6 4.8 20 4.8c2.1 0 4.1.4 5.9 1.2" stroke={`url(#${gradientId})`} />
      <path className="offline-mark-link" d="M11.1 23.1c2.7-7.7 9.2-11.4 17.7-6.2" stroke={`url(#${gradientId})`} />
      <circle className="offline-mark-node offline-mark-node-a" cx="10.5" cy="23.8" r="2.3" fill={`url(#${gradientId})`} />
      <circle className="offline-mark-node offline-mark-node-b" cx="29.4" cy="16.4" r="2.3" fill={monochrome ? "currentColor" : "#FFD59B"} />
      <circle className="offline-mark-core" cx="20" cy="20" r="4.3" />
    </svg>
  </span>;
}

export function BrandWordmark({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return <span className={`brand-wordmark ${compact ? "brand-wordmark-compact" : ""} ${className}`}><OfflineMark size={compact ? 34 : 38} /><span className="brand-copy"><strong>Offline</strong><small>Intelligence</small></span></span>;
}
