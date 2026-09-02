"use client";

import { useEffect } from "react";

export function AmbientGlow({ landing = false }: { landing?: boolean }) {
  return <div className={`ambient-glow ${landing ? "ambient-glow-landing" : ""}`} aria-hidden="true"><i className="ambient-orb ambient-orb-copper" /><i className="ambient-orb ambient-orb-bronze" /><i className="ambient-orb ambient-orb-soft" /></div>;
}

export function PremiumEffects() {
  useEffect(() => {
    const finePointer = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    if (!finePointer) return;
    let previous: HTMLElement | null = null;
    const reset = (element: HTMLElement | null) => { if (element) { element.style.setProperty("--mag-x", "0px"); element.style.setProperty("--mag-y", "0px"); } };
    const move = (event: PointerEvent) => {
      const source = event.target instanceof Element ? event.target : null;
      const target = source?.closest<HTMLElement>("[data-spotlight],.metric-card,.card,.button-primary,.hero-primary");
      if (previous && previous !== target) reset(previous);
      previous = target || null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
      target.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
      if (!reduced && target.matches("[data-magnetic]")) {
        const x = Math.max(-4, Math.min(4, (event.clientX - rect.left - rect.width / 2) / 18));
        const y = Math.max(-4, Math.min(4, (event.clientY - rect.top - rect.height / 2) / 14));
        target.style.setProperty("--mag-x", `${x}px`); target.style.setProperty("--mag-y", `${y}px`);
      }
    };
    const leave = () => { reset(previous); previous = null; };
    window.addEventListener("pointermove", move, { passive: true }); document.documentElement.addEventListener("pointerleave", leave);
    return () => { window.removeEventListener("pointermove", move); document.documentElement.removeEventListener("pointerleave", leave); };
  }, []);
  return null;
}
