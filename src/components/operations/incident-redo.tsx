"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/features/auth/auth-context";
import { isCommand } from "@/lib/permissions";
import { getErrorMessage } from "@/lib/get-error-message";

// G15: una intervencion cerrada no se edita; jefatura la anula y se rehace completa en una nueva.
export function IncidentRedo({ incidentId, closed, voided }: { incidentId: string; closed: boolean; voided: boolean }) {
  const { user } = useAuth(), router = useRouter();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  if (voided) return <p role="status" className="my-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">Esta intervención fue anulada y reemplazada: no acredita horas, salidas ni participación.</p>;
  if (!closed || !isCommand(user?.role)) return null;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const response = await api.post<{ incidentId: string }>(`/incidents/${incidentId}/void-and-redo`, { reason: new FormData(e.currentTarget).get("reason") });
      router.push(`/incidents/${response.data.incidentId}/sheet`);
    } catch (err) { setError(getErrorMessage(err, "No se pudo anular la intervención")); setBusy(false); }
  }
  return <section className="my-4 border-t border-[var(--bord)] pt-4">
    <button type="button" className="app-button w-auto" onClick={() => setOpen(!open)}>Anular y rehacer intervención</button>
    {open && <form onSubmit={submit} className="mt-3 space-y-3">
      <p className="text-sm text-[var(--mut)]">Para corregir participantes u horarios se anula esta intervención (con sus salidas y créditos) y se abre una nueva donde se carga todo otra vez con los horarios reales. La anulada queda en el historial.</p>
      <label className="block text-sm">Motivo de la anulación<textarea name="reason" required minLength={10} maxLength={2000} className="app-input mt-1" /></label>
      <button disabled={busy} className="app-button app-button-red w-auto">{busy ? "Anulando..." : "Confirmar anulación"}</button>
    </form>}
    {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
  </section>;
}
