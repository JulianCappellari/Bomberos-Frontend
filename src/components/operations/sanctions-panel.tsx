"use client";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Gavel } from "lucide-react";
import { ErrorNotice, Field, stationDate } from "@/components/operations/operations-ui";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { toast } from "@/lib/toast";

type Sanction = { id: string; kind: string; reason: string; startsOn: string; endsOn: string | null; points: number; restrictions: string[]; issuedBy: string; revokedAt: string | null; revokeReason: string | null; revision: number; active: boolean; createdAt: string };
const KINDS = [["WARNING", "Apercibimiento"], ["REPRIMAND", "Amonestación"], ["SUSPENSION", "Suspensión"], ["OTHER", "Otra sanción"]] as const;
const RESTRICTIONS = [["SUSPENDED", "Suspensión del servicio", "No registra asistencia, no es convocado a alertas ni integra dotaciones o tareas"], ["NO_DRIVING", "No puede conducir", "No se lo puede asignar como conductor"], ["NO_GUARD", "No hace guardias", "No se lo puede asignar a guardias"]] as const;
const kindLabel = (k: string) => KINDS.find(([v]) => v === k)?.[1] ?? k;
const restrictionLabel = (r: string) => RESTRICTIONS.find(([v]) => v === r)?.[1] ?? r;
const day = (v: string) => new Date(v).toLocaleDateString("es-AR", { timeZone: "UTC" });

