"use client";
// components/Preloader.tsx
// The tricolour chakra. Drop <Preloader active={x} label="Printing" /> anywhere,
// or drive it from a route transition with useTransition / router events.

import { useEffect, useState } from "react";

export function Preloader({ active, label = "Printing" }: { active: boolean; label?: string }) {
  const spokes = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className={`pre${active ? " run" : ""}`} aria-hidden={!active} aria-busy={active}>
      <div className="pre-bands"><i /><i /><i /></div>
      <svg className="pre-wheel" viewBox="0 0 120 120" fill="none">
        <defs>
          <linearGradient id="tri" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F2822F" />
            <stop offset="50%" stopColor="#FFFDF7" />
            <stop offset="100%" stopColor="#3FB184" />
          </linearGradient>
        </defs>
        <circle className="ring" cx="60" cy="60" r="52" />
        <g>
          {spokes.map((i) => (
            <line
              key={i}
              className="sp"
              x1="60" y1="14" x2="60" y2="52"
              transform={`rotate(${i * 15} 60 60)`}
              style={{ animationDelay: `${(i % 12) * 0.035}s` }}
            />
          ))}
        </g>
        <circle className="hub" cx="60" cy="60" r="5" />
      </svg>
      <div className="pre-txt">{label}</div>
    </div>
  );
}

/**
 * Minimum-duration wrapper. Without this, a fast response makes the preloader
 * flash for 80ms and look broken. 700ms is the floor that reads as intentional.
 */
export function useStagedTransition(min = 700) {
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("Printing");

  const run = async <T,>(fn: () => Promise<T>, text?: string): Promise<T> => {
    if (text) setLabel(text);
    setBusy(true);
    const started = Date.now();
    try {
      return await fn();
    } finally {
      const left = min - (Date.now() - started);
      if (left > 0) await new Promise((r) => setTimeout(r, left));
      setBusy(false);
    }
  };

  return { busy, label, run };
}

/* Usage:
   const { busy, label, run } = useStagedTransition();
   <Preloader active={busy} label={label} />
   await run(() => fetch('/api/read', ...), 'Reading your symbol');
*/

// Respect prefers-reduced-motion — the CSS already disables the animation,
// but skip the artificial delay too:
export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const h = () => setR(m.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);
  return r;
}
