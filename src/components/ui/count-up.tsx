"use client";
import { useEffect, useRef, useState } from "react";

// Numero que sube suavemente hasta su valor (y anima los cambios posteriores). Respeta "reducir movimiento".
export function CountUp({ value, duration = 700, format = (n: number) => String(Math.round(n)) }: { value: number; duration?: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now(), origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = reduce ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setShown(origin + (value - origin) * eased);
      if (t < 1) frame = requestAnimationFrame(tick); else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); from.current = value; };
  }, [value, duration]);
  return <span className="tabular-nums">{format(shown)}</span>;
}
