"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/features/auth/auth-context";
import { ChatMessage } from "@/types/chat";
import { getErrorMessage } from "@/lib/get-error-message";
export function MessageAcknowledgement({ message }: { message: ChatMessage }) {
  const { user } = useAuth(), client = useQueryClient();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const query = useQuery({ queryKey: ["message-ack", user?.id, message.id, message.editedAt], queryFn: async () => (await api.get<{ contentHash: string; body: string; version: string; acknowledgedAt: string | null }>(`/members/messages/${message.id}/read`)).data, enabled: Boolean(user), staleTime: 30000 });
  const matches = query.data?.body === message.body && query.data.version === (message.editedAt || message.createdAt);
  async function confirm() {
    if (!matches || !query.data) return;
    setBusy(true); setError("");
    try { await api.post(`/members/messages/${message.id}/read`, { contentHash: query.data.contentHash }); await client.invalidateQueries({ queryKey: ["message-ack", user?.id, message.id] }); }
    catch (err) { setError(getErrorMessage(err, "No se pudo confirmar la lectura")); }
    finally { setBusy(false); }
  }
  return <div className="mt-2 border-t border-[var(--bord)] pt-2 text-xs">
    {query.isError ? <button className="text-red-300 underline" onClick={() => query.refetch()}>Reintentar estado de lectura</button> : query.data && !matches ? <button className="text-amber-200 underline" onClick={() => { client.invalidateQueries({ queryKey: ["chat", "messages"] }); query.refetch(); }}>El mensaje cambio: actualizar chat antes de confirmar</button> : query.data?.acknowledgedAt ? <span className="text-green-300">Lectura confirmada: {new Date(query.data.acknowledgedAt).toLocaleString("es-AR", { hourCycle: "h23" })}</span> : <button className="app-button w-auto text-xs" disabled={busy || !matches} onClick={confirm}>{busy ? "Confirmando..." : "Confirmo que lei este mensaje"}</button>}
    {error && <p role="alert" className="mt-2 text-red-300">{error}</p>}
  </div>;
}
