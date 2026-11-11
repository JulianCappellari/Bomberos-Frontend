"use client";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { isDutyManager } from "@/lib/permissions";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { FormEvent, useState } from "react";
import { AlertTriangle, Check, Play, Plus, RefreshCw, Search, Wrench, X } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useAuth } from "@/features/auth/auth-context";
import { useAssets } from "@/hooks/use-assets";
import { useUserRoster } from "@/hooks/use-shifts";
import { useMaintenance, useCreateMaintenance, useTransitionMaintenance } from "@/hooks/use-operations";
import { Field, ErrorNotice, Metric, StateBadge, personName } from "@/components/operations/operations-ui";
import { getErrorMessage } from "@/lib/get-error-message";
import { MaintenanceJob, MaintenanceStatus } from "@/types/operations";

const statusLabels: Record<MaintenanceStatus, string> = { OPEN: "Pendiente", IN_PROGRESS: "En curso", RESOLVED: "Resuelto", CANCELLED: "Cancelado" };
export default function MaintenancePage() {
  const { user } = useAuth();
  const manager = isDutyManager(user?.role);
  const assets = useAssets();
  const roster = useUserRoster();
  const [assetId, setAssetId] = useState("");
  const query = useMaintenance(assetId);
  const create = useCreateMaintenance();
  const transition = useTransitionMaintenance();
  const [search, setSearch] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [closing, setClosing] = useState<{ job: MaintenanceJob; status: "RESOLVED" | "CANCELLED" } | null>(null);
  const [resolution, setResolution] = useState("");
  const [cost, setCost] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ assetId: "", title: "", description: "", blocksOperation: true, dueAt: "", responsibleUserId: "", publishTask: true });
  const jobs = query.data || [];
  const openJobs = jobs.filter((job) => job.status === "OPEN" || job.status === "IN_PROGRESS");
  const visible = jobs.filter((job) =>
    (showClosed || job.status === "OPEN" || job.status === "IN_PROGRESS") &&
    `${job.title} ${job.asset.name} ${job.description}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    try {
      await create.mutateAsync({ ...draft, dueAt: draft.dueAt || null, responsibleUserId: draft.responsibleUserId || null });
      setFormOpen(false); setDraft({ assetId: "", title: "", description: "", blocksOperation: true, dueAt: "", responsibleUserId: "", publishTask: true });
    } catch (err) { setError(getErrorMessage(err, "No se pudo registrar el trabajo.")); }
  }
  async function start(job: MaintenanceJob) {
    setError("");
    try { await transition.mutateAsync({ id: job.id, revision: job.revision, status: "IN_PROGRESS" }); }
    catch (err) { setError(getErrorMessage(err, "No se pudo iniciar el trabajo.")); }
  }
  async function closeJob(event: FormEvent) {
    event.preventDefault(); if (!closing) return; setError("");
    try {
      await transition.mutateAsync({
        id: closing.job.id, revision: closing.job.revision, status: closing.status,
        resolution, costCents: cost ? Math.round(Number(cost) * 100) : null,
      });
      setClosing(null); setResolution(""); setCost("");
    } catch (err) { setError(getErrorMessage(err, "No se pudo cerrar el trabajo.")); }
  }
  return <ProtectedLayout><main className="screen-body">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-white">Mantenimiento</h1><p className="mt-1 text-sm text-[var(--mut)]">Trabajos, responsables y seguimiento de moviles y equipos</p></div>
      <div className="flex gap-2">
        <button type="button" className="btn-icon" title="Actualizar trabajos" aria-label="Actualizar trabajos" onClick={() => query.refetch()}><RefreshCw className="h-4 w-4" /></button>
        {manager && <button type="button" className="app-button app-button-red w-auto" onClick={() => setFormOpen((value) => !value)}><Plus className="h-4 w-4" /> Nuevo trabajo</button>}
      </div>
    </div>
    <div className="mb-5 grid grid-cols-3 gap-3">
      <Metric label="Trabajos abiertos" value={openJobs.length} />
      <Metric label="Bloquean operacion" value={openJobs.filter((job) => job.blocksOperation).length} />
      <Metric label="Resueltos" value={jobs.filter((job) => job.status === "RESOLVED").length} />
    </div>
    {error && <ErrorNotice>{error}</ErrorNotice>}
    {manager && formOpen && <form onSubmit={submit} className="mb-5 border-y border-[var(--bord)] py-4">
      <h2 className="mb-3 font-bold text-white">Registrar trabajo</h2>
      <fieldset disabled={create.isPending} className="grid gap-3 sm:grid-cols-2">
        <Field label="Movil o equipo"><select required className="app-input" value={draft.assetId} onChange={(event) => setDraft((current) => ({ ...current, assetId: event.target.value }))}><option value="">Seleccionar</option>{(assets.data || []).map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></Field>
        <Field label="Titulo"><input required minLength={3} maxLength={140} className="app-input" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></Field>
        <Field label="Responsable"><select className="app-input" value={draft.responsibleUserId} onChange={(event) => setDraft((current) => ({ ...current, responsibleUserId: event.target.value }))}><option value="">Sin asignar</option>{(roster.data || []).map((person) => <option key={person.id} value={person.id}>{personName(person)}</option>)}</select></Field>
        <Field label="Fecha prevista"><input type="date" className="app-input" value={draft.dueAt} onChange={(event) => setDraft((current) => ({ ...current, dueAt: event.target.value }))} /></Field>
        <div className="sm:col-span-2"><Field label="Falla y trabajo requerido"><textarea required minLength={10} maxLength={10000} className="app-input min-h-24" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></Field></div>
        <label className="flex items-center gap-2 text-sm text-[var(--txt)]"><input type="checkbox" checked={draft.blocksOperation} onChange={(event) => setDraft((current) => ({ ...current, blocksOperation: event.target.checked }))} /> Impide operar hasta su resolucion</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.publishTask} onChange={(e) => setDraft((current) => ({ ...current, publishTask: e.target.checked }))} /> Publicar como tarea disponible para el personal</label>
        <button type="submit" className="app-button app-button-red">{create.isPending ? "Guardando..." : "Registrar trabajo"}</button>
      </fieldset>
    </form>}
    {manager && closing && <form onSubmit={closeJob} className="mb-5 border-y border-amber-500/30 py-4">
      <div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-bold text-white">{closing.status === "RESOLVED" ? "Resolver" : "Cancelar"}: {closing.job.title}</h2><button type="button" className="btn-icon" title="Cerrar formulario" aria-label="Cerrar formulario" onClick={() => setClosing(null)}><X className="h-4 w-4" /></button></div>
      <fieldset disabled={transition.isPending} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Resolucion / motivo"><textarea className="app-input min-h-24" required minLength={10} maxLength={10000} value={resolution} onChange={(event) => setResolution(event.target.value)} /></Field></div>
        <Field label="Costo total (ARS, opcional)"><input type="number" min={0} max={21474836.47} step="0.01" className="app-input" value={cost} onChange={(event) => setCost(event.target.value)} /></Field>
        <button type="submit" className="app-button app-button-red">Confirmar cierre</button>
      </fieldset>
      <p className="mt-3 text-sm text-amber-200">El movil conserva su estado hasta que se realice un nuevo control.</p>
    </form>}
    <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px_auto]">
      <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-[var(--mut)]" /><input type="search" className="app-input pl-9" aria-label="Buscar trabajos" placeholder="Buscar trabajo o movil" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <select className="app-input" aria-label="Filtrar equipo" value={assetId} onChange={(event) => setAssetId(event.target.value)}><option value="">Todos los equipos</option>{(assets.data || []).map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select>
      <label className="flex items-center gap-2 text-sm text-[var(--mut)]"><input type="checkbox" checked={showClosed} onChange={(event) => setShowClosed(event.target.checked)} /> Incluir cerrados</label>
    </div>
    {query.isLoading && <ListSkeleton label="Cargando trabajos" />}
    {query.isError && <ErrorNotice>No se pudieron cargar los trabajos. <button type="button" className="underline" onClick={() => query.refetch()}>Reintentar</button></ErrorNotice>}
    <div className="grid gap-3 lg:grid-cols-2">{visible.map((job) => {
      const active = job.status === "OPEN" || job.status === "IN_PROGRESS";
      return <article key={job.id} className="min-w-0 rounded-lg border border-[var(--bord)] bg-[var(--card)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StateBadge tone={job.status === "RESOLVED" ? "good" : active ? "warning" : "neutral"}>{statusLabels[job.status]}</StateBadge>
          {job.blocksOperation && active && <span className="flex items-center gap-1 text-xs text-red-300"><AlertTriangle className="h-4 w-4" />Bloqueante</span>}
        </div>
        <h2 className="mt-3 break-words text-lg font-bold text-white">{job.title}</h2>
        <div className="mt-1 flex items-center gap-2 text-sm text-red-300"><Wrench className="h-4 w-4" />{job.asset.name}</div>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm text-[var(--txt)]">{job.description}</p>
        <div className="mt-3 space-y-1 text-xs text-[var(--mut)]"><p>Responsable: {personName(job.responsible)}</p>
          {job.dueAt && <p>Previsto: {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(job.dueAt))}</p>}
          {job.costCents !== null && <p>Costo: {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(job.costCents / 100)}</p>}
        </div>
        {job.resolution && <p className="mt-3 whitespace-pre-wrap border-l-2 border-green-500/30 pl-3 text-sm text-[var(--txt)]">{job.resolution}</p>}
        {manager && active && <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--bord)] pt-3">
          {job.publicTask ? <Link href="/tasks" className="app-button w-auto">Consultar tarea publicada</Link> : <button type="button" className="app-button w-auto" onClick={async () => { setError(""); try { await api.post(`/operations/maintenance/${job.id}/task`); await query.refetch(); } catch (err) { setError(getErrorMessage(err, "No se pudo publicar la tarea")); } }}>Publicar como tarea</button>}
          {job.status === "OPEN" && <button type="button" disabled={transition.isPending} className="app-button app-button-outline w-auto" onClick={() => start(job)}><Play className="h-4 w-4" /> Iniciar</button>}
          <button type="button" className="app-button app-button-outline w-auto" onClick={() => { setClosing({ job, status: "RESOLVED" }); setResolution(""); setCost(""); }}><Check className="h-4 w-4" /> Resolver</button>
          <button type="button" className="app-button app-button-outline w-auto" onClick={() => { setClosing({ job, status: "CANCELLED" }); setResolution(""); setCost(""); }}>Cancelar</button>
        </div>}
      </article>;
    })}</div>
    {!query.isLoading && !query.isError && !visible.length && <p className="py-8 text-center text-sm text-[var(--mut)]">No hay trabajos para estos filtros.</p>}
  </main></ProtectedLayout>;
}
