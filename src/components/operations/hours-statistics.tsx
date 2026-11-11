"use client";
import { CountUp } from "@/components/ui/count-up";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CalendarRange, Clock3, Shield, Timer } from "lucide-react";
import { api } from "@/lib/api-client";
import { ErrorNotice } from "@/components/operations/operations-ui";

type Stats = {
  scope: "year" | "month"; kind: "normal" | "guard"; audience: "ALL" | "SELF";
  totalMinutes: number; people: number; averageMinutes: number; averageUnit: "month" | "day";
  buckets: Array<{ label: string; minutes: number }>; weekdays: number[]; blocks: number[];
  top: Array<{ userId: string; name: string; minutes: number }>;
};
const weekdayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const blockNames = [["🌅", "Mañana (6 a 12)"], ["☀️", "Tarde (12 a 18)"], ["🌆", "Noche (18 a 24)"], ["🌙", "Madrugada (0 a 6)"]];
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const fmtHours = (m: number) => { const h = m / 60; return h >= 100 ? `${Math.round(h)}` : h >= 10 ? String(Math.round(h)) : (Math.round(h * 10) / 10).toString().replace(".", ","); };

function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: Array<[T, string, React.ReactNode]>; label: string }) {
  return <div role="tablist" aria-label={label} className="grid grid-cols-2 gap-2">
    {options.map(([v, text, icon]) => <button key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)} className={`flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 text-[13px] font-bold leading-tight transition-colors sm:text-sm ${value === v ? "border-red-500 bg-red-600 text-white" : "border-[var(--bord)] bg-[var(--card)] text-[var(--mut)] hover:text-[var(--txt)]"}`}>{icon}{text}</button>)}
  </div>;
}
function Bars({ rows, color }: { rows: Array<{ label: string; minutes: number }>; color: string }) {
  const max = Math.max(1, ...rows.map((r) => r.minutes));
  return <ul className="space-y-1.5">{rows.map((r) => <li key={r.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-sm">
    <span className="truncate">{r.label}</span>
    <span className="h-3.5 overflow-hidden rounded-full bg-[var(--card2)]"><span className={`block h-full rounded-full ${color}`} style={{ width: `${(r.minutes / max) * 100}%` }} /></span>
    <span className="text-right font-bold tabular-nums">{fmtHours(r.minutes)} h</span>
  </li>)}</ul>;
}

// Estadisticas de horas: por mes o en lo que va del año, horas normales o de guardia,
// con reparto por mes/dia, dia de la semana y franja horaria.
export function HoursStatistics() {
  const today = new Date();
  const [scope, setScope] = useState<"month" | "year">("year");
  const [kind, setKind] = useState<"normal" | "guard">("normal");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const query = useQuery({ queryKey: ["hours-stats", scope, kind, year, month], queryFn: async () => (await api.get<Stats>("/station/reports/hours", { params: { scope, kind, year, ...(scope === "month" ? { month } : {}) } })).data, refetchInterval: 60_000 });
  const d = query.data;
  const period = scope === "year" ? (year === today.getFullYear() ? `Del 1 de enero a hoy (${today.toLocaleDateString("es-AR")})` : `Año ${year} completo`) : `${monthNames[month - 1]} de ${year}`;

  return <section aria-labelledby="hours-title" className="space-y-4">
    <h2 id="hours-title" className="flex items-center gap-2 text-xl font-bold"><Timer className="h-5 w-5 text-red-400" aria-hidden /> Estadísticas de horas</h2>
    <Segmented label="Período" value={scope} onChange={setScope} options={[["month", "Por mes", <CalendarDays key="m" className="h-4 w-4" />], ["year", "En lo que va del año", <CalendarRange key="y" className="h-4 w-4" />]]} />
    <Segmented label="Tipo de horas" value={kind} onChange={setKind} options={[["normal", "Horas normales", <Clock3 key="n" className="h-4 w-4" />], ["guard", "Horas de guardia", <Shield key="g" className="h-4 w-4" />]]} />
    <div className="grid grid-cols-2 gap-2">
      <label className="text-xs font-semibold uppercase text-[var(--mut)]">Año<select className="app-input mt-1" value={year} onChange={(e) => setYear(Number(e.target.value))}>{Array.from({ length: 6 }, (_, i) => today.getFullYear() - i).map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
      {scope === "month" && <label className="text-xs font-semibold uppercase text-[var(--mut)]">Mes<select className="app-input mt-1" value={month} onChange={(e) => setMonth(Number(e.target.value))}>{monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>}
    </div>

    {query.isLoading && <p className="text-sm text-[var(--mut)]">Calculando…</p>}
    {query.isError && <ErrorNotice>No se pudieron calcular las horas. <button className="underline" onClick={() => query.refetch()}>Reintentar</button></ErrorNotice>}
    {d && <>
      <div className="grid grid-cols-3 gap-2">
        {[[<CountUp key="t" value={d.totalMinutes / 60} format={(n) => fmtHours(n * 60)} />, "horas"], [`${fmtHours(d.averageMinutes)}h`, d.averageUnit === "month" ? "por mes" : "por día"], [d.audience === "ALL" ? d.people : "Vos", d.audience === "ALL" ? "bomberos" : "tus horas"]].map(([v, l]) => <div key={String(l)} className="rounded-xl border border-[var(--bord)] bg-[var(--card)] p-3 text-center"><p className="text-2xl font-black tabular-nums text-red-400">{v}</p><p className="text-xs text-[var(--mut)]">{l}</p></div>)}
      </div>
      <p className="text-xs text-[var(--mut)]">{period}. Se actualiza en vivo. {kind === "normal" ? "Cuentan las horas con ingreso por QR fuera de una guardia asignada" : "Cuentan las horas con ingreso por QR dentro de una guardia asignada"}; quien sigue adentro suma hasta este momento. Sin superponer intervalos ni contar registros rechazados.</p>

      {d.totalMinutes === 0 ? <p className="rounded-xl border border-[var(--bord)] bg-[var(--card)] p-4 text-center text-sm text-[var(--mut)]">No hay horas {kind === "guard" ? "de guardia" : "normales"} registradas en este período.</p> : <>
        <div><h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--mut)]"><CalendarDays className="h-4 w-4" aria-hidden />{scope === "year" ? "Horas por mes" : "Horas por día"}</h3><Bars rows={d.buckets} color="bg-red-500" /></div>
        <div><h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--mut)]"><CalendarRange className="h-4 w-4" aria-hidden />Por día de la semana</h3><Bars rows={weekdayNames.map((label, i) => ({ label, minutes: d.weekdays[i] }))} color="bg-sky-500" /></div>
        <div><h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--mut)]"><Clock3 className="h-4 w-4" aria-hidden />Por horario</h3>
          <ul className="space-y-2">{blockNames.map(([icon, label], i) => { const max = Math.max(1, ...d.blocks); return <li key={label} className="text-sm"><span>{icon} {label}</span><span className="mt-1 grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-2"><span className="h-3.5 overflow-hidden rounded-full bg-[var(--card2)]"><span className="block h-full rounded-full bg-orange-500" style={{ width: `${(d.blocks[i] / max) * 100}%` }} /></span><span className="text-right font-bold tabular-nums">{fmtHours(d.blocks[i])} h</span></span></li>; })}</ul>
        </div>
        {d.top.length > 0 && <div><h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--mut)]">Quiénes más horas sumaron</h3><Bars rows={d.top.map((t) => ({ label: t.name, minutes: t.minutes }))} color="bg-emerald-500" /></div>}
      </>}
    </>}
  </section>;
}
