"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

export function TableRegion({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        const region = event.currentTarget;
        if (region.scrollWidth <= region.clientWidth) return;
        event.preventDefault();
        region.scrollLeft += event.key === "ArrowRight" ? 80 : -80;
      }}
      className={cn("w-full min-w-0 max-w-full overflow-x-auto rounded-lg border border-[var(--bord)] print:overflow-visible print:border-0", className)}
    >
      {children}
    </div>
  );
}

