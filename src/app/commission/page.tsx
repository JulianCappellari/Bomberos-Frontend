"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Landmark, Receipt } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice } from "@/components/operations/operations-ui";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { toast } from "@/lib/toast";

type Overview = {
  generatedAt: string; months: number;
  totals: Record<"expensesApprovedCents" | "expensesPaidCents" | "expensesDebtCents" | "expensesPendingCents" | "waterIncomeCents" | "waterCollectedCents" | "waterUncollectedCents" | "crewCompensationPaidCents" | "crewCompensationPendingCents", number> & { expensesRejectedCount: number; paymentsReversed: number };
  series: Array<{ month: string; approvedCents: number; paidCents: number; waterIncomeCents: number }>;
  expenses: Array<{ id: string; title: string; amountCents: number; occurredOn: string; status: string; requestedBy: string; paidCents: number; hasReceipt: boolean; officerExpense: boolean; approvals: Array<{ by: string; rank: string; decision: string; note: string; at: string }> }>;
  waterTrips: Array<{ id: string; customer: string; destination: string; departedAt: string; tripCount: number; chargeCents: number; collected: boolean; vehicle: string }>;
  activity: Array<{ id: string; action: string; at: string; by: string; entity: string }>;
  station: { activeMembers: number; alertsLast30Days: number; incidentsLast30Days: number; openMaterialRequests: number; lowStockItems: number; suppliesLast30Days: Record<string, number> };
};
const money = (cents: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(cents / 100);
const day = (v: string) => new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC" }).format(new Date(v));
const monthName = (key: string) => new Intl.DateTimeFormat("es-AR", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${key}-01T00:00:00Z`));
const statusText: Record<string, string> = { PENDING: "En revisión", APPROVED: "Aprobado", REJECTED: "Rechazado" };
const actionText = (a: string) => a.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

// Apartado de la Comision Directiva: consulta de finanzas y transparencia, solo lectura.
export default function CommissionPage() {
  const { user } = useAuth();
  const [months, setMonths] = useState(12), [section, setSection] = useState<"finance" | "expenses" | "water" | "station">("finance");
  const query = useQuery({ queryKey: ["commission", user?.id, months], queryFn: async () => (await api.get<Overview>("/commission/overview", { params: { months } })).data, enabled: Boolean(user) });
  const data = query.data;
  const max = Math.max(1, ...(data?.series ?? []).flatMap((s) => [s.approvedCents, s.paidCents, s.waterIncomeCents]));

  async function openReceipt(id: string) {
    const tab = window.open("", "_blank");
    try { const r = await api.get<Blob>(`/finance/expenses/${id}/receipt`, { responseType: "blob" }); const url = URL.createObjectURL(r.data); if (tab) tab.location.replace(url); else window.location.assign(url); }
    catch (err) { tab?.close(); toast.error(getErrorMessage(err, "No se pudo abrir el comprobante")); }
  }

  return <ProtectedLayout><main className="screen-body">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Landmark className="h-6 w-6 text-red-400" aria-hidden /> Comisión directiva</h1>
        <p className="mt-1 text-sm text-[var(--mut)]">Finanzas y transparencia del cuartel: gastos, pagos, ingresos y quién aprobó cada movimiento. Solo consulta.</p>
      </div>
      <label className="text-sm text-[var(--mut)]">Período <select className="app-input ml-1 inline-block w-auto py-1.5" value={months} onChange={(e) => setMonths(Number(e.target.value))}>{[3, 6, 12, 24].map((m) => <option key={m} value={m}>Últimos {m} meses</option>)}</select></label>
    </header>

    {query.isLoading && <ListSkeleton label="Cargando información" />}
    {query.isError && <ErrorNotice>{getErrorMessage(query.error, "No se pudo cargar la información.")} <button className="underline" onClick={() => query.refetch()}>Reintentar</button></ErrorNotice>}

    {data && <>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([["Gastos aprobados", data.totals.expensesApprovedCents, ""], ["Pagado", data.totals.expensesPaidCents, "text-[var(--ok-text)]"], ["Deuda con el personal", data.totals.expensesDebtCents, data.totals.expensesDebtCents ? "text-amber-300" : ""], ["En revisión", data.totals.expensesPendingCents, ""], ["Ingresos por agua", data.totals.waterIncomeCents, ""], ["Agua sin cobrar", data.totals.waterUncollectedCents, data.totals.waterUncollectedCents ? "text-amber-300" : ""], ["Compensación pagada", data.totals.crewCompensationPaidCents, ""], ["Compensación pendiente", data.totals.crewCompensationPendingCents, ""]] as const).map(([label, cents, tone]) => <div key={label} className="card mb-0"><p className="text-xs text-[var(--mut)]">{label}</p><p className={`mt-1 text-xl font-bold tabular-nums ${tone}`}>{money(cents)}</p></div>)}
      </div>
      {(data.totals.paymentsReversed > 0 || data.totals.expensesRejectedCount > 0) && <p className="mt-2 text-xs text-[var(--mut)]">En el período: {data.totals.expensesRejectedCount} gastos rechazados · {data.totals.paymentsReversed} pagos revertidos.</p>}

      <div role="tablist" aria-label="Secciones" className="mt-5 flex flex-wrap gap-1 rounded-xl border border-[var(--bord)] bg-[var(--card)] p-1">
        {([["finance", "Por mes"], ["expenses", "Gastos"], ["water", "Viajes de agua"], ["station", "Cuartel"]] as const).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={section === id} onClick={() => setSection(id)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${section === id ? "bg-red-600 text-white" : "text-[var(--mut)] hover:text-[var(--txt)]"}`}>{label}</button>)}
      </div>

      {section === "finance" && <section className="card mt-4" aria-label="Evolución mensual">
        <div className="mb-3 flex flex-wrap gap-4 text-xs text-[var(--mut)]"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Gastos aprobados</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Pagado</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-sky-500" /> Ingresos por agua</span></div>
        <ul className="space-y-3">{data.series.map((s) => <li key={s.month} className="grid grid-cols-[56px_1fr] items-center gap-3 text-sm">
          <span className="text-[var(--mut)] capitalize">{monthName(s.month)}</span>
          <div className="space-y-1">{([["bg-red-500", s.approvedCents, "Aprobado"], ["bg-emerald-500", s.paidCents, "Pagado"], ["bg-sky-500", s.waterIncomeCents, "Agua"]] as const).map(([color, v, label]) => <div key={label} className="flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--card2)]"><div className={`h-full rounded-full ${color}`} style={{ width: `${(v / max) * 100}%` }} /></div><span className="w-24 shrink-0 text-right text-xs tabular-nums text-[var(--mut)]" aria-label={`${label} ${money(v)}`}>{money(v)}</span></div>)}</div>
        </li>)}</ul>
      </section>}

      {section === "expenses" && <section className="mt-4 space-y-3">
        {!data.expenses.length && <p className="card text-center text-sm text-[var(--mut)]">No hay gastos en el período.</p>}
        {data.expenses.map((e) => <article key={e.id} className="card mb-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0"><h2 className="break-words font-bold">{e.title}</h2><p className="text-sm text-[var(--mut)]">{day(e.occurredOn)} · presentado por {e.requestedBy}{e.officerExpense ? " · gasto de jefatura" : ""}</p></div>
            <div className="text-right"><p className="text-lg font-bold tabular-nums">{money(e.amountCents)}</p><p className="text-xs text-[var(--mut)]">{statusText[e.status] ?? e.status}{e.status === "APPROVED" ? ` · pagado ${money(e.paidCents)}` : ""}</p></div>
          </div>
          {e.approvals.length > 0 && <ul className="mt-2 space-y-1 border-t border-[var(--bord)] pt-2 text-xs text-[var(--mut)]">{e.approvals.map((a, i) => <li key={i}><strong className="text-[var(--txt)]">{a.decision === "APPROVED" ? "Aprobó" : a.decision === "REJECTED" ? "Rechazó" : a.decision}</strong> {a.by} ({a.rank}) · {day(a.at)}{a.note ? ` — ${a.note}` : ""}</li>)}</ul>}
          {e.hasReceipt && <button type="button" className="mt-2 inline-flex items-center gap-1 text-sm underline" onClick={() => void openReceipt(e.id)}><Receipt className="h-4 w-4" aria-hidden /> Ver comprobante</button>}
        </article>)}
      </section>}

      {section === "water" && <section className="card mt-4">
        {!data.waterTrips.length ? <p className="text-sm text-[var(--mut)]">No hubo viajes de agua en el período.</p> : <ul className="divide-y divide-[var(--bord)] text-sm">{data.waterTrips.map((t) => <li key={t.id} className="flex items-start justify-between gap-3 py-2.5"><div className="min-w-0"><p className="font-semibold">{t.customer}</p><p className="text-[var(--mut)]">{day(t.departedAt)} · {t.destination} · {t.vehicle} · {t.tripCount} viaje{t.tripCount === 1 ? "" : "s"}</p></div><div className="shrink-0 text-right"><p className="font-bold tabular-nums">{money(t.chargeCents)}</p><p className={`text-xs ${t.collected ? "text-[var(--ok-text)]" : "text-amber-300"}`}>{t.collected ? "Cobrado" : "Sin cobrar"}</p></div></li>)}</ul>}
      </section>}

      {section === "station" && <section className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {([["Personal activo", data.station.activeMembers], ["Alertas (30 días)", data.station.alertsLast30Days], ["Intervenciones (30 días)", data.station.incidentsLast30Days], ["Pedidos de materiales abiertos", data.station.openMaterialRequests], ["Artículos con faltante", data.station.lowStockItems], ["Entregas del depósito (30 días)", data.station.suppliesLast30Days.ASSIGN ?? 0]] as const).map(([label, value]) => <div key={label} className="card mb-0"><p className="text-xs text-[var(--mut)]">{label}</p><p className="mt-1 text-2xl font-bold tabular-nums">{value}</p></div>)}
        </div>
        <div className="card mb-0"><h2 className="font-bold">Últimos movimientos financieros registrados</h2>
          {data.activity.length ? <ul className="mt-2 divide-y divide-[var(--bord)] text-sm">{data.activity.map((a) => <li key={a.id} className="flex justify-between gap-3 py-2"><span className="min-w-0">{actionText(a.action)} · {a.by}</span><span className="shrink-0 text-[var(--mut)]">{day(a.at)}</span></li>)}</ul> : <p className="mt-2 text-sm text-[var(--mut)]">Sin movimientos en el período.</p>}
          <p className="mt-2 text-xs text-[var(--mut)]">Los registros de auditoría no se pueden modificar ni borrar.</p>
        </div>
      </section>}
    </>}
  </main></ProtectedLayout>;
}
