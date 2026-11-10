"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "./cn";

export interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  subtitle?: string;
}

export function StatCard({
  icon,
  value,
  label,
  trend,
  trendValue,
  className,
  subtitle,
}: StatCardProps) {
  const isNumeric = typeof value === "number";
  const [animatedNumber, setAnimatedNumber] = useState<number>(0);

  useEffect(() => {
    if (!isNumeric) return;

    const start = 0;
    const end = value as number;
    const duration = 800; // ms
    const startTime = performance.now();
    let frameId: number;

    const animateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(start + (end - start) * ease);
      setAnimatedNumber(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(animateCount);
      } else {
        setAnimatedNumber(end);
      }
    };

    frameId = requestAnimationFrame(animateCount);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [value, isNumeric]);

  const displayValue = isNumeric ? animatedNumber : value;

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--card)] p-4 shadow-[var(--shadow-card)] transition-colors hover:border-red-500/30 sm:p-5",
        className
      )}
    >
      <div className="pointer-events-none absolute -top-8 -right-6 h-20 w-20 rounded-full bg-red-500/10 blur-2xl" />
      <div className="flex items-center justify-between mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
          {icon}
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold font-[family-name:var(--font-barlow-condensed)] uppercase tracking-wider",
              trend === "up" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
              trend === "down" && "bg-red-500/10 text-red-400 border border-red-500/20",
              trend === "neutral" && "bg-white/[0.06] text-white/50 border border-white/[0.08]"
            )}
          >
            {trend === "up" && <TrendingUp className="h-3 w-3" />}
            {trend === "down" && <TrendingDown className="h-3 w-3" />}
            {trend === "neutral" && <Minus className="h-3 w-3" />}
            {trendValue}
          </div>
        )}
      </div>

      <div className="font-[family-name:var(--font-bebas)] text-3xl sm:text-4xl tracking-wider text-white">
        {displayValue}
      </div>

      <div className="font-[family-name:var(--font-barlow-condensed)] text-xs font-semibold uppercase tracking-wider text-[var(--mut)] mt-1">
        {label}
      </div>

      {subtitle && (
        <div className="text-[11px] text-white/40 mt-1 font-[family-name:var(--font-barlow)]">
          {subtitle}
        </div>
      )}
    </motion.div>
  );
}
