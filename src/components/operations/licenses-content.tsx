"use client";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";

import { ErrorNotice, Field, personName, stationDate } from "@/components/operations/operations-ui";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { classLabel, LICENSE_CLASSES, normalizeLicenseClass, VEHICLE_LICENSE_CATEGORIES } from "@/lib/license-classes";
import { toast } from "@/lib/toast";
import { getUserRosterRequest } from "@/services/user.service";

type ClassRow = { code: string; grantedOn: string; expiresOn: string };
type License = { id: string; title: string; details: string; revision: number; licenseNumber: string | null; issuer: string | null; licenseClasses: string[]; licenseClassDetails?: Array<{ code: string; grantedOn?: string | null; expiresOn?: string | null }> | null; issuedOn: string | null; expiresOn: string | null };
const rowsOf = (l: License | null): ClassRow[] => l ? l.licenseClasses.map((raw) => { const code = normalizeLicenseClass(raw), d = l.licenseClassDetails?.find((x) => normalizeLicenseClass(x.code) === code); return { code, grantedOn: d?.grantedOn?.slice(0, 10) || "", expiresOn: d?.expiresOn?.slice(0, 10) || "" }; }) : [{ code: "B.1", grantedOn: "", expiresOn: "" }];
// Moviles que habilita un conjunto de clases (misma regla que el servidor: una clase mayor incluye a las menores).
const INCLUDES: Record<string, string[]> = { "B.2": ["B.1"], "C.1": ["B.1"], "C.2": ["C.1"], "C.3": ["C.2"], "E.1": ["C.3", "B.2"], "D.2": ["D.1"], "D.3": ["D.2"] };
function expand(codes: string[]) { const out = new Set<string>(), q = [...codes]; while (q.length) { const c = q.pop()!; if (out.has(c)) continue; out.add(c); q.push(...(INCLUDES[c] ?? [])); } return out; }
function enabledVehicles(codes: string[]) { const held = expand(codes); return Object.entries(VEHICLE_LICENSE_CATEGORIES).filter(([, c]) => c.required.length && c.required.every((r) => held.has(r))).map(([, c]) => c.label); }

