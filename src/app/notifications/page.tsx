"use client";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { toast } from "@/lib/toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { Pager, dateTime } from "@/components/operations/work-ui";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { PushSettings } from "@/components/operations/push-settings";

type Row = { id: string; title: string; body?: string | null; href: string; createdAt: string; readAt: string | null };
const safeHref = (href: string) => (href.startsWith("/") && !href.startsWith("//") ? href : "/dashboard");

export default function NotificationsPage() {
  const client = useQueryClient();
  const router = useRouter();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const query = useQuery({ queryKey: ["notifications", user?.id, page], queryFn: async () => (await api.get<{ items: Row[]; total: number; unread: number }>("/members/notifications", { params: { page } })).data, enabled: Boolean(user), refetchInterval: 30000 });

  async function refresh() {
    await query.refetch();
    await client.invalidateQueries({ queryKey: ["notification-count", user?.id] });
  }
  // Abrir marca como leida: un solo toque en vez de dos botones.
  async function open(row: Row) {
    if (!row.readAt) { try { await api.post(`/members/notifications/${row.id}/read`); void refresh(); } catch { /* abrir igual */ } }
    router.push(safeHref(row.href));
  }
  async function readAll() {
    setBusy(true); setError("");
    try { await api.post("/members/notifications/read-all"); await refresh(); toast.success("Todas las notificaciones quedaron leídas"); }
    catch { setError("No se pudieron marcar como leídas."); }
    finally { setBusy(false); }
  }

  const unread = query.data?.unread ?? 0;
  const items = (query.data?.items ?? []).filter((row) => !onlyUnread || !row.readAt);

  return <ProtectedLayout><section className="screen-body">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Bell className="h-6 w-6 text-red-400" aria-hidden /> Notificaciones</h1>
        <p className="mt-1 text-sm text-[var(--mut)]">{query.data ? (unread ? `${unread} sin leer` : "Estás al día") : " "}</p>
      </div>
      {unread > 0 && <button type="button" disabled={busy} onClick={readAll} className="app-button app-button-outline w-auto"><CheckCheck className="h-4 w-4" /> Marcar todas como leídas</button>}
    </header>

    <div role="tablist" aria-label="Filtro" className="mt-4 inline-flex rounded-xl border border-[var(--bord)] bg-[var(--card)] p-1">
      {([[false, "Todas"], [true, "Sin leer"]] as Array<[boolean, string]>).map(([value, label]) => <button key={label} type="button" role="tab" aria-selected={onlyUnread === value} onClick={() => setOnlyUnread(value)} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${onlyUnread === value ? "bg-red-600 text-white" : "text-white/65"}`}>{label}</button>)}
    </div>

    {query.isLoading && <ListSkeleton label="Cargando" />}
    {(error || query.isError) && <p role="alert" className="my-3 text-red-300">{error || "No se pudieron consultar los avisos."}</p>}
    {query.data && items.length === 0 && <p className="py-8 text-center text-sm text-[var(--mut)]">{onlyUnread ? "No tenés notificaciones sin leer." : "No hay notificaciones."}</p>}

    <ul className="stagger mt-4 space-y-2">{items.map((row) => <li key={row.id}>
      <button type="button" onClick={() => void open(row)} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:border-white/25 ${row.readAt ? "border-[var(--bord)] bg-transparent" : "border-red-500/30 bg-red-500/[0.06]"}`}>
        <span aria-hidden className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${row.readAt ? "bg-transparent" : "bg-red-500"}`} />
        <span className="min-w-0 flex-1">
          <span className={`block ${row.readAt ? "font-medium text-white/80" : "font-bold text-white"}`}>{row.title}</span>
          {row.body && <span className="mt-1 block whitespace-pre-wrap break-words text-sm text-white/70">{row.body}</span>}
          <span className="mt-1 block text-xs text-[var(--mut)]">{dateTime(row.createdAt)}{row.readAt ? "" : " · Sin leer"}</span>
        </span>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/40" aria-hidden />
      </button>
    </li>)}</ul>
    {query.data && <Pager page={page} total={query.data.total} onPage={setPage} />}

    <details className="mt-6 rounded-xl border border-[var(--bord)] bg-[var(--card)] px-4">
      <summary className="cursor-pointer py-3 text-sm font-semibold">Avisos en este dispositivo</summary>
      <PushSettings />
    </details>
  </section></ProtectedLayout>;
}
