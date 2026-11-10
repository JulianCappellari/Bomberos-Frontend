"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { Pager, dateTime } from "@/components/operations/work-ui";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { PushSettings } from "@/components/operations/push-settings";
export default function NotificationsPage() {
  const client = useQueryClient();
  const { user } = useAuth(); const [page, setPage] = useState(1), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const query = useQuery({ queryKey: ["notifications", user?.id, page], queryFn: async () => (await api.get<{ items: Array<{ id: string; title: string; body?: string | null; href: string; createdAt: string; readAt: string | null }>; total: number; unread: number }>("/members/notifications", { params: { page } })).data, enabled: Boolean(user), refetchInterval: 30000 });
  async function read(id: string) { setBusy(true); setError(""); try { await api.post(`/members/notifications/${id}/read`); await query.refetch(); await client.invalidateQueries({ queryKey: ["notification-count", user?.id] }); } catch { setError("No se pudo marcar la notificacion."); } finally { setBusy(false); } }
  return <ProtectedLayout><section className="screen-body"><h1 className="text-2xl font-bold">Mis notificaciones</h1><PushSettings />{query.data && <p className="my-3 text-sm text-[var(--mut)]">{query.data.unread} sin leer</p>}{query.isLoading && <p>Cargando...</p>}{(error || query.isError) && <p role="alert" className="my-3 text-red-300">{error || "No se pudieron consultar los avisos."}</p>}{query.data?.items.length === 0 && <p className="py-8">No hay notificaciones.</p>}<div className="space-y-3">{query.data?.items.map((row) => <article key={row.id} className="rounded-lg border border-[var(--bord)] p-4"><h2 className="font-bold">{row.title}</h2>{row.body && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{row.body}</p>}<p className="mt-1 text-xs text-[var(--mut)]">{dateTime(row.createdAt)} · {row.readAt ? "Leida" : "Sin leer"}</p><div className="mt-3 flex flex-wrap gap-2"><Link className="app-button w-auto" href={row.href.startsWith("/") && !row.href.startsWith("//") ? row.href : "/dashboard"}>Abrir</Link>{!row.readAt && <button disabled={busy} className="app-button w-auto" onClick={() => read(row.id)}>Marcar notificacion leida</button>}</div></article>)}</div>{query.data && <Pager page={page} total={query.data.total} onPage={setPage} />}</section></ProtectedLayout>;
}
