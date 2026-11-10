"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ClipboardList, Pencil, Plus, RefreshCw, X } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field, StateBadge, isManager, personName } from "@/components/operations/operations-ui";
import { useAuth } from "@/features/auth/auth-context";
import { useEquipmentRequests, useEquipmentRequestAction } from "@/hooks/use-personal-equipment";
import { equipmentCategories, EquipmentRequest, EquipmentRequestStatus } from "@/types/personal-equipment";
import { getErrorMessage } from "@/lib/get-error-message";

const statuses: Record<EquipmentRequestStatus, string> = { PENDING: "Pendiente", APPROVED: "Aprobado · falta entrega", REJECTED: "Rechazado", FULFILLED: "Entregado", CANCELLED: "Cancelado" };
const dateTime = (value: string) => new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(value));
type Form = { type: "create" | "edit" | "review"; request?: EquipmentRequest; decision?: "APPROVED" | "REJECTED" };
export default function EquipmentRequestsPage() {
  const { user } = useAuth();
  const manager = isManager(user?.role);
  const [filters, setFilters] = useState({ status: "", page: 1 });
  const query = useEquipmentRequests(filters);
  const mutation = useEquipmentRequestAction();
  const [form, setForm] = useState<Form | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (form) {
      formRef.current?.scrollIntoView({ block: "start" });
      formRef.current?.querySelector<HTMLElement>("input,select,textarea")?.focus({ preventScroll: true });
    }
  }, [form]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  function open(next: Form) { setForm(next); setError(""); setNotice(""); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!form) return; setError(""); setNotice("");
    const data = new FormData(event.currentTarget), request = form.request;
    const body = form.type === "review" ? { revision: request?.revision, status: form.decision, notes: String(data.get("notes") || "") } : {
      ...(request ? { revision: request.revision } : {}), category: String(data.get("category") || ""), size: String(data.get("size") || ""), reason: String(data.get("reason") || ""),
    };
    try { await mutation.mutateAsync({ id: request?.id, action: form.type, body }); setForm(null); setNotice(form.type === "review" && form.decision === "APPROVED" ? "Pedido aprobado. La entrega fisica se registra desde Equipamiento personal." : "Pedido actualizado correctamente."); }
    catch (err) { setError(getErrorMessage(err, "No se pudo registrar. Actualice la lista y vuelva a intentarlo.")); }
  }
  async function cancel(request: EquipmentRequest) {
    if (!window.confirm("Cancelar este pedido? Se conservara en el historial.")) return;
    setError(""); setNotice("");
    try { await mutation.mutateAsync({ id: request.id, action: "cancel", body: { revision: request.revision } }); setNotice("Pedido cancelado."); if (form?.request?.id === request.id) setForm(null); }
    catch (err) { setError(getErrorMessage(err, "No se pudo cancelar el pedido.")); }
  }
  return <ProtectedLayout><main className="screen-body">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="flex items-center gap-2 text-2xl font-bold"><ClipboardList className="h-6 w-6 shrink-0 text-red-400" />Pedidos de vestimenta</h1><div className="flex flex-wrap gap-2"><button className="btn-icon" title="Actualizar pedidos" aria-label="Actualizar pedidos" onClick={() => void query.refetch()}><RefreshCw className="h-4 w-4" /></button><button className="app-button app-button-red w-auto" disabled={mutation.isPending} onClick={() => open({ type: "create" })}><Plus className="h-4 w-4" />Nuevo pedido</button><Link href="/personal-equipment" className="app-button app-button-outline w-auto">Equipamiento personal</Link></div></div>
    {error && <ErrorNotice>{error}</ErrorNotice>}{notice && <p role="status" className="mb-4 border-l-2 border-green-400 pl-3 text-sm text-green-200">{notice}</p>}
    {form && <form ref={formRef} key={`${form.type}-${form.request?.id || "new"}-${form.decision || ""}`} onSubmit={submit} className="mb-5 scroll-mt-20 border-y border-[var(--bord)] py-4">
      <div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-bold">{form.type === "review" ? `${form.decision === "APPROVED" ? "Aprobar" : "Rechazar"} pedido de ${personName(form.request?.user)}` : form.type === "edit" ? "Editar mi pedido" : "Nuevo pedido"}</h2><button type="button" title="Cerrar formulario" aria-label="Cerrar formulario" className="btn-icon" disabled={mutation.isPending} onClick={() => setForm(null)}><X className="h-4 w-4" /></button></div>
      <fieldset disabled={mutation.isPending} className="grid gap-3 sm:grid-cols-2">
        {form.type === "review" ? <div className="sm:col-span-2"><Field label="Motivo de la decision"><textarea name="notes" className="app-input min-h-24" required minLength={10} maxLength={2000} /></Field></div> : <>
          <Field label="Prenda o equipo"><select name="category" className="app-input" defaultValue={form.request?.category || "HELMET"}>{Object.entries(equipmentCategories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
          <Field label="Talle (opcional)"><input name="size" className="app-input" maxLength={30} defaultValue={form.request?.size || ""} /></Field>
          <div className="sm:col-span-2"><Field label="Motivo del pedido"><textarea name="reason" className="app-input min-h-24" required minLength={10} maxLength={2000} defaultValue={form.request?.reason} /></Field></div>
        </>}
        <button type="submit" className="app-button app-button-red sm:col-span-2">{mutation.isPending ? "Registrando..." : "Confirmar"}</button>
      </fieldset>
    </form>}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><label className="min-w-0 w-full sm:max-w-xs"><span className="app-label">Estado del pedido</span><select className="app-input" value={filters.status} onChange={(event) => setFilters({ status: event.target.value, page: 1 })}><option value="">Todos los estados</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><p className="text-xs text-[var(--mut)]">{manager ? "Pedidos del personal" : "Mis pedidos"}{query.data && ` · ${query.data.total}`}</p></div>
    {query.isPending && <p role="status">Cargando pedidos...</p>}
    {query.isError && <ErrorNotice>No se pudieron cargar los pedidos. <button className="underline" onClick={() => void query.refetch()}>Reintentar</button></ErrorNotice>}
    {query.data?.items.length === 0 && <p className="border-y border-[var(--bord)] py-10 text-center text-[var(--mut)]">No hay pedidos para estos filtros.</p>}
    <div className="grid items-start gap-3 lg:grid-cols-2">{query.data?.items.map((request) => <article key={request.id} className="min-w-0 rounded-lg border border-[var(--bord)] bg-[var(--card)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">{equipmentCategories[request.category]}</h2><StateBadge tone={request.status === "FULFILLED" ? "good" : request.status === "PENDING" || request.status === "APPROVED" ? "warning" : "neutral"}>{statuses[request.status]}</StateBadge></div>
      <p className="mt-2 break-words text-sm">{personName(request.user)}{request.size && ` · Talle ${request.size}`}</p><p className="mt-1 text-xs text-[var(--mut)]">{dateTime(request.createdAt)}</p>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm">{request.reason}</p>
      {request.reviewNotes && <div className="mt-3 border-l-2 border-[var(--bord)] pl-3 text-sm"><p className="whitespace-pre-wrap break-words">{request.reviewNotes}</p><p className="mt-1 text-xs text-[var(--mut)]">{personName(request.reviewedBy)}{request.reviewedAt && ` · ${dateTime(request.reviewedAt)}`}</p></div>}
      {request.fulfilledIssue && <p className="mt-3 break-words text-sm text-green-200">Entregado: {request.fulfilledIssue.equipment.code} · {request.fulfilledIssue.equipment.asset.name}<span className="mt-1 block text-xs">{dateTime(request.fulfilledIssue.issuedAt)}</span></p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {request.userId === user?.id && request.status === "PENDING" && <button className="btn-icon" title="Editar mi pedido" aria-label="Editar mi pedido" disabled={mutation.isPending} onClick={() => open({ type: "edit", request })}><Pencil className="h-4 w-4" /></button>}
        {request.userId === user?.id && ["PENDING", "APPROVED"].includes(request.status) && <button className="app-button app-button-outline w-auto" disabled={mutation.isPending} onClick={() => void cancel(request)}>Cancelar pedido</button>}
        {manager && request.userId !== user?.id && request.status === "PENDING" && <><button className="app-button app-button-outline w-auto" disabled={mutation.isPending} onClick={() => open({ type: "review", request, decision: "APPROVED" })}><Check className="h-4 w-4" />Aprobar</button><button className="app-button app-button-outline w-auto" disabled={mutation.isPending} onClick={() => open({ type: "review", request, decision: "REJECTED" })}><X className="h-4 w-4" />Rechazar</button></>}
        {manager && request.status === "APPROVED" && <Link className="app-button app-button-outline w-auto" href="/personal-equipment">Ver inventario</Link>}
      </div>
    </article>)}</div>
    {query.data && query.data.total > query.data.pageSize && <div className="mt-5 flex items-center justify-between gap-2"><button className="app-button app-button-outline w-auto" disabled={filters.page === 1 || query.isFetching} onClick={() => setFilters((value) => ({ ...value, page: value.page - 1 }))}>Anterior</button><span className="text-sm">{filters.page} / {Math.ceil(query.data.total / query.data.pageSize)}</span><button className="app-button app-button-outline w-auto" disabled={filters.page * query.data.pageSize >= query.data.total || query.isFetching} onClick={() => setFilters((value) => ({ ...value, page: value.page + 1 }))}>Siguiente</button></div>}
  </main></ProtectedLayout>;
}
