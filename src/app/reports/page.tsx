"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import { api } from "@/lib/api-client";
import { reportCsv } from "@/lib/report-csv";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { Metric, ErrorNotice, personName, stationDate } from "@/components/operations/operations-ui";
import { UserRosterItem } from "@/types/user";
import { useAuth } from "@/features/auth/auth-context";
import { PersonalStatistics } from "@/components/operations/personal-statistics";
import {OperationalReport} from "@/components/operations/operational-report";
import { isDutyManager } from "@/lib/permissions";

type Report = {
  month: string; scope: "ALL" | "SELF"; generatedAt: string;
  totals: { workedMinutes: number; sessions: number; people: number; openSessions: number; alerts: number; incidents: number; inspections: number; shifts: number; excludedSessions: number };
  people: Array<{ user: UserRosterItem; workedMinutes: number; sessions: number; openSessions: number }>;
  alertsByType: Array<{ type: string; count: number }>;
};
type FuelReport = { totals: { liters: number; loads: number; cost: number; pricedLoads: number }; vehicles: Array<{ assetId: string; name: string; liters: number; loads: number; cost: number; pricedLoads: number; distanceKm: number; odometerReadings: number }> };
type YearHours = { year: number; scope: "ALL" | "SELF"; totalMinutes: number; people: number; months: Array<{ month: number; minutes: number; people: number }> };
const periods = { THIS_MONTH: "Este mes", LAST_MONTH: "Mes anterior", THIS_YEAR: "Este año", LAST_YEAR: "Año anterior", ROLLING_YEAR: "12 meses", ALL: "Todo" } as const;
const alertLabels: Record<string, string> = { FIRE: "Incendio", RESCUE: "Rescate", ACCIDENT: "Accidente", CHEMICAL: "Quimico", MEDICAL: "Medico", FLOOD: "Inundacion", OTHER: "Otro" };
function hours(minutes: number) { return `${Math.floor(minutes / 60)} h ${minutes % 60} min`; }
export default function ReportsPage() {
  const { user, isAuthenticated } = useAuth();
  const [month, setMonth] = useState(() => stationDate().slice(0, 7));
  const [year, setYear] = useState(() => Number(stationDate().slice(0, 4)));
  const [period, setPeriod] = useState<keyof typeof periods>("THIS_YEAR");
  const [vehicleId, setVehicleId] = useState("");
  const canSeeFuel = isDutyManager(user?.role);
  const fuel = useQuery({ queryKey: ["operations", "fuel-report", period, vehicleId], queryFn: async () => (await api.get<FuelReport>("/operations/reports/fuel", { params: { period, ...(vehicleId ? { assetId: vehicleId } : {}) } })).data, enabled: isAuthenticated && canSeeFuel });
  const yearHours = useQuery({ queryKey: ["operations", "year-hours", year, user?.id], queryFn: async () => (await api.get<YearHours>("/operations/reports/hours/year", { params: { year } })).data, enabled: isAuthenticated });
  const [vehicleOptions, setVehicleOptions] = useState<Array<{ assetId: string; name: string }>>([]);
  const query = useQuery({
    queryKey: ["operations", "monthly-report", month, user?.id, user?.role],
    queryFn: async () => (await api.get<Report>("/operations/reports/monthly", { params: { month } })).data,
    enabled: isAuthenticated,
  });
  const report = query.data;
  function download() {
    if (!report) return;
    const csv = reportCsv(report.people.map((row) => ({
      name: personName(row.user), rank: row.user.profile?.rank || "", sessions: row.sessions, workedMinutes: row.workedMinutes,
    })));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `reporte-${month}.csv`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
  }
  return <ProtectedLayout><main className="screen-body">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-white">Reportes mensuales</h1><p className="mt-1 text-sm text-[var(--mut)]">{report?.scope === "SELF" ? "Mis horas y resumen operativo del cuartel" : "Personal y actividad operativa del cuartel"}</p></div>
      <div className="flex gap-2"><button type="button" className="btn-icon" title="Actualizar reporte" aria-label="Actualizar reporte" onClick={() => query.refetch()}><RefreshCw className="h-4 w-4" /></button>
        <button type="button" className="app-button app-button-outline w-auto" disabled={!report} onClick={download}><Download className="h-4 w-4" /> Exportar CSV</button></div>
    </div>
    <input type="month" aria-label="Mes del reporte" className="app-input mb-5 sm:w-auto" value={month} onChange={(event) => event.target.value && setMonth(event.target.value)} />
    {query.isLoading && <p className="py-4 text-sm text-[var(--mut)]">Calculando reporte...</p>}
    {query.isError && <ErrorNotice>No se pudo generar el reporte. <button type="button" className="underline" onClick={() => query.refetch()}>Reintentar</button></ErrorNotice>}
    {report && <>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="border-l-2 border-red-500/50 pl-3"><div className="text-xl font-bold text-white">{hours(report.totals.workedMinutes)}</div><div className="text-xs text-[var(--mut)]">{report.scope === "SELF" ? "Mi permanencia" : "Permanencia total"}</div></div>
        <Metric label="Registros de permanencia" value={report.totals.sessions} />
        <Metric label="Alertas" value={report.totals.alerts} />
        <Metric label="Intervenciones" value={report.totals.incidents} />
        <Metric label="Controles vehiculares" value={report.totals.inspections} />
        <Metric label="Turnos programados" value={report.totals.shifts} />
        <Metric label="Personal con registros" value={report.totals.people} />
        <Metric label="Permanencias abiertas" value={report.totals.openSessions} />
      </div>
      {report.totals.openSessions > 0 && <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">Las permanencias abiertas se calculan hasta el momento de generar el reporte.</p>}
      {report.totals.excludedSessions > 0 && <p role="status" className="mb-4 text-sm text-amber-200">{report.totals.excludedSessions} registros inconsistentes o rechazados fueron excluidos del calculo.</p>}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-white">{report.scope === "SELF" ? "Mis registros" : "Horas por integrante"}</h2>
        <div className="space-y-2">{report.people.map((row) => <article key={row.user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--bord)] bg-[var(--card)] p-4">
          <div><div className="font-bold text-white">{personName(row.user)}</div><div className="mt-1 text-xs text-[var(--mut)]">{row.user.profile?.rank} · {row.sessions} registros{row.openSessions ? ` · ${row.openSessions} abiertos` : ""}</div></div>
          <div className="text-lg font-bold text-red-300">{hours(row.workedMinutes)}</div>
        </article>)}</div>
        {!report.people.length && <p className="py-6 text-center text-sm text-[var(--mut)]">Sin registros de permanencia en el mes.</p>}
      </section>
      <section><h2 className="mb-3 text-lg font-bold text-white">Alertas por tipo</h2><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {report.alertsByType.map((group) => <div key={group.type} className="flex justify-between border-b border-[var(--bord)] py-3 text-sm"><span className="text-[var(--mut)]">{alertLabels[group.type] || group.type}</span><span className="font-bold text-white">{group.count}</span></div>)}
      </div></section>
      <p className="mt-5 text-xs text-[var(--mut)]">Generado: {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.generatedAt))}</p>
    </>}
    <section className="mt-8 border-t border-[var(--bord)] pt-6" aria-labelledby="year-hours-title"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 id="year-hours-title" className="text-xl font-bold">Estadísticas de horas</h2><select className="app-input w-auto" aria-label="Año de estadísticas" value={year} onChange={(event) => setYear(Number(event.target.value))}>{Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
      {yearHours.isLoading && <p role="status">Calculando horas...</p>}{yearHours.isError && <ErrorNotice>No se pudieron calcular las horas anuales.</ErrorNotice>}
      {yearHours.data && <><div className="mb-5 flex flex-wrap gap-6 border-l-2 border-red-500 pl-3"><div><strong className="block text-xl">{hours(yearHours.data.totalMinutes)}</strong><span className="text-xs text-[var(--mut)]">{yearHours.data.scope === "SELF" ? "Mis horas" : "Horas del cuartel"}</span></div><div><strong className="block text-xl">{yearHours.data.people}</strong><span className="text-xs text-[var(--mut)]">Personas con registros</span></div></div><h3 className="mb-3 font-semibold">Horas por mes</h3><div className="space-y-2">{yearHours.data.months.map((row) => <div key={row.month} className="grid grid-cols-[2.5rem_minmax(0,1fr)_4.5rem] items-center gap-2 text-sm"><span>{new Intl.DateTimeFormat("es-AR", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(year, row.month - 1, 1)))}</span><div className="h-3 overflow-hidden rounded bg-[var(--card)]"><div className="h-full rounded bg-red-500" style={{ width: `${yearHours.data!.months.reduce((max, item) => Math.max(max, item.minutes), 0) ? row.minutes / Math.max(...yearHours.data!.months.map((item) => item.minutes)) * 100 : 0}%` }} /></div><span className="text-right tabular-nums">{(row.minutes / 60).toLocaleString("es-AR", { maximumFractionDigits: 1 })} h</span></div>)}</div><p className="mt-3 text-xs text-[var(--mut)]">Se suman solo permanencias válidas hasta el momento de la consulta. Los intervalos superpuestos de una misma persona se cuentan una sola vez.</p></>}
    </section>
    {canSeeFuel && <section className="mt-8 border-t border-[var(--bord)] pt-6" aria-labelledby="fuel-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 id="fuel-title" className="text-xl font-bold">Informe de combustible</h2><button type="button" className="btn-icon" title="Actualizar combustible" aria-label="Actualizar combustible" onClick={() => fuel.refetch()}><RefreshCw className="h-4 w-4" /></button></div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Periodo de combustible">{Object.entries(periods).map(([key, label]) => <button key={key} type="button" aria-pressed={period === key} className={`app-button w-auto ${period === key ? "app-button-red" : "app-button-outline"}`} onClick={() => setPeriod(key as keyof typeof periods)}>{label}</button>)}</div>
      {fuel.data && <><label className="mb-4 block max-w-sm text-sm">Móvil<select className="app-input mt-1" value={vehicleId} onChange={(event) => { setVehicleId(event.target.value); if (!vehicleId) setVehicleOptions(fuel.data.vehicles.map(({ assetId, name }) => ({ assetId, name }))); }}><option value="">Todos los móviles</option>{(vehicleOptions.length ? vehicleOptions : fuel.data.vehicles).map((row) => <option key={row.assetId} value={row.assetId}>{row.name}</option>)}</select></label>
        <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4"><div className="border-l-2 border-orange-400 pl-3"><strong className="block text-xl">{fuel.data.totals.liters.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</strong><span className="text-xs text-[var(--mut)]">Litros</span></div><Metric label="Cargas" value={fuel.data.totals.loads} /><div className="border-l-2 border-orange-400 pl-3"><strong className="block text-xl">{fuel.data.totals.cost.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</strong><span className="text-xs text-[var(--mut)]">Costo registrado</span></div><Metric label="Cargas con precio" value={fuel.data.totals.pricedLoads} /></div>
        <div className="space-y-2">{fuel.data.vehicles.map((row) => <article key={row.assetId} className="rounded-lg border border-[var(--bord)] bg-[var(--card)] p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{row.name}</h3><strong className="text-orange-300">{row.liters.toLocaleString("es-AR", { maximumFractionDigits: 2 })} L</strong></div><p className="mt-2 text-sm text-[var(--mut)]">{row.loads} cargas · {row.odometerReadings >= 2 ? `${row.distanceKm.toLocaleString("es-AR")} km entre lecturas` : "Sin lecturas suficientes de odómetro"}{row.pricedLoads > 0 ? ` · ${row.cost.toLocaleString("es-AR", { style: "currency", currency: "ARS" })} registrado` : ""}</p></article>)}</div>
        {!fuel.data.vehicles.length && <p className="text-sm text-[var(--mut)]">Sin cargas en el período.</p>}
        <p className="mt-3 text-xs text-[var(--mut)]">El costo incluye solo cargas con precio. La distancia compara lecturas registradas dentro del período; no representa necesariamente el recorrido total.</p>
      </>}
      {fuel.isLoading && <p role="status">Calculando combustible...</p>}{fuel.isError && <ErrorNotice>No se pudo calcular el informe de combustible.</ErrorNotice>}
    </section>}
    <OperationalReport month={month}/>
    <Link href="/courses" className="app-button my-4 w-fit">Cursos y capacitación</Link>
    {user && user.profile?.rank?.toLowerCase() !== "administrador" && <PersonalStatistics userId={user.id} />}
  </main></ProtectedLayout>;
}
