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
import { isCommand, isDutyManager } from "@/lib/permissions";
import { GuardComplianceReport, YearComparisonReport } from "@/components/operations/station-reports";
import { HoursStatistics } from "@/components/operations/hours-statistics";

type Report = {
  month: string; scope: "ALL" | "SELF"; generatedAt: string;
  totals: { workedMinutes: number; sessions: number; people: number; openSessions: number; alerts: number; incidents: number; inspections: number; shifts: number; excludedSessions: number };
  people: Array<{ user: UserRosterItem; workedMinutes: number; sessions: number; openSessions: number }>;
  alertsByType: Array<{ type: string; count: number }>;
};
type FuelReport = { totals: { liters: number; loads: number; cost: number; pricedLoads: number }; vehicles: Array<{ assetId: string; name: string; liters: number; loads: number; cost: number; pricedLoads: number; distanceKm: number; odometerReadings: number }> };
const periods = { THIS_MONTH: "Este mes", LAST_MONTH: "Mes anterior", THIS_YEAR: "Este año", LAST_YEAR: "Año anterior", ROLLING_YEAR: "12 meses", ALL: "Todo" } as const;
const alertLabels: Record<string, string> = { FIRE: "Incendio", RESCUE: "Rescate", ACCIDENT: "Accidente", CHEMICAL: "Químico", MEDICAL: "Médico", FLOOD: "Inundación", OTHER: "Otro" };
type ReportTab = "month" | "year" | "guards" | "compare" | "fuel" | "mine";
function hours(minutes: number) { return `${Math.floor(minutes / 60)} h ${minutes % 60} min`; }
export default function ReportsPage() {
  const { user, isAuthenticated } = useAuth();
  const [month, setMonth] = useState(() => stationDate().slice(0, 7));
  const [period, setPeriod] = useState<keyof typeof periods>("THIS_YEAR");
  const [vehicleId, setVehicleId] = useState("");
  const [tab, setTab] = useState<ReportTab>("month");
  const canSeeFuel = isDutyManager(user?.role);
  const fuel = useQuery({ queryKey: ["operations", "fuel-report", period, vehicleId], queryFn: async () => (await api.get<FuelReport>("/operations/reports/fuel", { params: { period, ...(vehicleId ? { assetId: vehicleId } : {}) } })).data, enabled: isAuthenticated && canSeeFuel });
  const [vehicleOptions, setVehicleOptions] = useState<Array<{ assetId: string; name: string }>>([]);
  const query = useQuery({
    queryKey: ["operations", "monthly-report", month, user?.id, user?.role],
    queryFn: async () => (await api.get<Report>("/operations/reports/monthly", { params: { month } })).data,
    enabled: isAuthenticated,
  });
  const report = query.data;
  const showMine = Boolean(user && user.profile?.rank?.toLowerCase() !== "administrador");
  const command = isCommand(user?.role);
  const tabs: Array<[ReportTab, string]> = [["month", "Mensual"], ["year", "Horas"], ...(command ? [["guards", "Guardias"], ["compare", "Comparativa"]] as Array<[ReportTab, string]> : []), ...(canSeeFuel ? [["fuel", "Combustible"] as [ReportTab, string]] : []), ...(showMine ? [["mine", "Mi actividad"] as [ReportTab, string]] : [])];
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
    <header className="mb-4">
      <h1 className="text-2xl font-bold text-white">Reportes</h1>
      <p className="mt-1 text-sm text-[var(--mut)]">{report?.scope === "SELF" ? "Tus horas y el resumen operativo del cuartel." : "Horas del personal, actividad operativa y consumo de la flota."}</p>
    </header>
    <div role="tablist" aria-label="Tipo de reporte" className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-[var(--bord)] bg-[var(--card)] p-1">
      {tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`min-w-fit flex-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-semibold sm:text-sm transition-colors ${tab === id ? "bg-red-600 text-white" : "text-white/65 hover:text-white"}`}>{label}</button>)}
    </div>
    {tab === "month" && <>
    <div className="mb-5 flex flex-wrap items-end gap-2">
      <label className="text-sm text-[var(--mut)]"><span className="mb-1 block">Mes del reporte</span><input type="month" className="app-input w-auto" value={month} onChange={(event) => event.target.value && setMonth(event.target.value)} /></label>
      <button type="button" className="btn-icon" title="Actualizar reporte" aria-label="Actualizar reporte" onClick={() => query.refetch()}><RefreshCw className="h-4 w-4" /></button>
      <button type="button" className="app-button app-button-outline w-auto" disabled={!report || !report.people.length} onClick={download}><Download className="h-4 w-4" /> Exportar CSV</button>
    </div>
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
      {report.totals.excludedSessions > 0 && <p role="status" className="mb-4 text-sm text-amber-200">{report.totals.excludedSessions} registros inconsistentes o rechazados fueron excluidos del cálculo.</p>}
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
    <OperationalReport month={month}/>
    </>}
    {tab === "year" && <HoursStatistics />}
    {tab === "fuel" && canSeeFuel && <section aria-labelledby="fuel-title">
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
    {tab === "guards" && command && <><label className="mb-4 block text-sm text-[var(--mut)]"><span className="mb-1 block">Mes</span><input type="month" className="app-input w-auto" value={month} onChange={(event) => event.target.value && setMonth(event.target.value)} /></label><GuardComplianceReport month={month} /></>}
    {tab === "compare" && command && <YearComparisonReport />}
    {tab === "mine" && user && showMine && <>
      <PersonalStatistics userId={user.id} />
      <Link href="/courses" className="app-button app-button-outline my-4 w-fit">Ver mis cursos y capacitaciones</Link>
    </>}
  </main></ProtectedLayout>;
}
