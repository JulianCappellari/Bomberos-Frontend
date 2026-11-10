"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { listTasks } from "@/services/work.service";
import { stationDate } from "./operations-ui";
import { TaskQuickActions } from "./task-quick-actions";

export function MyTasksPanel() {
  const { user } = useAuth();
  const tasks = useQuery({ queryKey: ["tasks", user?.id, "dashboard"], queryFn: () => listTasks({ page: 1, status: "", q: "", mine: "true", pending: "true" }), enabled: Boolean(user), refetchInterval: 30000 });
  const pending = tasks.data?.items.filter((task) => ["ASSIGNED", "RETURNED", "SUBMITTED"].includes(task.status) && task.members.some((m) => m.userId === user?.id && !m.declinedAt)) || [];
  return <section className="mt-5" aria-label="Mis tareas"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-white/80">Mis tareas</h3><Link href="/tasks" className="text-sm text-red-300 underline-offset-4 hover:underline">Ver todas</Link></div>
    {tasks.isLoading && <p className="mt-3 text-sm" role="status">Cargando asignaciones...</p>}
    {tasks.isError && <p role="alert" className="mt-3 text-sm text-red-300">No se pudieron consultar tus tareas. <button onClick={() => tasks.refetch()} className="underline">Reintentar</button></p>}
    {!tasks.isLoading && !tasks.isError && !pending.length && <p className="mt-3 text-sm text-[var(--mut)]">No tenés tareas pendientes.</p>}
    <div className="mt-3 grid gap-2 lg:grid-cols-2">{pending.slice(0, 4).map((task) => <article key={task.id} className={`min-w-0 rounded-lg border border-[var(--bord)] border-l-4 p-3 ${task.dueOn && task.dueOn.slice(0, 10) < stationDate() && task.status !== "SUBMITTED" ? "border-l-red-400" : "border-l-sky-400"}`}><Link href="/tasks" className="break-words text-sm font-semibold underline-offset-4 hover:underline">{task.title}</Link><p className="mt-1 text-xs text-[var(--mut)]">{task.status === "SUBMITTED" ? "Enviada: esperando verificación" : task.status === "RETURNED" ? "Devuelta para corregir" : "Asignada"}{task.dueOn && ` · ${task.dueOn.slice(0, 10) < stationDate() ? "Vencida" : "Hasta"} ${task.dueOn.slice(0, 10)}`}</p><p className="mt-2 break-words text-xs text-[var(--mut)]">Equipo: {task.members.filter((m) => !m.declinedAt).map((m) => m.user.profile?.fullName || m.user.username).join(", ")}</p>{task.reviewNotes && <p className="mt-2 break-words text-xs text-amber-200">{task.reviewNotes}</p>}<TaskQuickActions task={task} /></article>)}</div>
  </section>;
}