export function LicensesContent({ personalOnly = false }: { personalOnly?: boolean }) {
  const { user } = useAuth(); const [subject, setSubject] = useState(""), [editing, setEditing] = useState<License | null>(null), [opened, setOpened] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [classes, setClasses] = useState<ClassRow[]>(rowsOf(null));
  const privileged = !personalOnly && (user?.role === "ADMIN" || user?.role === "OPERATOR"), own = !subject || subject === user?.id;
  const roster = useQuery({ queryKey: ["licenses-roster", user?.id], queryFn: getUserRosterRequest, enabled: privileged });
  const query = useQuery({ queryKey: ["structured-licenses", user?.id, subject], queryFn: async () => (await api.get<License[]>("/members/declarations", { params: { category: "DRIVER_LICENSE", userId: subject || undefined } })).data, enabled: Boolean(user) });
  function open(row: License | null) { setEditing(row); setClasses(rowsOf(row)); setOpened(true); setError(""); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget), text = (key: string) => String(data.get(key) || "");
    if (new Set(classes.map((c) => c.code)).size !== classes.length) { setError("Hay clases repetidas."); return; }
    setBusy(true); setError("");
    try {
      const payload = { category: "DRIVER_LICENSE", title: text("title"), details: text("details"), license: { number: text("number"), issuer: text("issuer"), classes: classes.map((c) => ({ code: c.code, grantedOn: c.grantedOn || null, expiresOn: c.expiresOn || null })), issuedOn: text("issued"), expiresOn: text("expires") } };
      if (editing) await api.put(`/members/declarations/${editing.id}`, { ...payload, revision: editing.revision }); else await api.post("/members/declarations", payload);
      setOpened(false); setEditing(null); await query.refetch();
      const vehicles = enabledVehicles(classes.map((c) => c.code));
      toast.success("Licencia guardada", vehicles.length ? `Te habilita para: ${vehicles.join(" · ")}` : "Para manejar móviles de emergencia también necesitás la clase D.4.");
    } catch (err) { setError(getErrorMessage(err, "No se pudo guardar la licencia")); } finally { setBusy(false); }
  }
  async function remove(row: License) { if (!window.confirm("¿Retirar esta licencia? El historial se conserva.")) return; setBusy(true); setError(""); try { await api.delete(`/members/declarations/${row.id}`, { data: { revision: row.revision } }); await query.refetch(); } catch (err) { setError(getErrorMessage(err, "No se pudo retirar")); } finally { setBusy(false); } }
  const setRow = (i: number, patch: Partial<ClassRow>) => setClasses((rows) => rows.map((r, j) => j === i ? { ...r, ...patch } : r));

  return <section className="screen-body"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Licencias de conducir</h1>{own && <button className="app-button app-button-red w-auto" onClick={() => open(null)}>Declarar licencia</button>}</div>
    <p className="my-3 text-sm text-[var(--mut)]">Cargá cada clase de tu licencia. Según las clases, el sistema te habilita solo para manejar los móviles que las exigen (por ejemplo, una autobomba de hasta 12.000 kg exige C.1 + D.4).</p>
    {privileged && <Field label="Personal"><select className="app-input mb-4" value={subject} onChange={(e) => { setSubject(e.target.value); setOpened(false); setEditing(null); }}><option value="">Mis licencias</option>{roster.data?.map((p) => <option key={p.id} value={p.id}>{personName(p)}</option>)}</select></Field>}
    {error && <ErrorNotice>{error}</ErrorNotice>}
    {opened && own && <form key={editing?.id || "new"} onSubmit={save} className="my-5 border-y border-[var(--bord)] py-4"><fieldset disabled={busy} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Identificación"><input name="title" className="app-input" required minLength={3} maxLength={160} defaultValue={editing?.title || "Licencia de conducir"} /></Field>
        <Field label="Número de licencia"><input name="number" className="app-input" required minLength={3} maxLength={80} defaultValue={editing?.licenseNumber || ""} /></Field>
        <Field label="Entidad emisora"><input name="issuer" className="app-input" required minLength={3} maxLength={160} defaultValue={editing?.issuer || ""} placeholder="Ej. Municipalidad de Sampacho" /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Emisión"><input name="issued" type="date" className="app-input" required max={stationDate()} defaultValue={editing?.issuedOn?.slice(0, 10) || ""} /></Field><Field label="Vencimiento"><input name="expires" type="date" className="app-input" required defaultValue={editing?.expiresOn?.slice(0, 10) || ""} /></Field></div>
      </div>
      <fieldset><legend className="text-sm font-semibold">Clases de la licencia</legend>
        <p className="mb-2 text-xs text-[var(--mut)]">Cada clase con su fecha de otorgamiento. Completá el vencimiento solo si es distinto al de la licencia.</p>
        <div className="space-y-2">{classes.map((c, i) => <div key={i} className="grid gap-2 rounded-xl border border-[var(--bord)] p-3 sm:grid-cols-[minmax(0,1fr)_150px_150px_auto] sm:items-end">
          <Field label={`Clase ${i + 1}`}><select className="app-input" value={c.code} onChange={(e) => setRow(i, { code: e.target.value })}>{LICENSE_CLASSES.map((o) => <option key={o.code} value={o.code}>{o.code} — {o.label}</option>)}</select></Field>
          <Field label="Otorgada"><input type="date" className="app-input" max={stationDate()} value={c.grantedOn} onChange={(e) => setRow(i, { grantedOn: e.target.value })} /></Field>
          <Field label="Vence (opcional)"><input type="date" className="app-input" value={c.expiresOn} onChange={(e) => setRow(i, { expiresOn: e.target.value })} /></Field>
          {classes.length > 1 && <button type="button" className="btn-icon h-11 w-11" aria-label={`Quitar clase ${c.code}`} onClick={() => setClasses((rows) => rows.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>}
        </div>)}</div>
        {classes.length < LICENSE_CLASSES.length && <button type="button" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:underline" onClick={() => setClasses((rows) => [...rows, { code: LICENSE_CLASSES.find((o) => !rows.some((r) => r.code === o.code))?.code || "D.4", grantedOn: "", expiresOn: "" }])}><Plus className="h-4 w-4" aria-hidden /> Agregar clase</button>}
        <p className="mt-2 text-xs text-[var(--mut)]">{enabledVehicles(classes.map((c) => c.code)).length ? `Con estas clases podés manejar: ${enabledVehicles(classes.map((c) => c.code)).join(" · ")}.` : "Con estas clases todavía no manejás móviles de emergencia: se necesita D.4 junto con la clase del vehículo (B.1, C.1, C.2…)."}</p>
      </fieldset>
      <Field label="Observaciones"><textarea name="details" className="app-input min-h-20" required minLength={3} maxLength={4000} defaultValue={editing?.details || "Declaración del titular"} /></Field>
      <div className="flex gap-2"><button className="app-button app-button-red w-auto" type="submit">{busy ? "Guardando…" : "Guardar"}</button><button className="app-button w-auto" type="button" onClick={() => setOpened(false)}>Cancelar</button></div>
    </fieldset></form>}
    {query.isLoading && <ListSkeleton label="Cargando licencias" />}{query.isError && <ErrorNotice>No se pudieron cargar las licencias.</ErrorNotice>}{query.data?.length === 0 && <p className="py-5">Sin licencias declaradas.</p>}
    <div className="grid gap-3 sm:grid-cols-2">{query.data?.map((row) => {
      const rows = rowsOf(row), expired = !row.expiresOn || row.expiresOn.slice(0, 10) < stationDate(), vehicles = expired ? [] : enabledVehicles(rows.filter((c) => !c.expiresOn || c.expiresOn >= stationDate()).map((c) => c.code));
      return <article key={row.id} className="min-w-0 rounded-lg border border-[var(--bord)] p-4">
        <div className="flex items-start justify-between gap-2"><h2 className="break-words font-bold">{row.title}</h2><span className={`badge ${expired ? "badge-red" : "badge-green"}`}>{!row.expiresOn ? "Incompleta" : expired ? "Vencida" : "Vigente"}</span></div>
        <p className="mt-1 text-sm text-[var(--mut)]">N° {row.licenseNumber || "—"} · {row.issuer || "—"} · vence {row.expiresOn?.slice(0, 10) || "—"}</p>
        <ul className="mt-3 space-y-1 text-sm">{rows.map((c) => <li key={c.code} className="flex flex-wrap justify-between gap-2 border-b border-[var(--bord)] pb-1"><span><strong>{c.code}</strong> <span className="text-[var(--mut)]">{classLabel(c.code)}</span></span><span className="text-xs text-[var(--mut)]">{c.grantedOn ? `desde ${c.grantedOn}` : ""}{c.expiresOn ? ` · vence ${c.expiresOn}` : ""}</span></li>)}</ul>
        <p className="mt-3 text-sm">{vehicles.length ? <>Habilita para: <strong>{vehicles.join(" · ")}</strong></> : <span className="text-[var(--mut)]">No habilita móviles de emergencia (falta D.4 o la clase del vehículo).</span>}</p>
        {row.details && <p className="mt-2 whitespace-pre-wrap break-words text-xs text-[var(--mut)]">{row.details}</p>}
        {own && <div className="mt-3 flex gap-2"><button className="app-button w-auto" disabled={busy} onClick={() => open(row)}>Editar</button><button className="app-button app-button-outline w-auto" disabled={busy} onClick={() => remove(row)}>Retirar</button></div>}
      </article>;
    })}</div>
  </section>;
}
