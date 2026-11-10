"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

/* ------------------------------------------------------------------ */
/*  Variants                                                           */
/* ------------------------------------------------------------------ */

const variantStyles = {
  primary:
    "bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg shadow-red-900/30 hover:shadow-red-900/50 hover:-translate-y-px active:translate-y-0",
  secondary:
    "bg-white/[0.04] border border-[var(--bord)] text-white hover:bg-white/[0.08] hover:border-white/[0.12] active:bg-white/[0.06]",
  ghost:
    "text-white/70 hover:bg-white/[0.06] hover:text-white active:bg-white/[0.04]",
  danger:
    "border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 active:bg-red-500/[0.06]",
  success:
    "bg-emerald-600/90 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-900/20 active:bg-emerald-700",
} as const;

const sizeStyles = {
  sm: "h-9 px-3.5 text-xs gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
} as const;

/* ------------------------------------------------------------------ */
/*  Spinner                                                            */
/* ------------------------------------------------------------------ */

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Button                                                             */
/* ------------------------------------------------------------------ */

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-[family-name:var(--font-barlow-condensed)] font-bold uppercase tracking-wider",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0e13]",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:scale-[0.98]",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
