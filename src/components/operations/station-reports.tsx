"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { ErrorNotice } from "@/components/operations/operations-ui";
import { GuardReport, YearComparison } from "@/services/station.service";

const monthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const typeLabel: Record<string, string> = { FIRE: "Incendio", RESCUE: "Rescate", ACCIDENT: "Accidente", CHEMICAL: "Químico", MEDICAL: "Médico", FLOOD: "Inundación", OTHER: "Otro" };
const rateTone = (rate: number | null) => rate === null ? "text-[var(--mut)]" : rate >= 90 ? "text-emerald-300" : rate >= 70 ? "text-amber-300" : "text-red-300";
const date = (v: string) => v.split("-").reverse().slice(0, 2).join("/");

// 18: cumplimiento de guardias: asignadas contra asistidas con presencia QR coincidente.
export function GuardComplianceReport({ month }: { month: string }) {
  const query = useQuery({ queryKey: ["station-guards", month], queryFn: async () => (await api.get<GuardReport>("/station/reports/guards", { params: { month } })).data });
  const data = query.data;
  return <section aria-labelledby="guards-title">
    <h2 id="guards-title" className="text-xl font-bold">Cumplimiento de guardias</h2>
    <p className="mt-1 text-sm text-[var(--mut)]">Se cuenta como asistida la guardia terminada con un ingreso por QR que coincide con el turno. Las guardias futuras no cuentan.</p>
    {query.isLoading && <p className="mt-3 text-sm text-[var(--mut)]">Calculando…</p>}
    {query.isError && <ErrorNotice>No se pudo calcular el cumplimiento. <button className="underline" onClick={() => query.refetch()}>Reintentar</button></ErrorNotice>}
    {data && <>
      <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Cumplimiento", data.totals.rate === null ? "–" : `${data.totals.rate}%`, rateTone(data.totals.rate)], ["Guardias asistidas", data.totals.attended, ""], ["Inasistencias", data.totals.missed, data.totals.missed ? "text-red-300" : ""], ["Turnos del mes", data.totals.shifts, ""]].map(([label, value, tone]) => <div key={String(label)} className="rounded-xl border border-[var(--bord)] bg-[var(--card)] p-3"><p className="text-xs text-[var(--mut)]">{label}</p><p className={`text-2xl font-bold ${tone}`}>{value}</p></div>)}
      </div>
      {!data.people.length && <p className="text-sm text-[var(--mut)]">No hay guardias asignadas en el mes.</p>}
      <ul className="divide-y divide-[var(--bord)] rounded-xl border border-[var(--bord)]">{data.people.map((row) => <li key={row.userId} className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0"><p className="truncate font-semibold">{row.name}</p><p className="text-xs text-[var(--mut)]">{row.rank} · {row.attended} de {row.attended + row.missed} asistidas{row.upcoming ? ` · ${row.upcoming} por venir` : ""}</p></div>
          <strong className={`shrink-0 text-lg ${rateTone(row.rate)}`}>{row.rate === null ? "–" : `${row.rate}%`}</strong>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--card2)]"><div className={`h-full ${row.rate === null ? "" : row.rate >= 90 ? "bg-emerald-500" : row.rate >= 70 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${row.rate ?? 0}%` }} /></div>
        {row.missedDates.length > 0 && <p className="mt-1 text-xs text-red-300">Faltó: {row.missedDates.map(date).join(", ")}</p>}
      </li>)}</ul>
    </>}
  </section>;
}

