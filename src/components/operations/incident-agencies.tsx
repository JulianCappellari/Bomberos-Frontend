"use client";
import { toast } from "@/lib/toast";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, LogOut, Pencil, Phone, Plus, XCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { Field, ErrorNotice } from "@/components/operations/operations-ui";
import { OperationDialog } from "@/components/operations/work-ui";
import { getContactsRequest } from "@/services/contacts.service";

type AgencyType = "FIRE_STATION" | "POLICE" | "MEDICAL" | "CIVIL_DEFENSE" | "UTILITY" | "MUNICIPAL" | "OTHER";
type Agency = { id: string; agencyType: AgencyType; name: string; contactId: string | null; unit: string; inCharge: string; phone: string | null; arrivedAt: string | null; leftAt: string | null; notes: string; revision: number; voidedAt: string | null; voidReason: string | null; createdBy: { username: string; profile: { fullName: string } | null } };
export const agencyLabels: Record<AgencyType, string> = { FIRE_STATION: "Otro cuartel de bomberos", POLICE: "Policía", MEDICAL: "Servicio médico / ambulancia", CIVIL_DEFENSE: "Defensa Civil", UTILITY: "Servicios (energía, gas, agua)", MUNICIPAL: "Municipalidad", OTHER: "Otra institución" };
const toLocal = (v: string | null) => { if (!v) return ""; const d = new Date(v); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const nowLocal = () => toLocal(new Date().toISOString());
const time = (v: string | null) => v ? new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(v)) : "–";
type Draft = { id?: string; revision?: number; agencyType: AgencyType; name: string; contactId: string | null; unit: string; inCharge: string; phone: string; arrivedAt: string; leftAt: string; notes: string };
const empty = (): Draft => ({ agencyType: "POLICE", name: "", contactId: null, unit: "", inCharge: "", phone: "", arrivedAt: nowLocal(), leftAt: "", notes: "" });

