"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { UserRosterItem } from "@/types/user";
import { ErrorNotice, personName } from "./operations-ui";
type Transfer = { id: string; fromUserId: string; toUserId: string; notes: string; task: { title: string }; from: UserRosterItem; to: UserRosterItem };
export function TaskTransfers() {
  const { user } = useAuth(), client = useQueryClient();
  const [busy, setBusy] = useState(""), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const query = useQuery({ queryKey: ["task-transfers", user?.id], enabled: Boolean(user), queryFn: async () => (await api.get<Transfer[]>("/work/tasks/transfers")).data, refetchInterval: 30000 });
  async function respond(row: Transfer, accept: boolean) {
    if (!window.confirm(accept ? "Aceptar la responsabilidad de esta tarea?" : "Rechazar o cancelar esta propuesta?")) return;
    setBusy(row.id); setError(""); setNotice("");
    try { const result = await api.post(`/work/tasks/transfers/${row.id}/respond`, { accept }); setNotice(result.data.message); await Promise.all([client.invalidateQueries({ queryKey: ["task-transfers"] }), client.invalidateQueries({ queryKey: ["tasks"] }), client.invalidateQueries({ queryKey: ["task-history"] })]); }
    catch (err) { setError(getErrorMessage(err, "No se pudo responder la transferencia")); } finally { setBusy(""); }
  }
  // Solo aparece cuando hay propuestas: una seccion vacia agrega ruido en cada visita.
  if (!query.isError && !error && !notice && !query.data?.length) return null;
  return <section className="mb-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4"><h2 className="font-bold">Transferencias pendientes</h2>{query.isLoading && <p className="mt-2 text-sm">Consultando propuestas...</p>}{(query.isError || error) && <ErrorNotice>{error || "No se pudieron cargar las propuestas."} <button className="underline" onClick={() => query.refetch()}>Actualizar</button></ErrorNotice>}{notice && <p role="status" className="my-3 text-sm">{notice}</p>}{query.data?.length === 0 && <p className="mt-2 text-sm text-[var(--mut)]">No tenes propuestas pendientes.</p>}{query.data?.map(row => <article key={row.id} className="border-b border-[var(--bord)] py-3"><h3 className="font-bold">{row.task.title}</h3><p className="my-2 text-sm">{personName(row.from)} propone transferir a {personName(row.to)}.</p><p className="whitespace-pre-wrap break-words text-sm text-[var(--mut)]">{row.notes}</p><div className="mt-3 flex flex-wrap gap-2">{row.toUserId === user?.id && <button className="app-button app-button-red w-auto" disabled={Boolean(busy)} onClick={() => respond(row, true)}>Aceptar tarea</button>}<button className="app-button w-auto" disabled={Boolean(busy)} onClick={() => respond(row, false)}>{row.fromUserId === user?.id ? "Cancelar propuesta" : "Rechazar propuesta"}</button></div></article>)}</section>;
}
