"use client";
import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ClipboardList, History, Package, PackagePlus, Plus, Search, Shirt } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field } from "@/components/operations/operations-ui";
import { OperationDialog } from "@/components/operations/work-ui";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { toast } from "@/lib/toast";

type Item = { id: string; name: string; category: string; size: string | null; unit: string; quantity: number; minQuantity: number; location: string | null; notes: string | null; revision: number; lowStock: boolean; outOfStock: boolean };
type Movement = { id: string; type: string; quantity: number; balanceAfter: number; reason: string; createdAt: string; createdBy: string | null; assignedTo: string | null; vehicle: string | null; item: { name: string; size: string | null; unit: string } };
type Request = { id: string; title: string; details: string | null; destination: "VEHICLE" | "STATION"; vehicle: string | null; quantity: number; priority: "NORMAL" | "URGENT"; status: string; requestedBy: string | null; handledBy: string | null; handlerNotes: string | null; createdAt: string; revision: number; canCancel: boolean; supplyItem: { name: string } | null };
type Options = { vehicles: Array<{ id: string; label: string }>; people: Array<{ id: string; name: string | null }>; manager: boolean; canRequest: boolean };
type Summary = { items: number; units: number; outOfStock: number; openMaterialRequests: number; openClothingRequests: number; movementsLast30Days: number; lowStock: Array<{ id: string; name: string; size: string | null; unit: string; quantity: number; minQuantity: number }> };

const categories: Record<string, string> = { VESTIMENTA: "Vestimenta", EPP: "EPP", MOVIL: "Para móviles", CUARTEL: "Para el cuartel", LIMPIEZA: "Limpieza", HERRAMIENTA: "Herramientas", OTRO: "Otro" };
const movementLabels: Record<string, string> = { IN: "Alta (ingreso)", OUT: "Baja", ASSIGN: "Entrega / asignación", LOSS: "Faltante o pérdida", ADJUST: "Recuento" };
const statusLabels: Record<string, string> = { PENDING: "Pendiente", APPROVED: "Aprobado", ORDERED: "Encargado", DELIVERED: "Entregado", REJECTED: "Rechazado", CANCELLED: "Cancelado" };
const statusTone: Record<string, string> = { PENDING: "badge-yellow", APPROVED: "badge-blue", ORDERED: "badge-blue", DELIVERED: "badge-green", REJECTED: "badge-red", CANCELLED: "badge-gray" };
const nextStatuses: Record<string, string[]> = { PENDING: ["APPROVED", "ORDERED", "DELIVERED", "REJECTED"], APPROVED: ["ORDERED", "DELIVERED", "REJECTED"], ORDERED: ["DELIVERED", "REJECTED"] };
const when = (v: string) => new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(v));
const itemLabel = (i: { name: string; size: string | null }) => `${i.name}${i.size ? ` · talle ${i.size}` : ""}`;
type Tab = "summary" | "stock" | "requests" | "movements";

// Deposito del cuartel: el encargado de vestimenta y materiales lleva el stock y atiende los pedidos.
export default function SuppliesPage() {
  return <Suspense fallback={null}><SuppliesScreen /></Suspense>;
}