// 62: instituciones que participaron en la intervencion. Se cargan desde la planilla.
export function IncidentAgencies({ incidentId }: { incidentId: string }) {
  const client = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null), [voiding, setVoiding] = useState<Agency | null>(null), [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [showVoided, setShowVoided] = useState(false);
  const query = useQuery({ queryKey: ["incident-agencies", incidentId], queryFn: async () => (await api.get<{ canEdit: boolean; items: Agency[] }>(`/incidents/${incidentId}/agencies`)).data, refetchInterval: 30000 });
  const contacts = useQuery({ queryKey: ["contacts"], queryFn: getContactsRequest, enabled: Boolean(draft), staleTime: 300000 });
  const items = (query.data?.items ?? []).filter((a) => showVoided || !a.voidedAt);
  const voidedCount = (query.data?.items ?? []).filter((a) => a.voidedAt).length;
  const canEdit = Boolean(query.data?.canEdit);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError("");
    try { await fn(); await client.invalidateQueries({ queryKey: ["incident-agencies", incidentId] }); await client.invalidateQueries({ queryKey: ["incident-sheet", incidentId] }); return true; } // tambien la planilla: la constancia lista los cuarteles presentes
    catch (err) { setError(getErrorMessage(err, "No se pudo guardar")); return false; } finally { setBusy(false); }
  }
  async function save(e: FormEvent) {
    e.preventDefault(); if (!draft) return;
    const body = { agencyType: draft.agencyType, name: draft.name, contactId: draft.contactId, unit: draft.unit, inCharge: draft.inCharge, phone: draft.phone || null, arrivedAt: draft.arrivedAt ? new Date(draft.arrivedAt).toISOString() : null, leftAt: draft.leftAt ? new Date(draft.leftAt).toISOString() : null, notes: draft.notes };
    if (await run(() => draft.id ? api.put(`/incidents/${incidentId}/agencies/${draft.id}`, { ...body, revision: draft.revision }) : api.post(`/incidents/${incidentId}/agencies`, body))) { toast.success(draft.id ? "Institución actualizada" : "Institución agregada", draft.name); setDraft(null); }
  }
  function pickName(name: string) {
    const contact = contacts.data?.find((c) => c.name === name);
    setDraft((d) => d && ({ ...d, name, contactId: contact?.id ?? null, phone: contact?.phone && !d.phone ? contact.phone : d.phone }));
  }
  const markLeft = (a: Agency) => run(() => api.put(`/incidents/${incidentId}/agencies/${a.id}`, { agencyType: a.agencyType, name: a.name, contactId: a.contactId, unit: a.unit, inCharge: a.inCharge, phone: a.phone, arrivedAt: a.arrivedAt, leftAt: new Date().toISOString(), notes: a.notes, revision: a.revision }));

  return <section aria-labelledby="agencies-title" className="mt-6 rounded-2xl border border-[var(--bord)] bg-[var(--card)] p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h2 id="agencies-title" className="flex items-center gap-2 text-lg font-bold"><Building2 className="h-5 w-5 text-sky-300" aria-hidden /> Otras instituciones en el lugar</h2><p className="text-sm text-[var(--mut)]">Cuarteles de apoyo, policía, ambulancias, Defensa Civil o servicios que participaron.</p></div>
      {canEdit && <button type="button" className="app-button app-button-outline w-auto" onClick={() => { setError(""); setDraft(empty()); }}><Plus className="h-4 w-4" /> Agregar institución</button>}
    </div>
    {error && !draft && !voiding && <ErrorNotice>{error}</ErrorNotice>}
    {query.isError && <ErrorNotice>No se pudieron cargar las instituciones.</ErrorNotice>}
    {query.data && !items.length && <p className="mt-3 text-sm text-[var(--mut)]">No se cargaron otras instituciones{canEdit ? "." : ". Para cargarlas tenés que estar en el cuartel con ingreso por QR."}</p>}
    <ul className="mt-3 space-y-2">{items.map((a) => <li key={a.id} className={`rounded-xl border p-3 ${a.voidedAt ? "border-[var(--bord)] opacity-60" : !a.leftAt ? "border-sky-500/40 bg-sky-500/5" : "border-[var(--bord)]"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><p className="text-xs font-semibold uppercase text-[var(--mut)]">{agencyLabels[a.agencyType]}{a.voidedAt ? " · Anulada" : !a.leftAt ? " · En el lugar" : ""}</p><p className="break-words font-bold">{a.name}{a.unit ? ` · ${a.unit}` : ""}</p>{a.inCharge && <p className="text-sm">A cargo: {a.inCharge}</p>}</div>
        <p className="shrink-0 text-sm tabular-nums">Llegó {time(a.arrivedAt)} · Se retiró {time(a.leftAt)}</p>
      </div>
      {a.notes && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[var(--mut)]">{a.notes}</p>}
      {a.voidedAt && <p className="mt-1 text-sm text-amber-300">Anulada: {a.voidReason}</p>}
      {!a.voidedAt && <div className="mt-2 flex flex-wrap gap-2">
        {a.phone && <a href={`tel:${a.phone.replace(/[^\d+]/g, "")}`} className="app-button app-button-outline w-auto"><Phone className="h-4 w-4" /> Llamar</a>}
        {canEdit && !a.leftAt && <button type="button" disabled={busy} className="app-button app-button-outline w-auto" onClick={() => markLeft(a)}><LogOut className="h-4 w-4" /> Registrar retiro ahora</button>}
        {canEdit && <button type="button" className="btn-icon" title="Editar" aria-label={`Editar ${a.name}`} onClick={() => { setError(""); setDraft({ id: a.id, revision: a.revision, agencyType: a.agencyType, name: a.name, contactId: a.contactId, unit: a.unit, inCharge: a.inCharge, phone: a.phone ?? "", arrivedAt: toLocal(a.arrivedAt), leftAt: toLocal(a.leftAt), notes: a.notes }); }}><Pencil className="h-4 w-4" /></button>}
        {canEdit && <button type="button" className="btn-icon text-red-300" title="Anular carga" aria-label={`Anular ${a.name}`} onClick={() => { setError(""); setReason(""); setVoiding(a); }}><XCircle className="h-4 w-4" /></button>}
      </div>}
    </li>)}</ul>
    {voidedCount > 0 && <button type="button" className="mt-2 text-xs underline" onClick={() => setShowVoided(!showVoided)}>{showVoided ? "Ocultar anuladas" : `Ver ${voidedCount} anulada${voidedCount === 1 ? "" : "s"}`}</button>}

    {draft && <OperationDialog title={draft.id ? "Editar institución" : "Agregar institución"} pending={busy} onClose={() => setDraft(null)}><form onSubmit={save}><fieldset disabled={busy} className="space-y-3">
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <Field label="Tipo"><select className="app-input" value={draft.agencyType} onChange={(e) => setDraft({ ...draft, agencyType: e.target.value as AgencyType })}>{Object.entries(agencyLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
      <Field label="Institución"><input autoFocus required minLength={3} maxLength={160} list="agency-contacts" className="app-input" value={draft.name} onChange={(e) => pickName(e.target.value)} placeholder="Ej. Bomberos Voluntarios Río Cuarto" /></Field>
      <datalist id="agency-contacts">{contacts.data?.map((c) => <option key={c.id} value={c.name}>{c.category}</option>)}</datalist>
      {draft.contactId && <p className="-mt-2 text-xs text-emerald-300">Vinculada a la agenda de contactos.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Unidad o móvil (opcional)"><input maxLength={80} className="app-input" value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} placeholder="Ej. Móvil 7 / Patrullero 214" /></Field>
        <Field label="Responsable (opcional)"><input maxLength={120} className="app-input" value={draft.inCharge} onChange={(e) => setDraft({ ...draft, inCharge: e.target.value })} placeholder="Nombre y cargo" /></Field>
        <div className="sm:col-span-2"><Field label="Teléfono (opcional)"><input type="tel" maxLength={40} className="app-input" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></Field></div>
        <Field label="Llegada"><input type="datetime-local" className="app-input" value={draft.arrivedAt} max={nowLocal()} onChange={(e) => setDraft({ ...draft, arrivedAt: e.target.value })} /></Field>
        <Field label="Retiro (si ya se fue)"><input type="datetime-local" className="app-input" value={draft.leftAt} max={nowLocal()} onChange={(e) => setDraft({ ...draft, leftAt: e.target.value })} /></Field>
      </div>
      <Field label="Qué hizo / observaciones"><textarea maxLength={2000} className="app-input min-h-20" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Ej. Cortó el tránsito en la ruta; trasladó a un herido al hospital" /></Field>
      <button className="app-button app-button-red">{busy ? "Guardando…" : "Guardar"}</button>
    </fieldset></form></OperationDialog>}

    {voiding && <OperationDialog title="Anular carga" pending={busy} onClose={() => setVoiding(null)}><form onSubmit={async (e) => { e.preventDefault(); if (await run(() => api.post(`/incidents/${incidentId}/agencies/${voiding.id}/void`, { reason }))) setVoiding(null); }}><fieldset disabled={busy} className="space-y-3">
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <p className="text-sm">La carga de <strong>{voiding.name}</strong> no se borra: queda anulada con el motivo y en la auditoría.</p>
      <Field label="Motivo"><textarea autoFocus required minLength={10} maxLength={1000} className="app-input min-h-20" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <button className="app-button app-button-red">Anular</button>
    </fieldset></form></OperationDialog>}
  </section>;
}
