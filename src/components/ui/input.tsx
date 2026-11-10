"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

/* ------------------------------------------------------------------ */
/*  Input                                                              */
/* ------------------------------------------------------------------ */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  errorMessage?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, errorMessage, icon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-[family-name:var(--font-barlow-condensed)] text-[11px] font-bold uppercase tracking-wider text-white/50"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-[15px] text-white outline-none",
              "placeholder:text-white/20",
              "transition-all duration-200",
              "focus:border-red-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-red-500/10",
              error
                ? "border-red-500/50 bg-red-500/[0.04]"
                : "border-white/[0.08]",
              icon && "pl-11",
              className,
            )}
            {...props}
          />
        </div>

        {errorMessage && (
          <p className="text-xs text-red-400">{errorMessage}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