function SuppliesScreen() {
  const { user } = useAuth(), client = useQueryClient(), params = useSearchParams();
  const options = useQuery({ queryKey: ["supplies", "options", user?.id], queryFn: async () => (await api.get<Options>("/supplies/options")).data, enabled: Boolean(user) });
  const manager = Boolean(options.data?.manager);
  const [tab, setTab] = useState<Tab | null>(params.get("tab") === "requests" ? "requests" : null);
  const current: Tab = tab ?? (manager ? "summary" : "requests");
  const summary = useQuery({ queryKey: ["supplies", "summary"], queryFn: async () => (await api.get<Summary>("/supplies/summary")).data, enabled: manager });
  const items = useQuery({ queryKey: ["supplies", "items"], queryFn: async () => (await api.get<Item[]>("/supplies/items")).data, enabled: manager });
  const requests = useQuery({ queryKey: ["supplies", "requests"], queryFn: async () => (await api.get<Request[]>("/supplies/requests")).data, enabled: Boolean(options.data) });
  const movements = useQuery({ queryKey: ["supplies", "movements"], queryFn: async () => (await api.get<Movement[]>("/supplies/movements")).data, enabled: manager && current === "movements" });

  const [dialog, setDialog] = useState<null | { kind: "item"; item?: Item } | { kind: "move"; item: Item; type: string } | { kind: "request" } | { kind: "decide"; request: Request; status: string } | { kind: "history"; item: Item }>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [q, setQ] = useState(""), [category, setCategory] = useState("");
  const history = useQuery({ queryKey: ["supplies", "movements", dialog?.kind === "history" ? dialog.item.id : ""], queryFn: async () => (await api.get<Movement[]>("/supplies/movements", { params: { itemId: dialog?.kind === "history" ? dialog.item.id : "" } })).data, enabled: dialog?.kind === "history" });

  const filtered = useMemo(() => (items.data ?? []).filter((i) => (!category || i.category === category) && (!q || `${i.name} ${i.size ?? ""} ${i.location ?? ""}`.toLocaleLowerCase().includes(q.toLocaleLowerCase()))), [items.data, q, category]);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true); setError("");
    try { await fn(); await client.invalidateQueries({ queryKey: ["supplies"] }); toast.success(ok); setDialog(null); }
    catch (err) { setError(getErrorMessage(err, "No se pudo guardar")); }
    finally { setBusy(false); }
  }
  function submitItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (dialog?.kind !== "item") return;
    const f = new FormData(e.currentTarget), editing = dialog.item;
    const body = { name: String(f.get("name")), category: String(f.get("category")), size: String(f.get("size") || "") || null, unit: String(f.get("unit") || "unidad"), minQuantity: Number(f.get("minQuantity") || 0), location: String(f.get("location") || "") || null, notes: String(f.get("notes") || "") || null };
    void run(() => editing ? api.put(`/supplies/items/${editing.id}`, { ...body, revision: editing.revision }) : api.post("/supplies/items", { ...body, initialQuantity: Number(f.get("initialQuantity") || 0) }), editing ? "Artículo actualizado" : "Artículo dado de alta");
  }
  function submitMove(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (dialog?.kind !== "move") return;
    const f = new FormData(e.currentTarget), target = String(f.get("target") || "");
    void run(() => api.post(`/supplies/items/${dialog.item.id}/movements`, { type: dialog.type, quantity: Number(f.get("quantity")), reason: String(f.get("reason")), assignedUserId: target.startsWith("u:") ? target.slice(2) : null, vehicleId: target.startsWith("v:") ? target.slice(2) : null }), `${movementLabels[dialog.type]} registrada`);
  }
  function submitRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget), destination = String(f.get("destination"));
    void run(() => api.post("/supplies/requests", { title: String(f.get("title")), details: String(f.get("details") || "") || null, destination, vehicleId: destination === "VEHICLE" ? String(f.get("vehicleId")) : null, quantity: Number(f.get("quantity") || 1), priority: f.get("urgent") ? "URGENT" : "NORMAL" }), "Pedido enviado al encargado");
  }
  function submitDecision(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (dialog?.kind !== "decide") return;
    const f = new FormData(e.currentTarget);
    void run(() => api.post(`/supplies/requests/${dialog.request.id}/decide`, { status: dialog.status, notes: String(f.get("notes") || "") || null, revision: dialog.request.revision, supplyItemId: String(f.get("supplyItemId") || "") || null }), `Pedido ${statusLabels[dialog.status].toLowerCase()}`);
  }

  const tabs: Array<[Tab, string]> = manager ? [["summary", "Resumen"], ["stock", "Stock"], ["requests", "Pedidos"], ["movements", "Movimientos"]] : [["requests", "Pedidos de materiales"]];
  return <ProtectedLayout><main className="screen-body">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Package className="h-6 w-6 text-red-400" aria-hidden /> Vestimenta y materiales</h1>
        <p className="mt-1 text-sm text-[var(--mut)]">{manager ? "Stock del depósito: altas, bajas, entregas, faltantes y los pedidos de vestimenta y materiales." : "Pedí materiales para un móvil o para el cuartel. La vestimenta personal se pide desde Mi perfil."}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.data?.canRequest && <button type="button" className="app-button app-button-red w-auto" onClick={() => { setError(""); setDialog({ kind: "request" }); }}><Plus className="h-4 w-4" /> Pedir material</button>}
        {manager && <button type="button" className="app-button w-auto" onClick={() => { setError(""); setDialog({ kind: "item" }); }}><PackagePlus className="h-4 w-4" /> Alta de artículo</button>}
      </div>
    </header>

    {options.isError && <ErrorNotice>No se pudo cargar el depósito. <button className="underline" onClick={() => options.refetch()}>Reintentar</button></ErrorNotice>}
    <div role="tablist" aria-label="Secciones del depósito" className="mt-4 flex flex-wrap gap-1 rounded-xl border border-[var(--bord)] bg-[var(--card)] p-1">
      {tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={current === id} onClick={() => setTab(id)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${current === id ? "bg-red-600 text-white" : "text-[var(--mut)] hover:text-[var(--txt)]"}`}>{label}</button>)}
    </div>

    {current === "summary" && manager && <section className="mt-4 space-y-4">
      {summary.isLoading && <ListSkeleton label="Cargando resumen" />}
      {summary.data && <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([["Artículos", summary.data.items], ["Sin stock", summary.data.outOfStock], ["Pedidos de materiales abiertos", summary.data.openMaterialRequests], ["Pedidos de vestimenta abiertos", summary.data.openClothingRequests]] as const).map(([label, value]) => <div key={label} className="card mb-0"><p className="text-xs text-[var(--mut)]">{label}</p><p className="mt-1 text-2xl font-bold tabular-nums">{value}</p></div>)}
        </div>
        <div className="card mb-0">
          <h2 className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden /> Faltantes (en o por debajo del mínimo)</h2>
          {summary.data.lowStock.length ? <ul className="mt-2 divide-y divide-[var(--bord)] text-sm">{summary.data.lowStock.map((i) => <li key={i.id} className="flex justify-between gap-2 py-2"><span>{itemLabel(i)}</span><span className={i.quantity === 0 ? "font-bold text-red-300" : "text-amber-300"}>{i.quantity} / mín. {i.minQuantity} {i.unit}</span></li>)}</ul> : <p className="mt-2 text-sm text-[var(--mut)]">No hay faltantes. Definí un mínimo en cada artículo para recibir el aviso.</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/equipment-requests" className="app-button app-button-outline w-auto"><Shirt className="h-4 w-4" /> Vestimenta pedida por el personal</Link>
          <Link href="/personal-equipment" className="app-button app-button-outline w-auto"><ClipboardList className="h-4 w-4" /> EPP con código y entregas</Link>
        </div>
      </>}
    </section>}

    {current === "stock" && manager && <section className="mt-4">
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_200px]">
        <label className="relative block"><span className="sr-only">Buscar</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mut)]" aria-hidden /><input type="search" className="app-input pl-9" placeholder="Buscar por nombre, talle o ubicación" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <select className="app-input" aria-label="Categoría" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Todas las categorías</option>{Object.entries(categories).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      </div>
      {items.isLoading && <ListSkeleton label="Cargando stock" />}
      {items.data && !filtered.length && <p className="card text-center text-sm text-[var(--mut)]">{items.data.length ? "Ningún artículo coincide." : "Todavía no hay artículos. Usá «Alta de artículo» para cargar el primero."}</p>}
      <ul className="stagger grid gap-3 lg:grid-cols-2">{filtered.map((i) => <li key={i.id} className={`card mb-0 ${i.outOfStock ? "border-red-500/40" : i.lowStock ? "border-amber-500/40" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--mut)]">{categories[i.category] ?? i.category}{i.location ? ` · ${i.location}` : ""}</p><h2 className="break-words font-bold">{itemLabel(i)}</h2></div>
          <div className="shrink-0 text-right"><p className={`text-2xl font-bold tabular-nums ${i.outOfStock ? "text-red-300" : i.lowStock ? "text-amber-300" : ""}`}>{i.quantity}</p><p className="text-xs text-[var(--mut)]">{i.unit}{i.minQuantity ? ` · mín. ${i.minQuantity}` : ""}</p></div>
        </div>
        {(i.lowStock || i.outOfStock) && <p className="mt-2 text-xs font-semibold text-amber-300">{i.outOfStock ? "Sin stock" : "Por debajo del mínimo"}</p>}
        <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--bord)] pt-3">
          <button type="button" className="app-button w-auto px-3 py-2 text-sm" onClick={() => { setError(""); setDialog({ kind: "move", item: i, type: "IN" }); }}><ArrowDownToLine className="h-4 w-4" /> Alta</button>
          <button type="button" className="app-button app-button-outline w-auto px-3 py-2 text-sm" onClick={() => { setError(""); setDialog({ kind: "move", item: i, type: "ASSIGN" }); }}><ArrowUpFromLine className="h-4 w-4" /> Entregar</button>
          <details className="relative"><summary className="app-button app-button-outline w-auto cursor-pointer list-none px-3 py-2 text-sm">Más ▾</summary>
            <div className="absolute left-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-[var(--bord)] bg-[var(--card)] shadow-xl">
              {(["OUT", "LOSS", "ADJUST"] as const).map((t) => <button key={t} type="button" className="block w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--card2)]" onClick={(e) => { (e.currentTarget.closest("details") as HTMLDetailsElement).open = false; setError(""); setDialog({ kind: "move", item: i, type: t }); }}>{movementLabels[t]}</button>)}
              <button type="button" className="block w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--card2)]" onClick={(e) => { (e.currentTarget.closest("details") as HTMLDetailsElement).open = false; setError(""); setDialog({ kind: "item", item: i }); }}>Editar datos</button>
              <button type="button" className="block w-full px-4 py-2.5 text-left text-sm text-red-300 hover:bg-[var(--card2)]" onClick={(e) => { (e.currentTarget.closest("details") as HTMLDetailsElement).open = false; const reason = window.prompt(`Motivo para dar de baja «${itemLabel(i)}» del catálogo:`); if (reason && reason.trim().length >= 5) void run(() => api.post(`/supplies/items/${i.id}/archive`, { reason: reason.trim() }), "Artículo dado de baja del catálogo"); }}>Dar de baja del catálogo</button>
            </div>
          </details>
          <button type="button" className="btn-icon ml-auto" aria-label={`Historial de ${itemLabel(i)}`} title="Historial" onClick={() => setDialog({ kind: "history", item: i })}><History className="h-4 w-4" /></button>
        </div>
      </li>)}</ul>
    </section>}

    {current === "requests" && <section className="mt-4">
      {requests.isLoading && <ListSkeleton label="Cargando pedidos" />}
      {requests.data && !requests.data.length && <p className="card text-center text-sm text-[var(--mut)]">{manager ? "No hay pedidos de materiales." : "Todavía no hiciste pedidos. Usá «Pedir material» (por ejemplo, un foco para el camión 8)."}</p>}
      <ul className="stagger space-y-3">{requests.data?.map((r) => <li key={r.id} className={`card mb-0 ${r.priority === "URGENT" && ["PENDING", "APPROVED", "ORDERED"].includes(r.status) ? "border-red-500/40" : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0"><h2 className="break-words font-bold">{r.title}{r.quantity > 1 ? ` (×${r.quantity})` : ""}</h2><p className="text-sm text-[var(--mut)]">{r.destination === "VEHICLE" ? `Para el móvil ${r.vehicle ?? ""}` : "Para el cuartel"} · {r.requestedBy} · {when(r.createdAt)}</p></div>
          <div className="flex shrink-0 gap-1">{r.priority === "URGENT" && <span className="badge badge-red">Urgente</span>}<span className={`badge ${statusTone[r.status] ?? ""}`}>{statusLabels[r.status] ?? r.status}</span></div>
        </div>
        {r.details && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{r.details}</p>}
        {r.handlerNotes && <p className="mt-2 text-sm text-[var(--mut)]"><strong className="text-[var(--txt)]">{r.handledBy}:</strong> {r.handlerNotes}</p>}
        {r.supplyItem && <p className="mt-1 text-xs text-[var(--mut)]">Entregado desde el depósito: {r.supplyItem.name}</p>}
        {(manager && nextStatuses[r.status] || r.canCancel) && <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--bord)] pt-3">
          {manager && nextStatuses[r.status]?.map((s) => <button key={s} type="button" className={`app-button w-auto px-3 py-2 text-sm ${s === "REJECTED" ? "app-button-outline text-red-300" : s === "DELIVERED" ? "app-button-red" : "app-button-outline"}`} onClick={() => { setError(""); setDialog({ kind: "decide", request: r, status: s }); }}>{({ APPROVED: "Aprobar", ORDERED: "Marcar encargado", DELIVERED: "Entregar", REJECTED: "Rechazar" } as Record<string, string>)[s]}</button>)}
          {r.canCancel && <button type="button" disabled={busy} className="app-button app-button-outline w-auto px-3 py-2 text-sm" onClick={() => { if (window.confirm("¿Cancelar este pedido?")) void run(() => api.post(`/supplies/requests/${r.id}/cancel`), "Pedido cancelado"); }}>Cancelar pedido</button>}
        </div>}
      </li>)}</ul>
    </section>}

    {current === "movements" && manager && <section className="mt-4">
      {movements.isLoading && <ListSkeleton label="Cargando movimientos" />}
      {movements.data && <MovementList rows={movements.data} />}
    </section>}

    {dialog?.kind === "item" && <OperationDialog title={dialog.item ? "Editar artículo" : "Alta de artículo"} pending={busy} onClose={() => setDialog(null)}><form onSubmit={submitItem}><fieldset disabled={busy} className="space-y-3">
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <Field label="Nombre"><input autoFocus required minLength={2} maxLength={140} name="name" className="app-input" defaultValue={dialog.item?.name} placeholder="Ej. Remera institucional, foco H4, guantes de nitrilo" /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Categoría"><select name="category" className="app-input" defaultValue={dialog.item?.category ?? "VESTIMENTA"}>{Object.entries(categories).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Talle (si corresponde)"><input name="size" maxLength={30} className="app-input" defaultValue={dialog.item?.size ?? ""} placeholder="Ej. M, 42" /></Field>
        <Field label="Unidad"><input name="unit" maxLength={20} className="app-input" defaultValue={dialog.item?.unit ?? "unidad"} /></Field>
        <Field label="Stock mínimo (aviso de faltante)"><input name="minQuantity" type="number" min={0} max={100000} inputMode="numeric" className="app-input" defaultValue={dialog.item?.minQuantity ?? 0} /></Field>
        {!dialog.item && <Field label="Cantidad inicial"><input name="initialQuantity" type="number" min={0} max={100000} inputMode="numeric" className="app-input" defaultValue={0} /></Field>}
        <Field label="Ubicación"><input name="location" maxLength={120} className="app-input" defaultValue={dialog.item?.location ?? ""} placeholder="Ej. Depósito, estante 3" /></Field>
      </div>
      <Field label="Notas"><textarea name="notes" maxLength={1000} className="app-input min-h-16" defaultValue={dialog.item?.notes ?? ""} /></Field>
      <button className="app-button app-button-red">{busy ? "Guardando…" : "Guardar"}</button>
    </fieldset></form></OperationDialog>}

    {dialog?.kind === "move" && <OperationDialog title={`${movementLabels[dialog.type]}: ${itemLabel(dialog.item)}`} pending={busy} onClose={() => setDialog(null)}><form onSubmit={submitMove}><fieldset disabled={busy} className="space-y-3">
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <p className="text-sm text-[var(--mut)]">Stock actual: <strong className="text-[var(--txt)]">{dialog.item.quantity} {dialog.item.unit}</strong></p>
      <Field label={dialog.type === "ADJUST" ? "Cantidad contada (queda este número)" : "Cantidad"}><input autoFocus required name="quantity" type="number" inputMode="numeric" min={dialog.type === "ADJUST" ? 0 : 1} max={dialog.type === "IN" || dialog.type === "ADJUST" ? 100000 : dialog.item.quantity} className="app-input" defaultValue={dialog.type === "ADJUST" ? dialog.item.quantity : 1} /></Field>
      {dialog.type === "ASSIGN" && <Field label="Entregar a"><select required name="target" className="app-input" defaultValue=""><option value="" disabled>Elegí una persona o un móvil</option><optgroup label="Personal">{options.data?.people.map((p) => <option key={p.id} value={`u:${p.id}`}>{p.name}</option>)}</optgroup><optgroup label="Móviles">{options.data?.vehicles.map((v) => <option key={v.id} value={`v:${v.id}`}>{v.label}</option>)}</optgroup></select></Field>}
      <Field label="Motivo"><input required minLength={3} maxLength={500} name="reason" className="app-input" placeholder={({ IN: "Ej. Compra, donación", OUT: "Ej. Desgaste, vencido", ASSIGN: "Ej. Entrega por ingreso", LOSS: "Ej. Faltante en el recuento", ADJUST: "Ej. Recuento mensual" } as Record<string, string>)[dialog.type]} /></Field>
      <button className="app-button app-button-red">{busy ? "Guardando…" : "Registrar"}</button>
    </fieldset></form></OperationDialog>}

    {dialog?.kind === "request" && <OperationDialog title="Pedir material" pending={busy} onClose={() => setDialog(null)}><RequestForm options={options.data} busy={busy} error={error} onSubmit={submitRequest} /></OperationDialog>}

    {dialog?.kind === "decide" && <OperationDialog title={`${({ APPROVED: "Aprobar", ORDERED: "Marcar como encargado", DELIVERED: "Entregar", REJECTED: "Rechazar" } as Record<string, string>)[dialog.status]}: ${dialog.request.title}`} pending={busy} onClose={() => setDialog(null)}><form onSubmit={submitDecision}><fieldset disabled={busy} className="space-y-3">
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {dialog.status === "DELIVERED" && <Field label="¿Sale del depósito? (descuenta stock)"><select name="supplyItemId" className="app-input" defaultValue=""><option value="">No, se compró o llegó directo</option>{(items.data ?? []).filter((i) => i.quantity >= dialog.request.quantity).map((i) => <option key={i.id} value={i.id}>{itemLabel(i)} — hay {i.quantity}</option>)}</select></Field>}
      <Field label={dialog.status === "REJECTED" ? "Motivo del rechazo" : "Nota para quien pidió (opcional)"}><textarea name="notes" required={dialog.status === "REJECTED"} minLength={dialog.status === "REJECTED" ? 5 : undefined} maxLength={2000} className="app-input min-h-20" /></Field>
      <button className="app-button app-button-red">{busy ? "Guardando…" : "Confirmar"}</button>
    </fieldset></form></OperationDialog>}

    {dialog?.kind === "history" && <OperationDialog title={`Historial: ${itemLabel(dialog.item)}`} pending={false} onClose={() => setDialog(null)}>
      {history.isLoading ? <ListSkeleton label="Cargando historial" /> : <MovementList rows={history.data ?? []} />}
    </OperationDialog>}
  </main></ProtectedLayout>;
}

function RequestForm({ options, busy, error, onSubmit }: { options?: Options; busy: boolean; error: string; onSubmit: (e: FormEvent<HTMLFormElement>) => void }) {
  const [destination, setDestination] = useState<"VEHICLE" | "STATION">("VEHICLE");
  return <form onSubmit={onSubmit}><fieldset disabled={busy} className="space-y-3">
    {error && <ErrorNotice>{error}</ErrorNotice>}
    <Field label="¿Qué se necesita?"><input autoFocus required minLength={3} maxLength={160} name="title" className="app-input" placeholder="Ej. Foco para el camión 8" /></Field>
    <div role="radiogroup" aria-label="Destino" className="grid grid-cols-2 gap-2">
      {(["VEHICLE", "STATION"] as const).map((d) => <label key={d} className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold ${destination === d ? "border-red-500 bg-red-500/15" : "border-[var(--bord)] text-[var(--mut)]"}`}><input type="radio" name="destination" value={d} checked={destination === d} onChange={() => setDestination(d)} className="sr-only" />{d === "VEHICLE" ? "Para un móvil" : "Para el cuartel"}</label>)}
    </div>
    {destination === "VEHICLE" && <Field label="Móvil"><select required name="vehicleId" className="app-input" defaultValue=""><option value="" disabled>Elegí el móvil</option>{options?.vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}</select></Field>}
    <div className="grid grid-cols-2 gap-3"><Field label="Cantidad"><input name="quantity" type="number" min={1} max={10000} inputMode="numeric" defaultValue={1} className="app-input" /></Field><label className="mt-6 flex items-center gap-2 text-sm"><input type="checkbox" name="urgent" className="h-4 w-4 accent-red-600" /> Es urgente</label></div>
    <Field label="Detalle (opcional)"><textarea name="details" maxLength={2000} className="app-input min-h-20" placeholder="Modelo, medida, dónde va, foto de referencia en Comunicaciones…" /></Field>
    <p className="text-xs text-[var(--mut)]">Le llega al encargado de vestimenta y materiales. Te avisamos cuando lo atienda.</p>
    <button className="app-button app-button-red">{busy ? "Enviando…" : "Enviar pedido"}</button>
  </fieldset></form>;
}

