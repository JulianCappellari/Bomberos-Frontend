"use client";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, ShieldX, Truck, XCircle } from "lucide-react";

import { ErrorNotice, Field, personName, stationDate } from "@/components/operations/operations-ui";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { classLabel, LICENSE_CLASSES, normalizeLicenseClass } from "@/lib/license-classes";
import { toast } from "@/lib/toast";
import { getUserRosterRequest } from "@/services/user.service";

type License = { id: string; title: string; details: string; revision: number; licenseNumber: string | null; issuer: string | null; licenseClasses: string[]; issuedOn: string | null; expiresOn: string | null };
type Driving = { assetId: string; unitNumber: string; name: string; required: string[]; configured: boolean; covered: boolean; missing: string[]; authorization: "NONE" | "PENDING" | "APPROVED" | "REJECTED" | "REVOKED"; decidedAt: string | null; decisionNote: string | null; decidedBy: string | null; canDrive: boolean };

// Estado de cada movil para la persona: primero lo que puede manejar, despues lo pendiente y lo que le falta.
function drivingState(v: Driving) {
  if (v.canDrive) return { label: "Habilitado", tone: "badge-green", Icon: CheckCircle2, text: `Autorizado por jefatura${v.decidedBy ? ` (${v.decidedBy})` : ""}.` };
  if (v.covered && v.authorization === "PENDING") return { label: "Pendiente", tone: "badge-yellow", Icon: Clock, text: "Tu licencia lo cubre. Falta la autorización de un oficial o administrador." };
  if (v.authorization === "REJECTED") return { label: "Rechazado", tone: "badge-red", Icon: XCircle, text: v.decisionNote ? `Motivo: ${v.decisionNote}` : "Jefatura rechazó la habilitación." };
  if (v.authorization === "REVOKED") return { label: "Revocado", tone: "badge-red", Icon: ShieldX, text: v.decisionNote ? `Motivo: ${v.decisionNote}` : "La habilitación fue revocada." };
  if (v.covered && v.authorization === "APPROVED") return { label: "Habilitado", tone: "badge-green", Icon: CheckCircle2, text: "Autorizado por jefatura." };
  if (!v.configured) return { label: "Manual", tone: "", Icon: Truck, text: "Este móvil se habilita a mano por jefatura." };
  return { label: "No alcanza", tone: "", Icon: Truck, text: `Te falta ${v.missing.join(" y ")}.` };
}
const rank = (v: Driving) => v.canDrive ? 0 : v.covered && v.authorization === "PENDING" ? 1 : v.authorization === "REJECTED" || v.authorization === "REVOKED" ? 2 : v.configured ? 3 : 4;

