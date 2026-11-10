"use client";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field, stationDate } from "@/components/operations/operations-ui";
import { isCommand } from "@/lib/permissions";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";

const states = { PENDING: "Por revisar", APPROVED: "Aprobado", REJECTED: "Rechazado" };
type Course = { id: string; userId: string; title: string; provider: string; completedOn: string; status: keyof typeof states; reviewNote: string | null; user: { username: string }; reviewer: { username: string } | null };
export default function Courses() {
  const { user } = useAuth(), client = useQueryClient();
  const [scope,setScope] = useState<"mine"|"pending">("mine"), [page,setPage] = useState(1), [busy,setBusy] = useState(false), [error,setError] = useState("");
  const list = useQuery({ queryKey: ["courses",user?.id,scope,page], enabled: Boolean(user), queryFn: async () => (await api.get<Course[]>("/members/courses",{params:{scope,page}})).data });
  async function submit(e: FormEvent<HTMLFormElement>, id?: string) {
    e.preventDefault(); const form = e.currentTarget, data = Object.fromEntries(new FormData(form)); setBusy(true); setError("");
    try { await api.post(id ? `/members/courses/${id}/review` : "/members/courses", data); form.reset(); await client.invalidateQueries({queryKey:["courses"]}); }
    catch(err) { setError(getErrorMessage(err,"No se pudo guardar el curso")); } finally { setBusy(false); }
  }
  return <ProtectedLayout><main className="screen-body"><h1 className="text-2xl font-bold">Cursos y capacitación</h1>
    {isCommand(user?.role) && <div className="my-4 flex flex-wrap gap-2">{(["mine","pending"] as const).map(s => <button className="app-button w-auto" aria-pressed={s === scope} key={s} onClick={() => {setScope(s);setPage(1);setError("");}}>{s === "mine" ? "Mis cursos" : "Revisar pendientes"}</button>)}</div>}
    {scope === "mine" && <form className="my-4" onSubmit={submit}><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2"><Field label="Curso realizado"><input className="app-input" required name="title" minLength={3} maxLength={160}/></Field><Field label="Institución"><input className="app-input" required name="provider" minLength={2} maxLength={160}/></Field><Field label="Fecha de finalización"><input className="app-input" required type="date" name="completedOn" max={stationDate()}/></Field><button className="app-button self-end">Enviar a revisión</button></fieldset></form>}
    {error && <ErrorNotice>{error}</ErrorNotice>}{list.isLoading && <p>Cargando cursos...</p>}{list.isError && <ErrorNotice>No se pudieron cargar los cursos.</ErrorNotice>}
    {list.data?.length === 0 && <p>No hay cursos en esta vista.</p>}{list.data?.map(row => <article key={row.id} className="border-b border-[var(--bord)] py-4"><h2 className="font-semibold">{row.title}</h2><p>{row.provider} · {row.completedOn.slice(0,10)} · {row.user.username}</p><p>{states[row.status]}{row.reviewer && ` por ${row.reviewer.username}`}</p>{row.reviewNote && <p>{row.reviewNote}</p>}
    {scope === "pending" && user?.id !== row.userId && <form onSubmit={e => submit(e,row.id)}><fieldset disabled={busy} className="mt-3 grid gap-2 sm:grid-cols-3"><Field label="Decisión"><select name="status" className="app-input" required defaultValue=""><option value="">Seleccionar</option><option value="APPROVED">Aprobar</option><option value="REJECTED">Rechazar</option></select></Field><Field label="Observación (obligatoria al rechazar)"><input name="note" maxLength={1000} className="app-input"/></Field><button className="app-button self-end">Registrar decisión</button></fieldset></form>}</article>)}
    <div className="mt-3 flex gap-3"><button disabled={page===1} onClick={() => setPage(page-1)}>Anterior</button><button disabled={list.data?.length!==30} onClick={() => setPage(page+1)}>Siguiente</button></div>
  </main></ProtectedLayout>;
}
