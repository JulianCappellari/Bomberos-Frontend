"use client";
import { FormEvent, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, Search, Users } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useAuth } from "@/features/auth/auth-context";
import { useUserRoster } from "@/hooks/use-shifts";
import { useAvailability, useSaveAvailability } from "@/hooks/use-operations";
import { getErrorMessage } from "@/lib/get-error-message";
import { AvailabilityRecord, AvailabilityStatus } from "@/types/operations";
import { Field, ErrorNotice, Metric, StateBadge, isManager, personName, stationDate } from "@/components/operations/operations-ui";

const labels: Record<AvailabilityStatus, string> = { AVAILABLE: "Disponible", ON_CALL: "A confirmar", UNAVAILABLE: "No disponible" };
export default function AvailabilityPage() {
  const { user } = useAuth();
  const manager = isManager(user?.role);
  const [date, setDate] = useState(stationDate);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState("");
  const [period, setPeriod] = useState<"DAY" | "NIGHT">("DAY");
  const query = useAvailability(date);
  const roster = useUserRoster();
  const rows = query.data || [];
  const selectedUserId = manager && editingUser ? editingUser : user?.id || "";
  const selected = rows.find((row) => row.userId === selectedUserId && row.period === period);
  const people = (roster.data || []).filter((person) => personName(person).toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const selectedPeriodRows = rows.filter((row) => row.period === period);
  function moveDate(offset: number) {
    const next = new Date(date + "T12:00:00Z");
    next.setUTCDate(next.getUTCDate() + offset);
    setDate(next.toISOString().slice(0, 10));
  }
  return <ProtectedLayout><main className="screen-body">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-white">Disponibilidad del personal</h1><p className="mt-1 text-sm text-[var(--mut)]">Por dia y turno · {roster.data?.length || 0} integrantes</p></div>
      <button type="button" className="btn-icon" title="Actualizar disponibilidad" aria-label="Actualizar disponibilidad" onClick={() => query.refetch()}><RefreshCw className="h-4 w-4" /></button>
    </div>
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <button type="button" className="btn-icon" title="Dia anterior" aria-label="Dia anterior" onClick={() => moveDate(-1)}><ChevronLeft className="h-4 w-4" /></button>
      <input aria-label="Fecha de disponibilidad" type="date" className="app-input w-auto flex-1 sm:flex-none" value={date} required onChange={(event) => event.target.value && setDate(event.target.value)} />
      <button type="button" className="btn-icon" title="Dia siguiente" aria-label="Dia siguiente" onClick={() => moveDate(1)}><ChevronRight className="h-4 w-4" /></button>
      <button type="button" className="app-button app-button-outline w-auto" onClick={() => setDate(stationDate())}>Hoy</button>
    </div>
    <div className="mb-5 grid grid-cols-3 gap-3">
      <Metric label="Disponibles en el turno" value={selectedPeriodRows.filter((row) => row.status === "AVAILABLE").length} />
      <Metric label="A confirmar" value={selectedPeriodRows.filter((row) => row.status === "ON_CALL").length} />
      <Metric label="No disponibles" value={selectedPeriodRows.filter((row) => row.status === "UNAVAILABLE").length} />
    </div>
    <section className="mb-5 border-y border-[var(--bord)] py-4">
      <div className="mb-3 flex items-center gap-2 font-bold text-white"><CalendarDays className="h-4 w-4 text-red-400" />{manager ? "Actualizar disponibilidad" : "Mi disponibilidad"}</div>
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        {manager && <Field label="Personal"><select className="app-input" value={selectedUserId} onChange={(event) => setEditingUser(event.target.value)}>
          {(roster.data || []).map((person) => <option key={person.id} value={person.id}>{personName(person)}</option>)}
        </select></Field>}
        <Field label="Turno"><select className="app-input" value={period} onChange={(event) => setPeriod(event.target.value as "DAY" | "NIGHT")}>
          <option value="DAY">Diurno · 08:00-20:00</option><option value="NIGHT">Nocturno · 20:00-08:00 (+1 dia)</option>
        </select></Field>
      </div>
      {!query.isLoading && !query.isError && <AvailabilityEditor
        key={`${date}:${selectedUserId}:${period}:${selected?.revision || 0}`}
        date={date} userId={selectedUserId} period={period} existing={selected} />}
    </section>
    <div className="mb-3 flex items-center gap-2 font-bold text-white"><Users className="h-4 w-4 text-red-400" />Estado por integrante</div>
    <label className="relative mb-4 block"><Search className="absolute left-3 top-3 h-4 w-4 text-[var(--mut)]" /><input type="search" className="app-input pl-9" aria-label="Buscar personal" placeholder="Buscar personal" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
    {(query.isLoading || roster.isLoading) && <p className="py-4 text-sm text-[var(--mut)]">Cargando disponibilidad...</p>}
    {(query.isError || roster.isError) && <ErrorNotice>No se pudo cargar la disponibilidad. <button type="button" className="underline" onClick={() => { query.refetch(); roster.refetch(); }}>Reintentar</button></ErrorNotice>}
    <div className="grid gap-3 md:grid-cols-2">
      {!query.isLoading && !query.isError && people.map((person) => <article key={person.id} className="min-w-0 rounded-lg border border-[var(--bord)] bg-[var(--card)] p-4">
        <div className="mb-3 font-bold text-white">{personName(person)}<div className="mt-1 text-xs font-normal text-[var(--mut)]">{person.profile?.rank}</div></div>
        <div className="space-y-2">{(["DAY", "NIGHT"] as const).map((itemPeriod) => {
          const record = rows.find((row) => row.userId === person.id && row.period === itemPeriod);
          return <div key={itemPeriod} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-[var(--mut)]">{itemPeriod === "DAY" ? "Diurno" : "Nocturno"}</span>
            <StateBadge tone={record?.status === "AVAILABLE" ? "good" : record?.status === "UNAVAILABLE" ? "danger" : record?.status === "ON_CALL" ? "warning" : "neutral"}>{record ? labels[record.status] : "Sin informar"}</StateBadge>
          </div>;
        })}</div>
      </article>)}
    </div>
    {!query.isLoading && !roster.isLoading && !people.length && <p className="py-6 text-center text-sm text-[var(--mut)]">No hay personal para este filtro.</p>}
  </main></ProtectedLayout>;
}
function AvailabilityEditor({ date, userId, period, existing }: {
  date: string; userId: string; period: "DAY" | "NIGHT"; existing?: AvailabilityRecord;
}) {
  const mutation = useSaveAvailability();
  const [status, setStatus] = useState<AvailabilityStatus>(existing?.status || "AVAILABLE");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const readOnly = date < stationDate();
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setSaved(false);
    try { await mutation.mutateAsync({ userId, date, period, status, notes, revision: existing?.revision || 0 }); setSaved(true); }
    catch (err) { setError(getErrorMessage(err, "No se pudo actualizar la disponibilidad.")); }
  }
  return <form onSubmit={submit}>
    <fieldset disabled={mutation.isPending || readOnly} className="grid items-end gap-3 sm:grid-cols-2">
      <Field label="Disponibilidad"><select className="app-input" value={status} onChange={(event) => setStatus(event.target.value as AvailabilityStatus)}>
        {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></Field>
      <Field label="Nota privada para responsables"><input className="app-input" maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
      <button type="submit" className="app-button app-button-red sm:col-span-2" disabled={!userId}>{mutation.isPending ? "Guardando..." : "Guardar disponibilidad"}</button>
    </fieldset>
    {readOnly && <p className="mt-2 text-sm text-[var(--mut)]">Registro historico de solo lectura.</p>}
    {saved && <p role="status" className="mt-2 text-sm text-green-300">Disponibilidad actualizada.</p>}
    {error && <ErrorNotice>{error}</ErrorNotice>}
  </form>;
}