export function LicensesContent({ personalOnly = false }: { personalOnly?: boolean }) {
  const { user } = useAuth(), client = useQueryClient();
  const [subject, setSubject] = useState(""), [editing, setEditing] = useState<License | null>(null), [opened, setOpened] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const privileged = !personalOnly && (user?.role === "ADMIN" || user?.role === "OPERATOR"), own = !subject || subject === user?.id;
  const roster = useQuery({ queryKey: ["licenses-roster", user?.id], queryFn: getUserRosterRequest, enabled: privileged });
  const query = useQuery({ queryKey: ["structured-licenses", user?.id, subject], queryFn: async () => (await api.get<License[]>("/members/declarations", { params: { category: "DRIVER_LICENSE", userId: subject || undefined } })).data, enabled: Boolean(user) });
  const driving = useQuery({ queryKey: ["driving-status", user?.id, subject], queryFn: async () => (await api.get<Driving[]>("/members/driving", { params: { userId: subject || undefined } })).data, enabled: Boolean(user) });
  const taken = new Set((query.data ?? []).filter((l) => l.id !== editing?.id).map((l) => normalizeLicenseClass(l.licenseClasses[0] ?? "")));
  function open(row: License | null) { setEditing(row); setOpened(true); setError(""); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget), text = (key: string) => String(data.get(key) || "");
    const code = text("code");
    setBusy(true); setError("");
    try {
      const payload = { category: "DRIVER_LICENSE", title: `Licencia ${code}`, details: text("details") || "Declaración del titular", license: { number: text("number"), issuer: text("issuer"), classes: [{ code, grantedOn: text("issued") || null, expiresOn: null }], issuedOn: text("issued"), expiresOn: text("expires") } };
      const saved = editing ? (await api.put(`/members/declarations/${editing.id}`, { ...payload, revision: editing.revision })).data : (await api.post("/members/declarations", payload)).data;
      setOpened(false); setEditing(null);
      await Promise.all([query.refetch(), client.invalidateQueries({ queryKey: ["driving-status"] })]);
      toast.success("Licencia guardada", saved?.driverRequests ? `Se pidió a jefatura la habilitación para ${saved.driverRequests === 1 ? "1 móvil" : `${saved.driverRequests} móviles`}.` : "Revisá abajo qué móviles podés manejar.");
    } catch (err) { setError(getErrorMessage(err, "No se pudo guardar la licencia")); } finally { setBusy(false); }
  }
  async function remove(row: License) { if (!window.confirm("¿Retirar esta licencia? El historial se conserva.")) return; setBusy(true); setError(""); try { await api.delete(`/members/declarations/${row.id}`, { data: { revision: row.revision } }); await Promise.all([query.refetch(), client.invalidateQueries({ queryKey: ["driving-status"] })]); } catch (err) { setError(getErrorMessage(err, "No se pudo retirar")); } finally { setBusy(false); } }

  const editingCode = editing ? normalizeLicenseClass(editing.licenseClasses[0] ?? "") : "";
  const vehicles = [...(driving.data ?? [])].sort((a, b) => rank(a) - rank(b));
  return <section className="screen-body"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Licencias de conducir</h1>{own && <button className="app-button app-button-red w-auto" onClick={() => open(null)}>Cargar licencia</button>}</div>
    <p className="my-3 text-sm text-[var(--mut)]">Cada número de licencia corresponde a una clase: cargá un formulario por cada clase (por ejemplo B.1, C.1 y D.4 por separado). Con tus licencias, el sistema pide a jefatura la habilitación de los móviles que cubren.</p>
    {privileged && <Field label="Personal"><select className="app-input mb-4" value={subject} onChange={(e) => { setSubject(e.target.value); setOpened(false); setEditing(null); }}><option value="">Mis licencias</option>{roster.data?.map((p) => <option key={p.id} value={p.id}>{personName(p)}</option>)}</select></Field>}
    {error && <ErrorNotice>{error}</ErrorNotice>}
    {opened && own && <form key={editing?.id || "new"} onSubmit={save} className="my-5 border-y border-[var(--bord)] py-4"><fieldset disabled={busy} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Clase"><select name="code" className="app-input" required defaultValue={editingCode || LICENSE_CLASSES.find((o) => !taken.has(o.code))?.code}>{LICENSE_CLASSES.map((o) => <option key={o.code} value={o.code} disabled={taken.has(o.code)}>{o.code} — {o.label}{taken.has(o.code) ? " (ya cargada)" : ""}</option>)}</select></Field>
        <Field label="Número de licencia de esta clase"><input name="number" className="app-input" required minLength={3} maxLength={80} defaultValue={editing?.licenseNumber || ""} /></Field>
        <Field label="Entidad emisora"><input name="issuer" className="app-input" required minLength={3} maxLength={160} defaultValue={editing?.issuer || ""} placeholder="Ej. Municipalidad de Sampacho" /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Otorgada"><input name="issued" type="date" className="app-input" required max={stationDate()} defaultValue={editing?.issuedOn?.slice(0, 10) || ""} /></Field><Field label="Vence"><input name="expires" type="date" className="app-input" required defaultValue={editing?.expiresOn?.slice(0, 10) || ""} /></Field></div>
      </div>
      <Field label="Observaciones (opcional)"><textarea name="details" className="app-input min-h-20" maxLength={4000} defaultValue={editing?.details || ""} /></Field>
      <div className="flex gap-2"><button className="app-button app-button-red w-auto" type="submit">{busy ? "Guardando…" : "Guardar"}</button><button className="app-button w-auto" type="button" onClick={() => setOpened(false)}>Cancelar</button></div>
    </fieldset></form>}
    {query.isLoading && <ListSkeleton label="Cargando licencias" />}{query.isError && <ErrorNotice>No se pudieron cargar las licencias.</ErrorNotice>}{query.data?.length === 0 && <p className="py-5">Sin licencias cargadas.</p>}
    <div className="grid gap-3 sm:grid-cols-2">{query.data?.map((row) => {
      const code = normalizeLicenseClass(row.licenseClasses[0] ?? ""), expired = !row.expiresOn || row.expiresOn.slice(0, 10) < stationDate();
      return <article key={row.id} className="min-w-0 rounded-lg border border-[var(--bord)] p-4">
        <div className="flex items-start justify-between gap-2"><h2 className="break-words font-bold">Clase {code}{row.licenseClasses.length > 1 ? ` (+${row.licenseClasses.length - 1})` : ""}</h2><span className={`badge ${expired ? "badge-red" : "badge-green"}`}>{!row.expiresOn ? "Incompleta" : expired ? "Vencida" : "Vigente"}</span></div>
        <p className="text-sm text-[var(--mut)]">{classLabel(code)}</p>
        <p className="mt-2 text-sm">N° <strong>{row.licenseNumber || "—"}</strong> · {row.issuer || "—"}</p>
        <p className="text-sm text-[var(--mut)]">Otorgada {row.issuedOn?.slice(0, 10) || "—"} · vence {row.expiresOn?.slice(0, 10) || "—"}</p>
        {row.details && <p className="mt-2 whitespace-pre-wrap break-words text-xs text-[var(--mut)]">{row.details}</p>}
        {own && <div className="mt-3 flex gap-2"><button className="app-button w-auto" disabled={busy} onClick={() => open(row)}>Editar</button><button className="app-button app-button-outline w-auto" disabled={busy} onClick={() => remove(row)}>Retirar</button></div>}
      </article>;
    })}</div>
    <section className="mt-6" aria-labelledby="driving-title">
      <h2 id="driving-title" className="text-lg font-bold">Móviles que {own ? "podés" : "puede"} manejar</h2>
      <p className="mb-3 text-sm text-[var(--mut)]">Para manejar un móvil hacen falta las licencias que exige y la autorización de un oficial o administrador.</p>
      {driving.isLoading && <ListSkeleton label="Cargando móviles" />}
      <ul className="grid gap-2 sm:grid-cols-2">{vehicles.map((v) => { const s = drivingState(v); return <li key={v.assetId} className="flex gap-3 rounded-xl border border-[var(--bord)] p-3">
        <s.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${v.canDrive ? "text-[var(--ok-text)]" : s.tone === "badge-yellow" ? "text-[var(--warn-text)]" : s.tone === "badge-red" ? "text-red-400" : "text-[var(--mut)]"}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">Móvil {v.unitNumber}</p>{s.tone && <span className={`badge ${s.tone}`}>{s.label}</span>}</div>
          <p className="text-xs text-[var(--mut)]">{v.name}{v.required.length ? ` · exige ${v.required.join(" + ")}` : ""}</p>
          <p className="mt-1 text-sm">{s.text}</p>
        </div>
      </li>; })}</ul>
    </section>
  </section>;
}
