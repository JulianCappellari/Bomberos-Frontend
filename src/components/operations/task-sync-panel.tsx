"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useAuth } from "@/features/auth/auth-context";
import { QueuedTask, readTaskOutbox, writeTaskOutbox } from "@/lib/task-outbox";
import { taskAction } from "@/services/work.service";

export function TaskSyncPanel() {
  const { user } = useAuth(), client = useQueryClient();
  const [items, setItems] = useState<QueuedTask[]>([]), [offline, setOffline] = useState(false);
  useEffect(() => {
    if (!user) return;
    let disposed = false, syncing = false;
    function refresh() { if (!disposed) { setItems(readTaskOutbox(user!.id)); setOffline(!navigator.onLine); } }
    async function sync() {
      refresh(); if (syncing || !navigator.onLine || !navigator.locks) return;
      syncing = true;
      try { await navigator.locks.request(`task-outbox:${user!.id}`, { ifAvailable: true }, async (lock) => {
        if (!lock) return;
        for (const row of readTaskOutbox(user!.id)) {
          if (disposed) break;
          if (row.conflict) continue;
          if (Date.now() - row.savedAt > 86400000 || row.savedAt > Date.now()) { writeTaskOutbox(user!.id, readTaskOutbox(user!.id).map((r) => r.id === row.id ? { ...r, conflict: true } : r)); continue; }
          try {
            await taskAction(row.taskId, row.route, row.body);
            writeTaskOutbox(user!.id, readTaskOutbox(user!.id).filter((r) => r.id !== row.id));
            await client.invalidateQueries({ queryKey: ["tasks"] }); await client.invalidateQueries({ queryKey: ["notifications"] });
          } catch (err) {
            if (isAxiosError(err) && (!err.response || err.response.status >= 500 || [401, 429].includes(err.response.status))) break;
            writeTaskOutbox(user!.id, readTaskOutbox(user!.id).map((r) => r.id === row.id ? { ...r, conflict: true } : r));
          }
        }
      }); } finally { syncing = false; refresh(); }
    }
    const tick = () => { void sync(); };
    const storage = () => { refresh(); };
    window.addEventListener("online", tick); window.addEventListener("offline", refresh); window.addEventListener("task-outbox", storage); window.addEventListener("storage", storage);
    const timer = window.setInterval(tick, 15000); tick();
    return () => { disposed = true; clearInterval(timer); window.removeEventListener("online", tick); window.removeEventListener("offline", refresh); window.removeEventListener("task-outbox", storage); window.removeEventListener("storage", storage); };
  }, [user, client]);
  if (!items.length && !offline) return null;
  return <aside className="my-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm" aria-label="Sincronizacion de tareas"><p role="status">{offline ? "Sin conexion. " : ""}{items.length ? `${items.length} acciones de tareas guardadas en este dispositivo, todavia no confirmadas por el servidor.` : "Los cambios requieren conexion para confirmarse."}</p>{items.length > 0 && <details className="mt-2"><summary className="cursor-pointer">Ver pendientes</summary><ul className="mt-2 space-y-3">{items.map((row) => <li key={row.id} className="break-words"><strong>{row.title}</strong> · {row.conflict ? "Requiere revision; no se sobrescribio el servidor" : "Pendiente de envio"}<div className="mt-1 flex flex-wrap gap-3"><Link href="/tasks" className="underline">Revisar tarea</Link><button className="underline" onClick={() => { if (user && window.confirm("Descartar esta accion local sin enviarla?")) writeTaskOutbox(user.id, readTaskOutbox(user.id).filter((r) => r.id !== row.id)); }}>Descartar pendiente local</button></div><p className="mt-1 whitespace-pre-wrap text-xs">{row.body.notes}</p></li>)}</ul></details>}</aside>;
}
