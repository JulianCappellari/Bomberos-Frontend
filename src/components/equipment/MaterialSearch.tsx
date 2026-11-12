"use client";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Search, Truck, X } from "lucide-react";
import { api } from "@/lib/api-client";

type Result = {
  vehicles: Array<{ id: string; name: string; labelCode: string | null; quantity: number; state: "OK" | "REVIEW" | "OUT"; compartment: string; vehicle: { assetId: string; unitNumber: string; name: string; status: string } }>;
  storeroom: Array<{ id: string; name: string; size: string | null; quantity: number; unit: string; location: string | null }>;
};
const STATE = { OK: "", REVIEW: "En revisión", OUT: "Fuera de servicio" } as const;

// Buscador de materiales: escribís "destornillador" y te dice en qué móvil y en qué baulera está.
export function MaterialSearch() {
  const [text, setText] = useState(""), term = useDeferredValue(text.trim());
  const query = useQuery({ queryKey: ["material-search", term], queryFn: async () => (await api.get<Result>("/equipment/materials/search", { params: { q: term } })).data, enabled: term.length >= 2, staleTime: 30_000 });
  // Agrupado por movil para que se lea "M-14 · Baulera 2: destornillador plano (2)".
  const byVehicle = (query.data?.vehicles ?? []).reduce((acc, r) => { (acc.get(r.vehicle.unitNumber) ?? acc.set(r.vehicle.unitNumber, []).get(r.vehicle.unitNumber)!).push(r); return acc; }, new Map<string, Result["vehicles"]>());
  const empty = query.data && !query.data.vehicles.length && !query.data.storeroom.length;
  return <section aria-label="Buscar material" className="rounded-2xl border border-[var(--bord)] bg-[var(--card)] p-4">
    <label className="relative block">
      <Search className="absolute left-3 top-3.5 h-4 w-4 text-[var(--mut)]" aria-hidden />
      <input type="text" inputMode="search" enterKeyHint="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Buscar material: destornillador, manguera, motosierra…" aria-label="Buscar material en los móviles" className="app-input pl-9 pr-10" />
      {text && <button type="button" aria-label="Borrar búsqueda" onClick={() => setText("")} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center"><X className="h-4 w-4" /></button>}
    </label>
    {term.length >= 2 && <div className="mt-3 space-y-3" aria-live="polite">
      {query.isLoading && <p className="text-sm text-[var(--mut)]">Buscando…</p>}
      {empty && <p className="text-sm text-[var(--mut)]">No hay ningún material con «{term}» en los móviles ni en el depósito.</p>}
      {[...byVehicle.entries()].map(([unit, rows]) => <div key={unit}>
        <Link href={`/equipment/${rows[0]!.vehicle.assetId}`} className="flex min-w-0 items-start gap-2"><Truck className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden /><span className="min-w-0"><span className="block whitespace-nowrap font-bold">Móvil {unit}</span><span className="block truncate text-xs text-[var(--mut)]">{rows[0]!.vehicle.name}</span></span></Link>
        <ul className="mt-1 space-y-1 pl-6">{rows.map((r) => <li key={r.id} className="text-sm"><span className="font-semibold">{r.compartment}</span>: {r.name}{r.quantity > 1 ? ` (${r.quantity})` : ""}{r.labelCode ? <span className="text-[var(--mut)]"> · {r.labelCode}</span> : null}{STATE[r.state] && <span className="ml-1 text-[var(--warn-text)]">· {STATE[r.state]}</span>}</li>)}</ul>
      </div>)}
      {!!query.data?.storeroom.length && <div>
        <p className="flex items-center gap-2 font-bold"><Package className="h-4 w-4 text-[var(--mut)]" aria-hidden /> Depósito del cuartel</p>
        <ul className="mt-1 space-y-1 pl-6">{query.data.storeroom.map((s) => <li key={s.id} className="text-sm">{s.name}{s.size ? ` · ${s.size}` : ""}: {s.quantity} {s.unit}{s.location ? <span className="text-[var(--mut)]"> · {s.location}</span> : null}</li>)}</ul>
      </div>}
    </div>}
  </section>;
}
