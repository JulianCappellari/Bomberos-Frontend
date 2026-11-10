"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "./cn";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "mb-5 flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-center",
        className
      )}
    >
      <div className="flex items-center gap-3.5">
        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 shadow-inner shadow-red-500/10">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-[family-name:var(--font-bebas)] text-2xl sm:text-3xl uppercase tracking-wider text-white">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-white/50 tracking-wide mt-0.5 font-[family-name:var(--font-barlow)]">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
