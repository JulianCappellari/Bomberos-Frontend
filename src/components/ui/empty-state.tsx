"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "./button";
import { cn } from "./cn";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]",
        className
      )}
    >
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white/40 mb-4 shadow-inner">
          {icon}
        </div>
      )}
      <h4 className="font-[family-name:var(--font-bebas)] text-xl sm:text-2xl uppercase tracking-wider text-white">
        {title}
      </h4>
      {description && (
        <p className="max-w-md text-xs sm:text-sm text-white/50 mt-1 mb-6 font-[family-name:var(--font-barlow)]">
          {description}
        </p>
      )}

      {action && (
        <>
          {action.href ? (
            <Link href={action.href}>
              <Button variant="primary" size="sm">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button variant="primary" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </>
      )}
    </motion.div>
  );
}
