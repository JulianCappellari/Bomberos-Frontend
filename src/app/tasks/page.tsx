"use client";
import { TaskTransfers } from "@/components/operations/task-transfers";
import { TaskPhotoPicker, TaskPhoto } from "@/components/operations/task-photos";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, ClipboardList, History, Plus, RefreshCw } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field, isManager, personName, StateBadge, stationDate } from "@/components/operations/operations-ui";
import { dateTime, localNow, OperationDialog, Pager, PeoplePicker } from "@/components/operations/work-ui";
import { useAuth } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/lib/get-error-message";
import { createTask, listTasks, taskAction, taskHistory } from "@/services/work.service";
import { getUserRosterRequest } from "@/services/user.service";
import { WorkStatus, WorkTask } from "@/types/work";

const labels: Record<WorkStatus, string> = { ASSIGNED: "Asignada", SUBMITTED: "Por verificar", RETURNED: "Devuelta", VERIFIED: "Verificada", CANCELLED: "Cancelada" };
const priorities:Record<string,string>={LOW:"Baja",NORMAL:"Normal",HIGH:"Alta",URGENT:"Urgente"};
const eventLabels:Record<string,string>={CREATED:"Tarea publicada",REPORTED:"Trabajo informado",SUBMITTED:"Enviado a revisión",VERIFIED:"Verificado",RETURNED:"Devuelto para corregir",CANCELLED:"Cancelado",TRANSFER:"Asignación transferida",TRANSFER_REQUESTED:"Transferencia propuesta; pendiente del destinatario",TRANSFER_CANCELLED:"Propuesta cancelada",TRANSFER_REJECTED:"Propuesta rechazada",DECLINE:"Imposibilidad informada",REASSIGNED:"Equipo reasignado",CLAIMED:"Se incorporó al equipo",PLANNED:"Planificación actualizada"};
type Mode = "create" | "report" | "submit" | "review" | "transfer" | "decline" | "assign" | "history" | "plan";
export default function TasksPage() {
  const { user } = useAuth(), client = useQueryClient(), manager = isManager(user?.role);
  const officer=user?.role==="OPERATOR"||user?.role==="ADMIN"&&user.profile?.rank?.toLowerCase()==="oficial";
  const [page, setPage] = useState(1), [status, setStatus] = useState(""), [mine, setMine] = useState<boolean | null>(null), [q, setQ] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [priority,setPriority]=useState("NORMAL");
  const [requiresPresence, setRequiresPresence] = useState(true);
  const [mode, setMode] = useState<Mode | null>(null), [task, setTask] = useState<WorkTask | null>(null);
  const [title, setTitle] = useState(""), [description, setDescription] = useState(""), [dueOn, setDueOn] = useState("");
  const [ids, setIds] = useState<string[]>([]), [notes, setNotes] = useState(""), [urls, setUrls] = useState("");
  const [completedAt, setCompletedAt] = useState(""), [target, setTarget] = useState(""), [next, setNext] = useState("VERIFIED");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const onlyMine = mine ?? !manager;
  const tasks = useQuery({ queryKey: ["tasks", user?.id, page, status, onlyMine, q], queryFn: () => listTasks({ page, status, q, mine: String(onlyMine) }), enabled: Boolean(user), refetchInterval: 30000 });
  const people = useQuery({ queryKey: ["work-roster", user?.id], queryFn: getUserRosterRequest, enabled: Boolean(user) });
  const history = useQuery({ queryKey: ["task-history", user?.id, task?.id], queryFn: () => taskHistory(task!.id), enabled: mode === "history" && Boolean(task) });
  function open(value: Mode, row: WorkTask | null = null) {
    setPriority(row?.priority||"NORMAL"); setRequiresPresence(row?.requiresPresence ?? true);
    setTask(row); setMode(value); setTitle(""); setDescription(""); setDueOn(""); setNotes(""); setUrls(""); setPhotos([]); setTarget(""); setNext("VERIFIED");
    setCompletedAt(localNow()); setIds(value === "assign" ? row!.members.map((m) => m.userId) : value === "report" && user ? [user.id] : []); setError("");
    if(value==="plan"&&row){setDueOn(row.dueOn?.slice(0,10)||"");setTarget(row.maintenanceJob?.responsibleUserId||"");}
  }
  function refresh() { client.invalidateQueries({ queryKey: ["tasks"] }); client.invalidateQueries({ queryKey: ["task-history"] }); client.invalidateQueries({ queryKey: ["task-transfers"] }); }
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      if (mode === "create" || mode === "report") {
        await createTask({ title, description, userIds: ids, requiresPresence, ...(mode === "create" ? { dueOn: dueOn || null } : { photos, notes, evidenceUrls: urls.split("\n").map((s) => s.trim()).filter(Boolean), completedAt: new Date(completedAt).toISOString() }) }, mode === "report");
      } else if (task) {
        const body = { revision: task.revision, notes };
        if (mode === "submit") await taskAction(task.id, "submit", { ...body, photos, completedAt: new Date(completedAt).toISOString(), evidenceUrls: urls.split("\n").map((s) => s.trim()).filter(Boolean) });
        else if (mode === "review") await taskAction(task.id, "review", { ...body, status: next });
        else if(mode==="plan")await taskAction(task.id,"plan",{...body,dueOn:dueOn||null,priority,responsibleUserId:target||null});
        else if (mode === "assign") await taskAction(task.id, "assign", { ...body, userIds: ids });
        else await taskAction(task.id, "member", { ...body, action: mode === "transfer" ? "TRANSFER" : "DECLINE", ...(mode === "transfer" ? { targetUserId: target } : {}) });
      }
      setMode(null); refresh();
    } catch (err) { setError(getErrorMessage(err, "No se pudo completar la operacion. Actualice antes de reintentar si hubo un conflicto.")); }
    finally { setBusy(false); }
  }
  async function claim(row: WorkTask) { setBusy(true); setError(""); try { await taskAction(row.id, "claim", { revision: row.revision }); refresh(); } catch (err) { setError(getErrorMessage(err, "No se pudo tomar la tarea. Recargue si cambio.")); } finally { setBusy(false); } }
  const names: Record<Mode, string> = { plan:"Planificar tarea y reparación", create: "Publicar tarea pendiente", report: "Informar trabajo realizado", submit: "Informar finalizacion", review: "Revisar tarea", transfer: "Proponer transferencia", decline: "Informar imposibilidad", assign: "Reasignar equipo", history: "Historial de tarea" };
  return <ProtectedLayout><main className="screen-body">
    <header className="mb-5"><h1 className="flex items-center gap-2 text-2xl font-bold"><ClipboardList className="h-6 w-6 text-red-400" aria-hidden /> Tareas</h1><p className="mt-1 text-sm text-[var(--mut)]">Tomá un trabajo, avisá cuando lo terminás y jefatura lo verifica.</p><div className="mt-4 flex flex-wrap gap-2">{manager && <button className="app-button app-button-red w-auto" onClick={() => open("create")}><Plus className="h-4 w-4" aria-hidden /> Asignar tarea</button>}<button className="app-button w-auto" onClick={() => open("report")}><CheckCheck className="h-4 w-4" aria-hidden /> Informar trabajo ya hecho</button>{!manager && <button type="button" className="app-button app-button-outline w-auto" onClick={() => open("create")}><Plus className="h-4 w-4" aria-hidden /> Proponer una tarea</button>}<button className="btn-icon ml-auto" title="Actualizar" aria-label="Actualizar tareas" onClick={refresh}><RefreshCw className="h-4 w-4" aria-hidden /></button></div></header>
    <TaskTransfers />
    <div role="tablist" aria-label="Qué tareas ver" className="mb-3 flex gap-1 rounded-xl border border-[var(--bord)] bg-black/20 p-1">{([[true, "Mis tareas"], [false, manager ? "Todas" : "Todas las disponibles"]] as const).map(([value, text]) => <button key={text} type="button" role="tab" aria-selected={onlyMine === value} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${onlyMine === value ? "bg-red-600 text-white" : "text-white/70 hover:bg-white/[0.06]"}`} onClick={() => { setMine(value); setPage(1); }}>{text}</button>)}</div>
    <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px]"><input className="app-input" type="search" aria-label="Buscar tareas" placeholder="Buscar por título o descripción" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /><select className="app-input" aria-label="Estado de tareas" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">Todos los estados</option>{Object.entries(labels).filter(([id]) => manager || ["ASSIGNED", "RETURNED", "SUBMITTED"].includes(id)).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>
    {error && !mode && <ErrorNotice>{error}</ErrorNotice>}{tasks.isLoading && <p role="status">Cargando tareas...</p>}{tasks.isError && <ErrorNotice>No se pudieron cargar las tareas. <button className="underline" onClick={refresh}>Reintentar</button></ErrorNotice>}
    {!tasks.isLoading && !tasks.isError && !tasks.data?.items.length && <p className="py-10 text-center text-[var(--mut)]">{onlyMine ? "No tenés tareas a tu cargo. Podés tomar una en \u201cTodas las disponibles\u201d." : "No hay tareas para estos filtros."}</p>}
    <div className="grid gap-3 lg:grid-cols-2">{tasks.data?.items.map((row) => {
      const member = row.members.find((m) => m.userId === user?.id), active = ["ASSIGNED", "RETURNED"].includes(row.status);
      const canReview = manager && row.status === "SUBMITTED" && !member && !(row.isSelfReported && row.createdByUserId === user?.id);
      const overdue = active && row.dueOn && row.dueOn.slice(0, 10) < stationDate();
      return <article key={row.id} className="min-w-0 rounded-lg border border-[var(--bord)] bg-[var(--card)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><h2 className="break-words font-bold">{row.title}{row.priority && row.priority !== "NORMAL" && <span className="ml-2 text-xs text-red-300">Prioridad {priorities[row.priority]||row.priority}</span>}</h2><StateBadge tone={row.status === "VERIFIED" ? "good" : row.status === "SUBMITTED" ? "warning" : "neutral"}>{row.status==="VERIFIED"&&!row.officerApproved?"Pendiente de aval":({OPEN:"Abierta",ASSIGNED:"Asignada",TAKEN:"Tomada",IN_REVIEW:"Enviada a revision",VERIFIED:"Verificada",EXPIRED:"Vencida",CANCELLED:"Cancelada",RETURNED:"Devuelta"}[row.state] || labels[row.status])}</StateBadge></div>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm text-[var(--mut)]">{row.description}</p><p className="mt-2 text-xs text-[var(--mut)]">{row.requiresPresence ? "Requiere ingreso QR y presencia en cuartel" : "No requiere presencia en cuartel"}</p>
        <div className="mt-3 text-xs text-[var(--mut)]">{row.isSelfReported ? "Informado por" : "Asignado por"} {personName(row.createdBy)}{row.dueOn && <span className={overdue ? "text-red-300" : ""}> · {overdue ? "Vencio" : "Hasta"} {row.dueOn.slice(0, 10)}</span>}</div>
        <ul className="mt-3 flex flex-wrap gap-2 text-xs">{row.members.map((m) => <li key={m.userId} className={m.declinedAt ? "text-red-300" : "text-[var(--txt)]"}>{personName(m.user)}{m.declinedAt ? " (no puede)" : ""}</li>)}</ul>
        {row.completionNotes && <p className="mt-3 whitespace-pre-wrap break-words border-t border-[var(--bord)] pt-3 text-sm">{row.completionNotes}</p>}
        {row.evidenceUrls?.map((url, i) => <a key={url + i} className="mt-2 block text-sm text-sky-300 underline" href={url} target="_blank" rel="noopener noreferrer">Evidencia {i + 1}</a>)}
        <div className="mt-3 grid grid-cols-2 gap-2">{row.photos?.map((p) => <TaskPhoto key={p.id} taskId={row.id} photoId={p.id} revision={p.submissionRevision} />)}</div>{row.reviewNotes && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-amber-200">{personName(row.reviewedBy)}: {row.reviewNotes}</p>}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--bord)] pt-3">
          {active && (!member || member.declinedAt) && <button disabled={busy} className="app-button app-button-red w-auto" onClick={() => claim(row)}>La voy a hacer</button>}
          {active && member && !member.declinedAt && <><button className="app-button w-auto" onClick={() => open("submit", row)}>La hice</button><button className="app-button w-auto" onClick={() => open("transfer", row)}>Proponer transferencia</button><button className="app-button w-auto" onClick={() => open("decline", row)}>No puedo</button></>}
          {manager && active && <button className="app-button w-auto" onClick={() => open("assign", row)}>Reasignar</button>}
          {manager&&active&&<button className="app-button w-auto" onClick={()=>open("plan",row)}>Planificar</button>}
          {manager && (!["VERIFIED", "CANCELLED"].includes(row.status)||(officer&&row.status==="VERIFIED"&&!row.officerApproved)) && <button className="app-button w-auto" onClick={() => { open("review", row); setNext(row.status==="VERIFIED"?"VERIFIED":canReview ? (officer?"VERIFIED":"RETURNED") : "CANCELLED"); }}>Revisar</button>}
          <button className="btn-icon ml-auto" title="Historial" aria-label={`Historial de ${row.title}`} onClick={() => open("history", row)}><History className="h-4 w-4" /></button>
        </div>
      </article>;
    })}</div>
    {tasks.data && <Pager page={page} total={tasks.data.total} onPage={setPage} />}
    {mode && <OperationDialog title={names[mode]} pending={busy} onClose={() => setMode(null)}>
      {mode === "history" ? <div className="space-y-3">{history.isLoading && <p>Cargando historial...</p>}{history.isError && <ErrorNotice>No se pudo cargar el historial.</ErrorNotice>}{history.data?.map((item) => <div key={item.id} className="border-b border-[var(--bord)] pb-3"><div className="text-sm font-bold">{eventLabels[item.action]||item.action} · {personName(item.actor)}</div><div className="text-xs text-[var(--mut)]">{dateTime(item.createdAt)}</div><p className="mt-1 whitespace-pre-wrap break-words text-sm">{item.notes}</p></div>)}</div> : <form onSubmit={submit}><fieldset disabled={busy} className="space-y-3">
        {error && <ErrorNotice>{error}</ErrorNotice>}
        {(mode === "create" || mode === "report") && <><Field label="Titulo"><input autoFocus required minLength={3} maxLength={160} className="app-input" value={title} onChange={(e) => setTitle(e.target.value)} /></Field><Field label="Descripcion"><textarea required minLength={5} maxLength={4000} className="app-input" value={description} onChange={(e) => setDescription(e.target.value)} /></Field>{mode === "create" && <Field label="Fecha limite"><input className="app-input" type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} /></Field>}</>}
        {(["report", "assign"].includes(mode) || mode === "create" && manager) && <>{people.isError && <ErrorNotice>No se pudo cargar el personal.</ErrorNotice>}<PeoplePicker people={people.data || []} value={ids} onChange={setIds} /></>}
        {(mode === "create" || mode === "report") && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={requiresPresence} onChange={e => setRequiresPresence(e.target.checked)} />Requiere presencia en cuartel (QR)</label>}
        {mode === "decline" && <p className="text-sm text-amber-300">Se libera tu responsabilidad, se aplica el descuento por imposibilidad y se informa a jefatura. La tarea puede ser tomada por otra persona.</p>}
        {mode === "transfer" && <p className="text-sm text-[var(--mut)]">Seguis a cargo hasta que la persona propuesta acepte la transferencia.</p>}
        {mode !== "create" && <Field label={mode === "submit" || mode === "report" ? "Trabajo realizado" : "Motivo / observaciones"}><textarea autoFocus={mode !== "report"} required minLength={mode === "plan" ? 10 : 5} maxLength={mode === "submit" || mode === "report" ? 4000 : 2000} className="app-input min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>}
        {(mode === "report" || mode === "submit") && <><Field label="Fecha y hora de realizacion"><input required className="app-input" type="datetime-local" step="1" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} /></Field><TaskPhotoPicker photos={photos} onChange={setPhotos} onBusyChange={setPhotoBusy} /><Field label="Enlaces de evidencia HTTPS (hasta 3, uno por linea)"><textarea className="app-input" value={urls} maxLength={1502} onChange={(e) => setUrls(e.target.value)} /></Field></>}
{mode==="plan"&&<><Field label="Prioridad"><select className="app-input" value={priority} onChange={e=>setPriority(e.target.value)}>{Object.entries({LOW:"Baja",NORMAL:"Normal",HIGH:"Alta",URGENT:"Urgente"}).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></Field><Field label="Fecha límite"><input type="date" className="app-input" value={dueOn} onChange={e=>setDueOn(e.target.value)}/></Field><Field label="Responsable"><select className="app-input" value={target} onChange={e=>setTarget(e.target.value)}><option value="">Sin responsable individual</option>{people.data?.map(person=><option key={person.id} value={person.id}>{personName(person)}</option>)}</select></Field></>}
        {mode === "review" && <Field label="Decision"><select className="app-input" value={next} onChange={(e) => setNext(e.target.value)}>{(task?.status === "SUBMITTED" || (task?.status==="VERIFIED"&&!task.officerApproved&&officer)) && !task.members.some((m) => m.userId === user?.id) && !(task.isSelfReported && task.createdByUserId === user?.id) && <>{officer&&<option value="VERIFIED">Avalar trabajo</option>}<option value="RETURNED">Devolver para corregir</option></>}<option value="CANCELLED">Cancelar tarea</option></select></Field>}
        {mode === "transfer" && <Field label="Proponer integrante"><select className="app-input" required value={target} onChange={(e) => setTarget(e.target.value)}><option value="">Seleccionar</option>{people.data?.filter((p) => !task?.members.some((m) => m.userId === p.id)).map((p) => <option key={p.id} value={p.id}>{personName(p)}</option>)}</select></Field>}
        <button type="submit" className="app-button app-button-red" disabled={busy || photoBusy || ["report", "assign"].includes(mode) && (!ids.length || people.isError || people.isLoading)}>{busy ? "Guardando..." : "Confirmar"}</button>
      </fieldset></form>}
    </OperationDialog>}
  </main></ProtectedLayout>;
}
