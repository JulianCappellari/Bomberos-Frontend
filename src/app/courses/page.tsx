"use client";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Plus } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field, stationDate } from "@/components/operations/operations-ui";
import { isCommand } from "@/lib/permissions";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";

const states = { PENDING: "Por revisar", APPROVED: "Aprobado", REJECTED: "Rechazado" };
const tones = { PENDING: "badge-yellow", APPROVED: "badge-green", REJECTED: "badge-red" };
type Course = { id: string; userId: string; title: string; provider: string; completedOn: string; status: keyof typeof states; reviewNote: string | null; user: { username: string }; reviewer: { username: string } | null };
const date = (value: string) => value.slice(0, 10).split("-").reverse().join("/");

export default function Courses() {
  const { user } = useAuth(), client = useQueryClient();
  const command = isCommand(user?.role);
  const [scope, setScope] = useState<"mine" | "pending">("mine"), [page, setPage] = useState(1), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const list = useQuery({ queryKey: ["courses", user?.id, scope, page], enabled: Boolean(user), queryFn: async () => (await api.get<Course[]>("/members/courses", { params: { scope, page } })).data });
  const pendingCount = useQuery({ queryKey: ["courses", user?.id, "pending-count"], enabled: command, queryFn: async () => (await api.get<Course[]>("/members/courses", { params: { scope: "pending", page: 1 } })).data.filter((row) => row.userId !== user?.id).length });

  async function submit(e: FormEvent<HTMLFormElement>, id?: string) {
    e.preventDefault(); const form = e.currentTarget, data = Object.fromEntries(new FormData(form)); setBusy(true); setError(""); setNotice("");
    try {
      await api.post(id ? `/members/courses/${id}/review` : "/members/courses", data);
      form.reset(); await client.invalidateQueries({ queryKey: ["courses"] });
      setNotice(id ? "Decisión registrada. Se le avisó a la persona." : "Curso enviado. Jefatura lo revisa y, si lo aprueba, suma puntos en el ranking.");
      if (!id) setFormOpen(false);
    } catch (err) { setError(getErrorMessage(err, "No se pudo guardar el curso")); } finally { setBusy(false); }
  }
  function changeScope(next: "mine" | "pending") { setScope(next); setPage(1); setError(""); setNotice(""); }

  const rows = list.data ?? [];
  const showPager = page > 1 || rows.length === 30;

  return <ProtectedLayout><main className="screen-body">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><GraduationCap className="h-6 w-6 text-red-400" aria-hidden /> Cursos y capacitación</h1>
        <p className="mt-1 text-sm text-[var(--mut)]">Declarás los cursos que hiciste; jefatura los aprueba y quedan en tu legajo.</p>
      </div>
      {scope === "mine" && !formOpen && <button type="button" className="app-button app-button-red w-auto" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Declarar curso</button>}
    </header>

    {command && <div role="tablist" aria-label="Vista" className="mt-4 inline-flex rounded-xl border border-[var(--bord)] bg-[var(--card)] p-1">
      {(["mine", "pending"] as const).map((s) => <button key={s} type="button" role="tab" aria-selected={s === scope} onClick={() => changeScope(s)} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${s === scope ? "bg-red-600 text-white" : "text-white/65 hover:text-white"}`}>
        {s === "mine" ? "Mis cursos" : <>Para revisar{pendingCount.data ? <span className="ml-1.5 rounded-full bg-amber-500/25 px-1.5 text-xs text-amber-200">{pendingCount.data}</span> : null}</>}
      </button>)}
    </div>}

    {notice && <p role="status" className="mt-4 border-l-2 border-emerald-500 pl-3 text-sm">{notice}</p>}
    {error && <ErrorNotice>{error}</ErrorNotice>}

    {scope === "mine" && formOpen && <form className="card mt-4" onSubmit={submit}>
      <h2 className="mb-3 font-bold">Declarar un curso</h2>
      <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-3">
        <Field label="Nombre del curso"><input className="app-input" required name="title" minLength={3} maxLength={160} placeholder="Ej. Rescate vehicular nivel I" /></Field>
        <Field label="Institución"><input className="app-input" required name="provider" minLength={2} maxLength={160} placeholder="Ej. Federación de Bomberos" /></Field>
        <Field label="Fecha de finalización"><input className="app-input" required type="date" name="completedOn" max={stationDate()} /></Field>
      </fieldset>
      <div className="mt-3 flex flex-wrap gap-2"><button disabled={busy} className="app-button app-button-red w-auto">Enviar a revisión</button><button type="button" className="app-button app-button-outline w-auto" onClick={() => setFormOpen(false)}>Cancelar</button></div>
    </form>}

    <section className="mt-5" aria-label={scope === "mine" ? "Mis cursos" : "Cursos para revisar"}>
      {list.isLoading && <p className="text-sm text-[var(--mut)]">Cargando cursos…</p>}
      {list.isError && <ErrorNotice>No se pudieron cargar los cursos. <button className="underline" onClick={() => list.refetch()}>Reintentar</button></ErrorNotice>}
      {list.data && rows.length === 0 && <div className="card text-center text-sm text-[var(--mut)]">{scope === "mine" ? <>Todavía no declaraste cursos. <button type="button" className="underline" onClick={() => setFormOpen(true)}>Declarar el primero</button></> : "No hay cursos esperando revisión."}</div>}
      <ul className="space-y-2">{rows.map((row) => <li key={row.id} className="card mb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-words font-semibold">{row.title}</h2>
            <p className="mt-0.5 text-sm text-[var(--mut)]">{row.provider} · {date(row.completedOn)}{scope === "pending" ? ` · ${row.user.username}` : ""}</p>
          </div>
          <span className={`badge ${tones[row.status]} shrink-0`}>{states[row.status]}</span>
        </div>
        {(row.reviewer || row.reviewNote) && <p className="mt-2 border-l-2 border-[var(--bord)] pl-2 text-sm text-[var(--mut)]">{row.reviewer ? `Revisó ${row.reviewer.username}` : ""}{row.reviewNote ? `${row.reviewer ? ": " : ""}${row.reviewNote}` : ""}</p>}
        {scope === "pending" && user?.id !== row.userId && <form onSubmit={(e) => submit(e, row.id)} className="mt-3 border-t border-[var(--bord)] pt-3">
          <fieldset disabled={busy} className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-end">
            <Field label="Decisión"><select name="status" className="app-input" required defaultValue=""><option value="">Elegir…</option><option value="APPROVED">Aprobar</option><option value="REJECTED">Rechazar</option></select></Field>
            <Field label="Observación (obligatoria si rechazás)"><input name="note" maxLength={1000} className="app-input" /></Field>
            <button className="app-button w-auto">Registrar</button>
          </fieldset>
        </form>}
      </li>)}</ul>
      {showPager && <nav aria-label="Páginas" className="mt-4 flex items-center gap-2"><button className="app-button app-button-outline w-auto" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button><span className="text-sm text-[var(--mut)]">Página {page}</span><button className="app-button app-button-outline w-auto" disabled={rows.length !== 30} onClick={() => setPage(page + 1)}>Siguiente</button></nav>}
    </section>
  </main></ProtectedLayout>;
}