// Sanciones del legajo. Jefatura las registra (con su contrasena) y las puede dejar sin efecto; la persona ve las suyas.
export function SanctionsPanel({ userId, canManage = false }: { userId?: string; canManage?: boolean }) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["sanctions", userId ?? "me"], queryFn: async () => (await api.get<Sanction[]>("/sanctions", { params: { userId } })).data });
  const [open, setOpen] = useState(false), [kind, setKind] = useState("WARNING"), [restrictions, setRestrictions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [revoking, setRevoking] = useState("");
  const refresh = () => client.invalidateQueries({ queryKey: ["sanctions"] });

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget), text = (k: string) => String(data.get(k) || "");
    setBusy(true); setError("");
    try {
      await api.post("/sanctions", { userId, kind, reason: text("reason"), startsOn: text("startsOn"), endsOn: text("endsOn") || null, points: Number(text("points") || 0), restrictions });
      setOpen(false); setRestrictions([]); setKind("WARNING"); await refresh();
      toast.success("Sanción registrada", "Queda en el legajo y se avisó a la persona.");
    } catch (err) { setError(getErrorMessage(err, "No se pudo registrar la sanción")); } finally { setBusy(false); }
  }
  async function revoke(event: FormEvent<HTMLFormElement>, s: Sanction) {
    event.preventDefault();
    setBusy(true); setError("");
    try { await api.post(`/sanctions/${s.id}/revoke`, { reason: String(new FormData(event.currentTarget).get("reason") || ""), revision: s.revision }); setRevoking(""); await refresh(); toast.success("La sanción quedó sin efecto"); }
    catch (err) { setError(getErrorMessage(err, "No se pudo dejar sin efecto")); } finally { setBusy(false); }
  }
  const toggle = (r: string) => setRestrictions((list) => list.includes(r) ? list.filter((x) => x !== r) : [...list, r]);

  return <section className="mt-6 border-t border-[var(--bord)] pt-4" aria-labelledby="sanctions-title">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id="sanctions-title" className="flex items-center gap-2 font-bold"><Gavel className="h-4 w-4" aria-hidden /> Sanciones</h2>
      {canManage && !open && <button className="app-button app-button-outline w-auto" onClick={() => setOpen(true)}>Registrar sanción</button>}
    </div>
    <p className="mt-1 text-xs text-[var(--mut)]">Quedan en el legajo, descuentan puntos del ranking y pueden restringir funciones del sistema mientras están vigentes.</p>
    {error && <ErrorNotice>{error}</ErrorNotice>}
    {open && canManage && <form onSubmit={create} className="card mt-3"><fieldset disabled={busy} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo"><select className="app-input" value={kind} onChange={(e) => { setKind(e.target.value); if (e.target.value === "SUSPENSION" && !restrictions.includes("SUSPENDED")) setRestrictions((l) => [...l, "SUSPENDED"]); }}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        <Field label="Puntos a descontar del ranking"><input name="points" type="number" min={0} max={1000} defaultValue={0} className="app-input" /></Field>
        <Field label="Desde"><input name="startsOn" type="date" required defaultValue={stationDate()} className="app-input" /></Field>
        <Field label={restrictions.length ? "Hasta (obligatorio con restricciones)" : "Hasta (opcional)"}><input name="endsOn" type="date" required={restrictions.length > 0} className="app-input" /></Field>
      </div>
      <fieldset><legend className="mb-1 text-sm font-semibold">Restricciones mientras esté vigente</legend>
        <div className="space-y-2">{RESTRICTIONS.map(([v, l, d]) => <label key={v} className="flex gap-3 rounded-xl border border-[var(--bord)] p-3"><input type="checkbox" className="mt-1" checked={restrictions.includes(v)} onChange={() => toggle(v)} disabled={v === "SUSPENDED" && kind === "SUSPENSION"} /><span><span className="block font-semibold">{l}</span><span className="text-xs text-[var(--mut)]">{d}</span></span></label>)}</div>
      </fieldset>
      <Field label="Motivo"><textarea name="reason" required minLength={10} maxLength={2000} className="app-input min-h-24" /></Field>
      <div className="flex flex-wrap gap-2"><button className="app-button app-button-red w-auto">{busy ? "Guardando…" : "Registrar sanción"}</button><button type="button" className="app-button app-button-outline w-auto" onClick={() => setOpen(false)}>Cancelar</button></div>
      <p className="text-xs text-[var(--mut)]">Se pide tu contraseña para confirmar. La persona recibe un aviso.</p>
    </fieldset></form>}
    {query.isLoading && <ListSkeleton label="Cargando sanciones" />}
    {query.data?.length === 0 && <p className="mt-3 text-sm text-[var(--mut)]">Sin sanciones registradas.</p>}
    <ul className="mt-3 space-y-2">{query.data?.map((s) => <li key={s.id} className={`rounded-xl border p-3 ${s.active ? "border-red-500/50 bg-red-500/5" : "border-[var(--bord)]"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{kindLabel(s.kind)}{s.points ? <span className="font-normal text-[var(--mut)]"> · −{s.points} puntos</span> : null}</p>
        <span className={`badge ${s.revokedAt ? "" : s.active ? "badge-red" : ""}`}>{s.revokedAt ? "Sin efecto" : s.active ? "Vigente" : s.startsOn.slice(0, 10) > stationDate() ? "Programada" : "Cumplida"}</span>
      </div>
      <p className="text-xs text-[var(--mut)]">Desde {day(s.startsOn)}{s.endsOn ? ` hasta ${day(s.endsOn)}` : ""} · registró {s.issuedBy}</p>
      {s.restrictions.length > 0 && <p className="mt-1 text-sm">Restricciones: {s.restrictions.map(restrictionLabel).join(", ")}</p>}
      <p className="mt-1 whitespace-pre-wrap break-words text-sm">{s.reason}</p>
      {s.revokedAt && <p className="mt-1 text-xs text-[var(--mut)]">Sin efecto: {s.revokeReason}</p>}
      {canManage && !s.revokedAt && revoking !== s.id && <button className="mt-2 text-xs font-semibold underline" onClick={() => setRevoking(s.id)}>Dejar sin efecto</button>}
      {canManage && revoking === s.id && <form className="mt-2 flex flex-wrap gap-2" onSubmit={(e) => void revoke(e, s)}><input name="reason" required minLength={10} maxLength={1000} autoFocus aria-label="Motivo" placeholder="Motivo" className="app-input min-w-0 flex-1" /><button className="app-button w-auto" disabled={busy}>Confirmar</button><button type="button" className="app-button app-button-outline w-auto" onClick={() => setRevoking("")}>Cancelar</button></form>}
    </li>)}</ul>
  </section>;
}
