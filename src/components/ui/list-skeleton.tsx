// Esqueleto de carga con la forma de una lista de tarjetas: el usuario ve la estructura antes de los datos.
export function ListSkeleton({ rows = 3, label = "Cargando" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="rounded-2xl border border-[var(--bord)] bg-[var(--card)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="skeleton h-4" style={{ width: `${55 - i * 7}%` }} />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
          <div className="skeleton mt-3 h-3 w-full" />
          <div className="skeleton mt-2 h-3" style={{ width: `${70 + (i % 2) * 15}%` }} />
        </div>
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  );
}
