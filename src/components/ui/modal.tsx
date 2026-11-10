"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "./cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative z-10 w-full overflow-hidden rounded-t-3xl border border-white/10 bg-[#12151c] text-white shadow-2xl sm:rounded-2xl",
              "max-h-[min(92dvh,880px)]",
              sizeClasses[size],
              className
            )}
          >
            <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-white/15 sm:hidden" />
            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between border-b border-white/[0.08] p-5 sm:p-6 pb-4">
                <div className="space-y-1 pr-6">
                  {title && (
                    <h3 className="font-[family-name:var(--font-bebas)] text-xl sm:text-2xl uppercase tracking-wider text-white">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-xs sm:text-sm text-white/50">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-white/40 hover:bg-white/[0.08] hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Cerrar</span>
                </button>
              </div>
            )}

            {!title && !description && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 z-20 rounded-lg p-1.5 text-white/40 hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Cerrar</span>
              </button>
            )}

            {/* Content */}
            <div className="max-h-[min(70dvh,720px)] overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
