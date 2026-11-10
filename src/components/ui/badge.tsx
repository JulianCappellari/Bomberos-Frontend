"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./cn";

/* ------------------------------------------------------------------ */
/*  Variants                                                           */
/* ------------------------------------------------------------------ */

const variantStyles = {
  red: "bg-red-500/15 text-red-400 border-red-500/20",
  green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  blue: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  gray: "bg-white/[0.06] text-white/60 border-white/[0.08]",
  outline: "bg-transparent text-white/60 border-white/[0.12]",
} as const;

const sizeStyles = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-[11px] px-2.5 py-1",
} as const;

/* ------------------------------------------------------------------ */
/*  Badge                                                              */
/* ------------------------------------------------------------------ */

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  pulse?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { variant = "gray", size = "md", pulse = false, className, children, ...props },
    ref,
  ) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-[family-name:var(--font-barlow-condensed)] font-bold uppercase tracking-wider",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              variant === "red" && "bg-red-400",
              variant === "green" && "bg-emerald-400",
              variant === "yellow" && "bg-yellow-400",
              variant === "blue" && "bg-blue-400",
              (variant === "gray" || variant === "outline") && "bg-white/60",
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-1.5 w-1.5 rounded-full",
              variant === "red" && "bg-red-400",
              variant === "green" && "bg-emerald-400",
              variant === "yellow" && "bg-yellow-400",
              variant === "blue" && "bg-blue-400",
              (variant === "gray" || variant === "outline") && "bg-white/60",
            )}
          />
        </span>
      )}
      {children}
    </span>
  ),
);
Badge.displayName = "Badge";