function MovementList({ rows }: { rows: Movement[] }) {
  if (!rows.length) return <p className="text-sm text-[var(--mut)]">Sin movimientos todavía.</p>;
  const sign = (t: string) => t === "IN" ? "+" : t === "ADJUST" ? "±" : "−";
  return <ul className="divide-y divide-[var(--bord)] text-sm">{rows.map((m) => <li key={m.id} className="flex items-start justify-between gap-3 py-2.5">
    <div className="min-w-0"><p className="font-semibold">{movementLabels[m.type] ?? m.type} · {itemLabel(m.item)}</p><p className="break-words text-[var(--mut)]">{m.reason}{m.assignedTo ? ` · a ${m.assignedTo}` : ""}{m.vehicle ? ` · móvil ${m.vehicle}` : ""}</p><p className="text-xs text-[var(--mut)]">{when(m.createdAt)} · {m.createdBy}</p></div>
    <div className="shrink-0 text-right tabular-nums"><p className={m.type === "IN" ? "font-bold text-[var(--ok-text)]" : m.type === "LOSS" ? "font-bold text-red-300" : "font-bold"}>{sign(m.type)}{m.quantity}</p><p className="text-xs text-[var(--mut)]">quedan {m.balanceAfter}</p></div>
  </li>)}</ul>;
}
