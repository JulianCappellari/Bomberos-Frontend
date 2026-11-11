"use client";
import { FormEvent, useState } from "react";
import { Megaphone } from "lucide-react";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { OperationDialog } from "@/components/operations/work-ui";
import { Field } from "@/components/operations/operations-ui";

// 3: pedir refuerzos desde una intervencion abierta, sin crear una alerta nueva.
export function ReinforcementRequest({ incidentId }: { incidentId: string }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [done, setDone] = useState("");
  const [target, setTarget] = useState<"ALL" | "DRIVERS">("ALL"), [message, setMessage] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const { data } = await api.post<{ notified: number }>(`/station/incidents/${incidentId}/reinforcements`, { message, target });
      setDone(data.notified ? `Se avisó a ${data.notified} ${data.notified === 1 ? "persona" : "personas"}.` : "No hay personal disponible para avisar en este momento.");
      setOpen(false); setMessage("");
    } catch (err) { setError(getErrorMessage(err, "No se pudo pedir refuerzos")); }
    finally { setBusy(false); }
  }
  return <>
    <button type="button" className="app-button app-button-orange w-auto" onClick={() => { setError(""); setOpen(true); }}><Megaphone className="h-4 w-4" /> Pedir refuerzos</button>
    {done && <p role="status" className="basis-full text-sm text-emerald-300">{done}</p>}
    {open && <OperationDialog title="Pedir refuerzos" pending={busy} onClose={() => setOpen(false)}><form onSubmit={submit}><fieldset disabled={busy} className="space-y-3">
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <p className="text-sm text-[var(--mut)]">Se avisa al personal disponible que no está en esta salida, incluido quien había respondido “No voy”.</p>
      <div role="radiogroup" aria-label="A quién avisar" className="grid grid-cols-2 gap-2">
        {([["ALL", "Todo el personal disponible"], ["DRIVERS", "Solo choferes habilitados"]] as const).map(([value, label]) => <button key={value} type="button" role="radio" aria-checked={target === value} onClick={() => setTarget(value)} className={`rounded-xl border p-3 text-left text-sm font-semibold ${target === value ? "border-[var(--accent)] ring-1 ring-[var(--accent)]" : "border-[var(--bord)]"}`}>{label}</button>)}
      </div>
      <Field label="¿Qué se necesita?"><textarea autoFocus required minLength={3} maxLength={500} className="app-input min-h-20" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ej. Hace falta una segunda dotación con equipos ERA" /></Field>
      <button className="app-button app-button-red">{busy ? "Enviando…" : "Avisar ahora"}</button>
    </fieldset></form></OperationDialog>}
  </>;
}
