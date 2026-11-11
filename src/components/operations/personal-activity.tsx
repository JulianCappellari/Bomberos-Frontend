"use client";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { label, recordStatusLabels } from "@/lib/labels";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/features/auth/auth-context";
import { formatOperationalDate } from "@/lib/operational-dates";
type Activity = { page: number; total: number; items: Array<{ id: string; date: string | null; dateOnly?: boolean; title: string; status: string; detail: string }> };
export function PersonalActivity({ userId }: { userId: string }) {
  const { user } = useAuth();
  const [kind, setKind] = useState("ATTENDANCE"), [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["personal-activity", user?.id, userId, kind, page], queryFn: async () => (await api.get<Activity>(`/members/statistics/${userId}/activity`, { params: { kind, page } })).data, enabled: Boolean(user && userId) });
  return <details className="mt-5 border-t border-[var(--bord)] pt-4">
    <summary className="cursor-pointer font-bold">Historial de actividad individual</summary>
    <label className="my-3 block">Actividad<select aria-label="Tipo de actividad personal" className="app-input mt-1" value={kind} onChange={(e) => { setKind(e.target.value); setPage(1); }}>
      {[["ATTENDANCE", "Permanencias"], ["SHIFT", "Guardias asignadas"], ["INCIDENT", "Emergencias asignadas"], ["INSPECTION", "Controles realizados"], ["WORK", "Trabajos"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></label>
    {query.isLoading && <ListSkeleton label="Cargando historial" />}{query.isError && <p role="alert">No se pudo consultar el historial.</p>}
    <ul className="divide-y divide-[var(--bord)]">{query.data?.items.map((row) => <li key={row.id} className="py-3">
      <p className="break-words font-bold">{row.title}</p>
      <p className="text-sm">{formatOperationalDate(row.date, row.dateOnly)} · {label(recordStatusLabels, row.status)}</p>
      <p className="mt-1 break-words text-sm text-[var(--mut)]">{row.detail}</p>
    </li>)}</ul>
    {query.data && !query.data.items.length && <p>Sin registros en esta categoria.</p>}
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button className="app-button w-auto" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button><span>Pagina {page}</span>
      <button className="app-button w-auto" disabled={!query.data || page * 20 >= query.data.total} onClick={() => setPage(page + 1)}>Siguiente</button>
    </div>
  </details>;
}
