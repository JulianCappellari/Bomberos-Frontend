"use client";
import { toast } from "@/lib/toast";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, MapPin, Plus } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field } from "@/components/operations/operations-ui";
import { OperationDialog } from "@/components/operations/work-ui";
import { useAuth } from "@/features/auth/auth-context";
import { isCommand } from "@/lib/permissions";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { eventKinds, listEvents, StationEvent } from "@/services/station.service";

const fmtDay = (v: string) => new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(v));
const fmtTime = (v: string) => new Intl.DateTimeFormat("es-AR", { hourCycle: "h23", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(v));
const toLocal = (v: string) => { const d = new Date(v); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const responses = [["GOING", "Voy"], ["MAYBE", "Tal vez"], ["NOT_GOING", "No voy"]] as const;
type Draft = { id?: string; revision?: number; title: string; description: string; kind: StationEvent["kind"]; location: string; startsAt: string; endsAt: string };

// 27: agenda del cuartel con confirmacion de asistencia.
export default function AgendaPage() {
  const { user } = useAuth(), client = useQueryClient(), manager = isCommand(user?.role);
  const [scope, setScope] = useState<"upcoming" | "past">("upcoming");
  const [draft, setDraft] = useState<Draft | null>(null), [cancelling, setCancelling] = useState<StationEvent | null>(null), [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [open, setOpen] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["station-events", user?.id, scope], queryFn: () => listEvents(scope), enabled: Boolean(user), refetchInterval: 60000 });

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError("");
    try { await fn(); await client.invalidateQueries({ queryKey: ["station-events"] }); return true; }
    catch (err) { setError(getErrorMessage(err, "No se pudo guardar")); return false; }
    finally { setBusy(false); }
  }
  function newEvent() {
    const start = new Date(Date.now() + 86400000); start.setHours(20, 0, 0, 0);
    const end = new Date(start.getTime() + 2 * 3600000);
    setError(""); setDraft({ title: "", description: "", kind: "TRAINING", location: "Cuartel", startsAt: toLocal(start.toISOString()), endsAt: toLocal(end.toISOString()) });
  }
  async function save(e: FormEvent) {
    e.preventDefault(); if (!draft) return;
    const body = { title: draft.title, description: draft.description, kind: draft.kind, location: draft.location, startsAt: new Date(draft.startsAt).toISOString(), endsAt: new Date(draft.endsAt).toISOString() };
    if (await run(() => draft.id ? api.put(`/station/events/${draft.id}`, { ...body, revision: draft.revision }) : api.post("/station/events", body))) setDraft(null);
  }
  async function cancel(e: FormEvent) {
    e.preventDefault(); if (!cancelling) return;
    if (await run(() => api.post(`/station/events/${cancelling.id}/cancel`, { reason }))) { setCancelling(null); setReason(""); }
  }

  const rows = query.data ?? [];
  return <ProtectedLayout><main className="screen-body">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><CalendarDays className="h-6 w-6 text-red-400" aria-hidden /> Agenda del cuartel</h1>
        <p className="mt-1 text-sm text-[var(--mut)]">Capacitaciones, reuniones y eventos. Confirmá si vas para que jefatura pueda organizarse; te avisamos un día antes.</p>
      </div>
      {manager && <button type="button" className="app-button app-button-red w-auto" onClick={newEvent}><Plus className="h-4 w-4" /> Nueva actividad</button>}
    </header>

    <div role="tablist" aria-label="Período" className="mt-4 inline-flex rounded-xl border border-[var(--bord)] bg-[var(--card)] p-1">
      {(["upcoming", "past"] as const).map((s) => <button key={s} type="button" role="tab" aria-selected={scope === s} onClick={() => setScope(s)} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${scope === s ? "bg-red-600 text-white" : "text-white/65"}`}>{s === "upcoming" ? "Próximas" : "Anteriores"}</button>)}
    </div>

    {error && !draft && !cancelling && <ErrorNotice>{error}</ErrorNotice>}
    {query.isLoading && <ListSkeleton label="Cargando agenda" />}
    {query.isError && <ErrorNotice>No se pudo cargar la agenda. <button className="underline" onClick={() => query.refetch()}>Reintentar</button></ErrorNotice>}
    {query.data && !rows.length && <p className="card mt-4 text-center text-sm text-[var(--mut)]">{scope === "upcoming" ? "No hay actividades programadas." : "No hay actividades en los últimos meses."}</p>}

    <ul className="stagger mt-4 space-y-3">{rows.map((ev) => {
      const past = scope === "past"; // el servidor separa proximas y anteriores por la hora de fin
      return <li key={ev.id} className={`card mb-0 ${ev.cancelledAt ? "opacity-70" : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-red-300">{eventKinds[ev.kind]}{ev.cancelledAt ? " · Cancelada" : ""}</p>
            <h2 className="break-words text-lg font-bold">{ev.title}</h2>
            <p className="mt-0.5 text-sm first-letter:uppercase">{fmtDay(ev.startsAt)} · {fmtTime(ev.startsAt)} a {fmtTime(ev.endsAt)}</p>
            {ev.location && <p className="mt-0.5 flex items-center gap-1 text-sm text-[var(--mut)]"><MapPin className="h-3.5 w-3.5" aria-hidden />{ev.location}</p>}
          </div>
          <p className="text-sm text-[var(--mut)]"><strong className="text-[var(--txt)]">{ev.counts.GOING}</strong> van · {ev.counts.MAYBE} tal vez · {ev.counts.NOT_GOING} no</p>
        </div>
        {ev.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{ev.description}</p>}
        {ev.cancelledAt && <p className="mt-2 text-sm text-amber-300">Motivo de la cancelación: {ev.cancelReason}</p>}
        {!ev.cancelledAt && !past && <div role="group" aria-label="Mi asistencia" className="mt-3 flex flex-wrap gap-2">
          {responses.map(([value, label]) => <button key={value} type="button" disabled={busy} aria-pressed={ev.myResponse === value} onClick={async () => { if (await run(() => api.post(`/station/events/${ev.id}/rsvp`, { response: value }))) toast.success(value === "GOING" ? "Confirmaste que vas" : value === "MAYBE" ? "Respondiste: tal vez" : "Avisaste que no vas", ev.title); }}
            className={`min-h-10 rounded-xl border px-4 text-sm font-semibold ${ev.myResponse === value ? value === "GOING" ? "border-emerald-500 bg-emerald-700 text-white" : value === "NOT_GOING" ? "border-red-500 bg-red-700 text-white" : "border-amber-500 bg-amber-600 text-white" : "border-[var(--bord)] text-[var(--mut)] hover:text-[var(--txt)]"}`}>{label}</button>)}
        </div>}
        {(ev.attendees || manager) && <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--bord)] pt-3 text-sm">
          {ev.attendees && <button type="button" className="underline" onClick={() => setOpen(open === ev.id ? null : ev.id)}>{open === ev.id ? "Ocultar respuestas" : "Ver quiénes respondieron"}</button>}
          {manager && !ev.cancelledAt && !past && <><button type="button" className="underline" onClick={() => { setError(""); setDraft({ id: ev.id, revision: ev.revision, title: ev.title, description: ev.description, kind: ev.kind, location: ev.location, startsAt: toLocal(ev.startsAt), endsAt: toLocal(ev.endsAt) }); }}>Editar</button><button type="button" className="text-red-300 underline" onClick={() => { setError(""); setReason(""); setCancelling(ev); }}>Cancelar actividad</button></>}
        </div>}
        {open === ev.id && ev.attendees && <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">{ev.attendees.map((a) => <li key={a.userId} className="flex justify-between gap-2 rounded-lg bg-[var(--card2)] px-3 py-1.5"><span className="truncate">{a.name}</span><span className="shrink-0 text-[var(--mut)]">{responses.find(([v]) => v === a.response)?.[1]}</span></li>)}{!ev.attendees.length && <li className="text-[var(--mut)]">Nadie respondió todavía.</li>}</ul>}
      </li>;
    })}</ul>

    {draft && <OperationDialog title={draft.id ? "Editar actividad" : "Nueva actividad"} pending={busy} onClose={() => setDraft(null)}><form onSubmit={save}><fieldset disabled={busy} className="space-y-3">
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <Field label="Tipo"><select className="app-input" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as Draft["kind"] })}>{Object.entries(eventKinds).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
      <Field label="Título"><input autoFocus className="app-input" required minLength={3} maxLength={160} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Ej. Práctica de rescate vehicular" /></Field>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Empieza"><input type="datetime-local" className="app-input" required value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} /></Field><Field label="Termina"><input type="datetime-local" className="app-input" required value={draft.endsAt} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })} /></Field></div>
      <Field label="Lugar"><input className="app-input" maxLength={200} value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} /></Field>
      <Field label="Detalle"><textarea className="app-input min-h-24" maxLength={4000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Qué llevar, uniforme, temario…" /></Field>
      <p className="text-xs text-[var(--mut)]">{draft.id ? "Se avisa del cambio a quienes confirmaron." : "Se avisa a todo el personal para que confirme."}</p>
      <button className="app-button app-button-red">{busy ? "Guardando…" : "Guardar"}</button>
    </fieldset></form></OperationDialog>}

    {cancelling && <OperationDialog title="Cancelar actividad" pending={busy} onClose={() => setCancelling(null)}><form onSubmit={cancel}><fieldset disabled={busy} className="space-y-3">
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <p className="text-sm">Se avisará a quienes confirmaron <strong>{cancelling.title}</strong>.</p>
      <Field label="Motivo"><textarea autoFocus className="app-input min-h-20" required minLength={5} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <button className="app-button app-button-red">Cancelar actividad</button>
    </fieldset></form></OperationDialog>}
  </main></ProtectedLayout>;
}
