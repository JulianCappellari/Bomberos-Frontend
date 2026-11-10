import { cn } from "./cn";

/* ------------------------------------------------------------------ */
/*  Base Skeleton                                                      */
/* ------------------------------------------------------------------ */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-white/[0.06]",
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton Text                                                      */
/* ------------------------------------------------------------------ */

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ["w-full", "w-4/5", "w-3/5", "w-5/6", "w-2/3"];
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3", widths[i % widths.length])}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton Avatar                                                    */
/* ------------------------------------------------------------------ */

export function SkeletonAvatar({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn("animate-pulse shrink-0 rounded-full bg-white/[0.06]", className)}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton Card                                                      */
/* ------------------------------------------------------------------ */

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-[var(--card)] p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-2.5 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton Stat Card                                                 */
/* ------------------------------------------------------------------ */

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-[var(--card)] p-5",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    </div>
  );
}
