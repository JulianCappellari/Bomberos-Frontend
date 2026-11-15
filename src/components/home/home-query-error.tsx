export function HomeQueryError({ children, onRetry }: { children: React.ReactNode; onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
      <p role="status" className="min-w-0 text-sm text-red-200">{children}</p>
      <button type="button" onClick={onRetry} className="min-h-11 px-1 text-sm font-semibold text-white underline underline-offset-4">
        Reintentar
      </button>
    </div>
  );
}
