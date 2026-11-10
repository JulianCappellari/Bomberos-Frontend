"use client";
import { DocumentRectification } from "./document-rectification";
import { FormEvent, useState } from "react";
import { Archive, BookOpen, Copy, Download, ExternalLink, Pencil, Plus, RefreshCw, Search, Send, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/features/auth/auth-context";
import { useDocuments, useSaveDocument, useTransitionDocument } from "@/hooks/use-operations";
import { useShifts } from "@/hooks/use-shifts";
import { useIncidents } from "@/hooks/use-incidents";
import { Field, ErrorNotice, StateBadge, isManager, personName } from "@/components/operations/operations-ui";
import { getErrorMessage } from "@/lib/get-error-message";
import { DocumentInput, DocumentKind, DocumentStatus, OperationalDocument } from "@/types/operations";

const kindLabels: Record<DocumentKind, string> = { PROTOCOL: "Protocolos", SHIFT_REPORT: "Actas de guardia", INCIDENT_REPORT: "Actas de intervencion" };
const statusLabels: Record<DocumentStatus, string> = { DRAFT: "Borrador", PUBLISHED: "Publicado", ARCHIVED: "Archivado" };
function emptyDocument(kind: DocumentKind): DocumentInput {
  return { kind, title: "", category: "Operativo", body: "", externalUrl: "", shiftId: "", incidentId: "" };
}
function downloadDocument(document: OperationalDocument) {
  const context = document.publicationContext;
  const assignments = context?.shift?.assignments || context?.incident?.assignments || [];
  const text = [
    document.title, document.category, statusLabels[document.status], `Revision: ${document.revision}`,
    `Responsable: ${personName(document.createdBy)}`,
    document.publishedAt ? `Publicado: ${new Date(document.publishedAt).toLocaleString("es-AR")}` : "",
    "", document.body, "", assignments.length ? `Personal al publicar: ${assignments.map((item) => personName(item.user)).join(", ")}` : "",
    document.externalUrl || "",
  ].filter((line) => line !== undefined).join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const anchor = window.document.createElement("a");
  anchor.href = url; anchor.download = `documento-${document.id}.txt`; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}
export function DocumentsScreen({ guardLog = false }: { guardLog?: boolean }) {
  const { user } = useAuth();
  const [kind, setKind] = useState<DocumentKind>(guardLog ? "SHIFT_REPORT" : "PROTOCOL");
  const manager = isManager(user?.role) || guardLog && user?.role === "GUARD";
  const canReadDrafts = isManager(user?.role) || user?.role === "GUARD";
  const [status, setStatus] = useState<"" | DocumentStatus>("");
  const [search, setSearch] = useState("");
  const query = useDocuments({ kind, ...(canReadDrafts && status ? { status } : {}) });
  const shifts = useShifts();
  const incidents = useIncidents();
  const save = useSaveDocument();
  const transition = useTransitionDocument();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OperationalDocument | null>(null);
  const [draft, setDraft] = useState<DocumentInput>(() => emptyDocument(guardLog ? "SHIFT_REPORT" : "PROTOCOL"));
  const [expanded, setExpanded] = useState("");
  const [error, setError] = useState("");
  const visible = (query.data || []).filter((document) => `${document.title} ${document.category} ${document.body}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  function editDocument(document: OperationalDocument | null, clone = false) {
    setError(""); setEditing(clone ? null : document);
    setDraft(document ? {
      kind: document.kind, title: document.title + (clone ? " - nueva revision" : ""), category: document.category,
      body: document.body, externalUrl: document.externalUrl || "", shiftId: document.shiftId || "", incidentId: document.incidentId || "",
    } : emptyDocument(kind));
    setFormOpen(true);
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    try {
      await save.mutateAsync({ ...draft, ...(editing ? { id: editing.id, revision: editing.revision } : {}) });
      setKind(draft.kind); setFormOpen(false); setEditing(null);
    } catch (err) { setError(getErrorMessage(err, "No se pudo guardar el documento.")); }
  }
  async function changeStatus(document: OperationalDocument, next: "PUBLISHED" | "ARCHIVED") {
    const message = next === "PUBLISHED" ? "Publicar este documento? Su contenido quedara en modo de solo lectura." : "Archivar este documento? Se retirara de la consulta habitual.";
    if (!window.confirm(message)) return;
    setError("");
    try { await transition.mutateAsync({ id: document.id, revision: document.revision, status: next }); }
    catch (err) { setError(getErrorMessage(err, "No se pudo cambiar el estado.")); }
  }
  return <main className="screen-body">
    <div className="mb-3 flex gap-3 text-xs"><Link href="/hazmat" className="text-sky-200 underline">Materiales peligrosos / GRE</Link></div><div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-white">{guardLog ? "Actas de guardia" : "Documentacion operativa"}</h1><p className="mt-1 text-sm text-[var(--mut)]">Protocolos y actas vinculadas a guardias e intervenciones</p></div>
      <div className="flex gap-2"><button type="button" className="btn-icon" title="Actualizar documentos" aria-label="Actualizar documentos" onClick={() => query.refetch()}><RefreshCw className="h-4 w-4" /></button>
        {manager && <button type="button" className="app-button app-button-red w-auto" onClick={() => editDocument(null)}><Plus className="h-4 w-4" /> Nuevo documento</button>}</div>
    </div>
    <div className="mb-4 grid gap-2 sm:grid-cols-3" role="group" aria-label="Tipo de documento">
      {(Object.entries(kindLabels) as Array<[DocumentKind, string]>).filter(([value]) => guardLog ? value === "SHIFT_REPORT" : isManager(user?.role) || value !== "SHIFT_REPORT").map(([value, label]) => <button key={value} type="button" aria-pressed={kind === value}
        onClick={() => setKind(value)} className={`rounded-lg border px-3 py-3 text-sm font-bold ${kind === value ? "border-red-500 bg-red-500/10 text-white" : "border-[var(--bord)] bg-[var(--card)] text-[var(--mut)]"}`}>{label}</button>)}
    </div>
    {error && <ErrorNotice>{error}</ErrorNotice>}
    {manager && formOpen && <form onSubmit={submit} className="mb-5 border-y border-[var(--bord)] py-4">
      <div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-bold text-white">{editing ? "Editar borrador" : "Crear borrador"}</h2><button type="button" className="btn-icon" title="Cerrar formulario" aria-label="Cerrar formulario" disabled={save.isPending} onClick={() => setFormOpen(false)}><X className="h-4 w-4" /></button></div>
      <fieldset disabled={save.isPending} className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo"><select className="app-input" value={draft.kind} onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value as DocumentKind, shiftId: "", incidentId: "" }))}>{Object.entries(kindLabels).filter(([value]) => guardLog ? value === "SHIFT_REPORT" : isManager(user?.role) || value !== "SHIFT_REPORT").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Categoria"><input required minLength={2} maxLength={80} className="app-input" value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} /></Field>
        <div className="sm:col-span-2"><Field label="Titulo"><input required minLength={3} maxLength={160} className="app-input" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></Field></div>
        {draft.kind === "SHIFT_REPORT" && <div className="sm:col-span-2"><Field label="Guardia vinculada"><select required className="app-input" value={draft.shiftId} onChange={(event) => setDraft((current) => ({ ...current, shiftId: event.target.value }))}><option value="">Seleccionar guardia</option>{(shifts.data || []).map((shift) => <option key={shift.id} value={shift.id}>{shift.date.slice(0, 10)} · {shift.shiftType} · {shift.assignments.length} personas</option>)}</select></Field></div>}
        {draft.kind === "INCIDENT_REPORT" && <div className="sm:col-span-2"><Field label="Intervencion vinculada"><select required className="app-input" value={draft.incidentId} onChange={(event) => setDraft((current) => ({ ...current, incidentId: event.target.value }))}><option value="">Seleccionar intervencion</option>{(incidents.data || []).map((incident) => <option key={incident.id} value={incident.id}>{incident.title}</option>)}</select></Field></div>}
        <div className="sm:col-span-2"><Field label="Contenido"><textarea required minLength={10} maxLength={40000} className="app-input min-h-64" value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} /></Field></div>
        <div className="sm:col-span-2"><Field label="Documentacion externa (HTTPS, opcional)"><input type="url" pattern="https://.*" maxLength={500} className="app-input" value={draft.externalUrl} onChange={(event) => setDraft((current) => ({ ...current, externalUrl: event.target.value }))} /></Field></div>
        <button type="submit" className="app-button app-button-red sm:col-span-2">{save.isPending ? "Guardando..." : "Guardar borrador"}</button>
      </fieldset>
    </form>}
    <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px]">
      <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-[var(--mut)]" /><input type="search" className="app-input pl-9" aria-label="Buscar documentos" placeholder="Buscar por titulo, categoria o contenido" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      {manager && <select className="app-input" aria-label="Estado del documento" value={status} onChange={(event) => setStatus(event.target.value as "" | DocumentStatus)}><option value="">Todos los estados</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}
    </div>
    {query.isLoading && <p className="py-4 text-sm text-[var(--mut)]">Cargando documentos...</p>}
    {query.isError && <ErrorNotice>No se pudieron cargar los documentos. <button type="button" className="underline" onClick={() => query.refetch()}>Reintentar</button></ErrorNotice>}
    <div className="space-y-3">{visible.map((document) => {
      const opened = expanded === document.id;
      const context = document.publicationContext;
      const assignments = context?.shift?.assignments || context?.incident?.assignments || [];
      return <article key={document.id} className="min-w-0 rounded-lg border border-[var(--bord)] bg-[var(--card)] p-4">
        <div className="flex flex-wrap items-center gap-2"><StateBadge tone={document.status === "PUBLISHED" ? "good" : document.status === "DRAFT" ? "warning" : "neutral"}>{statusLabels[document.status]}</StateBadge><span className="text-xs text-[var(--mut)]">{document.category} · Rev. {document.revision}</span></div>
        <h2 className="mt-3 break-words text-lg font-bold text-white">{document.title}</h2>
        <p className="mt-1 text-xs text-[var(--mut)]">{personName(document.createdBy)}{document.publishedAt ? " · " + new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(document.publishedAt)) : ""}</p>
        <p className={`mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--txt)] ${opened ? "" : "line-clamp-3"}`}>{document.body}</p>
        {opened && assignments.length > 0 && <div className="mt-4 border-l-2 border-[var(--bord)] pl-3 text-sm text-[var(--mut)]"><div className="font-semibold text-white">Personal al publicar el acta</div><p className="mt-1">{assignments.map((item) => personName(item.user)).join(", ")}</p></div>}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--bord)] pt-3">
          <button type="button" className="app-button app-button-outline w-auto" onClick={() => setExpanded(opened ? "" : document.id)}><BookOpen className="h-4 w-4" />{opened ? "Contraer" : "Leer completo"}</button>
          <button type="button" className="btn-icon" title="Descargar texto" aria-label={`Descargar ${document.title}`} onClick={() => downloadDocument(document)}><Download className="h-4 w-4" /></button>
          {document.externalUrl?.startsWith("https://") && <a className="btn-icon" title="Abrir documento externo" aria-label="Abrir documento externo" href={document.externalUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>}
          {manager && document.status === "DRAFT" && <>
            <button type="button" className="btn-icon" title="Editar borrador" aria-label="Editar borrador" onClick={() => editDocument(document)}><Pencil className="h-4 w-4" /></button>
            <button type="button" className="app-button app-button-outline w-auto" disabled={transition.isPending} onClick={() => changeStatus(document, "PUBLISHED")}><Send className="h-4 w-4" /> Publicar</button>
          </>}
          {manager && document.status === "PUBLISHED" && <DocumentRectification document={document} onCreated={draft => { setStatus(""); editDocument(draft); void query.refetch(); }} />}
          {manager && document.status !== "ARCHIVED" && <button type="button" className="btn-icon" title="Archivar documento" aria-label="Archivar documento" disabled={transition.isPending} onClick={() => changeStatus(document, "ARCHIVED")}><Archive className="h-4 w-4" /></button>}
        </div>
      </article>;
    })}</div>
    {!query.isLoading && !query.isError && !visible.length && <p className="py-8 text-center text-sm text-[var(--mut)]">No hay documentos para estos filtros.</p>}
  </main>;
}
