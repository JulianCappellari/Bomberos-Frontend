"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, ImagePlus, X } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field } from "@/components/operations/operations-ui";
import { preparePhoto } from "@/components/operations/task-photos";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { isCommand } from "@/lib/permissions";
import { POST_KIND_LABEL, PublicPost, PublicPostKind, publicPhotoUrl } from "@/lib/public-posts";
import { toast } from "@/lib/toast";

type Row = PublicPost & { status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; incidentId: string | null; revision: number; updatedAt: string };
type Draft = { id?: string; revision?: number; kind: PublicPostKind; title: string; summary: string; body: string; incidentId: string | null; happenedOn: string; keep: string[] };
const empty: Draft = { kind: "NEWS", title: "", summary: "", body: "", incidentId: null, happenedOn: "", keep: [] };
const STATUS = { DRAFT: ["Borrador", ""], PUBLISHED: ["Publicada", "badge-green"], ARCHIVED: ["Retirada", ""] } as const;

// Jefatura redacta y publica novedades para la comunidad y los medios (pagina publica /novedades).
export default function PublicPostsAdminPage() {
  const { user } = useAuth(), client = useQueryClient(), allowed = isCommand(user?.role);
  const posts = useQuery({ queryKey: ["public-posts-admin", user?.id], queryFn: async () => (await api.get<Row[]>("/public-posts")).data, enabled: allowed });
  const closed = useQuery({ queryKey: ["closed-incidents", user?.id], queryFn: async () => (await api.get<Array<{ id: string; title: string; location: string; occurredAt: string }>>("/incidents", { params: { status: "CLOSED" } })).data, enabled: allowed });
  const [draft, setDraft] = useState<Draft | null>(null), [photos, setPhotos] = useState<string[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const set = (patch: Partial<Draft>) => setDraft((d) => d ? { ...d, ...patch } : d);
  const refresh = () => client.invalidateQueries({ queryKey: ["public-posts-admin"] });

  async function fromIncident(id: string) {
    if (!id) return;
    setError("");
    try { const d = (await api.get(`/public-posts/incident-draft/${id}`)).data; setDraft({ ...empty, ...d, keep: [] }); setPhotos([]); }
    catch (err) { setError(getErrorMessage(err, "No se pudo armar el borrador")); }
  }
  async function addPhotos(files: FileList | null) {
    if (!files) return;
    try { const out: string[] = []; for (const f of Array.from(files).slice(0, 6)) out.push(await preparePhoto(f)); setPhotos((p) => [...p, ...out].slice(0, 6 - (draft?.keep.length ?? 0))); }
    catch (err) { setError(getErrorMessage(err, "No se pudo preparar la foto")); }
  }
  async function save(event: FormEvent, publish = false) {
    event.preventDefault();
    if (!draft) return;
    setBusy(true); setError("");
    try {
      const body = { kind: draft.kind, title: draft.title, summary: draft.summary, body: draft.body, incidentId: draft.incidentId, happenedOn: draft.happenedOn || null, photos };
      let id = draft.id, revision = draft.revision;
      if (id) { await api.put(`/public-posts/${id}`, { ...body, keepPhotoIds: draft.keep, revision }); revision = (revision ?? 0) + 1; }
      else { id = (await api.post<{ id: string }>("/public-posts", body)).data.id; revision = 1; }
      if (publish) await api.post(`/public-posts/${id}/publish`, { revision });
      setDraft(null); setPhotos([]); await refresh();
      toast.success(publish ? "Publicado" : "Borrador guardado", publish ? "Ya se ve en la página pública de novedades." : undefined);
    } catch (err) { setError(getErrorMessage(err, "No se pudo guardar")); } finally { setBusy(false); }
  }
  async function toggle(row: Row) {
    setError("");
    try { await api.post(`/public-posts/${row.id}/${row.status === "PUBLISHED" ? "unpublish" : "publish"}`, { revision: row.revision }); await refresh(); }
    catch (err) { setError(getErrorMessage(err, "No se pudo cambiar")); }
  }

  return <ProtectedLayout><main className="screen-body">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">Novedades públicas</h1>
      <Link href="/novedades" target="_blank" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold underline">Ver página pública <ExternalLink className="h-4 w-4" aria-hidden /></Link>
    </div>
    <p className="mb-4 mt-1 text-sm text-[var(--mut)]">Lo que se publica lo ve cualquier persona sin iniciar sesión (comunidad y medios). No incluyas nombres, teléfonos ni datos de las personas asistidas.</p>
    {!allowed ? <ErrorNotice>Las publicaciones las gestiona jefatura.</ErrorNotice> : <>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {!draft && <div className="card grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Informe de una intervención finalizada"><select className="app-input" defaultValue="" onChange={(e) => void fromIncident(e.target.value)}><option value="">Elegí la intervención…</option>{closed.data?.map((i) => <option key={i.id} value={i.id}>{new Date(i.occurredAt).toLocaleDateString("es-AR")} · {i.title} · {i.location}</option>)}</select></Field>
        <button className="app-button w-auto" onClick={() => { setDraft({ ...empty }); setPhotos([]); }}>Nueva capacitación o noticia</button>
      </div>}
      {draft && <form onSubmit={(e) => void save(e)} className="card"><fieldset disabled={busy} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tipo"><select className="app-input" value={draft.kind} onChange={(e) => set({ kind: e.target.value as PublicPostKind })} disabled={Boolean(draft.incidentId)}>{(Object.keys(POST_KIND_LABEL) as PublicPostKind[]).map((k) => <option key={k} value={k} disabled={k === "INCIDENT" && !draft.incidentId}>{POST_KIND_LABEL[k]}</option>)}</select></Field>
          <Field label="Fecha"><input type="date" className="app-input" value={draft.happenedOn} onChange={(e) => set({ happenedOn: e.target.value })} /></Field>
        </div>
        <Field label="Título"><input className="app-input" required minLength={5} maxLength={160} value={draft.title} onChange={(e) => set({ title: e.target.value })} /></Field>
        <Field label="Resumen (se ve en el listado)"><textarea className="app-input min-h-16" required minLength={10} maxLength={400} value={draft.summary} onChange={(e) => set({ summary: e.target.value })} /></Field>
        <Field label="Texto completo"><textarea className="app-input min-h-48" required minLength={10} maxLength={20000} value={draft.body} onChange={(e) => set({ body: e.target.value })} /></Field>
        <div>
          <p className="mb-2 text-sm font-semibold">Fotos (hasta 6)</p>
          <div className="flex flex-wrap gap-2">
            {draft.id && draft.keep.map((pid) => <span key={pid} className="relative">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={publicPhotoUrl(draft.id!, pid)} alt="" className="h-20 w-20 rounded-lg object-cover" /><button type="button" aria-label="Quitar foto" className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white" onClick={() => set({ keep: draft.keep.filter((x) => x !== pid) })}><X className="h-3 w-3" /></button></span>)}
            {photos.map((p, i) => <span key={i} className="relative">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={`data:image/jpeg;base64,${p}`} alt="" className="h-20 w-20 rounded-lg object-cover" /><button type="button" aria-label="Quitar foto" className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white" onClick={() => setPhotos((l) => l.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button></span>)}
            {draft.keep.length + photos.length < 6 && <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed border-[var(--bord)]"><ImagePlus className="h-5 w-5" aria-label="Agregar fotos" /><input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void addPhotos(e.target.files)} /></label>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="app-button app-button-red w-auto" onClick={(e) => void save(e, true)}>{busy ? "Guardando…" : "Publicar"}</button>
          <button className="app-button w-auto">Guardar borrador</button>
          <button type="button" className="app-button app-button-outline w-auto" onClick={() => { setDraft(null); setPhotos([]); }}>Cancelar</button>
        </div>
      </fieldset></form>}
      <h2 className="mb-2 mt-6 text-lg font-bold">Publicaciones</h2>
      {posts.isLoading && <ListSkeleton label="Cargando publicaciones" />}
      {posts.data?.length === 0 && <p className="text-sm text-[var(--mut)]">Todavía no hay publicaciones.</p>}
      <ul className="space-y-2">{posts.data?.map((p) => <li key={p.id} className="rounded-xl border border-[var(--bord)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{p.title}</p><span className={`badge ${STATUS[p.status][1]}`}>{STATUS[p.status][0]}</span></div>
        <p className="text-xs text-[var(--mut)]">{POST_KIND_LABEL[p.kind]} · {p.photos.length} fotos{p.publishedAt ? ` · publicada ${new Date(p.publishedAt).toLocaleDateString("es-AR")}` : ""}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className="app-button w-auto" onClick={() => { setDraft({ id: p.id, revision: p.revision, kind: p.kind, title: p.title, summary: p.summary, body: p.body, incidentId: p.incidentId, happenedOn: p.happenedOn?.slice(0, 10) ?? "", keep: p.photos.map((x) => x.id) }); setPhotos([]); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Editar</button>
          <button className="app-button app-button-outline w-auto" onClick={() => void toggle(p)}>{p.status === "PUBLISHED" ? "Retirar de la página" : "Publicar"}</button>
          {p.status === "PUBLISHED" && <Link href={`/novedades/${p.id}`} target="_blank" className="inline-flex min-h-11 items-center gap-1 text-sm underline">Ver <ExternalLink className="h-3.5 w-3.5" aria-hidden /></Link>}
        </div>
      </li>)}</ul>
    </>}
  </main></ProtectedLayout>;
}
