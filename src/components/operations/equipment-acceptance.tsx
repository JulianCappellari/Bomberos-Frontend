"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/lib/get-error-message";

type Issue = { id: string; issuedAt: string; holderAcceptedAt: string | null; issueNotes: string | null; equipment: { code: string; category: string; size: string | null; asset: { name: string } } };

// P04: la entrega de una prenda institucional queda firme cuando el titular confirma la recepcion.
export function EquipmentAcceptance() {
  const { user } = useAuth(), client = useQueryClient();
  const [busy, setBusy] = useState(""), [error, setError] = useState("");
  const query = useQuery({ queryKey: ["my-equipment-issues", user?.id], enabled: Boolean(user), queryFn: async () => (await api.get<Issue[]>("/members/equipment-issues")).data });
  if (!query.data?.length) return null;
  async function accept(id: string) {
    setBusy(id); setError("");
    try { await api.post(`/members/equipment-issues/${id}/accept`); await client.invalidateQueries({ queryKey: ["my-equipment-issues"] }); }
    catch (err) { setError(getErrorMessage(err, "No se pudo confirmar la recepción")); } finally { setBusy(""); }
  }
  return <section className="my-5 border-y border-[var(--bord)] py-4" aria-label="Prendas institucionales a mi cargo">
    <h2 className="mb-3 font-bold">Prendas institucionales a mi cargo</h2>
    {error && <p role="alert" className="mb-2 text-sm text-red-300">{error}</p>}
    <ul className="space-y-2">{query.data.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--bord)] p-3 text-sm">
      <div className="min-w-0"><div className="font-semibold">{row.equipment.asset.name}</div><div className="text-xs text-[var(--mut)]">Código {row.equipment.code}{row.equipment.size ? ` · Talle ${row.equipment.size}` : ""} · Entregada {new Date(row.issuedAt).toLocaleDateString("es-AR")}</div>{row.issueNotes && <p className="mt-1 text-xs">{row.issueNotes}</p>}</div>
      {row.holderAcceptedAt ? <span className="text-xs text-emerald-400">Recepción confirmada</span> : <button disabled={busy === row.id} className="app-button app-button-red w-auto" onClick={() => accept(row.id)}>Confirmar recepción</button>}
    </li>)}</ul>
  </section>;
}
