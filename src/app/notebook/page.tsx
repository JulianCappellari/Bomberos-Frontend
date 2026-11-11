"use client";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { FormEvent, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Download, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field, isManager, personName } from "@/components/operations/operations-ui";
import { dateTime, localNow, OperationDialog, Pager } from "@/components/operations/work-ui";
import { useAuth } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/lib/get-error-message";
import { getIncidentsRequest } from "@/services/incidents.service";
import { listNotebook, removeNotebook, saveNotebook } from "@/services/work.service";
import { NotebookCategory, NotebookEntry } from "@/types/work";
import { api } from "@/lib/api-client";

const categories: Record<NotebookCategory, string> = { PLACE: "Lugar", PERSON: "Persona", VEHICLE: "Vehículo", AGENCY: "Constancia de fuerza o servicio", NOTE: "Nota", NOVELTY: "Novedad posterior", THIRD_PARTY: "Datos de terceros", CORRECTION: "Corrección documental", DAMAGE: "Daños y roturas" };
export default function NotebookPage() {
  const { user } = useAuth(), manager = isManager(user?.role), client = useQueryClient();
  const [chosenId, setIncidentId] = useState(""), [category, setCategory] = useState(""), [page, setPage] = useState(1);
  const [form, setForm] = useState<{ id: string | null; revision?: number; category: NotebookCategory; title: string; body: string; occurredAt: string } | null>(null);
  const [removing, setRemoving] = useState<NotebookEntry | null>(null), [notes, setNotes] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const incidents = useQuery({ queryKey: ["notebook-incidents", user?.id], queryFn: () => getIncidentsRequest(), enabled: Boolean(user) });
  const accessible = incidents.data || [];
  // Abre directo la intervencion pedida por enlace o, si no, la abierta mas reciente: antes arrancaba vacia.
  // Se deriva del listado (solo existe en el navegador), sin efectos ni renders extra.
  const autoId = useMemo(() => {
    if (!incidents.data?.length) return "";
    const wanted = new URLSearchParams(window.location.search).get("incident");
    const recent = [...incidents.data].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    return (incidents.data.find((i) => i.id === wanted) ?? recent.find((i) => i.status === "OPEN") ?? recent[0]).id;
  }, [incidents.data]);
  const incidentId = chosenId || autoId;
  const incident = accessible.find((i) => i.id === incidentId), open = incident?.status === "OPEN";
  const access = useQuery({ queryKey: ["incident-sheet", incidentId, user?.id], queryFn: async () => (await api.get<{ canWrite: boolean }>(`/incidents/${incidentId}/sheet`)).data, enabled: Boolean(user && incidentId), refetchInterval: 30000 });
  const mayEdit = open && access.data?.canWrite === true;
  const entries = useQuery({ queryKey: ["notebook", user?.id, incidentId, category, page], queryFn: () => listNotebook(incidentId, { page, category }), enabled: Boolean(user && incidentId), refetchInterval: 30000 });
  function refresh() { client.invalidateQueries({ queryKey: ["notebook"] }); client.invalidateQueries({ queryKey: ["notebook-incidents"] }); }
  function edit(row: NotebookEntry | null) { setError(""); setForm(row ? { ...row, occurredAt: new Date(new Date(row.occurredAt).getTime() - new Date(row.occurredAt).getTimezoneOffset() * 60000).toISOString().slice(0, 19) } : { id: null, category: "NOTE", title: "", body: "", occurredAt: localNow() }); }
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      if (removing) await removeNotebook(incidentId, removing.id, { revision: removing.revision, notes });
      else if (form) { const { id, ...fields } = form; await saveNotebook(incidentId, id, { ...fields, occurredAt: new Date(fields.occurredAt).toISOString() }); }
      setForm(null); setRemoving(null); refresh();
    } catch (err) { setError(getErrorMessage(err, "No se pudo guardar. Si otra persona la modificó, cerrá y actualizá antes de editar.")); }
    finally { setBusy(false); }
  }
  function download() {
    const text = [`Libreta: ${incident?.title || "Intervencion"}`, `Pagina ${page} de registros`, ...entries.data!.items.map((e) => `\n${categories[e.category]}: ${e.title}\n${dateTime(e.occurredAt)} - ${personName(e.author)}\n${e.body}`)].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = `libreta-${incidentId}-pagina-${page}.txt`; a.click(); URL.revokeObjectURL(url);
  }
  return <ProtectedLayout><main className="screen-body">
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><BookOpen className="h-6 w-6 text-red-400" /> Libreta del siniestro</h1><p className="mt-1 text-sm text-[var(--mut)]">Apuntes de una emergencia: lugares, personas, vehículos, constancias y novedades. Los horarios de salida de los móviles quedan en Actas de salida.</p></div><div className="flex gap-2"><button className="btn-icon" title="Actualizar" aria-label="Actualizar libreta" onClick={refresh}><RefreshCw className="h-4 w-4" /></button><button className="btn-icon" title="Descargar página en texto" aria-label="Descargar página en texto" disabled={!entries.data?.items.length} onClick={download}><Download className="h-4 w-4" /></button>{mayEdit && <button className="app-button app-button-red w-auto" onClick={() => edit(null)}><Plus className="h-4 w-4" /> Nueva entrada</button>}</div></header>
    <div className="mb-5 grid gap-3 sm:grid-cols-2"><Field label="Intervención"><select className="app-input" value={incidentId} onChange={(e) => { setIncidentId(e.target.value); setPage(1); }}><option value="">Elegir intervención</option>{accessible.map((i) => <option key={i.id} value={i.id}>{i.title} · {i.status === "OPEN" ? "Abierta" : "Cerrada"} · {i.occurredAt.slice(0, 10)}</option>)}</select></Field><Field label="Categoría"><select className="app-input" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}><option value="">Todas</option>{Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field></div>
    {incidents.isLoading && <ListSkeleton label="Cargando intervenciones" />}{incidents.isError && <ErrorNotice>No se pudieron cargar las intervenciones. <button className="underline" onClick={refresh}>Reintentar</button></ErrorNotice>}
    {incident && !open && <p className="mb-4 border-l-2 border-amber-400 pl-3 text-sm text-amber-200">Intervención cerrada: la libreta queda en solo lectura. Para agregar datos posteriores usá un anexo en la planilla.</p>}
    {!incidentId && !incidents.isLoading && <p className="py-8 text-center text-[var(--mut)]">{accessible.length ? "Elegí una intervención." : "No tenés intervenciones disponibles."}</p>}
    {incidentId && entries.isLoading && <ListSkeleton label="Cargando libreta" />}{entries.isError && <ErrorNotice>No se pudo consultar la libreta. <button className="underline" onClick={refresh}>Reintentar</button></ErrorNotice>}
    {entries.data && !entries.data.items.length && <p className="py-8 text-center text-[var(--mut)]">No hay entradas para estos filtros.</p>}
    <div className="grid gap-3 lg:grid-cols-2">{entries.data?.items.map((row) => <article key={row.id} className="min-w-0 rounded-lg border border-[var(--bord)] bg-[var(--card)] p-4"><div className="text-xs font-bold uppercase text-red-300">{categories[row.category]}</div><h2 className="mt-1 break-words font-bold">{row.title}</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm">{row.body}</p><div className="mt-3 text-xs text-[var(--mut)]">{personName(row.author)} · {dateTime(row.occurredAt)}</div>{mayEdit && <div className="mt-3 flex justify-end gap-2">{(row.authorUserId === user?.id || user?.role === "ADMIN") && <button className="btn-icon" title="Editar entrada" aria-label={`Editar ${row.title}`} onClick={() => edit(row)}><Pencil className="h-4 w-4" /></button>}{manager && <button className="btn-icon text-red-300" title="Retirar entrada" aria-label={`Retirar ${row.title}`} onClick={() => { setRemoving(row); setNotes(""); setError(""); }}><Trash2 className="h-4 w-4" /></button>}</div>}</article>)}</div>
    {entries.data && <Pager page={page} total={entries.data.total} onPage={setPage} />}
    {(form || removing) && <OperationDialog title={removing ? "Retirar entrada" : form?.id ? "Editar entrada" : "Nueva entrada"} pending={busy} onClose={() => { setForm(null); setRemoving(null); }}><form onSubmit={submit}><fieldset disabled={busy} className="space-y-3">
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {removing ? <Field label="Motivo de retiro"><textarea autoFocus className="app-input min-h-24" required minLength={5} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field> : form && <>
        <Field label="Categoría"><select className="app-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as NotebookCategory })}>{Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
        <Field label="Título o identificación"><input autoFocus className="app-input" required minLength={3} maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Detalle"><textarea className="app-input min-h-32" required minLength={3} maxLength={4000} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
        <Field label="Fecha y hora"><input className="app-input" required type="datetime-local" step="1" value={form.occurredAt} onChange={(e) => setForm({ ...form, occurredAt: e.target.value })} /></Field>
      </>}
      <button className="app-button app-button-red" type="submit">{busy ? "Guardando..." : removing ? "Retirar conservando historial" : "Guardar"}</button>
    </fieldset></form></OperationDialog>}
  </main></ProtectedLayout>;
}
