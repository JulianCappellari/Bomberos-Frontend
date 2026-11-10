"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/features/auth/auth-context";
import { ChatMessage } from "@/types/chat";
import { MessageReceipt, groupMessageReceipts } from "@/lib/message-receipts";
import { ErrorNotice, Field } from "./operations-ui";
import { dateTime } from "./work-ui";
type Report = { contentHash: string; message: Pick<ChatMessage, "id" | "body" | "createdAt" | "editedAt" | "deletedAt" | "author">; receipts: MessageReceipt[] };
function Readers({ rows }: { rows: MessageReceipt[] }) {
  return <ul className="divide-y divide-[var(--bord)]">{rows.map(row => <li key={row.userId} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><strong className="break-words">{row.user.profile?.fullName || row.user.username}</strong><time className="text-xs text-[var(--mut)]">{dateTime(row.acknowledgedAt)}</time></li>)}</ul>;
}
export function MessageReceiptAdmin() {
  const { user } = useAuth(); const [id, setId] = useState(""), [search, setSearch] = useState("");
  const messages = useQuery({ queryKey: ["admin-receipt-messages", user?.id], queryFn: async () => (await api.get<ChatMessage[]>("/chat/messages", { params: { limit: 80 } })).data, enabled: user?.role === "ADMIN" });
  const report = useQuery({ queryKey: ["admin-receipt-report", user?.id, id], queryFn: async () => (await api.get<Report>(`/members/messages/${id}/receipt-report`)).data, enabled: user?.role === "ADMIN" && Boolean(id) });
  const grouped = report.data ? groupMessageReceipts(report.data.receipts, report.data.contentHash) : null;
  return <section className="my-5 border-t border-[var(--bord)] pt-5"><h2 className="mb-4 text-lg font-bold">Lecturas confirmadas</h2>
    <div className="grid gap-3 sm:grid-cols-2"><Field label="Buscar mensaje reciente"><input type="search" className="app-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Texto o autor" /></Field><Field label="Mensaje a consultar"><select className="app-input" value={id} onChange={e => setId(e.target.value)}><option value="">Seleccionar mensaje</option>{messages.data?.filter(m => `${m.body} ${m.author.profile?.fullName || m.author.username}`.toLowerCase().includes(search.toLowerCase())).map(m => <option key={m.id} value={m.id}>{m.body.slice(0, 70)} · {dateTime(m.createdAt)}</option>)}</select></Field></div>
    {messages.isLoading && <p className="my-4">Cargando mensajes...</p>}{messages.isError && <ErrorNotice>No se pudieron consultar los mensajes. <button onClick={() => messages.refetch()} className="underline">Reintentar</button></ErrorNotice>}
    {!id && <p className="my-5 text-sm text-[var(--mut)]">Selecciona un mensaje para consultar sus confirmaciones.</p>}
    {id && report.isLoading && <p className="my-4">Consultando lecturas...</p>}{report.isError && <ErrorNotice>No se pudieron consultar las lecturas. <button className="underline" onClick={() => report.refetch()}>Reintentar</button></ErrorNotice>}
    {report.data && grouped && <div className="mt-5"><section className="border-l-2 border-[var(--bord)] pl-4"><h3 className="mb-2 text-xs font-semibold uppercase text-[var(--mut)]">Mensaje actual</h3><p className="whitespace-pre-wrap break-words text-sm">{report.data.message.body}</p><p className="mt-3 text-xs text-[var(--mut)]">{report.data.message.author.profile?.fullName || report.data.message.author.username} · {dateTime(report.data.message.editedAt || report.data.message.createdAt)}{report.data.message.editedAt ? " · Editado" : ""}</p></section>
      <h3 className="mt-6 font-bold">Confirmaron esta version: {grouped.current.length}</h3>{!grouped.current.length ? <p className="my-3 text-sm text-[var(--mut)]">Todavia no hay confirmaciones de la version actual.</p> : <Readers rows={grouped.current} />}
      {grouped.previous.length > 0 && <details className="mt-5 border-t border-[var(--bord)] pt-4"><summary className="cursor-pointer font-semibold">Versiones anteriores ({grouped.previous.length})</summary><p className="my-3 text-sm text-[var(--mut)]">Estas lecturas no confirman el texto actual.</p>{grouped.previous.map((version, index) => <section key={version.hash} className="my-4 border-t border-[var(--bord)] pt-4"><h4 className="mb-2 font-bold">Registro anterior {index + 1} · {version.readers.length} confirmaciones</h4><p className="whitespace-pre-wrap break-words text-sm text-[var(--mut)]">{version.body}</p><Readers rows={version.readers} /></section>)}</details>}
    </div>}
  </section>;
}
