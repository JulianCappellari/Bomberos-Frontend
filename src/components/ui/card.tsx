"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./cn";

/* ------------------------------------------------------------------ */
/*  Card                                                               */
/* ------------------------------------------------------------------ */

const variantStyles = {
  default: "bg-[var(--card)] border-[var(--bord)]",
  elevated:
    "bg-[var(--card)] border-[var(--bord)] shadow-lg shadow-black/20",
  interactive:
    "bg-[var(--card)] border-[var(--bord)] cursor-pointer transition-all duration-200 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/5 hover:-translate-y-0.5 active:scale-[0.99]",
  danger:
    "bg-red-500/[0.06] border-red-500/20",
} as const;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variantStyles;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border backdrop-blur-sm",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

/* ------------------------------------------------------------------ */
/*  Card Header                                                        */
/* ------------------------------------------------------------------ */

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-5 pb-0", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/* ------------------------------------------------------------------ */
/*  Card Title                                                         */
/* ------------------------------------------------------------------ */

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-[family-name:var(--font-bebas)] text-lg uppercase tracking-wider text-white",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/* ------------------------------------------------------------------ */
/*  Card Description                                                   */
/* ------------------------------------------------------------------ */

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-[var(--mut)]", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/* ------------------------------------------------------------------ */
/*  Card Content                                                       */
/* ------------------------------------------------------------------ */

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5", className)} {...props} />
));
CardContent.displayName = "CardContent";

/* ------------------------------------------------------------------ */
/*  Card Footer                                                        */
/* ------------------------------------------------------------------ */

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center border-t border-white/[0.06] px-5 py-3",
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
