"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ClipboardCheck } from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/features/auth/auth-context";
import { listTasks } from "@/services/work.service";
import { useFinanceAccess } from "@/components/operations/finance-panel";

// Jefatura: todo lo que espera una verificacion o aprobacion, en un solo lugar.
export function ReviewQueue() {
  const { user } = useAuth();
  const enabled = user?.role === "ADMIN" || user?.role === "OPERATOR";
  const tasks = useQuery({ queryKey: ["tasks", user?.id, "review-queue"], enabled, queryFn: () => listTasks({ page: 1, q: "", status: "SUBMITTED", mine: "false" }), refetchInterval: 60000 });
  const courses = useQuery({ queryKey: ["courses", user?.id, "review-queue"], enabled, queryFn: async () => (await api.get<unknown[]>("/members/courses", { params: { scope: "pending", page: 1 } })).data, refetchInterval: 60000 });
  const swaps = useQuery({ queryKey: ["shift-swaps", user?.id], enabled, queryFn: async () => (await api.get<Array<{ status: string; fromUserId: string; toUserId: string }>>("/shifts/swaps")).data, refetchInterval: 60000 });
  const corrections = useQuery({ queryKey: ["attendance-corrections", user?.id], enabled, queryFn: async () => (await api.get<Array<{ requestedBy: { id: string }; attendance: { userId: string } }>>("/attendance/corrections")).data, refetchInterval: 60000 });
  const finance = useFinanceAccess();
  const canFinance = enabled && Boolean(finance.data?.canManage);
  const expenses = useQuery({ queryKey: ["finance", user?.id, "review-queue"], enabled: canFinance, queryFn: async () => (await api.get<{ total: number }>("/finance", { params: { state: "pending", page: 1 } })).data, refetchInterval: 60000 });
  const officerExpenses = useQuery({ queryKey: ["officer-expenses", user?.id], enabled: enabled && user?.role === "OPERATOR", queryFn: async () => (await api.get<Array<{ userId: string; approvals: Array<{ userId: string }> }>>("/finance/officer-expenses")).data, refetchInterval: 60000 });
  if (!enabled) return null;
  const rows: Array<[string, number, string]> = [
    ["Tareas enviadas para verificar", tasks.data?.total ?? 0, "/tasks"],
    ["Cursos declarados para aprobar", courses.data?.length ?? 0, "/courses"],
    ["Intercambios de guardia para aprobar", swaps.data?.filter((swap) => swap.status === "ACCEPTED" && swap.fromUserId !== user?.id && swap.toUserId !== user?.id).length ?? 0, "/calendar"],
    ["Gastos para revisar", canFinance ? expenses.data?.total ?? 0 : 0, "/expenses"],
    ["Gastos de oficiales para autorizar", officerExpenses.data?.filter((row) => row.userId !== user?.id && !row.approvals.some((a) => a.userId === user?.id)).length ?? 0, "/expenses"],
    ["Correcciones de fichaje para autorizar", corrections.data?.filter((row) => row.requestedBy.id !== user?.id && row.attendance.userId !== user?.id).length ?? 0, "/station"],
  ];
  const pending = rows.filter(([, count]) => count > 0);
  return (
    <section aria-label="Para verificar">
      <h2 className="mb-3 text-base font-bold text-white">Para verificar</h2>
      {pending.length === 0 ? (
        <p className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[var(--card)] p-3 text-sm text-white/70"><ClipboardCheck className="h-4 w-4 text-emerald-400" aria-hidden />No hay nada esperando tu verificación.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {pending.map(([text, count, href]) => (
            <li key={text}><Link href={href} className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-50 hover:bg-amber-500/15">
              <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-amber-500/30 px-2 font-bold">{count}</span>
              <span className="flex-1">{text}</span><ChevronRight className="h-4 w-4 opacity-60" aria-hidden />
            </Link></li>
          ))}
        </ul>
      )}
    </section>
  );
}
