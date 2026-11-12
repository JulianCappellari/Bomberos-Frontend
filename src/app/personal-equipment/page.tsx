"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, History, PackageCheck, Pencil, Plus, RefreshCw, RotateCcw, Search, Shirt, X } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field, StateBadge, personName } from "@/components/operations/operations-ui";
import { useAuth } from "@/features/auth/auth-context";
import { useUserRoster } from "@/hooks/use-shifts";
import { useEquipmentAction, useEquipmentHistory, usePersonalEquipment, useEquipmentRequests } from "@/hooks/use-personal-equipment";
import { equipmentCategories, EquipmentCategory, EquipmentCondition, PersonalEquipment } from "@/types/personal-equipment";
import { getErrorMessage } from "@/lib/get-error-message";

const conditionLabels = { OK: "Sin novedades", REVIEW: "Necesita revisión", OUT: "Fuera de servicio" };
const dateTime = (value: string) => new Intl.DateTimeFormat("es-AR", { hourCycle: "h23", dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(value));
type Action = { type: "create" | "edit" | "checks" | "issues" | "return"; item?: PersonalEquipment };
function EquipmentHistory({ item }: { item: PersonalEquipment }) {
  const [page, setPage] = useState(1);
  const query = useEquipmentHistory(item.id, page);
  return <div className="mt-4 border-t border-[var(--bord)] pt-4">
    <h3 className="mb-3 font-semibold">Historial de entregas</h3>
    {query.isPending && <p role="status" className="text-sm">Cargando historial...</p>}
    {query.isError && <ErrorNotice>No se pudo cargar. <button className="underline" onClick={() => void query.refetch()}>Reintentar</button></ErrorNotice>}
    {query.data?.total === 0 && <p className="text-sm text-[var(--mut)]">Sin entregas visibles.</p>}
    <ol className="divide-y divide-[var(--bord)]">{query.data?.issues.map((issue) => <li key={issue.id} className="py-3 text-sm">
      <p className="font-semibold">{personName(issue.user)}</p><p className="mt-1 text-xs text-[var(--mut)]">Entrega: {dateTime(issue.issuedAt)} · {personName(issue.issuedBy)}</p>
      {issue.issueNotes && <p className="mt-2 whitespace-pre-wrap break-words">{issue.issueNotes}</p>}
      {issue.returnedAt ? <><p className="mt-2 text-xs text-[var(--mut)]">Devolución: {dateTime(issue.returnedAt)} · {personName(issue.receivedBy)} · {issue.returnCondition && conditionLabels[issue.returnCondition]}</p>{issue.returnNotes && <p className="mt-2 whitespace-pre-wrap break-words">{issue.returnNotes}</p>}</> : <p className="mt-2 text-amber-200">Entrega vigente</p>}
    </li>)}</ol>
    {query.data && query.data.total > query.data.pageSize && <div className="mt-3 flex items-center justify-between gap-2"><button className="app-button app-button-outline w-auto" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button><span className="text-xs">{page} / {Math.ceil(query.data.total / query.data.pageSize)}</span><button className="app-button app-button-outline w-auto" disabled={page * query.data.pageSize >= query.data.total} onClick={() => setPage(page + 1)}>Siguiente</button></div>}
  </div>;
}

export default function PersonalEquipmentPage() {
  const { user } = useAuth();
  const manager = user?.role === "ADMIN" || Boolean(user?.specialPermissions?.includes("PPE"));
  const roster = useUserRoster();
  const [filters, setFilters] = useState({ q: "", view: "all", category: "", page: 1 });
  const query = usePersonalEquipment(filters);
  const mutation = useEquipmentAction();
  const [action, setAction] = useState<Action | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (action) {
      formRef.current?.scrollIntoView({ block: "start" });
      formRef.current?.querySelector<HTMLElement>("input,select,textarea")?.focus({ preventScroll: true });
    }
  }, [action]);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [condition, setCondition] = useState<EquipmentCondition>("OK");
  const [recipientId, setRecipientId] = useState("");
  const [requestId, setRequestId] = useState("");
  const approvedRequests = useEquipmentRequests({ status: "APPROVED", userId: recipientId, page: 1 }, manager && action?.type === "issues" && !!recipientId);
  function open(type: Action["type"], item?: PersonalEquipment) { setError(""); setNotice(""); setCondition("OK"); setRecipientId(""); setRequestId(""); setAction({ type, item }); }
  function filter(name: "q" | "view" | "category", value: string) { setFilters((current) => ({ ...current, [name]: value, page: 1 })); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!action) return; setError(""); setNotice("");
    const data = new FormData(event.currentTarget), item = action.item;
    const body: Record<string, unknown> = item ? { revision: item.revision } : {};
    if (action.type === "create" || action.type === "edit") {
      Object.assign(body, { name: String(data.get("name") || ""), category: String(data.get("category") || ""), size: String(data.get("size") || "") });
      if (action.type === "create") body.code = String(data.get("code") || "");
    } else {
      body.notes = String(data.get("notes") || "");
      if (action.type === "issues") {
        body.userId = String(data.get("userId") || "");
        const request = approvedRequests.data?.items.find((row) => row.id === requestId);
        if (requestId && !request) { setError("El pedido cambio. Actualice la lista."); return; }
        if (request) { body.requestId = request.id; body.requestRevision = request.revision; }
      }
      else body.condition = condition;
      if (action.type === "return") body.issueId = item?.currentIssue?.id;
    }
    try {
      await mutation.mutateAsync({ id: item?.id, action: action.type, body });
      setNotice(action.type === "create" ? "Elemento registrado. Falta la revision inicial." : action.type === "return" ? "Devolucion registrada. Falta revisar el elemento antes de otra entrega." : "Operacion registrada correctamente.");
      setAction(null);
    } catch (err) { setError(getErrorMessage(err, "No se pudo registrar. Actualice la lista y vuelva a intentarlo.")); }
  }
  async function archive(item: PersonalEquipment) {
    if (!window.confirm(`Dar de baja ${item.code}? Se conservara su historial y no podra volver a entregarse.`)) return;
    setError(""); setNotice("");
    try { await mutation.mutateAsync({ id: item.id, action: "archive", body: { revision: item.revision } }); setNotice("Baja registrada; historial conservado."); if (action?.item?.id === item.id) setAction(null); }
    catch (err) { setError(getErrorMessage(err, "No se pudo registrar la baja.")); }
  }
  const names = { create: "Nuevo elemento", edit: "Editar elemento", checks: "Revision de estado", issues: "Registrar entrega", return: "Registrar devolucion" };
  return <ProtectedLayout><main className="screen-body">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="flex items-center gap-2 text-2xl font-bold"><Shirt className="h-6 w-6 shrink-0 text-red-400" />Equipamiento personal</h1><div className="flex gap-2"><button className="btn-icon" title="Actualizar equipamiento" aria-label="Actualizar equipamiento" onClick={() => void query.refetch()}><RefreshCw className="h-4 w-4" /></button>{manager && <button className="app-button app-button-red w-auto" disabled={mutation.isPending} onClick={() => open("create")}><Plus className="h-4 w-4" />Nuevo elemento</button>}</div></div>
    <div className="mb-5"><Link href="/equipment-requests" className="app-button app-button-outline w-auto">Pedidos de vestimenta</Link></div>
    {error && <ErrorNotice>{error}</ErrorNotice>}
    {notice && <p role="status" className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">{notice}</p>}
    {action && manager && <form ref={formRef} key={`${action.type}-${action.item?.id || "new"}`} onSubmit={submit} className="mb-5 scroll-mt-20 border-y border-[var(--bord)] py-4">
      <div className="mb-4 flex items-center justify-between gap-2"><h2 className="font-bold">{names[action.type]}{action.item && ` · ${action.item.code}`}</h2><button type="button" className="btn-icon" title="Cerrar formulario" aria-label="Cerrar formulario" disabled={mutation.isPending} onClick={() => setAction(null)}><X className="h-4 w-4" /></button></div>
      <fieldset disabled={mutation.isPending} className="grid gap-3 sm:grid-cols-2">
        {(action.type === "create" || action.type === "edit") ? <>
          {action.type === "create" && <Field label="Codigo de inventario"><input name="code" className="app-input" required minLength={2} maxLength={40} pattern={"[A-Za-z0-9][A-Za-z0-9._\\x2F\\x2D]+"} /></Field>}
          <Field label="Nombre"><input name="name" className="app-input" required minLength={3} maxLength={140} defaultValue={action.item?.asset.name} /></Field>
          <Field label="Categoria"><select name="category" className="app-input" defaultValue={action.item?.category || "HELMET"}>{Object.entries(equipmentCategories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
          <Field label="Talle (opcional)"><input name="size" className="app-input" maxLength={30} defaultValue={action.item?.size || ""} /></Field>
        </> : <>
          {action.type === "issues" ? <><Field label="Integrante"><select name="userId" className="app-input" required value={recipientId} onChange={(event) => { setRecipientId(event.target.value); setRequestId(""); }}><option value="">Seleccionar integrante</option>{roster.data?.map((person) => <option key={person.id} value={person.id}>{personName(person)}</option>)}</select></Field><Field label="Pedido aprobado (opcional)"><select className="app-input" value={requestId} disabled={!recipientId || approvedRequests.isFetching} onChange={(event) => setRequestId(event.target.value)}><option value="">Entrega directa sin pedido</option>{approvedRequests.data?.items.filter((row) => row.category === action.item?.category).map((row) => <option key={row.id} value={row.id}>{equipmentCategories[row.category]}{row.size && ` · Talle ${row.size}`} · {dateTime(row.createdAt)}</option>)}</select></Field>{approvedRequests.isError && <ErrorNotice>No se pudieron consultar los pedidos aprobados. <button type="button" className="underline" onClick={() => void approvedRequests.refetch()}>Reintentar</button></ErrorNotice>}</> : <Field label="Condicion observada"><select className="app-input" value={condition} onChange={(event) => setCondition(event.target.value as EquipmentCondition)}>{Object.entries(conditionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>}
          <div className="sm:col-span-2"><Field label={action.type === "checks" ? "Detalle de la revision realizada" : "Novedades"}><textarea name="notes" className="app-input min-h-24" maxLength={2000} required={action.type === "checks" || (action.type === "return" && condition !== "OK")} minLength={action.type === "checks" || (action.type === "return" && condition !== "OK") ? 10 : undefined} /></Field></div>
          {action.type === "issues" && roster.isError && <ErrorNotice>No se pudo cargar el personal. <button type="button" className="underline" onClick={() => void roster.refetch()}>Reintentar</button></ErrorNotice>}
        </>}
        <button type="submit" className="app-button app-button-red sm:col-span-2" disabled={action.type === "issues" && !roster.data?.length}>{mutation.isPending ? "Registrando..." : "Confirmar"}</button>
      </fieldset>
    </form>}
    <div className="mb-4 grid gap-3 sm:grid-cols-2"><label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-[var(--mut)]" /><input className="app-input pl-9" type="search" aria-label="Buscar equipamiento" placeholder="Código o nombre" maxLength={140} value={filters.q} onChange={(event) => filter("q", event.target.value)} /></label><select className="app-input" aria-label="Categoría de equipamiento" value={filters.category} onChange={(event) => filter("category", event.target.value)}><option value="">Todas las categorías</option>{Object.entries(equipmentCategories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
    {/* Estado como chips: se ve de un vistazo que filtros existen y cual esta activo. */}
    <div role="group" aria-label="Estado de equipamiento" className="-mt-1 mb-4 flex flex-wrap gap-2">{Object.entries({ all: "Todos", available: "Disponibles", assigned: "Entregados", review: "Necesitan revisión", mine: "A mi cargo", archived: "Dados de baja" }).map(([key, label]) => <button key={key} type="button" aria-pressed={filters.view === key} onClick={() => filter("view", key)} className={`min-h-9 rounded-full border px-3.5 text-sm font-semibold transition-colors ${filters.view === key ? "border-red-500 bg-red-600 text-white" : "border-[var(--bord)] text-[var(--mut)] hover:text-[var(--txt)]"}`}>{label}</button>)}</div>
    {query.isPending && <p role="status" className="py-4 text-[var(--mut)]">Cargando equipamiento...</p>}
    {query.isError && <ErrorNotice>No se pudo cargar el equipamiento. <button className="underline" onClick={() => void query.refetch()}>Reintentar</button></ErrorNotice>}
    {query.data && <p className="mb-3 text-xs text-[var(--mut)]">{query.data.total} elementos encontrados</p>}
    {query.data?.items.length === 0 && <p className="border-y border-[var(--bord)] py-10 text-center text-[var(--mut)]">No hay elementos para estos filtros.</p>}
    <div className="grid items-start gap-3 lg:grid-cols-2">{query.data?.items.map((item) => <article key={item.id} className="min-w-0 rounded-lg border border-[var(--bord)] bg-[var(--card)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="break-all text-xs font-semibold text-red-300">{item.code}</p><h2 className="mt-1 break-words text-lg font-bold">{item.asset.name}</h2></div><StateBadge tone={item.available ? "good" : item.archivedAt || item.asset.status === "OUT_OF_SERVICE" ? "danger" : "warning"}>{item.archivedAt ? "Baja" : item.assigned ? "Entregado" : item.available ? "Disponible" : "No disponible"}</StateBadge></div>
      <p className="mt-2 text-sm text-[var(--mut)]">{equipmentCategories[item.category as EquipmentCategory] || item.category}{item.size && ` · Talle ${item.size}`}</p>
      {item.currentIssue && <p className="mt-3 break-words text-sm">Asignado a {personName(item.currentIssue.user)}<span className="mt-1 block text-xs text-[var(--mut)]">Desde {dateTime(item.currentIssue.issuedAt)}</span></p>}
      {!item.archivedAt && item.asset.status !== "OPERATIONAL" && <p className="mt-3 text-xs text-amber-200">{item.asset.status === "OUT_OF_SERVICE" ? "Fuera de servicio" : "Pendiente de revision"}{item.blockingMaintenance && " · Mantenimiento bloqueante"}</p>}
      {item.checks[0] && <details className="mt-3 text-xs text-[var(--mut)]"><summary className="cursor-pointer">Ultima revision: {dateTime(item.checks[0].checkedAt)}</summary><p className="mt-2">{conditionLabels[item.checks[0].condition]} · {personName(item.checks[0].checkedBy)}</p><p className="mt-2 whitespace-pre-wrap break-words">{item.checks[0].notes}</p></details>}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--bord)] pt-3">
        {manager && !item.archivedAt && !item.assigned && <><button className="btn-icon" title="Editar elemento" aria-label={`Editar ${item.code}`} disabled={mutation.isPending} onClick={() => open("edit", item)}><Pencil className="h-4 w-4" /></button><button className="app-button app-button-outline w-auto" disabled={mutation.isPending} onClick={() => open("checks", item)}><ClipboardCheck className="h-4 w-4" />Revisar</button>{item.available && <button className="app-button app-button-outline w-auto" disabled={mutation.isPending} onClick={() => open("issues", item)}><PackageCheck className="h-4 w-4" />Entregar</button>}<button className="app-button app-button-outline w-auto" disabled={mutation.isPending} onClick={() => void archive(item)}>Dar de baja</button></>}
        {manager && item.currentIssue && <button className="app-button app-button-outline w-auto" disabled={mutation.isPending} onClick={() => open("return", item)}><RotateCcw className="h-4 w-4" />Recibir devolucion</button>}
        <button className="btn-icon" title="Historial de entregas" aria-label={`Historial de ${item.code}`} aria-expanded={historyId === item.id} onClick={() => setHistoryId(historyId === item.id ? null : item.id)}><History className="h-4 w-4" /></button>
        {manager && item.blockingMaintenance && <Link href="/maintenance" className="app-button app-button-outline w-auto">Mantenimiento</Link>}
      </div>
      {historyId === item.id && <EquipmentHistory item={item} />}
    </article>)}</div>
    {query.data && query.data.total > query.data.pageSize && <div className="mt-5 flex items-center justify-between gap-2"><button className="app-button app-button-outline w-auto" disabled={filters.page === 1 || query.isFetching} onClick={() => setFilters((value) => ({ ...value, page: value.page - 1 }))}>Anterior</button><span className="text-sm">{filters.page} / {Math.ceil(query.data.total / query.data.pageSize)}</span><button className="app-button app-button-outline w-auto" disabled={filters.page * query.data.pageSize >= query.data.total || query.isFetching} onClick={() => setFilters((value) => ({ ...value, page: value.page + 1 }))}>Siguiente</button></div>}
  </main></ProtectedLayout>;
}
