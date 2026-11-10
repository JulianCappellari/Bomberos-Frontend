"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field } from "@/components/operations/operations-ui";
import { isDutyManager } from "@/lib/permissions";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";

const types = { FIRE: "Incendio", RESCUE: "Rescate", ACCIDENT: "Accidente", MEDICAL: "Emergencia médica", CHEMICAL: "Riesgo químico", FLOOD: "Inundación", OTHER: "Otro" };
const priorities = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" };
type Notice = { id: string; revision: number; operatorId: string; cancelledAt: string | null; cancelReason: string | null; source: string; location: string; type: keyof typeof types; priority: keyof typeof priorities; notes: string; phone?: string; referral?: string; receivedAt: string; operator: { username: string }; alertId: string | null; alert: { incident: { id: string } | null } | null };
export default function NoticesPage() {
  const { user } = useAuth(), client = useQueryClient();
  const [page, setPage] = useState(1), [busy, setBusy] = useState(false), [error, setError] = useState(""), [confirm, setConfirm] = useState("");
  const [editing, setEditing] = useState<Notice | null>(null), [cancelling, setCancelling] = useState<Notice | null>(null);
  const allowed = isDutyManager(user?.role);
  const list = useQuery({ queryKey: ["dispatch-notices", user?.id, page], queryFn: async () => (await api.get<Notice[]>("/alerts/notices", { params: { page } })).data, enabled: allowed });
  async function register(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget;
    setBusy(true); setError("");
    try {
      const data = Object.fromEntries(new FormData(form));
      if (editing) await api.put(`/alerts/notices/${editing.id}`, { ...data, revision: editing.revision });
      else await api.post("/alerts/notices", data);
      form.reset(); setEditing(null); setPage(1); await client.invalidateQueries({ queryKey: ["dispatch-notices"] });
    }
    catch (err) { setError(getErrorMessage(err, "No se pudo registrar el aviso")); } finally { setBusy(false); }
  }
  async function cancelNotice(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!cancelling) return;
    const reason = String(new FormData(e.currentTarget).get("reason") || "");
    setBusy(true); setError("");
    try {
      await api.post(`/alerts/notices/${cancelling.id}/cancel`, { revision: cancelling.revision, reason });
      if (editing?.id === cancelling.id) setEditing(null);
      setCancelling(null); await client.invalidateQueries({ queryKey: ["dispatch-notices"] });
    } catch (err) { setError(getErrorMessage(err, "No se pudo anular el aviso")); } finally { setBusy(false); }
  }
  async function activate(id: string) {
    setBusy(true); setError("");
    try { await api.post(`/alerts/notices/${id}/activate`); setConfirm(""); await Promise.all([client.invalidateQueries({ queryKey: ["dispatch-notices"] }), client.invalidateQueries({ queryKey: ["alerts"] })]); }
    catch (err) { setError(getErrorMessage(err, "No se pudo convocar")); } finally { setBusy(false); }
  }
  return <ProtectedLayout><main className="screen-body"><Link href="/alerts" className="text-sm underline">Volver a alertas</Link><h1 className="my-4 text-2xl font-bold">Registro de llamadas y avisos</h1>
    {!allowed ? <ErrorNotice>Acceso reservado a guardia y jefatura.</ErrorNotice> : <>
    <h2 className="my-3 font-bold">{editing ? "Corregir aviso pendiente" : "Nuevo aviso"}</h2>
    <form key={editing?.id || "new"} onSubmit={register}><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
      <Field label="Origen del aviso"><input name="source" className="app-input" required minLength={2} maxLength={120} placeholder="Persona o institución que llama" defaultValue={editing?.source || ""} /></Field>
      <Field label="Teléfono de contacto"><input name="phone" type="tel" className="app-input" maxLength={40} defaultValue={editing?.phone || ""} /></Field>
      <Field label="Ubicación"><input name="location" required minLength={4} maxLength={180} className="app-input" defaultValue={editing?.location || ""} /></Field>
      <Field label="Tipo de emergencia"><select name="type" className="app-input" defaultValue={editing?.type || "FIRE"}>{Object.entries(types).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></Field>
      <Field label="Prioridad"><select name="priority" defaultValue={editing?.priority || "MEDIUM"} className="app-input">{Object.entries(priorities).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></Field>
      <Field label="Derivación"><input name="referral" maxLength={180} className="app-input" defaultValue={editing?.referral || ""} /></Field>
      <Field label="Observaciones"><textarea name="notes" maxLength={2000} className="app-input" defaultValue={editing?.notes || ""} /></Field>
      {editing && <Field label="Motivo de la corrección"><textarea name="reason" required minLength={10} maxLength={1000} className="app-input" /></Field>}
      <div className="flex flex-wrap items-end gap-2"><button className="app-button w-auto">{editing ? "Guardar corrección" : "Registrar sin convocar"}</button>{editing && <button type="button" className="app-button w-auto" onClick={() => setEditing(null)}>Descartar edición</button>}</div>
    </fieldset></form>
    {error && <ErrorNotice>{error}</ErrorNotice>}<h2 className="my-4 text-lg font-bold">Avisos recibidos</h2>
    {list.isLoading && <p>Cargando avisos...</p>}{list.isError && <ErrorNotice>No se pudieron cargar los avisos. <button onClick={() => list.refetch()}>Reintentar</button></ErrorNotice>}
    {list.data?.length === 0 && <p>No hay avisos en esta página.</p>}
    {list.data?.map(row => <article key={row.id} className="border-b border-[var(--bord)] py-4"><h3 className="font-bold">{types[row.type]} · {row.location}</h3><p className="text-sm">{new Date(row.receivedAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })} · {row.operator.username} · Prioridad {priorities[row.priority]}</p><p>Origen: {row.source} {row.phone}</p>{row.notes && <p>{row.notes}</p>}{row.referral && <p>Derivado a: {row.referral}</p>}
    {row.cancelledAt ? <p className="mt-2 text-sm">Anulado: {row.cancelReason}</p> : row.alertId ? <Link href={row.alert?.incident ? "/incidents" : "/alerts"} className="underline">{row.alert?.incident ? "Intervención despachada" : "Ver convocatoria en alertas"}</Link> : <>
      <div className="mt-2 flex flex-wrap gap-2">{confirm === row.id ? <><button disabled={busy} className="app-button app-button-red w-auto" onClick={() => activate(row.id)}>Confirmar convocatoria</button><button disabled={busy} className="app-button w-auto" onClick={() => setConfirm("")}>Cancelar convocatoria</button></> : <button disabled={busy} className="app-button w-auto" onClick={() => setConfirm(row.id)}>Convocar dotación</button>}
      {(user?.role !== "GUARD" || row.operatorId === user.id) && <><button disabled={busy} className="app-button w-auto" onClick={() => { setEditing(row); setCancelling(null); setConfirm(""); }}>Corregir</button><button disabled={busy} className="app-button w-auto" onClick={() => { setCancelling(row); setConfirm(""); }}>Anular aviso</button></>}</div>
      {cancelling?.id === row.id && <form onSubmit={cancelNotice} className="mt-3 grid gap-2"><Field label="Motivo de anulación"><textarea name="reason" required minLength={10} maxLength={1000} className="app-input" disabled={busy} /></Field><div className="flex flex-wrap gap-2"><button disabled={busy} className="app-button w-auto">Confirmar anulación</button><button disabled={busy} type="button" className="app-button w-auto" onClick={() => setCancelling(null)}>Conservar aviso</button></div></form>}
    </>}</article>)}
    <div className="mt-4 flex gap-2"><button disabled={page === 1} onClick={() => setPage(page-1)}>Anterior</button><button disabled={list.data?.length !== 30} onClick={() => setPage(page+1)}>Siguiente</button></div></>}
  </main></ProtectedLayout>;
}
