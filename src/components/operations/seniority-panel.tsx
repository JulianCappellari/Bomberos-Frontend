"use client";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { useAuth } from "@/features/auth/auth-context";
import { ErrorNotice } from "@/components/operations/operations-ui";
import { PromotionRule, SeniorityRow } from "@/services/station.service";

const fmt = (v: string | null) => v ? new Date(v).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "Sin dato";
const yrs = (v: number | null) => v === null ? "–" : `${String(v).replace(".", ",")} ${v === 1 ? "año" : "años"}`;

// 14: escalafon y antiguedad calculados con la fecha de ingreso, la del ultimo ascenso y los cursos aprobados.
export function SeniorityPanel() {
  const { user } = useAuth(), client = useQueryClient(), admin = user?.role === "ADMIN";
  const [filter, setFilter] = useState<"all" | "eligible">("all"), [editing, setEditing] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const query = useQuery({ queryKey: ["station-seniority", user?.id], queryFn: async () => (await api.get<{ rules: PromotionRule[]; people: SeniorityRow[] }>("/station/seniority")).data });
  const [draft, setDraft] = useState<PromotionRule[]>([]), [reason, setReason] = useState("");
  const people = (query.data?.people ?? []).filter((p) => filter === "all" || p.eligible);
  const eligible = query.data?.people.filter((p) => p.eligible).length ?? 0;

  async function save(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { await api.put("/station/promotion-rules", { rules: draft, reason }); await client.invalidateQueries({ queryKey: ["station-seniority"] }); setEditing(false); setReason(""); }
    catch (err) { setError(getErrorMessage(err, "No se pudieron guardar las reglas")); } finally { setBusy(false); }
  }
  return <section aria-labelledby="seniority-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 id="seniority-title" className="flex items-center gap-2 text-xl font-bold"><Award className="h-5 w-5 text-red-400" aria-hidden /> Escalafón y antigüedad</h2><p className="mt-1 text-sm text-[var(--mut)]">Se calcula solo con la fecha de ingreso, la del último ascenso (se registra al cambiar el cargo) y los cursos aprobados.</p></div>
      {admin && query.data && !editing && <button type="button" className="app-button app-button-outline w-auto" onClick={() => { setDraft(query.data!.rules.map((r) => ({ ...r }))); setError(""); setEditing(true); }}>Editar reglas de ascenso</button>}
    </div>
    {query.isLoading && <p className="mt-3 text-sm text-[var(--mut)]">Calculando…</p>}
    {query.isError && <ErrorNotice>No se pudo calcular el escalafón. <button className="underline" onClick={() => query.refetch()}>Reintentar</button></ErrorNotice>}

    {editing && <form onSubmit={save} className="card mt-4"><fieldset disabled={busy} className="space-y-3">
      <h3 className="font-bold">Reglas de ascenso</h3>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="text-left text-xs text-[var(--mut)]"><th className="py-1">Cargo</th><th>Asciende a</th><th>Años en el cargo</th><th>Años de servicio</th><th>Cursos aprobados</th></tr></thead><tbody>
        {draft.map((rule, i) => <tr key={rule.rank} className="border-t border-[var(--bord)]"><td className="py-2 pr-2 font-semibold">{rule.rank}</td>
          <td className="pr-2"><input className="app-input py-1.5" value={rule.nextRank} maxLength={80} onChange={(e) => setDraft(draft.map((r, j) => j === i ? { ...r, nextRank: e.target.value } : r))} /></td>
          {(["minYearsInRank", "minYearsService", "minApprovedCourses"] as const).map((k) => <td key={k} className="pr-2"><input type="number" min={0} max={k === "minApprovedCourses" ? 200 : 60} className="app-input w-20 py-1.5" value={rule[k]} onChange={(e) => setDraft(draft.map((r, j) => j === i ? { ...r, [k]: Number(e.target.value) } : r))} /></td>)}
        </tr>)}
      </tbody></table></div>
      <label className="block text-sm">Motivo del cambio<textarea required minLength={10} maxLength={1000} className="app-input mt-1" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
      <div className="flex gap-2"><button className="app-button app-button-red w-auto">Guardar reglas</button><button type="button" className="app-button app-button-outline w-auto" onClick={() => setEditing(false)}>Cancelar</button></div>
    </fieldset></form>}

    {query.data && <>
      <div role="tablist" aria-label="Filtro" className="mt-4 inline-flex rounded-xl border border-[var(--bord)] bg-[var(--card)] p-1">
        {([["all", `Todos (${query.data.people.length})`], ["eligible", `En condiciones de ascender (${eligible})`]] as const).map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={filter === v} onClick={() => setFilter(v)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${filter === v ? "bg-red-600 text-white" : "text-white/65"}`}>{l}</button>)}
      </div>
      <ul className="mt-3 space-y-2">{people.map((p) => <li key={p.userId} className={`rounded-xl border p-3 ${p.eligible ? "border-emerald-500/50 bg-emerald-500/10" : "border-[var(--bord)] bg-[var(--card)]"}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0"><p className="font-semibold">{p.name} <span className="text-xs font-normal text-[var(--mut)]">· Legajo {p.badge}</span></p><p className="text-sm text-[var(--mut)]">{p.rank}{p.nextRank ? ` → ${p.nextRank}` : ""}</p></div>
          {p.eligible ? <span className="badge badge-green">En condiciones de ascender</span> : p.nextRank ? <span className="badge badge-gray">Todavía no</span> : <span className="badge badge-gray">Sin regla para este cargo</span>}
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-[var(--mut)]">Ingreso</dt><dd>{fmt(p.joinDate)}</dd></div>
          <div><dt className="text-xs text-[var(--mut)]">Antigüedad</dt><dd>{yrs(p.yearsService)}</dd></div>
          <div><dt className="text-xs text-[var(--mut)]">En el cargo</dt><dd>{yrs(p.yearsInRank)}{p.rankSinceEstimated && p.yearsInRank !== null ? " *" : ""}</dd></div>
          <div><dt className="text-xs text-[var(--mut)]">Cursos aprobados</dt><dd>{p.approvedCourses}</dd></div>
        </dl>
        {!p.eligible && p.missing.length > 0 && <p className="mt-2 text-xs text-amber-300">Falta: {p.missing.join(" · ")}</p>}
      </li>)}</ul>
      {!people.length && <p className="mt-3 text-sm text-[var(--mut)]">Nadie cumple todavía los requisitos.</p>}
      <p className="mt-3 text-xs text-[var(--mut)]">* Sin fecha de último ascenso registrada: se toma la fecha de ingreso. Los ascensos que se hagan desde ahora quedan con su fecha.</p>
    </>}
  </section>;
}