// 35: comparativa del año elegido contra el anterior (mismo periodo si el año está en curso).
export function YearComparisonReport() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const query = useQuery({ queryKey: ["station-compare", year], queryFn: async () => (await api.get<YearComparison>("/station/reports/compare", { params: { year } })).data });
  const data = query.data;
  const delta = (a: number, b: number) => b === 0 ? (a === 0 ? "sin cambios" : "nuevo") : `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)}%`;
  const max = data ? Math.max(1, ...data.current.months, ...data.previous.months) : 1;
  const types = data ? [...new Set([...Object.keys(data.current.byType), ...Object.keys(data.previous.byType)])].sort((a, b) => (data.current.byType[b] ?? 0) - (data.current.byType[a] ?? 0)) : [];
  return <section aria-labelledby="compare-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="compare-title" className="text-xl font-bold">Comparativa anual</h2>
      <select className="app-input w-auto" aria-label="Año" value={year} onChange={(e) => setYear(Number(e.target.value))}>{Array.from({ length: 6 }, (_, i) => thisYear - i).map((y) => <option key={y} value={y}>{y} contra {y - 1}</option>)}</select>
    </div>
    {query.isLoading && <p className="mt-3 text-sm text-[var(--mut)]">Calculando…</p>}
    {query.isError && <ErrorNotice>No se pudo calcular la comparativa.</ErrorNotice>}
    {data && <>
      <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--bord)] bg-[var(--card)] p-3"><p className="text-xs text-[var(--mut)]">Intervenciones{data.comparableMonths < 12 ? ` (ene–${monthNames[data.comparableMonths - 1]})` : ""}</p><p className="text-2xl font-bold">{data.comparable.current}</p><p className="text-xs text-[var(--mut)]">{data.comparable.previous} en {year - 1} · {delta(data.comparable.current, data.comparable.previous)}</p></div>
        <div className="rounded-xl border border-[var(--bord)] bg-[var(--card)] p-3"><p className="text-xs text-[var(--mut)]">Alertas del año</p><p className="text-2xl font-bold">{data.current.alerts}</p><p className="text-xs text-[var(--mut)]">{data.previous.alerts} en {year - 1}</p></div>
        <div className="rounded-xl border border-[var(--bord)] bg-[var(--card)] p-3"><p className="text-xs text-[var(--mut)]">Aviso → salida (mediana)</p><p className="text-2xl font-bold">{data.current.medianDispatchMinutes ?? "–"}<span className="text-sm font-normal"> min</span></p><p className="text-xs text-[var(--mut)]">{data.previous.medianDispatchMinutes ?? "–"} min en {year - 1}</p></div>
        <div className="rounded-xl border border-[var(--bord)] bg-[var(--card)] p-3"><p className="text-xs text-[var(--mut)]">Salida → llegada (mediana)</p><p className="text-2xl font-bold">{data.current.medianTravelMinutes ?? "–"}<span className="text-sm font-normal"> min</span></p><p className="text-xs text-[var(--mut)]">{data.previous.medianTravelMinutes ?? "–"} min en {year - 1}</p></div>
      </div>
      <h3 className="mb-2 font-semibold">Intervenciones por mes</h3>
      <div className="mb-1 flex gap-4 text-xs text-[var(--mut)]"><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-red-500" />{year}</span><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--dim)]" />{year - 1}</span></div>
      <div className="flex h-40 items-end gap-1 rounded-xl border border-[var(--bord)] bg-[var(--card)] p-2" role="img" aria-label={`Intervenciones por mes en ${year} y ${year - 1}`}>
        {monthNames.map((m, i) => <div key={m} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
          <div className="flex h-full w-full items-end justify-center gap-0.5">
            <div className="w-1/2 rounded-t bg-red-500" style={{ height: `${(data.current.months[i] / max) * 100}%` }} title={`${data.current.months[i]} en ${m} ${year}`} />
            <div className="w-1/2 rounded-t bg-[var(--dim)]" style={{ height: `${(data.previous.months[i] / max) * 100}%` }} title={`${data.previous.months[i]} en ${m} ${year - 1}`} />
          </div>
          <span className="text-[10px] text-[var(--mut)]">{m}</span>
        </div>)}
      </div>
      <h3 className="mb-2 mt-5 font-semibold">Por tipo</h3>
      {!types.length && <p className="text-sm text-[var(--mut)]">Sin intervenciones registradas.</p>}
      <ul className="divide-y divide-[var(--bord)]">{types.map((t) => <li key={t} className="flex justify-between gap-2 py-2 text-sm"><span>{typeLabel[t] ?? t}</span><span><strong>{data.current.byType[t] ?? 0}</strong> <span className="text-[var(--mut)]">vs {data.previous.byType[t] ?? 0} ({delta(data.current.byType[t] ?? 0, data.previous.byType[t] ?? 0)})</span></span></li>)}</ul>
      <p className="mt-3 text-xs text-[var(--mut)]">Los tiempos usan la primera salida de cada intervención con alerta; se descartan valores sin datos o fuera de rango. Muestras: {data.current.samples.dispatch} salidas y {data.current.samples.travel} llegadas en {year}.</p>
    </>}
  </section>;
}
