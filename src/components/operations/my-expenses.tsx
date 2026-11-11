"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/features/auth/auth-context";
import { money } from "@/components/operations/finance-panel";
import { expenseState, financeDate } from "@/lib/finance-presentation";

type Mine = { id: string; title: string; amountCents: number; occurredOn: string; status: string; reviewNote: string | null; paidCents: number; debtCents: number };
const tone: Record<string, string> = { "Por revisar": "bg-amber-500/15 text-amber-200", Rechazado: "bg-red-500/15 text-red-300", Pagado: "bg-emerald-500/15 text-emerald-300", "Pago parcial": "bg-sky-500/15 text-sky-200", "Pendiente de pago": "bg-sky-500/15 text-sky-200" };

// Seguimiento de lo que presente: antes no habia forma de saber si un gasto se aprobo o pago.
export function MyExpenses() {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ["finance", "mine", user?.id], enabled: Boolean(user), queryFn: async () => (await api.get<Mine[]>("/finance/mine")).data });
  const pending = (query.data ?? []).reduce((sum, row) => sum + row.debtCents, 0);
  return (
    <section className="mt-8 border-t border-[var(--bord)] pt-5" aria-labelledby="my-expenses-title">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="my-expenses-title" className="text-lg font-bold">Mis gastos presentados</h2>
        {pending > 0 && <p className="text-sm text-sky-200">A cobrar: <strong>{money(pending)}</strong></p>}
      </div>
      {query.isLoading && <p className="text-sm text-[var(--mut)]">Cargando…</p>}
      {query.isError && <p role="alert" className="text-sm text-red-300">No se pudieron consultar tus gastos. <button className="underline" onClick={() => query.refetch()}>Reintentar</button></p>}
      {query.data?.length === 0 && <p className="text-sm text-[var(--mut)]">Todavía no presentaste gastos.</p>}
      <ul className="space-y-2">
        {query.data?.map((row) => {
          const state = expenseState(row);
          return (
            <li key={row.id} className="rounded-xl border border-[var(--bord)] bg-[var(--card)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-semibold">{row.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--mut)]">{financeDate(row.occurredOn)} · {money(row.amountCents)}{row.paidCents > 0 && row.debtCents > 0 ? ` · cobrado ${money(row.paidCents)}` : ""}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${tone[state] ?? "bg-white/10"}`}>{state}</span>
              </div>
              {row.reviewNote && <p className="mt-2 whitespace-pre-wrap break-words border-l-2 border-[var(--bord)] pl-2 text-sm text-white/75">Jefatura: {row.reviewNote}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
